// ==================================================
// BabyBasen — children.js
// Flere børn, deling, farvevalg og login.
// ==================================================

// ==========================================
// GÆST: ét barn i localStorage
// ==========================================
function indlaesGaestData() {
    childId = 'lokal';
    childList = [{ id: 'lokal', name: 'Baby', gender: 'neutral' }];
    const p = gaestLaes('profile', {});
    babyName = p.name || "Baby";
    babyGender = p.gender || "neutral";
    babyColor = p.color || "";
    babyBirthDate = p.birthDate || "";
    babyDueDate = p.dueDate || "";
    birthInfo = p.birthInfo || {};
    inviteCode = "";

    // Gamle logs fra tidligere versioner tages med
    let gammel = {};
    try { gammel = JSON.parse(localStorage.getItem('babyRoLogs')) || {}; } catch (e) {}
    const konverteret = {};
    Object.keys(gammel).forEach(k => {
        let nk = k;
        if (k.includes('.')) {
            const d = k.split('.');
            if (d.length === 3) nk = `${d[2]}-${String(d[1]).padStart(2, '0')}-${String(d[0]).padStart(2, '0')}`;
        }
        konverteret[nk] = gammel[k];
    });
    localSleepLogs = Object.assign(konverteret, gaestLaes('sleep', {}));
    growthData = gaestLaes('growth', { measurements: [], customTypes: [] });
    careData = gaestLaes('care', {});
    milestones = gaestLaes('milestones', []);
}

function gemGaestProfil() {
    gaestSkriv('profile', {
        name: babyName, gender: babyGender, color: babyColor,
        birthDate: babyBirthDate, dueDate: babyDueDate, birthInfo
    });
}

window.nulstilGaest = function () {
    if (!confirm(T('resetAsk'))) return;
    ['profile', 'sleep', 'growth', 'care', 'milestones'].forEach(k => localStorage.removeItem(gaestNoegle(k)));
    localStorage.removeItem('babyRoLogs');
    localStorage.removeItem('babyRoUr_lokal');
    indlaesGaestData();
    opdaterAlt();
    alert(T('resetDone'));
};

// ==========================================
// KONTO: hent børn og data
// ==========================================
async function indlaesBrugerensBoern() {
    const userRef = db.collection("users").doc(currentUserId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Flytning af data fra den gamle version (alt lå i users/{uid})
    if (!userData.children && (userData.babyName || userData.sleepLogs)) {
        await flytGamleData(userRef, userData);
        return indlaesBrugerensBoern();
    }

    let ids = userData.children || [];
    if (!ids.length) ids = [await opretBarn(userData.babyName || "Baby", true)];

    childList = [];
    for (const id of ids) {
        try {
            const d = await db.collection("children").doc(id).get();
            if (d.exists) childList.push(Object.assign({ id }, d.data()));
        } catch (e) { console.log("Kunne ikke hente barn:", id, e); }
    }
    if (!childList.length) {
        const nyt = await opretBarn("Baby", true);
        const d = await db.collection("children").doc(nyt).get();
        childList = [Object.assign({ id: nyt }, d.data())];
    }

    const oensket = localStorage.getItem('babyRoActiveChild') || userData.activeChild;
    const muligt = childList.filter(c => !c.archived);
    const valgt = muligt.find(c => c.id === oensket) || muligt[0] || childList[0];
    await skiftBarn(valgt.id, false);
}

async function flytGamleData(userRef, gammel) {
    const cid = db.collection("children").doc().id;
    await db.collection("children").doc(cid).set({
        name: gammel.babyName || "Baby",
        gender: gammel.babyGender || "neutral",
        birthDate: gammel.babyBirthDate || "",
        dueDate: gammel.babyDueDate || "",
        birthInfo: gammel.birthInfo || {},
        members: { [currentUserId]: true },
        createdAt: Date.now()
    });

    const logs = gammel.sleepLogs || {};
    const maaneder = {};
    Object.keys(logs).forEach(k => {
        const ym = k.slice(0, 7);
        if (!maaneder[ym]) maaneder[ym] = {};
        maaneder[ym][k] = logs[k];
    });
    for (const ym of Object.keys(maaneder)) {
        await db.collection("children").doc(cid).collection("sleep").doc(ym).set({ days: maaneder[ym] });
    }
    if (gammel.growth) await db.collection("children").doc(cid).collection("data").doc("growth").set(gammel.growth);
    await userRef.set({ children: [cid], activeChild: cid }, { merge: true });
    console.log("Dine tidligere data er flyttet til den nye struktur.");
}

async function opretBarn(navn, stille) {
    const cid = db.collection("children").doc().id;
    await db.collection("children").doc(cid).set({
        name: navn || "Baby", gender: "neutral", color: "", birthDate: "", dueDate: "",
        birthInfo: {}, members: { [currentUserId]: true }, createdAt: Date.now()
    });
    await db.collection("users").doc(currentUserId).set({
        children: firebase.firestore.FieldValue.arrayUnion(cid),
        activeChild: cid
    }, { merge: true });
    if (!stille) {
        const d = await db.collection("children").doc(cid).get();
        childList.push(Object.assign({ id: cid }, d.data()));
    }
    return cid;
}

// ==========================================
// SKIFT BARN
// ==========================================
async function skiftBarn(id, gemValg) {
    if (childId && childId !== id) spor('barnSkiftet');
    // Uret hører til det forrige barn — gem det, før vi skifter
    if (typeof gemUr === 'function') gemUr();

    childId = id;
    localStorage.setItem('babyRoActiveChild', id);
    const c = childList.find(x => x.id === id);
    if (c) {
        babyName = c.name || "Baby";
        babyGender = c.gender || "neutral";
        babyColor = c.color || "";
        babyBirthDate = c.birthDate || "";
        babyDueDate = c.dueDate || "";
        birthInfo = c.birthInfo || {};
        inviteCode = c.inviteCode || "";
    }

    localSleepLogs = {}; growthData = { measurements: [], customTypes: [] };
    careData = {}; milestones = [];

    try {
        const base = db.collection("children").doc(id);
        const [sleepSnap, growthDoc, careSnap, msSnap] = await Promise.all([
            base.collection("sleep").get(),
            base.collection("data").doc("growth").get(),
            base.collection("care").get(),
            base.collection("milestones").get()
        ]);
        sleepSnap.forEach(doc => Object.assign(localSleepLogs, doc.data().days || {}));
        if (growthDoc.exists) growthData = Object.assign({ measurements: [], customTypes: [] }, growthDoc.data());
        careSnap.forEach(doc => { careData[doc.id] = doc.data().entries || []; });
        msSnap.forEach(doc => milestones.push(Object.assign({ id: doc.id }, doc.data())));
    } catch (e) { console.log("Kunne ikke hente barnets data:", e); }

    if (gemValg !== false) {
        try { await db.collection("users").doc(currentUserId).set({ activeChild: id }, { merge: true }); } catch (e) {}
    }
    opdaterAlt();
}

function aktiveBoern() { return childList.filter(c => !c.archived); }

// ==========================================
// BØRNELISTE
// ==========================================
function renderChildrenList() {
    const el = document.getElementById('children-list');
    const arkivKort = document.getElementById('archived-card');
    const arkivEl = document.getElementById('archived-list');
    if (!el) return;

    if (isGuest) {
        el.innerHTML = `<p class="field-label">${T('loginForMulti')}</p>
            <button class="action-btn reset-btn full-btn" onclick="nulstilGaest()" style="margin-top:10px;">${T('resetGuest')}</button>`;
        if (arkivKort) arkivKort.style.display = 'none';
        return;
    }

    const raekke = (c, arkiveret) => {
        const antal = Object.keys(c.members || {}).length;
        return `<div class="child-row ${c.id === childId ? 'current' : ''}">
            <div>
                <strong>${esc(c.name || 'Baby')}</strong>
                <small>${c.birthDate ? new Date(c.birthDate).toLocaleDateString(locale()) : T('noBirthDateShort')}${antal > 1 ? ` · ${T('sharedWith')} ${antal - 1}` : ''}</small>
            </div>
            <div class="child-row-actions">
                ${arkiveret
                    ? `<button class="mini-btn" data-unarchive="${c.id}">${T('unarchive')}</button>`
                    : (c.id === childId ? `<span class="chip-tag">${T('selected')}</span>` : `<button class="mini-btn" data-pick="${c.id}">${T('pick')}</button>`)}
                ${arkiveret ? '' : `<button class="mini-btn" data-archive="${c.id}">${T('archive')}</button>`}
                <button class="mini-btn danger" data-delete="${c.id}">${T('del')}</button>
            </div>
        </div>`;
    };

    const aktive = aktiveBoern();
    const arkiv = childList.filter(c => c.archived);
    el.innerHTML = aktive.map(c => raekke(c, false)).join('');
    if (arkivKort) arkivKort.style.display = arkiv.length ? 'block' : 'none';
    if (arkivEl) arkivEl.innerHTML = arkiv.map(c => raekke(c, true)).join('');

    document.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => skiftBarn(b.dataset.pick)));
    document.querySelectorAll('[data-archive]').forEach(b => b.addEventListener('click', () => arkiverBarn(b.dataset.archive, true)));
    document.querySelectorAll('[data-unarchive]').forEach(b => b.addEventListener('click', () => arkiverBarn(b.dataset.unarchive, false)));
    document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => sletBarnHelt(b.dataset.delete)));
}

async function arkiverBarn(id, skjul) {
    const c = childList.find(x => x.id === id);
    if (!c) return;
    if (skjul && aktiveBoern().length <= 1) { alert(T('cantArchiveOnly')); return; }
    try {
        await db.collection("children").doc(id).set({ archived: !!skjul }, { merge: true });
        c.archived = !!skjul;
        if (skjul && childId === id) await skiftBarn(aktiveBoern()[0].id);
        else { renderChildrenList(); opdaterProfilMenu(); }
    } catch (e) { alert(T('couldNotSave') + e.message); }
}

async function sletBarnHelt(id) {
    const c = childList.find(x => x.id === id);
    const navn = c?.name || 'barnet';
    const antal = Object.keys(c?.members || {}).length;

    if (!confirm(T('deleteChildAsk', { navn }) + (antal > 1 ? '\n\n' + T('deleteChildShared') : ''))) return;
    if (!confirm(T('deleteChildSure', { navn }))) return;

    try {
        const base = db.collection("children").doc(id);
        for (const mappe of ['sleep', 'care', 'milestones', 'data']) {
            const snap = await base.collection(mappe).get();
            for (const doc of (snap.docs || [])) await base.collection(mappe).doc(doc.id).delete();
        }
        if (c?.inviteCode) await db.collection("invites").doc(c.inviteCode).delete().catch(() => {});
        await base.delete();
        await db.collection("users").doc(currentUserId).set({
            children: firebase.firestore.FieldValue.arrayRemove(id)
        }, { merge: true });
        localStorage.removeItem('babyRoUr_' + id);

        childList = childList.filter(x => x.id !== id);
        if (!childList.length) {
            const nyt = await opretBarn("Baby", true);
            const d = await db.collection("children").doc(nyt).get();
            childList = [Object.assign({ id: nyt }, d.data())];
            await skiftBarn(nyt);
            alert(T('childDeletedNew', { navn }));
        } else {
            if (childId === id) await skiftBarn(childList[0].id);
            else { renderChildrenList(); opdaterProfilMenu(); }
            alert(T('childDeleted', { navn }));
        }
    } catch (e) { alert(T('couldNotDelete') + e.message); }
}

document.getElementById('btn-new-child')?.addEventListener('click', tilfoejBarn);

async function tilfoejBarn() {
    if (isGuest) { alert(T('loginForChildren')); return; }
    const navn = prompt(T('askChildName'));
    if (!navn || !navn.trim()) return;
    spor('barnTilfoejet');
    const cid = await opretBarn(navn.trim(), false);
    await skiftBarn(cid);
    alert(T('childAdded', { navn: navn.trim() }));
}

// ==========================================
// DELING
// ==========================================
function lavKode() {
    const tegn = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 4; i++) s += tegn[Math.floor(Math.random() * tegn.length)];
    return "BABY-" + s;
}

function renderShare() {
    const el = document.getElementById('share-area');
    if (!el) return;
    if (isGuest) { el.innerHTML = `<p class="field-label">${T('loginToShare')}</p>`; return; }

    const c = childList.find(x => x.id === childId);
    const antal = Object.keys(c?.members || {}).length;
    el.innerHTML = `
        <p class="field-label">${T('sharingNow', { navn: esc(babyName) })} ${antal - 1 > 0 ? (antal - 1) : T('nobodyYet')}.</p>
        ${inviteCode
            ? `<div class="code-box"><span id="code-value">${esc(inviteCode)}</span>
                   <button class="mini-btn" id="btn-copy-code">${T('copy')}</button></div>
               <p class="field-label">${T('codeHelp')}</p>
               <button class="action-btn reset-btn full-btn" id="btn-new-code">${T('newCode')}</button>`
            : `<button class="action-btn save-btn full-btn" id="btn-make-code">${T('makeCode')}</button>`}`;

    document.getElementById('btn-make-code')?.addEventListener('click', lavDelingskode);
    document.getElementById('btn-new-code')?.addEventListener('click', lavDelingskode);
    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
        navigator.clipboard.writeText(inviteCode);
        const b = document.getElementById('btn-copy-code');
        b.textContent = T('copied');
        setTimeout(() => { b.textContent = T('copy'); }, 1500);
    });
}

async function lavDelingskode() {
    if (isGuest) { alert(T('loginFirst')); return; }
    const kode = lavKode();
    try {
        if (inviteCode) await db.collection("invites").doc(inviteCode).delete().catch(() => {});
        await db.collection("invites").doc(kode).set({ childId, createdBy: currentUserId, createdAt: Date.now() });
        await db.collection("children").doc(childId).set({ inviteCode: kode }, { merge: true });
        inviteCode = kode;
        const c = childList.find(x => x.id === childId);
        if (c) c.inviteCode = kode;
        renderShare();
    } catch (e) { alert(T('couldNotSave') + e.message); }
}

document.getElementById('btn-join-child')?.addEventListener('click', async () => {
    spor('tilsluttet');
    if (isGuest) { alert(T('loginToJoin')); return; }
    const kode = document.getElementById('join-code').value.trim().toUpperCase();
    if (!kode) { alert(T('writeCode')); return; }
    try {
        const inv = await db.collection("invites").doc(kode).get();
        if (!inv.exists) { alert(T('codeNotFound')); return; }
        const cid = inv.data().childId;
        if (childList.some(c => c.id === cid)) { alert(T('alreadyJoined')); return; }

        // joinedWith beviser over for Firestore-reglerne, at vi kender koden
        await db.collection("children").doc(cid).set({
            members: { [currentUserId]: true },
            joinedWith: kode
        }, { merge: true });
        await db.collection("users").doc(currentUserId).set({
            children: firebase.firestore.FieldValue.arrayUnion(cid)
        }, { merge: true });

        const d = await db.collection("children").doc(cid).get();
        childList.push(Object.assign({ id: cid }, d.data()));
        document.getElementById('join-code').value = '';
        await skiftBarn(cid);
        alert(T('joinedOk', { navn: d.data().name || '' }));
    } catch (e) { alert(T('couldNotSave') + e.message); }
});

// ==========================================
// PROFILFELTER
// ==========================================
const profileNameInput = document.getElementById('profile-name-input');
const profileDueDateInput = document.getElementById('profile-duedate-input');
const profileBirthDateInput = document.getElementById('profile-birthdate-input');
const BIRTH_FIELDS = ['birth-time', 'birth-place', 'birth-weight', 'birth-length', 'birth-head', 'birth-week', 'parent-1', 'parent-2', 'birth-story'];

async function gemProfil(visKvittering) {
    if (isGuest) {
        gemGaestProfil();
        applyGenderTheme(); renderTexts();
        if (visKvittering) alert(T('loginToSave'));
        return false;
    }
    try {
        await db.collection("children").doc(childId).set({
            name: babyName, gender: babyGender, color: babyColor,
            birthDate: babyBirthDate, dueDate: babyDueDate, birthInfo
        }, { merge: true });
        const c = childList.find(x => x.id === childId);
        if (c) Object.assign(c, { name: babyName, gender: babyGender, color: babyColor, birthDate: babyBirthDate, dueDate: babyDueDate, birthInfo });
        applyGenderTheme(); renderTexts(); renderChildrenList(); renderShare(); opdaterProfilMenu();
        if (typeof planlaegNaesteSoevn === 'function') planlaegNaesteSoevn();
        if (visKvittering) alert(T('savedOk'));
        return true;
    } catch (e) { alert(T('couldNotSave') + e.message); return false; }
}

// Køn: sætter automatisk blå eller lyserød og rydder egen farve
document.querySelectorAll('.gender-btn[data-gender]').forEach(btn => {
    btn.addEventListener('click', async () => {
        spor('koenValgt');
        babyGender = btn.getAttribute('data-gender');
        babyColor = "";
        applyGenderTheme();
        document.getElementById('color-row').style.display = 'none';
        if (!isGuest) await gemProfil(false); else gemGaestProfil();
        if (typeof renderGrowth === 'function') renderGrowth();
    });
});

// Egen farve
document.getElementById('btn-color-pick')?.addEventListener('click', () => {
    const row = document.getElementById('color-row');
    if (!row) return;
    renderFarveRaekke();
    row.style.display = row.style.display === 'grid' ? 'none' : 'grid';
});

document.getElementById('color-row')?.addEventListener('click', async (e) => {
    const knap = e.target.closest('[data-color]');
    if (!knap) return;
    spor('farveValgt');
    babyColor = (babyColor === knap.dataset.color) ? "" : knap.dataset.color;
    applyGenderTheme();
    if (!isGuest) await gemProfil(false); else gemGaestProfil();
});

document.getElementById('btn-update-name')?.addEventListener('click', async () => {
    const n = profileNameInput.value.trim();
    if (n) babyName = n;
    if (profileBirthDateInput.value) babyBirthDate = profileBirthDateInput.value;
    if (profileDueDateInput.value) babyDueDate = profileDueDateInput.value;
    if (await gemProfil(true)) {
        if (typeof renderGrowth === 'function') renderGrowth();
        renderPlanCard();
    }
});

document.getElementById('btn-save-birth')?.addEventListener('click', async () => {
    BIRTH_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) birthInfo[id] = el.value;
    });
    await gemProfil(true);
});

function refreshProfileInputs() {
    if (profileNameInput) profileNameInput.value = (babyName !== "Baby") ? babyName : "";
    if (profileDueDateInput) profileDueDateInput.value = babyDueDate || "";
    if (profileBirthDateInput) profileBirthDateInput.value = babyBirthDate || "";
    BIRTH_FIELDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = birthInfo[id] || "";
    });
    const locked = document.getElementById('profile-locked-note');
    if (locked) locked.style.display = isGuest ? 'block' : 'none';

    // Neutral-knappen vises kun, hvis admin har slået den til
    const neutral = document.getElementById('gender-neutral');
    if (neutral) neutral.style.display = (TEXTS.showNeutral === true) ? 'block' : 'none';

    renderChildrenList();
    renderShare();
}

// ==========================================
// LOGIN
// ==========================================
if (auth) {
    document.getElementById('btn-google-login')?.addEventListener('click', () => {
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => alert("Login: " + e.message));
    });
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if (confirm(T('logoutConfirm'))) auth.signOut();
    });

    auth.onAuthStateChanged(async (user) => {
        const guestSection = document.getElementById('profile-guest-section');
        const loggedIn = document.getElementById('profile-logged-in-section');

        if (user) {
            isGuest = false;
            currentUserId = user.uid;
            currentEmail = user.email || "";
            if (guestSection) guestSection.style.display = 'none';
            if (loggedIn) loggedIn.style.display = 'block';
            const mail = document.getElementById('logged-in-email');
            if (mail) mail.textContent = currentEmail;
            if (typeof sporLogin === 'function') sporLogin();
            try { await indlaesBrugerensBoern(); }
            catch (e) { console.log("Kunne ikke hente børn:", e); opdaterAlt(); }
        } else {
            isGuest = true;
            currentUserId = null; currentEmail = "";
            if (guestSection) guestSection.style.display = 'block';
            if (loggedIn) loggedIn.style.display = 'none';
            indlaesGaestData();
            opdaterAlt();
        }
    });
} else {
    // Firebase kom ikke i gang. Før sad login-knappen bare og gjorde ingenting,
    // og man kunne ikke se hvorfor. Nu siger den det højt.
    const forklar = () => {
        const n = (typeof firebaseFejl !== 'undefined' && firebaseFejl) ? firebaseFejl : 'firebaseStartFejl';
        alert(T(n));
        console.log('BabyBasen: login virker ikke, fordi →', n);
    };
    document.getElementById('btn-google-login')?.addEventListener('click', forklar);
    document.getElementById('btn-logout')?.addEventListener('click', forklar);

    document.addEventListener('DOMContentLoaded', () => {
        const note = document.getElementById('profile-locked-note');
        if (note) {
            const n = (typeof firebaseFejl !== 'undefined' && firebaseFejl) ? firebaseFejl : 'firebaseStartFejl';
            note.textContent = T(n);
            note.classList.add('notif-error');
        }
    });
}

// Gæstetilstand med det samme, så siden aldrig står tom
document.addEventListener('DOMContentLoaded', () => {
    if (isGuest) { indlaesGaestData(); opdaterAlt(); }
});
