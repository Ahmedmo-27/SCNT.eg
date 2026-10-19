/**
 * Lightweight, zero-dependency User-Agent and Referrer parser
 */

const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /sogou/i,
  /exabot/i,
  /facebot/i,
  /facebookexternalhit/i,
  /ia_archiver/i,
  /headlesschrome/i,
  /lighthouse/i,
  /pingdom/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
];

function isBotUserAgent(userAgent = "") {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function parseDevice(userAgent = "") {
  if (!userAgent) return "desktop";
  const ua = userAgent.toLowerCase();

  // Tablets
  if (
    /ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk/i.test(
      ua
    )
  ) {
    return "tablet";
  }

  // Mobile
  if (
    /mobi|iphone|ipod|phone|blackberry|opera mini|iemobile|mobile/i.test(ua)
  ) {
    return "mobile";
  }

  return "desktop";
}

function parseBrowser(userAgent = "") {
  if (!userAgent) return "Unknown";

  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\/|opera/i.test(userAgent)) return "Opera";
  if (/samsungbrowser/i.test(userAgent)) return "Samsung Browser";
  if (/chrome|crios/i.test(userAgent) && !/edg\//i.test(userAgent)) return "Chrome";
  if (/fxios|firefox/i.test(userAgent)) return "Firefox";
  if (/safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)) return "Safari";
  if (/msie|trident/i.test(userAgent)) return "Internet Explorer";

  return "Other";
}

function parseOS(userAgent = "") {
  if (!userAgent) return "Unknown";

  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macOS";
  if (/linux/i.test(userAgent)) return "Linux";
  if (/cros/i.test(userAgent)) return "Chrome OS";

  return "Other";
}

function normalizeReferrerDomain(referrer = "") {
  if (!referrer || typeof referrer !== "string") return "direct";
  const trimmed = referrer.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "direct";

  try {
    // Handle social app deep links (e.g. android-app://com.instagram.android)
    if (trimmed.startsWith("android-app://") || trimmed.startsWith("ios-app://")) {
      if (/instagram/i.test(trimmed)) return "instagram.com";
      if (/facebook/i.test(trimmed)) return "facebook.com";
      if (/tiktok/i.test(trimmed)) return "tiktok.com";
      if (/twitter|x\.com/i.test(trimmed)) return "x.com";
      if (/whatsapp/i.test(trimmed)) return "whatsapp.com";
    }

    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host.includes("google.")) return "google.com";
    if (host.includes("instagram.")) return "instagram.com";
    if (host.includes("facebook.") || host.includes("fb.me")) return "facebook.com";
    if (host.includes("tiktok.")) return "tiktok.com";
    if (host.includes("twitter.") || host.includes("x.com")) return "x.com";
    if (host.includes("youtube.")) return "youtube.com";
    if (host.includes("pinterest.")) return "pinterest.com";
    if (host.includes("scnt-eg.me") || host.includes("scnt.eg") || host.includes("localhost")) {
      return "internal";
    }

    return host || "direct";
  } catch {
    return "other";
  }
}

function parseUserAgent(userAgent = "") {
  return {
    device: parseDevice(userAgent),
    browser: parseBrowser(userAgent),
    os: parseOS(userAgent),
    isBot: isBotUserAgent(userAgent),
  };
}

module.exports = {
  isBotUserAgent,
  parseDevice,
  parseBrowser,
  parseOS,
  normalizeReferrerDomain,
  parseUserAgent,
};
