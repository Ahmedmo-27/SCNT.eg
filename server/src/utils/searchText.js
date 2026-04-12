/** Escape a string for safe use inside a Mongo `$regex` pattern. */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Strip tatweel and Arabic combining marks so queries match catalogue text
 * that is usually stored without vocalization.
 */
function normalizeArabicSearchInput(s) {
  let out = "";
  for (const ch of String(s).normalize("NFC")) {
    const cp = ch.codePointAt(0);
    if (cp === 0x0640) continue; // tatweel
    if (cp >= 0x0610 && cp <= 0x061a) continue;
    if (cp >= 0x064b && cp <= 0x065f) continue;
    if (cp === 0x0670) continue;
    if (cp >= 0x06d6 && cp <= 0x06ed) continue;
    out += ch;
  }
  return out;
}

module.exports = {
  escapeRegex,
  normalizeArabicSearchInput,
};
