// ==================================================
// BabyRo — Fælles Firebase-opsætning
// Bruges af BÅDE index.html og admin.html
// ==================================================
// VIGTIGT: ALLE værdier skal stå i "anførselstegn".
// Mangler bare ét tegn, går hele appen i stå.

const firebaseConfig = {
  apiKey: "AIzaSyAiev2iHG8I31LSe-oBL7yjQMiDtVYEQHM",
  authDomain: "babyro-b320c.firebaseapp.com",
  projectId: "babyro-b320c",
  storageBucket: "babyro-b320c.firebasestorage.app",
  messagingSenderId: "260945437474",
  appId: "1:260945437474:web:f670ae0502e1843125fb7b",
  measurementId: "G-9HT4SHH5BR"
  };

// De e-mails der må logge ind på admin.html.
// Skriv din egen Google-mail her (små bogstaver).
// BEMÆRK: Dette er kun en "dørmand" i browseren — den rigtige sikkerhed
// ligger i Firebase-reglerne. Se filen SIKKERHED-regler.md.
const ADMIN_EMAILS = [
    "muhre93@gmail.com"
];
