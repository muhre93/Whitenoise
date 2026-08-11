// ==================================================
// BabyRo — Referencedata
//
// VÆKST: WHO Child Growth Standards (0-24 mdr.).
// Tallene er median (det typiske) samt -2SD og +2SD,
// som tilsammen dækker ca. 95 % af alle raske børn.
//
// SØVN: Vejledende vågetider og søvnbehov baseret på
// anbefalinger fra bl.a. Sundhedsstyrelsen og
// American Academy of Sleep Medicine.
//
// Alt er VEJLEDENDE. Sundhedsplejersken bruger de
// officielle kurver og ser barnet — det gør en app ikke.
// ==================================================

// alder i måneder: [-2SD, median, +2SD]
const WHO_DATA = {
    dreng: {
        vaegt: { // kg
            0: [2.5, 3.3, 4.4], 1: [3.4, 4.5, 5.8], 2: [4.3, 5.6, 7.1],
            3: [5.0, 6.4, 8.0], 4: [5.6, 7.0, 8.7], 5: [6.0, 7.5, 9.3],
            6: [6.4, 7.9, 9.8], 7: [6.7, 8.3, 10.3], 8: [6.9, 8.6, 10.7],
            9: [7.1, 8.9, 11.0], 10: [7.4, 9.2, 11.4], 11: [7.6, 9.4, 11.7],
            12: [7.7, 9.6, 12.0], 15: [8.3, 10.3, 12.8], 18: [8.8, 10.9, 13.7],
            21: [9.2, 11.5, 14.5], 24: [9.7, 12.2, 15.3]
        },
        laengde: { // cm
            0: [46.1, 49.9, 53.7], 1: [50.8, 54.7, 58.6], 2: [54.4, 58.4, 62.4],
            3: [57.3, 61.4, 65.5], 4: [59.7, 63.9, 68.0], 5: [61.7, 65.9, 70.1],
            6: [63.3, 67.6, 71.9], 7: [64.8, 69.2, 73.5], 8: [66.2, 70.6, 75.0],
            9: [67.5, 72.0, 76.5], 10: [68.7, 73.3, 77.9], 11: [69.9, 74.5, 79.2],
            12: [71.0, 75.7, 80.5], 15: [74.1, 79.1, 84.2], 18: [76.9, 82.3, 87.7],
            21: [79.4, 85.1, 90.9], 24: [81.7, 87.1, 93.9]
        },
        hoved: { // cm
            0: [32.1, 34.5, 36.9], 1: [34.9, 37.3, 39.6], 2: [36.8, 39.1, 41.5],
            3: [38.1, 40.5, 42.9], 4: [39.2, 41.6, 44.0], 5: [40.1, 42.6, 45.0],
            6: [40.9, 43.3, 45.8], 7: [41.5, 44.0, 46.4], 8: [42.0, 44.5, 47.0],
            9: [42.5, 45.0, 47.5], 10: [42.9, 45.4, 47.9], 11: [43.2, 45.8, 48.3],
            12: [43.5, 46.1, 48.6], 15: [44.3, 46.9, 49.4], 18: [44.9, 47.4, 50.0],
            21: [45.3, 47.9, 50.5], 24: [45.7, 48.3, 50.9]
        }
    },
    pige: {
        vaegt: {
            0: [2.4, 3.2, 4.2], 1: [3.2, 4.2, 5.5], 2: [3.9, 5.1, 6.6],
            3: [4.5, 5.8, 7.5], 4: [5.0, 6.4, 8.2], 5: [5.4, 6.9, 8.8],
            6: [5.7, 7.3, 9.3], 7: [6.0, 7.6, 9.8], 8: [6.3, 7.9, 10.2],
            9: [6.5, 8.2, 10.5], 10: [6.7, 8.5, 10.9], 11: [6.9, 8.7, 11.2],
            12: [7.0, 8.9, 11.5], 15: [7.6, 9.6, 12.4], 18: [8.1, 10.2, 13.2],
            21: [8.6, 10.9, 14.0], 24: [9.0, 11.5, 14.8]
        },
        laengde: {
            0: [45.4, 49.1, 52.9], 1: [49.8, 53.7, 57.6], 2: [53.0, 57.1, 61.1],
            3: [55.6, 59.8, 64.0], 4: [57.8, 62.1, 66.4], 5: [59.6, 64.0, 68.5],
            6: [61.2, 65.7, 70.3], 7: [62.7, 67.3, 71.9], 8: [64.0, 68.7, 73.5],
            9: [65.3, 70.1, 75.0], 10: [66.5, 71.5, 76.4], 11: [67.7, 72.8, 77.8],
            12: [68.9, 74.0, 79.2], 15: [72.0, 77.5, 83.0], 18: [74.9, 80.7, 86.5],
            21: [77.5, 83.7, 89.8], 24: [80.0, 86.4, 92.9]
        },
        hoved: {
            0: [31.7, 33.9, 36.1], 1: [34.2, 36.5, 38.9], 2: [35.8, 38.3, 40.7],
            3: [37.1, 39.5, 42.0], 4: [38.1, 40.6, 43.1], 5: [38.9, 41.5, 44.0],
            6: [39.6, 42.2, 44.8], 7: [40.2, 42.8, 45.5], 8: [40.7, 43.4, 46.0],
            9: [41.2, 43.8, 46.5], 10: [41.5, 44.2, 46.9], 11: [41.9, 44.6, 47.3],
            12: [42.2, 44.9, 47.6], 15: [43.0, 45.7, 48.5], 18: [43.6, 46.2, 49.1],
            21: [44.1, 46.7, 49.6], 24: [44.4, 47.2, 50.0]
        }
    }
};

// Bruges når køn er sat til "neutral" — gennemsnit af de to
WHO_DATA.neutral = (function () {
    const out = { vaegt: {}, laengde: {}, hoved: {} };
    ["vaegt", "laengde", "hoved"].forEach(m => {
        Object.keys(WHO_DATA.dreng[m]).forEach(age => {
            const d = WHO_DATA.dreng[m][age], p = WHO_DATA.pige[m][age];
            out[m][age] = [
                Math.round(((d[0] + p[0]) / 2) * 10) / 10,
                Math.round(((d[1] + p[1]) / 2) * 10) / 10,
                Math.round(((d[2] + p[2]) / 2) * 10) / 10
            ];
        });
    });
    return out;
})();

const MAAL_TYPER = {
    vaegt: { navn: "Vægt", enhed: "kg", ikon: "⚖️", trin: 0.01 },
    laengde: { navn: "Længde", enhed: "cm", ikon: "📏", trin: 0.1 },
    hoved: { navn: "Hovedomfang", enhed: "cm", ikon: "🧢", trin: 0.1 }
};

// ==================================================
// SØVN: vågetider og behov efter alder
// fraMdr er nedre grænse (inklusiv)
// vaageMin / vaageMax er vågetid i MINUTTER
// soevnMin / soevnMax er samlet døgnsøvn i TIMER
// ==================================================
const SOEVN_FASER = [
    { fraMdr: 0,  tilMdr: 1,  vaageMin: 45,  vaageMax: 60,  soevnMin: 14, soevnMax: 17, lure: "4-6", navn: "Nyfødt" },
    { fraMdr: 1,  tilMdr: 2,  vaageMin: 60,  vaageMax: 90,  soevnMin: 14, soevnMax: 17, lure: "4-5", navn: "1-2 måneder" },
    { fraMdr: 2,  tilMdr: 3,  vaageMin: 75,  vaageMax: 105, soevnMin: 14, soevnMax: 17, lure: "4-5", navn: "2-3 måneder" },
    { fraMdr: 3,  tilMdr: 4,  vaageMin: 90,  vaageMax: 120, soevnMin: 12, soevnMax: 16, lure: "3-4", navn: "3-4 måneder" },
    { fraMdr: 4,  tilMdr: 6,  vaageMin: 120, vaageMax: 150, soevnMin: 12, soevnMax: 16, lure: "3-4", navn: "4-6 måneder" },
    { fraMdr: 6,  tilMdr: 9,  vaageMin: 150, vaageMax: 180, soevnMin: 12, soevnMax: 15, lure: "2-3", navn: "6-9 måneder" },
    { fraMdr: 9,  tilMdr: 12, vaageMin: 180, vaageMax: 210, soevnMin: 12, soevnMax: 15, lure: "2",   navn: "9-12 måneder" },
    { fraMdr: 12, tilMdr: 18, vaageMin: 210, vaageMax: 300, soevnMin: 11, soevnMax: 14, lure: "1-2", navn: "12-18 måneder" },
    { fraMdr: 18, tilMdr: 999,vaageMin: 300, vaageMax: 360, soevnMin: 11, soevnMax: 14, lure: "1",   navn: "18-24 måneder" }
];

function soevnFaseForAlder(mdr) {
    if (mdr == null || isNaN(mdr)) return null;
    return SOEVN_FASER.find(f => mdr >= f.fraMdr && mdr < f.tilMdr) || SOEVN_FASER[SOEVN_FASER.length - 1];
}
