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

const firebaseConfig = {
  apiKey: "AIzaSyAiev2iHG8I31LSe-oBL7yjQMiDtVYEQHM",
  authDomain: "babyro-b320c.firebaseapp.com",
  projectId: "babyro-b320c",
  storageBucket: "babyro-b320c.firebasestorage.app",
  messagingSenderId: "260945437474",
  appId: "1:260945437474:web:f670ae0502e1843125fb7b",
  measurementId: "G-9HT4SHH5BR"
};

// Din egen e-mail. Kun den kan komme ind på admin.html.
// Skriv den præcis som du skriver den, når du logger ind med Google.
const ADMIN_EMAILS = ["kronborgnielsen@gmail.com"];
