/**
 * Reads all collections and products from MongoDB, calls Groq (OpenAI-compatible API)
 * to produce Arabic translations, and writes them to `translations.ar` on each document.
 *
 * Rules (enforced in prompt):
 * - Product/collection `name` → Arabic script phonetic transliteration of the English
 *   (same “word”, not meaning translation).
 * - Marketing copy & descriptions → natural Modern Standard Arabic.
 * - Note lists → Arabic perfumery terms.
 * - inspired_from → transliterate titles + standard Arabic for phrases like Eau de Parfum.
 *
 * Usage (from repo server folder):
 *   node scripts/fillArabicTranslations.js
 *   node scripts/fillArabicTranslations.js --dry-run
 *   node scripts/fillArabicTranslations.js --force
 *
 * Env:
 *   MONGODB_URI (required)
 *   GROQ_API_KEY (required for real runs; omit with --dry-run to only inspect counts)
 *   GROQ_TRANSLATION_MODEL (optional; default llama-3.3-70b-versatile)
 *   GROQ_API_BASE (optional; default https://api.groq.com/openai/v1)
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Collection = require("../src/models/Collection");
const Product = require("../src/models/Product");

const SYSTEM_PROMPT = `You localize SCNT.eg fragrance catalog data for Egyptian Arabic e‑commerce.

Output ONLY valid JSON with no markdown fences.

Rules:
1) For every field named "name" (product title or collection title): write Arabic SCRIPT that phonetically matches the English—transliteration / Arabic-letter spelling of the same name. Do NOT translate the meaning. Examples: "Azure Code" → Arabic letters sounding like Azure Code; "The Executive" → Arabic letters for that phrase.
2) For "inspired_from": transliterate brand and fragrance names; you may use standard Arabic beauty terms for product types (e.g. Eau de Parfum → أو دو بارفام or أو دو بارفان).
3) For "description", "tagline", "sub_tagline": fluent Modern Standard Arabic, luxury retail tone.
4) For "topNotes", "heartNotes", "baseNotes" arrays: translate each string to natural Arabic ingredient/note names used in perfumery. Same array length as input.
5) For "size": Arabic-friendly text reflecting the same volume (e.g. 100 ml → 100 مل).

Always return the exact slugs you receive. Every "ar" object must include all keys shown in the examples for that entity type.`;

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI in environment (.env).");
  }
  await mongoose.connect(mongoUri);
}

const GROQ_DEFAULT_BASE = "https://api.groq.com/openai/v1";

/**
 * @param {{ role: string, content: string }[]} messages
 * @returns {Promise<string>}
 */
async function groqChatJson(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment (.env).");
  }
  const base = (process.env.GROQ_API_BASE || GROQ_DEFAULT_BASE).replace(/\/$/, "");
  const model = process.env.GROQ_TRANSLATION_MODEL || "llama-3.3-70b-versatile";
  const url = `${base}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Groq HTTP ${res.status}: ${raw.slice(0, 800)}`);
  }
  const data = JSON.parse(raw);
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(`Unexpected Groq response: ${raw.slice(0, 500)}`);
  }
  return content;
}

function collectionPayload(collections) {
  return {
    task: "translate_collections",
    items: collections.map((c) => ({
      slug: c.slug,
      name: c.name || "",
      tagline: c.tagline || "",
      sub_tagline: c.sub_tagline || "",
      description: c.description || "",
    })),
  };
}

function productPayload(products) {
  return {
    task: "translate_products",
    items: products.map((p) => ({
      slug: p.slug,
      name: p.name || "",
      inspired_from: p.inspired_from || "",
      description: p.description || "",
      size: p.size || "",
      topNotes: Array.isArray(p.topNotes) ? p.topNotes : [],
      heartNotes: Array.isArray(p.heartNotes) ? p.heartNotes : [],
      baseNotes: Array.isArray(p.baseNotes) ? p.baseNotes : [],
    })),
  };
}

async function translateCollections(collections) {
  if (collections.length === 0) return [];
  const user = JSON.stringify(collectionPayload(collections));
  const text = await groqChatJson([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${user}\n\nReturn JSON shape exactly: { "collections": [ { "slug": string, "ar": { "name": string, "tagline": string, "sub_tagline": string, "description": string } } ] }`,
    },
  ]);
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.collections)) {
    throw new Error("Groq JSON missing collections[]");
  }
  return parsed.collections;
}

async function translateProducts(products) {
  if (products.length === 0) return [];
  const user = JSON.stringify(productPayload(products));
  const text = await groqChatJson([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${user}\n\nReturn JSON shape exactly: { "products": [ { "slug": string, "ar": { "name": string, "inspired_from": string, "description": string, "size": string, "topNotes": string[], "heartNotes": string[], "baseNotes": string[] } } ] }`,
    },
  ]);
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.products)) {
    throw new Error("Groq JSON missing products[]");
  }
  return parsed.products;
}

function hasArCollection(c) {
  const ar = c.translations?.ar;
  return Boolean(ar && String(ar.name || "").trim() && String(ar.description || ar.tagline || "").trim());
}

function hasArProduct(p) {
  const ar = p.translations?.ar;
  return Boolean(ar && String(ar.name || "").trim());
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function run() {
  console.log("[fill-ar] dryRun=%s force=%s", dryRun, force);
  await connectDb();

  let allCollections = await Collection.find({}).sort({ createdAt: -1 }).lean();
  let allProducts = await Product.find({}).sort({ createdAt: -1 }).lean();

  console.log("[fill-ar] DB: %d collections, %d products", allCollections.length, allProducts.length);

  if (!dryRun && !process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required (use --dry-run to only inspect counts).");
  }

  const colToDo = force ? allCollections : allCollections.filter((c) => !hasArCollection(c));
  const prodToDo = force ? allProducts : allProducts.filter((p) => !hasArProduct(p));

  console.log("[fill-ar] To translate: %d collections, %d products", colToDo.length, prodToDo.length);

  if (dryRun) {
    if (colToDo.length) {
      console.log("[fill-ar] --dry-run sample collection slugs:", colToDo.slice(0, 5).map((c) => c.slug));
    }
    if (prodToDo.length) {
      console.log("[fill-ar] --dry-run sample product slugs:", prodToDo.slice(0, 5).map((p) => p.slug));
    }
    await mongoose.disconnect();
    return;
  }

  /** @type {Record<string, object>} */
  const colBySlug = {};
  for (const batch of chunk(colToDo, 12)) {
    const rows = await translateCollections(batch);
    for (const row of rows) {
      if (!row?.slug || !row.ar) continue;
      colBySlug[row.slug] = row.ar;
    }
  }

  for (const c of colToDo) {
    const ar = colBySlug[c.slug];
    if (!ar) {
      console.warn("[fill-ar] Missing Arabic for collection slug=%s", c.slug);
      continue;
    }
    await Collection.updateOne({ _id: c._id }, { $set: { "translations.ar": ar } });
    console.log("[fill-ar] Collection OK %s", c.slug);
  }

  /** @type {Record<string, object>} */
  const prodBySlug = {};
  for (const batch of chunk(prodToDo, 6)) {
    const rows = await translateProducts(batch);
    for (const row of rows) {
      if (!row?.slug || !row.ar) continue;
      prodBySlug[row.slug] = row.ar;
    }
  }

  for (const p of prodToDo) {
    const ar = prodBySlug[p.slug];
    if (!ar) {
      console.warn("[fill-ar] Missing Arabic for product slug=%s", p.slug);
      continue;
    }
    await Product.updateOne({ _id: p._id }, { $set: { "translations.ar": ar } });
    console.log("[fill-ar] Product OK %s", p.slug);
  }

  await mongoose.disconnect();
  console.log("[fill-ar] Done.");
}

run().catch((err) => {
  console.error("[fill-ar] Failed:", err.message || err);
  process.exit(1);
});
