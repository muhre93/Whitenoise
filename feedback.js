// ==================================================
// BabyBasen — feedback.js
// Brugerne kan sende ros, ris, idéer og fejl.
// Gemmes i Firestore, så de kan læses i admin.
// ==================================================

let fbType = 'godt';

document.querySelectorAll('.fb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.fb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        fbType = btn.dataset.fb;
    });
});

document.getElementById('btn-send-feedback')?.addEventListener('click', async () => {
    const felt = document.getElementById('fb-text');
    const status = document.getElementById('fb-status');
    const knap = document.getElementById('btn-send-feedback');
    const tekst = (felt?.value || '').trim();

    if (!tekst) { status.textContent = T('fbEmpty'); status.classList.add('notif-error'); return; }
    if (!db) { status.textContent = T('fbFailed'); status.classList.add('notif-error'); return; }
    spor('feedback');

    status.classList.remove('notif-error');
    knap.disabled = true;
    knap.textContent = T('fbSending');

    try {
        await db.collection("feedback").add({
            type: fbType,
            text: tekst.slice(0, 2000),
            sprog: SPROG,
            fra: isGuest ? 'gæst' : (currentEmail || currentUserId || ''),
            enhed: (navigator.userAgent || '').slice(0, 180),
            installeret: (typeof erInstalleret === 'function') ? erInstalleret() : false,
            tid: Date.now(),
            dato: todayKey(),
            laest: false
        });
        felt.value = '';
        status.textContent = T('fbThanks');
    } catch (e) {
        status.textContent = T('fbFailed');
        status.classList.add('notif-error');
        console.log("Feedback:", e);
    } finally {
        knap.disabled = false;
        knap.textContent = T('fbSend');
    }
});
