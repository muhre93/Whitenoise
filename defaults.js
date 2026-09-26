// ==================================================
// BabyBasen — defaults.js
// Standardindhold på begge sprog.
//
// Hver tekst kan være enten en almindelig streng
// (samme på begge sprog) eller { da: "...", en: "..." }.
// Funktionen lokal() nedenfor vælger det rigtige.
// Gamle data med kun strenge virker derfor stadig.
// ==================================================

function lokal(v) {
    if (v == null) return "";
    if (typeof v === 'string') return v;
    const sprog = (typeof SPROG !== 'undefined') ? SPROG : 'da';
    return v[sprog] || v.da || v.en || "";
}

const DEFAULT_SOUNDS = [
    { id: "stovsuger", icon: "💨", title: { da: "Støvsuger", en: "Vacuum" }, variants: [
        { label: { da: "Standard", en: "Standard" }, url: "lyde/stovsuger-1.mp3" },
        { label: { da: "Dyb", en: "Deep" }, url: "lyde/stovsuger-2.mp3" },
        { label: { da: "Let", en: "Light" }, url: "lyde/stovsuger-3.mp3" }
    ]},
    { id: "hartorrer", icon: "💇‍♀️", title: { da: "Hårtørrer", en: "Hair dryer" }, variants: [
        { label: { da: "Mild", en: "Gentle" }, url: "lyde/hartorrer-1.mp3" },
        { label: { da: "Kraftig", en: "Strong" }, url: "lyde/hartorrer-2.mp3" },
        { label: { da: "Fjern", en: "Distant" }, url: "lyde/hartorrer-3.mp3" }
    ]},
    { id: "hjerte", icon: "❤️", title: { da: "Hjerte", en: "Heartbeat" }, variants: [
        { label: { da: "Rolig", en: "Calm" }, url: "lyde/hjerte-1.mp3" },
        { label: { da: "Med sus", en: "With whoosh" }, url: "lyde/hjerte-2.mp3" },
        { label: { da: "Dyb puls", en: "Deep pulse" }, url: "lyde/hjerte-3.mp3" }
    ]},
    { id: "regn", icon: "🌧️", title: { da: "Regnvejr", en: "Rain" }, variants: [
        { label: { da: "Let regn", en: "Light rain" }, url: "lyde/regn-1.mp3" },
        { label: { da: "Tung regn", en: "Heavy rain" }, url: "lyde/regn-2.mp3" },
        { label: { da: "Torden", en: "Thunder" }, url: "lyde/regn-3.mp3" }
    ]},
    { id: "hav", icon: "🌊", title: { da: "Havet", en: "Ocean" }, variants: [
        { label: { da: "Bølger", en: "Waves" }, url: "lyde/hav-1.mp3" },
        { label: { da: "Havbund", en: "Underwater" }, url: "lyde/hav-2.mp3" },
        { label: { da: "Strand", en: "Beach" }, url: "lyde/hav-3.mp3" }
    ]},
    { id: "noise", icon: "📻", title: { da: "Støj", en: "Noise" }, variants: [
        { label: "White Noise", url: "lyde/noise-1.mp3" },
        { label: "Pink Noise", url: "lyde/noise-2.mp3" },
        { label: "Brown Noise", url: "lyde/noise-3.mp3" }
    ]},
    { id: "vask", icon: "🧺", title: { da: "Vask", en: "Washing machine" }, variants: [
        { label: { da: "Tromle", en: "Drum" }, url: "lyde/vask-1.mp3" },
        { label: { da: "Centrifuge", en: "Spin" }, url: "lyde/vask-2.mp3" },
        { label: { da: "Gammel", en: "Old machine" }, url: "lyde/vask-3.mp3" }
    ]},
    { id: "bil", icon: "🚗", title: { da: "Bilkørsel", en: "Car ride" }, variants: [
        { label: { da: "Motorvej", en: "Motorway" }, url: "lyde/bil-1.mp3" },
        { label: { da: "Motor", en: "Engine" }, url: "lyde/bil-2.mp3" },
        { label: { da: "Natkørsel", en: "Night drive" }, url: "lyde/bil-3.mp3" }
    ]},
    { id: "andet", icon: "✨", title: { da: "Andet", en: "Other" }, variants: [
        { label: { da: "Lyd 1", en: "Sound 1" }, url: "lyde/andet-1.mp3" },
        { label: { da: "Lyd 2", en: "Sound 2" }, url: "lyde/andet-2.mp3" },
        { label: { da: "Lyd 3", en: "Sound 3" }, url: "lyde/andet-3.mp3" }
    ]}
];

// {navn} erstattes automatisk med barnets navn.
const DEFAULT_TEXTS = {
    appTitle: { da: "BabyBasen", en: "BabyBase" },
    appSubtitle: { da: "Alt om {navn} ét sted", en: "Everything about {navn} in one place" },
    appSubtitleGuest: { da: "Søvn, mad og vækst — samlet ét sted", en: "Sleep, feeding and growth — all in one place" },

    // Forslag i milepæle-feltet
    milestoneSuggestions: {
        da: ["Første smil", "Første grin", "Løfter hovedet", "Griber om ting",
             "Triller om på maven", "Sover igennem", "Første tand", "Sidder selv",
             "Første ord", "Kravler", "Står selv", "Første skridt",
             "Vinker farvel", "Drikker af kop", "Første sætning", "Løber"],
        en: ["First smile", "First laugh", "Lifts head", "Grasps objects",
             "Rolls over", "Sleeps through", "First tooth", "Sits unaided",
             "First word", "Crawls", "Stands unaided", "First steps",
             "Waves goodbye", "Drinks from a cup", "First sentence", "Runs"]
    }
};
