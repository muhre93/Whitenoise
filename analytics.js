// ==================================================
// BabyBasen — analytics.js
//
// Helt anonym brugsstatistik, så det kan ses i admin,
// hvilke dele af appen der bliver brugt — og hvilke
// der ikke gør.
//
// HVAD GEMMES: kun tællere. Hvor mange gange en fane
// blev åbnet, og hvor mange der brugte appen den dag.
// Der gemmes INGEN navne, mails, søvntider eller andet
// om barnet. En enhed kendes kun på et tilfældigt id.
// ==================================================

function anonymtId() {
    let id = localStorage.getItem('babyRoAnonId');
    if (!id) {
        id = 'a' + Math.random().toString(36).slice(2, 12);
        localStorage.setItem('babyRoAnonId', id);
    }
    return id;
}

// Tællerne samles lokalt og sendes højst én gang i timen,
// så der ikke skrives til databasen ved hvert klik.
let statKoe = {};
let sidsteSend = Number(localStorage.getItem('babyRoStatSent') || 0);

function taelOp(navn) {
    statKoe[navn] = (statKoe[navn] || 0) + 1;
    try { localStorage.setItem('babyRoStatKoe', JSON.stringify(statKoe)); } catch (e) {}
}

function sporSidevisning(faneId) {
    const kort = {
        'nav-player': 'ur', 'nav-care': 'pleje', 'nav-history': 'soevn',
        'nav-growth': 'vaekst', 'nav-milestones': 'milepaele',
        'nav-know': 'viden', 'nav-profile': 'profil'
    };
    taelOp('side_' + (kort[faneId] || 'andet'));
}
function sporHandling(navn) { taelOp('gjort_' + navn); }
function sporLogin() { taelOp('login'); }

async function sendStatistik() {
    if (!db) return;
    try { statKoe = Object.assign(JSON.parse(localStorage.getItem('babyRoStatKoe') || '{}'), statKoe); } catch (e) {}
    if (!Object.keys(statKoe).length) return;
    if (Date.now() - sidsteSend < 3600000) return;   // højst én gang i timen

    const dag = todayKey();
    const inc = (n) => firebase.firestore.FieldValue.increment(n);

    try {
        const data = { dato: dag, opdateret: Date.now() };
        Object.keys(statKoe).forEach(k => { data[k] = inc(statKoe[k]); });

        await db.collection("stats").doc(dag).set(data, { merge: true });

        // Aktive enheder tælles én gang pr. dag pr. enhed
        const setNoegle = 'babyRoStatDag';
        if (localStorage.getItem(setNoegle) !== dag) {
            await db.collection("stats").doc(dag).collection("enheder").doc(anonymtId()).set({
                sidst: Date.now(),
                sprog: SPROG,
                installeret: (typeof erInstalleret === 'function') ? erInstalleret() : false,
                loggetInd: !isGuest,
                mobil: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
            });
            localStorage.setItem(setNoegle, dag);
        }

        statKoe = {};
        localStorage.removeItem('babyRoStatKoe');
        sidsteSend = Date.now();
        localStorage.setItem('babyRoStatSent', String(sidsteSend));
    } catch (e) {
        // Statistik må aldrig stå i vejen for appen
        console.log("Statistik kunne ikke sendes:", e);
    }
}

// Sender når man forlader siden, og ellers hver halve time
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') sendStatistik();
});
document.addEventListener('DOMContentLoaded', () => {
    taelOp('aabnet');
    setTimeout(sendStatistik, 20000);
    setInterval(sendStatistik, 1800000);
});
