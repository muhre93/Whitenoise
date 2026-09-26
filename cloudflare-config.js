// ==================================================
// BabyBasen — cloudflare-config.js
//
// Adressen på din Cloudflare Worker. Du finder den i Cloudflare:
// Workers & Pages → klik på din worker → øverst står der noget i
// stil med  babybasen-api.ditnavn.workers.dev
//
// Skriv den MED https:// foran og UDEN skråstreg til sidst:
//   const CLOUDFLARE_URL = "https://babybasen-api.ditnavn.workers.dev";
//
// Lader du den stå tom, virker appen fint — du kan bare ikke
// uploade lyde og billeder, og påmindelser kan ikke sendes.
// ==================================================

const CLOUDFLARE_URL = "";

// Den hemmelige kode du selv vælger. Den SKAL være præcis den samme
// som den, du skriver i Cloudflare under Variables and Secrets
// (navnet der skal være ADMIN_TOKEN).
// Brug fx 20 tilfældige bogstaver og tal. Del den ikke med nogen.
const CLOUDFLARE_TOKEN = "";
