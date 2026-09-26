// ==================================================
// BabyBasen — firebase-config.js
//
// HER SKRIVER DU DINE EGNE FIREBASE-VÆRDIER.
//
// Du finder dem i Firebase: Projektindstillinger (tandhjulet)
// → Generelt → rul ned til "Dine apps" → vælg web-appen
// → "SDK-opsætning og konfiguration" → vælg "Konfiguration".
//
// ⚠️ VIGTIGT: hver værdi SKAL stå mellem to anførselstegn ("...").
//    Rigtigt:  apiKey: "AIzaSyB3xY...",
//    Forkert:  apiKey: AIzaSyB3xY...",     ← mangler det første "
//    Mangler et anførselstegn, virker HELE appen ikke.
// ==================================================

const FIREBASE_CONFIG = {
    apiKey: "SKRIV_DIN_API_KEY_HER",
    authDomain: "dit-projekt.firebaseapp.com",
    projectId: "dit-projekt",
    storageBucket: "dit-projekt.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};

// Din egen e-mail. Kun den kan komme ind på admin.html.
// Skriv den præcis som du skriver den, når du logger ind med Google.
const ADMIN_EMAILS = ["kronborgnielsen@gmail.com"];
