// ==================================================
// BabyBasen — admin.js
// ==================================================

const SPROG = 'da';           // admin-siden er altid på dansk
let db = null, auth = null;
let minEmail = "";

let LYDE = [];
let TEKSTER = {};
let ART = {};
let statsDage = 7;
let fbFilter = "";
let feedbackListe = [];

// ---------- små hjælpere ----------
function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function $(id) { return document.getElementById(id); }
function kopi(o) { return JSON.parse(JSON.stringify(o)); }
function isoKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dageTilbage(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoKey(d); }
function kortDato(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('da-DK', { day: 'numeric', month: 'numeric' });
}
function status(tekst, fejl) {
    const el = $('gem-status');
    if (!el) return;
    el.textContent = tekst;
    el.className = 'gem-status' + (fejl ? ' fejl' : ' ok');
    if (tekst) setTimeout(() => { el.textContent = ""; }, 4000);
}
function tv(v, sprog) {
    // tosproget værdi → tekst på ét sprog
    if (v == null) return "";
    if (typeof v === 'string') return sprog === 'da' ? v : "";
    return v[sprog] || "";
}
function cfBase() {
    return (typeof CLOUDFLARE_URL === 'string' && CLOUDFLARE_URL) ? CLOUDFLARE_URL.replace(/\/$/, '') : "";
}

// ==================================================
// LOGIN
// ==================================================
try {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
} catch (e) {
    $('login-fejl').textContent = "Firebase kunne ikke starte. Tjek firebase-config.js — husk anførselstegn om alle værdier.";
}

$('btn-login')?.addEventListener('click', async () => {
    try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch (e) {
        $('login-fejl').textContent = "Kunne ikke logge ind: " + (e.message || e);
    }
});

$('btn-logout')?.addEventListener('click', () => auth.signOut().then(() => location.reload()));

auth?.onAuthStateChanged(async bruger => {
    if (!bruger) { $('login-skaerm').style.display = 'flex'; $('admin').style.display = 'none'; return; }
    const tilladt = (typeof ADMIN_EMAILS !== 'undefined' ? ADMIN_EMAILS : []).map(e => e.toLowerCase());
    if (!tilladt.includes((bruger.email || "").toLowerCase())) {
        $('login-fejl').textContent = `${bruger.email} står ikke som admin. Skriv din e-mail ind i firebase-config.js under ADMIN_EMAILS.`;
        await auth.signOut();
        return;
    }
    minEmail = bruger.email;
    $('hvem').textContent = minEmail;
    $('login-skaerm').style.display = 'none';
    $('admin').style.display = 'block';
    await hentAlt();
});

// ==================================================
// FANER
// ==================================================
document.querySelectorAll('.fane').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.fane').forEach(x => x.classList.remove('aktiv'));
        document.querySelectorAll('.panel').forEach(x => x.classList.remove('aktiv'));
        b.classList.add('aktiv');
        $(b.dataset.fane).classList.add('aktiv');
        if (b.dataset.fane === 'f-filer') hentFiler();
        if (b.dataset.fane === 'f-stats') hentStats();
        if (b.dataset.fane === 'f-feedback') hentFeedback();
    });
});
document.querySelectorAll('.under-fane').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.under-fane').forEach(x => x.classList.remove('aktiv'));
        b.classList.add('aktiv');
        $('art-soevn').style.display = b.dataset.del === 'soevn' ? '' : 'none';
        $('art-spring').style.display = b.dataset.del === 'spring' ? '' : 'none';
    });
});

// ==================================================
// HENT INDHOLD
// ==================================================
async function hentAlt() {
    try {
        const [s, t, a] = await Promise.all([
            db.collection('content').doc('sounds').get(),
            db.collection('content').doc('texts').get(),
            db.collection('content').doc('articles').get()
        ]);
        LYDE = (s.exists && Array.isArray(s.data().categories) && s.data().categories.length)
            ? s.data().categories : kopi(DEFAULT_SOUNDS);
        TEKSTER = t.exists ? Object.assign(kopi(DEFAULT_TEXTS), t.data()) : kopi(DEFAULT_TEXTS);
        ART = a.exists ? Object.assign(kopi(DEFAULT_ARTICLES), a.data()) : kopi(DEFAULT_ARTICLES);
    } catch (e) {
        status("Kunne ikke hente indhold: " + (e.message || e), true);
        LYDE = kopi(DEFAULT_SOUNDS); TEKSTER = kopi(DEFAULT_TEXTS); ART = kopi(DEFAULT_ARTICLES);
    }
    tegnLyde();
    tegnTekster();
    tegnArtikler();
    tegnForbindelser();
    hentStats();
    hentFeedback();
}

// ==================================================
// STATISTIK
// ==================================================
document.querySelectorAll('.p-knap').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.p-knap').forEach(x => x.classList.remove('aktiv'));
        b.classList.add('aktiv');
        statsDage = Number(b.dataset.dage);
        hentStats();
    });
});

// Navnene på de ting appen tæller, oversat til noget man kan læse
const BRUG_NAVN = {
    side_ur: "Ur-siden",
    side_pleje: "Pleje",
    side_soevn: "Søvnlog",
    side_vaekst: "Vækst",
    side_milepaele: "Milepæle",
    side_viden: "Viden",
    side_profil: "Profil",
    side_andet: "Andre sider",
    login: "Logget ind",
    gjort_urStart: "Startede uret",
    gjort_urGemt: "Gemte en lur",
    gjort_urNulstil: "Nulstillede uret",
    gjort_lydStart: "Startede en lyd",
    gjort_stopAlt: "Stoppede al lyd",
    gjort_smartLyt: "Brugte babyalarmen",
    gjort_plejeGemt: "Gemte en registrering",
    gjort_plejeHurtig: "Brugte en hurtigknap",
    gjort_maalingGemt: "Gemte en måling",
    gjort_milepaelGemt: "Gemte en milepæl",
    gjort_rapport: "Lavede rapporten",
    gjort_oversigt: "Åbnede oversigten",
    gjort_laaseskaerm: "Slog låseskærmen til",
    gjort_feedback: "Sendte feedback",
    gjort_sprogSkift: "Skiftede sprog",
    gjort_temaSkift: "Skiftede nat/dag",
    gjort_farveValgt: "Valgte en farve",
    gjort_koenValgt: "Valgte dreng eller pige",
    gjort_barnSkiftet: "Skiftede barn",
    gjort_barnTilfoejet: "Tilføjede et barn",
    gjort_delt: "Delte med en anden forælder",
    gjort_tilsluttet: "Tilsluttede sig et barn med kode",
    gjort_notifTil: "Slog påmindelser til",
    gjort_installeret: "Lagde appen på hjemmeskærmen",
    gjort_soevnRettet: "Rettede en gemt lur",
    gjort_soevnTilfoejet: "Tilføjede søvn manuelt"
};

async function hentStats() {
    const tal = $('stats-tal'), graf = $('stats-graf'), brug = $('stats-brug'), enh = $('stats-enheder');
    if (!tal) return;
    tal.innerHTML = `<p class="hjaelp">Henter…</p>`;

    const dage = [];
    for (let i = statsDage - 1; i >= 0; i--) dage.push(dageTilbage(i));

    let docs = [];
    try {
        const snap = await db.collection('stats')
            .where(firebase.firestore.FieldPath.documentId(), '>=', dage[0])
            .where(firebase.firestore.FieldPath.documentId(), '<=', dage[dage.length - 1])
            .get();
        snap.forEach(d => docs.push({ id: d.id, data: d.data() }));
    } catch (e) {
        tal.innerHTML = `<p class="hjaelp fejl">Kunne ikke hente statistik: ${esc(e.message || e)}<br>
        Har du husket at sætte de nye Firestore-regler ind? Se firestore-regler.txt.</p>`;
        return;
    }

    if (!docs.length) {
        tal.innerHTML = `<p class="hjaelp">Ingen tal endnu. De kommer, så snart nogen har brugt appen —
        der går op til en time, før en dags tal er skrevet ind.</p>`;
        if (graf) graf.innerHTML = "";
        if (brug) brug.innerHTML = "";
        if (enh) enh.innerHTML = "";
        return;
    }

    const pr = {};
    docs.forEach(d => { pr[d.id] = d.data; });

    const sum = {};
    let brugereIAlt = 0, loggetInd = 0, gaester = 0, installeret = 0, mobil = 0, computer = 0;
    docs.forEach(d => {
        Object.keys(d.data).forEach(k => {
            if (typeof d.data[k] === 'number') sum[k] = (sum[k] || 0) + d.data[k];
        });
    });

    // Antal telefoner/computere pr. dag ligger i underlisten "enheder"
    const prDagBrugere = {};
    for (const key of dage) {
        prDagBrugere[key] = 0;
        try {
            const e = await db.collection('stats').doc(key).collection('enheder').get();
            prDagBrugere[key] = e.size;
            e.forEach(doc => {
                const v = doc.data();
                brugereIAlt++;
                if (v.loggetInd) loggetInd++; else gaester++;
                if (v.installeret) installeret++;
                if (v.mobil) mobil++; else computer++;
            });
        } catch (_) {}
    }

    const iDagKey = dage[dage.length - 1];
    const iDagBrugere = prDagBrugere[iDagKey] || 0;
    const gnsBrugere = dage.length ? (brugereIAlt / dage.length) : 0;

    tal.innerHTML = [
        { v: iDagBrugere, l: "Brugere i dag", n: "Telefoner og computere der åbnede appen i dag" },
        { v: gnsBrugere.toFixed(1), l: "Brugere pr. dag", n: `Over ${dage.length} dage` },
        { v: loggetInd, l: "Logget ind", n: `${gaester} brugte den som gæst` },
        { v: sum.aabnet || 0, l: "Gange åbnet", n: "" },
        { v: sum.urStart || 0, l: "Ur startet", n: `${sum.urGemt || 0} lure gemt` },
        { v: installeret, l: "På hjemmeskærmen", n: brugereIAlt ? Math.round(installeret / brugereIAlt * 100) + "% af alle" : "" }
    ].map(k => `<div class="tal-kort"><strong>${k.v}</strong><span>${k.l}</span>${k.n ? `<em>${k.n}</em>` : ''}</div>`).join('');

    if (graf) {
        graf.innerHTML = barChart(dage.map(k => ({
            label: kortDato(k), value: prDagBrugere[k] || 0, highlight: k === iDagKey
        })), { format: v => Math.round(v) });
    }

    if (brug) {
        const raekker = Object.keys(sum)
            .filter(k => k !== 'aabnet')
            .map(k => ({ navn: BRUG_NAVN[k] || k, antal: sum[k], noegle: k }))
            .sort((a, b) => b.antal - a.antal);
        const max = raekker.length ? raekker[0].antal : 1;
        brug.innerHTML = raekker.length ? raekker.map(r => `
            <div class="brug-raekke">
                <span class="brug-navn">${esc(r.navn)}</span>
                <span class="brug-bar"><i style="width:${Math.max(2, r.antal / max * 100)}%"></i></span>
                <span class="brug-tal">${r.antal}</span>
            </div>`).join('') + `<p class="hjaelp" style="margin-top:14px;">
            Noget helt nede med 0-2 brug over ${dage.length} dage er sandsynligvis ikke værd at
            beholde. Men husk: en funktion kan være vigtig for de få, der bruger den.</p>`
            : `<p class="hjaelp">Ingen tal endnu.</p>`;
    }

    if (enh) {
        enh.innerHTML = [
            { v: mobil, l: "Telefon eller tablet" },
            { v: computer, l: "Computer" },
            { v: brugereIAlt ? Math.round(mobil / brugereIAlt * 100) + "%" : "–", l: "Andel på mobil" }
        ].map(k => `<div class="tal-kort"><strong>${k.v}</strong><span>${k.l}</span></div>`).join('');
    }
}

// ==================================================
// FEEDBACK
// ==================================================
const FB_IKON = { godt: '😊', daarligt: '😕', ide: '💡', fejl: '🐛' };
const FB_NAVN = { godt: 'Godt', daarligt: 'Driller', ide: 'Idé', fejl: 'Fejl' };

document.querySelectorAll('.fb-filter').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.fb-filter').forEach(x => x.classList.remove('aktiv'));
        b.classList.add('aktiv');
        fbFilter = b.dataset.type;
        tegnFeedback();
    });
});

async function hentFeedback() {
    const box = $('fb-liste');
    if (!box) return;
    box.innerHTML = `<p class="hjaelp">Henter…</p>`;
    try {
        const snap = await db.collection('feedback').orderBy('tid', 'desc').limit(200).get();
        feedbackListe = [];
        snap.forEach(d => feedbackListe.push(Object.assign({ id: d.id }, d.data())));
    } catch (e) {
        box.innerHTML = `<p class="hjaelp fejl">Kunne ikke hente: ${esc(e.message || e)}<br>
        Husk de nye Firestore-regler — se firestore-regler.txt.</p>`;
        return;
    }
    const ulaeste = feedbackListe.filter(f => !f.laest).length;
    const prik = $('fb-antal');
    if (prik) { prik.style.display = ulaeste ? '' : 'none'; prik.textContent = ulaeste; }
    tegnFeedback();
}

function tegnFeedback() {
    const box = $('fb-liste');
    if (!box) return;
    const liste = fbFilter ? feedbackListe.filter(f => f.type === fbFilter) : feedbackListe;
    if (!liste.length) { box.innerHTML = `<p class="hjaelp">Ingen beskeder her.</p>`; return; }
    box.innerHTML = liste.map(f => {
        const tid = f.tid && f.tid.toDate ? f.tid.toDate() : (f.dato ? new Date(f.dato) : null);
        return `<div class="fb-kort ${f.laest ? 'laest' : ''}">
            <div class="fb-hoved">
                <span class="fb-type">${FB_IKON[f.type] || '•'} ${FB_NAVN[f.type] || f.type}</span>
                <span class="fb-tid">${tid ? tid.toLocaleString('da-DK') : ''}</span>
            </div>
            <p class="fb-tekst">${esc(f.text)}</p>
            <div class="fb-fod">
                <span>${esc(f.fra || 'gæst')} · ${f.sprog === 'en' ? '🇬🇧' : '🇩🇰'}${f.installeret ? ' · på hjemmeskærmen' : ''}</span>
                <span class="fb-enhed">${esc(f.enhed || '')}</span>
            </div>
            <div class="fb-knapper">
                <button class="knap lille" onclick="markerLaest('${f.id}', ${f.laest ? 'false' : 'true'})">
                    ${f.laest ? 'Marker som ulæst' : 'Marker som læst'}</button>
                <button class="knap lille fare" onclick="sletFeedback('${f.id}')">Slet</button>
            </div>
        </div>`;
    }).join('');
}

window.markerLaest = async function (id, vaerdi) {
    try {
        await db.collection('feedback').doc(id).update({ laest: vaerdi });
        const f = feedbackListe.find(x => x.id === id);
        if (f) f.laest = vaerdi;
        tegnFeedback();
        const ulaeste = feedbackListe.filter(x => !x.laest).length;
        const prik = $('fb-antal');
        if (prik) { prik.style.display = ulaeste ? '' : 'none'; prik.textContent = ulaeste; }
    } catch (e) { status("Kunne ikke gemme: " + (e.message || e), true); }
};

window.sletFeedback = async function (id) {
    if (!confirm("Slet beskeden for altid?")) return;
    try {
        await db.collection('feedback').doc(id).delete();
        feedbackListe = feedbackListe.filter(x => x.id !== id);
        tegnFeedback();
    } catch (e) { status("Kunne ikke slette: " + (e.message || e), true); }
};

// ==================================================
// LYDE
// ==================================================
function tegnLyde() {
    const box = $('lyd-liste');
    if (!box) return;
    box.innerHTML = LYDE.map((c, i) => `
    <div class="lyd-kort" data-i="${i}">
        <div class="lyd-hoved">
            <input type="text" class="ikon-felt" value="${esc(c.icon || '')}" data-felt="icon" maxlength="4" title="Emoji">
            <div class="tosprog voksen">
                <label class="felt"><span>🇩🇰 Navn</span><input type="text" value="${esc(tv(c.title, 'da'))}" data-felt="title.da"></label>
                <label class="felt"><span>🇬🇧 Name</span><input type="text" value="${esc(tv(c.title, 'en'))}" data-felt="title.en"></label>
            </div>
            <button class="knap lille fare" onclick="sletKategori(${i})">Slet</button>
        </div>
        <div class="varianter">
            ${(c.variants || []).map((v, j) => `
            <div class="variant" data-j="${j}">
                <div class="tosprog">
                    <label class="felt"><span>🇩🇰 Tekst i menuen</span><input type="text" value="${esc(tv(v.label, 'da'))}" data-felt="v.label.da"></label>
                    <label class="felt"><span>🇬🇧 Menu text</span><input type="text" value="${esc(tv(v.label, 'en'))}" data-felt="v.label.en"></label>
                </div>
                <label class="felt"><span>Lydfil</span>
                    <input type="text" value="${esc(v.url || '')}" data-felt="v.url" placeholder="https://...">
                </label>
                <div class="variant-fod">
                    <select class="fil-vaelger" data-i="${i}" data-j="${j}"><option value="">— vælg en fil du har lagt op —</option></select>
                    <button class="knap lille" onclick="afspil(${i},${j})">▶︎ Hør den</button>
                    <button class="knap lille fare" onclick="sletVariant(${i},${j})">Slet</button>
                </div>
            </div>`).join('')}
        </div>
        <button class="knap lille" onclick="nyVariant(${i})">+ Ny lyd i denne kategori</button>
    </div>`).join('');
    fyldFilVaelgere();
}

function laesLyde() {
    const ud = [];
    document.querySelectorAll('#lyd-liste .lyd-kort').forEach(kort => {
        const i = Number(kort.dataset.i);
        const gammel = LYDE[i] || {};
        const c = {
            id: gammel.id || ('lyd' + Date.now() + i),
            icon: kort.querySelector('[data-felt="icon"]').value.trim(),
            title: {
                da: kort.querySelector('[data-felt="title.da"]').value.trim(),
                en: kort.querySelector('[data-felt="title.en"]').value.trim()
            },
            variants: []
        };
        kort.querySelectorAll('.variant').forEach(v => {
            c.variants.push({
                label: {
                    da: v.querySelector('[data-felt="v.label.da"]').value.trim(),
                    en: v.querySelector('[data-felt="v.label.en"]').value.trim()
                },
                url: v.querySelector('[data-felt="v.url"]').value.trim()
            });
        });
        ud.push(c);
    });
    return ud;
}

window.sletKategori = function (i) {
    if (!confirm("Slet hele kategorien?")) return;
    LYDE = laesLyde(); LYDE.splice(i, 1); tegnLyde();
};
window.nyVariant = function (i) {
    LYDE = laesLyde();
    if (!LYDE[i].variants) LYDE[i].variants = [];
    LYDE[i].variants.push({ label: { da: "Ny lyd", en: "New sound" }, url: "" });
    tegnLyde();
};
window.sletVariant = function (i, j) {
    LYDE = laesLyde(); LYDE[i].variants.splice(j, 1); tegnLyde();
};
window.afspil = function (i, j) {
    const url = document.querySelector(`.lyd-kort[data-i="${i}"] .variant[data-j="${j}"] [data-felt="v.url"]`).value.trim();
    if (!url) { alert("Der er ingen fil på den endnu."); return; }
    const a = new Audio(url);
    a.play().catch(() => alert("Kunne ikke afspille. Tjek at adressen er rigtig."));
    setTimeout(() => a.pause(), 6000);
};

$('btn-ny-kategori')?.addEventListener('click', () => {
    LYDE = laesLyde();
    LYDE.push({ id: 'ny' + Date.now(), icon: '🔊', title: { da: "Ny kategori", en: "New category" }, variants: [] });
    tegnLyde();
});

$('btn-gem-lyde')?.addEventListener('click', async () => {
    LYDE = laesLyde();
    try {
        await db.collection('content').doc('sounds').set({ categories: LYDE, opdateret: new Date().toISOString() });
        status("Lydene er gemt ✓");
    } catch (e) { status("Kunne ikke gemme: " + (e.message || e), true); }
});

$('btn-nulstil-lyde')?.addEventListener('click', () => {
    if (!confirm("Sætte alle lyde tilbage til standard? Det du har rettet, forsvinder.")) return;
    LYDE = kopi(DEFAULT_SOUNDS); tegnLyde();
});

// ==================================================
// TEKSTER
// ==================================================
const TXT_FELTER = [
    { key: 'appTitle', navn: 'Navnet på appen', hjaelp: 'Fx BabyBasen' },
    { key: 'appSubtitle', navn: 'Undertitel når man er logget ind', hjaelp: 'Skriv {navn}, hvor barnets navn skal stå' },
    { key: 'appSubtitleGuest', navn: 'Undertitel for gæster', hjaelp: 'Vises før man logger ind' }
];

function tegnTekster() {
    const box = $('txt-felter');
    if (box) {
        box.innerHTML = TXT_FELTER.map(f => `
        <div class="txt-blok">
            <h3>${esc(f.navn)}</h3>
            <p class="hjaelp">${esc(f.hjaelp)}</p>
            <div class="tosprog">
                <label class="felt"><span>🇩🇰 Dansk</span><input type="text" data-txt="${f.key}.da" value="${esc(tv(TEKSTER[f.key], 'da'))}"></label>
                <label class="felt"><span>🇬🇧 English</span><input type="text" data-txt="${f.key}.en" value="${esc(tv(TEKSTER[f.key], 'en'))}"></label>
            </div>
        </div>`).join('');
    }
    const n = $('vis-neutral'); if (n) n.checked = TEKSTER.showNeutral === true;
    const f = $('vis-farver'); if (f) f.checked = TEKSTER.showColors !== false;

    const forslag = TEKSTER.milestoneSuggestions || DEFAULT_TEXTS.milestoneSuggestions;
    const da = $('ms-da'), en = $('ms-en');
    if (da) da.value = (Array.isArray(forslag.da) ? forslag.da : []).join('\n');
    if (en) en.value = (Array.isArray(forslag.en) ? forslag.en : []).join('\n');
}

$('btn-gem-tekster')?.addEventListener('click', async () => {
    const ny = {};
    TXT_FELTER.forEach(f => {
        ny[f.key] = {
            da: document.querySelector(`[data-txt="${f.key}.da"]`).value.trim(),
            en: document.querySelector(`[data-txt="${f.key}.en"]`).value.trim()
        };
    });
    ny.showNeutral = $('vis-neutral').checked;
    ny.showColors = $('vis-farver').checked;
    ny.milestoneSuggestions = {
        da: $('ms-da').value.split('\n').map(s => s.trim()).filter(Boolean),
        en: $('ms-en').value.split('\n').map(s => s.trim()).filter(Boolean)
    };
    try {
        await db.collection('content').doc('texts').set(Object.assign({}, TEKSTER, ny, { opdateret: new Date().toISOString() }));
        TEKSTER = Object.assign(TEKSTER, ny);
        status("Teksterne er gemt ✓");
    } catch (e) { status("Kunne ikke gemme: " + (e.message || e), true); }
});

$('btn-nulstil-tekster')?.addEventListener('click', () => {
    if (!confirm("Sætte teksterne tilbage til standard?")) return;
    TEKSTER = kopi(DEFAULT_TEXTS); tegnTekster();
});

// ==================================================
// ARTIKLER
// ==================================================
function artFelt(sti, navn, hjaelp, linjer) {
    const v = hentSti(ART, sti);
    const stor = linjer > 2;
    const felt = (sprog, flag) => stor
        ? `<label class="felt"><span>${flag}</span><textarea rows="${linjer}" data-art="${sti}.${sprog}">${esc(tv(v, sprog))}</textarea></label>`
        : `<label class="felt"><span>${flag}</span><input type="text" data-art="${sti}.${sprog}" value="${esc(tv(v, sprog))}"></label>`;
    return `<div class="art-felt">
        <h4>${esc(navn)}</h4>
        ${hjaelp ? `<p class="hjaelp">${esc(hjaelp)}</p>` : ''}
        <div class="tosprog">${felt('da', '🇩🇰 Dansk')}${felt('en', '🇬🇧 English')}</div>
    </div>`;
}

function hentSti(o, sti) {
    return sti.split('.').reduce((a, k) => {
        if (a == null) return null;
        return /^\d+$/.test(k) ? a[Number(k)] : a[k];
    }, o);
}
function saetSti(o, sti, v) {
    const dele = sti.split('.');
    let p = o;
    for (let i = 0; i < dele.length - 1; i++) {
        const k = /^\d+$/.test(dele[i]) ? Number(dele[i]) : dele[i];
        if (p[k] == null) p[k] = /^\d+$/.test(dele[i + 1]) ? [] : {};
        p = p[k];
    }
    const sidst = dele[dele.length - 1];
    p[/^\d+$/.test(sidst) ? Number(sidst) : sidst] = v;
}

function tegnArtikler() {
    const s = $('art-soevn');
    if (s) {
        s.innerHTML = `<section class="kort">
            <h2>Overskrift på Søvn-siden</h2>
            ${artFelt('sleepTitle', 'Titel')}
            ${artFelt('sleepSub', 'Undertitel')}
        </section>` +
        (ART.sleepCards || []).map((c, i) => `<section class="kort art-kort">
            <div class="kort-hoved">
                <h2>Afsnit ${i + 1}</h2>
                <button class="knap lille fare" onclick="sletArtikel('sleepCards', ${i})">Slet afsnittet</button>
            </div>
            ${artFelt('sleepCards.' + i + '.title', 'Overskrift')}
            ${artFelt('sleepCards.' + i + '.body', 'Tekst', 'HTML er tilladt. {navn} bliver barnets navn.', 12)}
        </section>`).join('') +
        `<div class="gem-linje"><button class="knap lille" onclick="nyArtikel('sleepCards')">+ Nyt afsnit under Søvn</button></div>`;
    }

    const p = $('art-spring');
    if (p) {
        p.innerHTML = `<section class="kort">
            <h2>Overskrifter på Tigerspring-siden</h2>
            ${artFelt('leapTitle', 'Titel')}
            ${artFelt('leapSub', 'Undertitel')}
            ${artFelt('leapStatusTitle', 'Overskrift over statuslinjen')}
            ${artFelt('leapIntroTitle', 'Introduktion — overskrift')}
            ${artFelt('leapIntroBody', 'Introduktion — tekst', 'HTML er tilladt.', 8)}
        </section>` +
        (ART.leapCards || []).map((c, i) => `<section class="kort art-kort">
            <div class="kort-hoved">
                <h2>Spring ${c.nr || i + 1}</h2>
                <button class="knap lille fare" onclick="sletArtikel('leapCards', ${i})">Slet springet</button>
            </div>
            <div class="spring-tal">
                <label class="felt lille-felt"><span>Nummer</span><input type="number" data-artnum="leapCards.${i}.nr" value="${c.nr || ''}"></label>
                <label class="felt lille-felt"><span>Fra uge</span><input type="number" data-artnum="leapCards.${i}.from" value="${c.from || ''}"></label>
                <label class="felt lille-felt"><span>Til uge</span><input type="number" data-artnum="leapCards.${i}.to" value="${c.to || ''}"></label>
            </div>
            ${artFelt('leapCards.' + i + '.title', 'Navnet på springet')}
            ${artFelt('leapCards.' + i + '.body', 'Tekst', 'HTML er tilladt.', 10)}
        </section>`).join('') +
        `<section class="kort">
            <h2>Afslutning</h2>
            ${artFelt('leapOutroTitle', 'Overskrift')}
            ${artFelt('leapOutroBody', 'Tekst', 'HTML er tilladt.', 8)}
        </section>
        <div class="gem-linje"><button class="knap lille" onclick="nyArtikel('leapCards')">+ Nyt spring</button></div>`;
    }
}

function laesArtikler() {
    const ny = kopi(ART);
    document.querySelectorAll('[data-art]').forEach(el => {
        const sti = el.dataset.art;
        saetSti(ny, sti, el.value);
    });
    document.querySelectorAll('[data-artnum]').forEach(el => {
        saetSti(ny, el.dataset.artnum, Number(el.value) || 0);
    });
    return ny;
}

window.nyArtikel = function (liste) {
    ART = laesArtikler();
    if (!Array.isArray(ART[liste])) ART[liste] = [];
    if (liste === 'leapCards') {
        const sidst = ART[liste][ART[liste].length - 1] || { nr: 0, to: 0 };
        ART[liste].push({ nr: (sidst.nr || 0) + 1, from: (sidst.to || 0) + 1, to: (sidst.to || 0) + 2, title: { da: "", en: "" }, body: { da: "", en: "" } });
    } else {
        ART[liste].push({ title: { da: "", en: "" }, body: { da: "", en: "" } });
    }
    tegnArtikler();
};
window.sletArtikel = function (liste, i) {
    if (!confirm("Slet det for altid?")) return;
    ART = laesArtikler();
    ART[liste].splice(i, 1);
    tegnArtikler();
};

$('btn-gem-artikler')?.addEventListener('click', async () => {
    ART = laesArtikler();
    try {
        await db.collection('content').doc('articles').set(Object.assign({}, ART, { opdateret: new Date().toISOString() }));
        status("Artiklerne er gemt ✓");
    } catch (e) { status("Kunne ikke gemme: " + (e.message || e), true); }
});

$('btn-nulstil-artikler')?.addEventListener('click', () => {
    if (!confirm("Sætte alle artikler tilbage til standard? Det du selv har skrevet, forsvinder.")) return;
    ART = kopi(DEFAULT_ARTICLES); tegnArtikler();
});

// ==================================================
// FILER I CLOUDFLARE
// ==================================================
let filer = [];

async function hentFiler() {
    const box = $('fil-liste');
    if (!box) return;
    if (!cfBase()) {
        box.innerHTML = `<p class="hjaelp">Der står ingen adresse i <code>cloudflare-config.js</code>.
        Skriv din workers.dev-adresse ind under <code>CLOUDFLARE_URL</code>, så kan du lægge filer op herfra.</p>`;
        return;
    }
    box.innerHTML = `<p class="hjaelp">Henter…</p>`;
    try {
        const svar = await fetch(cfBase() + '/list', { headers: { 'Authorization': 'Bearer ' + CLOUDFLARE_TOKEN } });
        if (svar.status === 401) { box.innerHTML = `<p class="hjaelp fejl">Den hemmelige kode passer ikke.
            <code>CLOUDFLARE_TOKEN</code> i cloudflare-config.js skal være præcis den samme som
            <code>ADMIN_TOKEN</code> i Cloudflare.</p>`; return; }
        const j = await svar.json();
        filer = j.filer || [];
    } catch (e) {
        box.innerHTML = `<p class="hjaelp fejl">Kunne ikke nå Cloudflare: ${esc(e.message || e)}</p>`;
        return;
    }
    if (!filer.length) { box.innerHTML = `<p class="hjaelp">Der ligger ingen filer endnu.</p>`; fyldFilVaelgere(); return; }
    box.innerHTML = `<table class="fil-tabel"><thead><tr><th>Fil</th><th>Størrelse</th><th>Lagt op</th><th></th></tr></thead><tbody>` +
        filer.map(f => `<tr>
            <td><code>${esc(f.navn)}</code></td>
            <td>${(f.storrelse / 1048576).toFixed(1)} MB</td>
            <td>${f.tid ? new Date(f.tid).toLocaleDateString('da-DK') : '–'}</td>
            <td class="fil-handling">
                <button class="knap lille" onclick="kopierUrl('${esc(f.url)}')">Kopier adressen</button>
                <button class="knap lille fare" onclick="sletFil('${esc(f.key)}')">Slet</button>
            </td></tr>`).join('') + `</tbody></table>`;
    fyldFilVaelgere();
}

function fyldFilVaelgere() {
    document.querySelectorAll('.fil-vaelger').forEach(sel => {
        sel.innerHTML = `<option value="">— vælg en fil du har lagt op —</option>` +
            filer.map(f => `<option value="${esc(f.url)}">${esc(f.navn)}</option>`).join('');
        sel.onchange = () => {
            if (!sel.value) return;
            const felt = document.querySelector(`.lyd-kort[data-i="${sel.dataset.i}"] .variant[data-j="${sel.dataset.j}"] [data-felt="v.url"]`);
            if (felt) felt.value = sel.value;
            sel.value = "";
        };
    });
}

window.kopierUrl = function (url) {
    navigator.clipboard.writeText(url).then(() => status("Adressen er kopieret ✓"));
};
window.sletFil = async function (key) {
    if (!confirm("Slet filen for altid? Lyde der bruger den, holder op med at virke.")) return;
    try {
        await fetch(cfBase() + '/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CLOUDFLARE_TOKEN },
            body: JSON.stringify({ key })
        });
        hentFiler();
    } catch (e) { status("Kunne ikke slette: " + (e.message || e), true); }
};

$('btn-hent-filer')?.addEventListener('click', hentFiler);

$('btn-upload')?.addEventListener('click', async () => {
    const fil = $('lyd-fil').files[0];
    const st = $('upload-status');
    if (!fil) { st.textContent = "Vælg en fil først."; return; }
    if (!cfBase()) { st.textContent = "Der står ingen adresse i cloudflare-config.js."; return; }
    if (fil.size > 24 * 1024 * 1024) { st.textContent = "Filen er for stor. Max 24 MB."; return; }
    st.textContent = "Lægger op…";
    $('btn-upload').disabled = true;
    try {
        const fd = new FormData();
        fd.append('file', fil);
        fd.append('name', fil.name);
        const svar = await fetch(cfBase() + '/upload', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + CLOUDFLARE_TOKEN },
            body: fd
        });
        const j = await svar.json();
        if (!svar.ok) { st.textContent = "Gik ikke: " + (j.error || svar.status); return; }
        st.innerHTML = `Klar ✓ <code>${esc(j.url)}</code> — den ligger nu i menuerne herunder.`;
        $('lyd-fil').value = "";
        hentFiler();
    } catch (e) {
        st.textContent = "Kunne ikke nå Cloudflare: " + (e.message || e);
    } finally {
        $('btn-upload').disabled = false;
    }
});

// ==================================================
// OPSÆTNING
// ==================================================
function tegnForbindelser() {
    const box = $('forbindelser');
    if (!box) return;
    const raekker = [
        { navn: 'Firebase', ok: !!db, note: db ? 'Forbundet' : 'Tjek firebase-config.js' },
        { navn: 'Admin-mail', ok: !!minEmail, note: minEmail || '–' },
        { navn: 'Cloudflare-adresse', ok: !!cfBase(), note: cfBase() || 'Ikke udfyldt i cloudflare-config.js' },
        { navn: 'Hemmelig kode', ok: !!(typeof CLOUDFLARE_TOKEN !== 'undefined' && CLOUDFLARE_TOKEN), note: (typeof CLOUDFLARE_TOKEN !== 'undefined' && CLOUDFLARE_TOKEN) ? 'Udfyldt' : 'Ikke udfyldt' }
    ];
    box.innerHTML = raekker.map(r => `<div class="forb-raekke">
        <span class="forb-prik ${r.ok ? 'ja' : 'nej'}"></span>
        <strong>${esc(r.navn)}</strong>
        <span class="hjaelp" style="margin:0;">${esc(r.note)}</span>
    </div>`).join('');
}

$('btn-push-setup')?.addEventListener('click', async () => {
    const st = $('push-status');
    if (!cfBase()) { st.textContent = "Skriv først din Cloudflare-adresse ind i cloudflare-config.js."; return; }
    st.textContent = "Arbejder…";
    try {
        const svar = await fetch(cfBase() + '/push/setup', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + CLOUDFLARE_TOKEN }
        });
        const j = await svar.json();
        if (!svar.ok) { st.textContent = "Gik ikke: " + (j.error || svar.status); return; }
        st.innerHTML = `Push er slået til ✓ Nøglerne er gemt i Cloudflare.<br>
        <code>${esc((j.key || '').slice(0, 24))}…</code>`;
    } catch (e) {
        st.textContent = "Kunne ikke nå Cloudflare: " + (e.message || e);
    }
});
