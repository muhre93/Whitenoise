// ==================================================
// BabyBasen — lockscreen.js
//
// Viser en bjælke på telefonens låseskærm, mens barnet
// sover, med navn, forløbet tid og en play/pause-knap
// der styrer søvnuret.
//
// SÅDAN VIRKER DET:
// Telefoner viser kun sådan en bjælke for noget, der
// afspiller lyd. Derfor kører BabyBasen en næsten lydløs
// tone i baggrunden, mens uret er i gang, og hænger
// oplysningerne på den via Media Session. Spiller der
// allerede en rigtig beroligende lyd, bruges den i stedet.
// ==================================================

let laaseskaermTil = localStorage.getItem('babyRoLock') === 'ja';
let stilleUrl = null;
let laaseTimer = null;

function harMediaSession() {
    return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

// ==========================================
// EN NÆSTEN LYDLØS TONE
// Ren stilhed bliver stoppet af nogle browsere, så
// tonen har en ganske svag amplitude — uhørbar i praksis.
// ==========================================
function lavStilleLyd() {
    if (stilleUrl) return stilleUrl;
    const sr = 8000, sekunder = 2, n = sr * sekunder;
    const buf = new ArrayBuffer(44 + n * 2);
    const v = new DataView(buf);
    const skriv = (pos, s) => { for (let i = 0; i < s.length; i++) v.setUint8(pos + i, s.charCodeAt(i)); };

    skriv(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); skriv(8, 'WAVE');
    skriv(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    skriv(36, 'data'); v.setUint32(40, n * 2, true);

    for (let i = 0; i < n; i++) {
        v.setInt16(44 + i * 2, Math.round(Math.sin(i / 40) * 2), true);
    }
    stilleUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    return stilleUrl;
}

// ==========================================
// TÆND / SLUK
// ==========================================
async function slaaLaaseskaermTil() {
    if (!harMediaSession()) { visLaaseStatus(T('lockNotSupported'), true); return false; }
    laaseskaermTil = true;
    localStorage.setItem('babyRoLock', 'ja');
    opdaterLaaseskaerm();
    opdaterLaaseKnap();
    return true;
}

function slaaLaaseskaermFra() {
    laaseskaermTil = false;
    localStorage.setItem('babyRoLock', 'nej');
    stopStilleLyd();
    ryddMediaSession();
    opdaterLaaseKnap();
}

function stopStilleLyd() {
    const el = document.getElementById('lock-audio');
    if (el && !el.paused) el.pause();
    if (laaseTimer) { clearInterval(laaseTimer); laaseTimer = null; }
}

function ryddMediaSession() {
    if (!harMediaSession()) return;
    try {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.metadata = null;
    } catch (e) {}
}

// ==========================================
// OPDATERING
// ==========================================
function opdaterLaaseskaerm() {
    if (!harMediaSession()) return;
    const koerer = (typeof urKoerer !== 'undefined') && urKoerer;

    if (!laaseskaermTil || !koerer) {
        // Kun stop den stille tone — en rigtig lyd må gerne køre videre
        stopStilleLyd();
        if (!koerer) ryddMediaSession();
        opdaterLaaseKnap();
        return;
    }

    startBaggrundslyd();
    saetMetadata();
    saetHandlers();

    if (!laaseTimer) laaseTimer = setInterval(saetMetadata, 30000);
    opdaterLaaseKnap();
}

function startBaggrundslyd() {
    const rigtig = document.getElementById('global-audio-player');
    if (rigtig && !rigtig.paused) return;   // der spiller allerede noget

    const el = document.getElementById('lock-audio');
    if (!el) return;
    if (!el.src) { el.src = lavStilleLyd(); el.volume = 0.02; }
    if (el.paused) el.play().catch(() => visLaaseStatus(T('lockNotSupported'), true));
}

function saetMetadata() {
    if (!harMediaSession()) return;
    const sek = (typeof forloebetSek === 'function') ? forloebetSek() : 0;
    const naeste = (typeof naesteSoevnTid === 'function') ? naesteSoevnTid() : null;

    const linje2 = naeste
        ? T('lockWindow', { tid: clockFromMs(naeste.tidligst) })
        : (typeof formatTimeText === 'function' ? formatTimeText(sek) : '');

    try {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: T('lockSleeping', { navn: babyName }),
            artist: formatTimeText(sek),
            album: linje2,
            artwork: [{ src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml' }]
        });
        navigator.mediaSession.playbackState = 'playing';
        // Giver en tællende bjælke på låseskærmen
        if (navigator.mediaSession.setPositionState) {
            navigator.mediaSession.setPositionState({
                duration: Math.max(sek + 3600, 7200),
                position: sek,
                playbackRate: 1
            });
        }
    } catch (e) {}
}

function saetHandlers() {
    if (!harMediaSession()) return;
    const saet = (navn, fn) => { try { navigator.mediaSession.setActionHandler(navn, fn); } catch (e) {} };

    // Pause på låseskærmen sætter luren på pause
    saet('pause', () => {
        if (typeof stopStopwatch === 'function') stopStopwatch();
        try { navigator.mediaSession.playbackState = 'paused'; } catch (e) {}
    });
    saet('play', () => {
        if (typeof startStopwatch === 'function') startStopwatch();
    });
    // Stop gemmer luren, så man kan afslutte uden at låse op
    saet('stop', () => {
        document.getElementById('btn-save-log')?.click();
    });
    saet('nexttrack', () => {
        document.getElementById('btn-save-log')?.click();
    });
    saet('seekbackward', null);
    saet('seekforward', null);
}

// ==========================================
// UI
// ==========================================
function visLaaseStatus(tekst, fejl) {
    const el = document.getElementById('lock-status');
    if (!el) return;
    el.textContent = tekst || '';
    el.classList.toggle('notif-error', !!fejl);
}

function opdaterLaaseKnap() {
    const btn = document.getElementById('btn-lock-toggle');
    if (!btn) return;
    btn.textContent = laaseskaermTil ? T('lockOffBtn') : T('lockOn');
    btn.classList.toggle('save-btn', laaseskaermTil);
    btn.classList.toggle('reset-btn', !laaseskaermTil);
    if (!document.getElementById('lock-status')?.classList.contains('notif-error')) {
        visLaaseStatus(laaseskaermTil ? T('lockHelp') : '');
    }
}

document.getElementById('btn-lock-toggle')?.addEventListener('click', async () => {
    if (!laaseskaermTil) spor('laaseskaerm');
    if (laaseskaermTil) slaaLaaseskaermFra();
    else await slaaLaaseskaermTil();
});

document.addEventListener('DOMContentLoaded', () => {
    if (!harMediaSession()) {
        const btn = document.getElementById('btn-lock-toggle');
        if (btn) btn.style.display = 'none';
        return;
    }
    opdaterLaaseKnap();
    opdaterLaaseskaerm();
});

// Når appen kommer frem igen, opdateres bjælken
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') opdaterLaaseskaerm();
});
