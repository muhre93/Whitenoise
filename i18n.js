// ==================================================
// BabyBasen — i18n.js
// Dansk og engelsk. Sproget gemmes lokalt og
// skiftes med knappen i øverste højre hjørne.
// ==================================================

let SPROG = localStorage.getItem('babyRoLang');
if (SPROG !== 'en' && SPROG !== 'da') SPROG = 'da';   // dansk som standard

const ORD = {

    urSover: { da: "💤 {navn} sover",           en: "💤 {navn} is asleep" },
    urPause: { da: "⏸ Luren er sat på pause",   en: "⏸ The nap is paused" },
    urKlar:  { da: "{navn} er vågen",           en: "{navn} is awake" },


    ownPeriod: { da: "Vælg dine egne datoer", en: "Pick your own dates" },


    timerSettings: { da: "Indstillinger for uret", en: "Timer settings" },


    // ---------- SOVENDE SØSKENDE ----------
    sleepsToo:    { da: "sover også",       en: "is asleep too" },
    tapToSwitch:  { da: "tryk for at skifte", en: "tap to switch" },

    // ---------- FANER MED KLARERE NAVNE ----------
    tabSounds:    { da: "🎵 Lyde",          en: "🎵 Sounds" },
    tabNapsToday: { da: "🌙 Dagens lure",   en: "🌙 Today's naps" },
    tabMonitor:   { da: "🎙️ Babyalarm",    en: "🎙️ Baby monitor" },
    tabDayByDay:  { da: "📅 Dag for dag",   en: "📅 Day by day" },
    tabNumbers:   { da: "📊 Tal & grafer",  en: "📊 Numbers & charts" },


    // ---------- NÅR FIREBASE IKKE VIRKER ----------
    firebaseManglerSdk:  { da: "Firebase kunne ikke hentes. Tjek din internetforbindelse, og prøv igen.",
                           en: "Firebase couldn't load. Check your internet connection and try again." },
    firebaseManglerFil:  { da: "Filen firebase-config.js mangler. Læg den op på GitHub ved siden af index.html.",
                           en: "The file firebase-config.js is missing. Upload it to GitHub next to index.html." },
    firebaseIkkeUdfyldt: { da: "Dine Firebase-nøgler er ikke skrevet ind endnu. Åbn firebase-config.js på GitHub og sæt dine egne værdier ind — husk anførselstegn om hver af dem.",
                           en: "Your Firebase keys haven't been filled in yet. Open firebase-config.js on GitHub and put your own values in — remember the quote marks around each one." },
    firebaseStartFejl:   { da: "Firebase kunne ikke starte. Det skyldes næsten altid en fejl i firebase-config.js — tjek at hver værdi står mellem to anførselstegn.",
                           en: "Firebase couldn't start. This is nearly always a mistake in firebase-config.js — check that every value sits between two quote marks." },


    // ---------- NAVIGATION (korte navne i bunden) ----------
    navPlayerShort:     { da: "Søvnur", en: "Sleep timer" },
    navCareShort:       { da: "Mad & bleer", en: "Food & nappies" },
    navHistoryShort:    { da: "Søvnlog", en: "Sleep log" },
    navGrowthShort:     { da: "Vækst", en: "Growth" },
    navMilestonesShort: { da: "Milepæle", en: "Milestones" },
    navKnowShort:       { da: "Viden", en: "Learn" },
    // ---------- PROFILMENU ----------
    tabReport:      { da: "📄 Rapport",     en: "📄 Report" },
    tabFeedback:    { da: "💬 Godt og skidt", en: "💬 Good and bad" },

    // ---------- UR OG LÅSESKÆRM ----------
    lockOffBtn:     { da: "🔓 Slå bjælken fra", en: "🔓 Turn the bar off" },

    // ---------- PLEJE ----------
    careNoEntries:  { da: "Der er ikke registreret noget på den dag endnu.", en: "Nothing logged for that day yet." },
    careHeroNone:   { da: "Der er ikke registreret et måltid i dag endnu.", en: "No feed logged today yet." },
    careHeroLast:   { da: "Seneste {type} var {siden}.", en: "Last {type} was {siden}." },
    justNow:        { da: "lige nu",        en: "just now" },
    noneToday:      { da: "ingen i dag",    en: "none today" },
    minShort:       { da: "min",            en: "min" },
    inTotal:        { da: "i alt",          en: "in total" },
    statFeedsDay:   { da: "Måltider pr. dag", en: "Feeds per day" },
    statNappiesDay: { da: "Bleer pr. dag",  en: "Nappies per day" },
    statMlDay:      { da: "Mælk pr. dag",   en: "Milk per day" },
    statBreastDay:  { da: "Amning pr. dag", en: "Breastfeeding per day" },
    noMlYet:        { da: "Der er ikke skrevet nogen mængder ind endnu.", en: "No amounts entered yet." },

    // ---------- VÆKST ----------
    growthLast:     { da: "Seneste måling: {dato}", en: "Last measurement: {dato}" },
    growthNone:     { da: "Der er ingen målinger endnu. Skriv den første ind herunder.", en: "No measurements yet. Add the first one below." },
    noMeasuresYet:  { da: "Der er ingen målinger endnu.", en: "No measurements yet." },
    noMeasuresPeriod: { da: "Ingen målinger i den periode.", en: "No measurements in that period." },
    deleteMeasureSure: { da: "Slet målingen?", en: "Delete this measurement?" },
    ownNameAsk:     { da: "Hvad skal målingen hedde? (fx Temperatur)", en: "What should the measurement be called? (e.g. Temperature)" },
    ownUnitAsk:     { da: "Hvilken enhed? (fx °C — lad stå tom hvis ingen)", en: "Which unit? (e.g. °C — leave blank for none)" },
    monthsShort:    { da: "mdr",            en: "mo" },
    monthOne:       { da: "måned",          en: "month" },
    monthMany:      { da: "måneder",        en: "months" },
    underMonth:     { da: "under 1 måned",  en: "under 1 month" },
    whoNormal:      { da: "inden for det normale", en: "within the normal range" },
    whoBelow:       { da: "under det normale", en: "below the normal range" },
    whoAbove:       { da: "over det normale", en: "above the normal range" },
    whoBand:        { da: "WHO normalområde", en: "WHO normal range" },

    // ---------- MILEPÆLE ----------
    msEmpty:        { da: "Der er ingen milepæle endnu. Den første må du meget gerne skrive ind.", en: "No milestones yet. Do add the first one." },
    msNeedTitle:    { da: "Skriv hvad der skete.", en: "Write what happened." },
    msDeleteSure:   { da: "Slet milepælen?", en: "Delete this milestone?" },
    msPhotoBig:     { da: "Billedet er for stort. Vælg et på under 4 MB.", en: "That image is too big. Pick one under 4 MB." },
    msNonePeriod:   { da: "Ingen milepæle i den periode.", en: "No milestones in that period." },

    // ---------- SØVNREDIGERING ----------
    pickTime:       { da: "Vælg både dato og klokkeslæt.", en: "Pick both a date and a time." },
    deleteSleepSure:{ da: "Slet den lur?", en: "Delete this nap?" },

    // ---------- BØRN ----------
    childNoName:    { da: "Uden navn",      en: "No name" },
    childDeleted:   { da: "{navn} er slettet.", en: "{navn} has been deleted." },
    childDeletedNew:{ da: "{navn} er slettet. Du starter nu forfra med et nyt barn.", en: "{navn} has been deleted. You're starting fresh with a new child." },
    deleteChildAsk: { da: "Slet {navn} og alt der er gemt? Det kan ikke fortrydes.", en: "Delete {navn} and everything saved? This can't be undone." },
    deleteChildShared: { da: "{navn} deles med en anden. Sletter du barnet, forsvinder det også for dem.", en: "{navn} is shared with someone else. Deleting removes it for them too." },
    deleteChildSure:{ da: "Skriv SLET for at bekræfte", en: "Type DELETE to confirm" },

    // ---------- PÅMINDELSER ----------
    notifWorking:   { da: "Arbejder…",      en: "Working…" },
    notifOn:        { da: "Påmindelser er slået til. Du får besked {min} min. før næste søvnvindue.", en: "Reminders are on. You'll hear from us {min} min before the next sleep window." },
    notifDenied:    { da: "Browseren sagde nej. Slå beskeder til for siden i browserens indstillinger.", en: "The browser said no. Allow notifications for this site in your browser settings." },
    notifNotSupported: { da: "Den her browser kan ikke sende påmindelser. Prøv Chrome eller Safari — og læg appen på hjemmeskærmen først.", en: "This browser can't send reminders. Try Chrome or Safari — and add the app to your home screen first." },
    notifNoServer:  { da: "Der mangler en adresse i cloudflare-config.js.", en: "There's no address in cloudflare-config.js." },
    notifNoKey:     { da: "Serveren har ikke fået lavet sine nøgler endnu. Tryk \"Slå push til\" på admin-siden.", en: "The server hasn't made its keys yet. Press \"Turn push on\" on the admin page." },
    notifServerFail:{ da: "Serveren svarede ikke som forventet.", en: "The server didn't respond as expected." },
    notifError:     { da: "Der gik noget galt:", en: "Something went wrong:" },
    notifTestSent:  { da: "Testbeskeden er sendt. Den kommer om et øjeblik.", en: "Test message sent. It'll arrive in a moment." },
    notifTestSentLocal: { da: "Testbeskeden er vist her på enheden.", en: "Test message shown on this device." },
    notifTestTitle: { da: "BabyBasen",      en: "BabyBase" },
    notifTestBody:  { da: "Sådan ser en påmindelse om {navn} ud.", en: "This is what a reminder about {navn} looks like." },

    // ---------- RAPPORT ----------
    reportFor:      { da: "Perioden",       en: "Period" },
    reportKey:      { da: "Nøgletal",       en: "Key figures" },
    reportDayByDay: { da: "Dag for dag",    en: "Day by day" },
    reportRec:      { da: "Anbefalingen for den alder er {min}-{max} timers søvn i døgnet fordelt på ca. {lure} lure.", en: "The recommendation at this age is {min}-{max} hours of sleep a day across about {lure} naps." },
    reportFoot:     { da: "Lavet i BabyBasen. Tallene er skrevet ind af forælderen og er ikke en lægefaglig vurdering.", en: "Made in BabyBase. The figures were entered by the parent and are not a medical assessment." },
    printBtn:       { da: "🖨️ Print eller gem som PDF", en: "🖨️ Print or save as PDF" },
    summaryTotal:   { da: "I alt er der registreret {timer} timers søvn fordelt på {lure} lure.", en: "In total {timer} hours of sleep have been logged across {lure} naps." },
    birthWeek:      { da: "Uge ved fødslen", en: "Week at birth" },
    birthHead:      { da: "Hovedomfang ved fødslen", en: "Head at birth" },
    ageLabel:       { da: "Alder",          en: "Age" },

    // ---------- DIAGRAMMER ----------
    actualSleep:    { da: "Faktisk søvn",   en: "Actual sleep" },
    avg3day:        { da: "3-dages gennemsnit", en: "3-day average" },

    // ---------- INSTALLATION ----------
    installIOS:     { da: "På iPhone: tryk på Del-knappen nederst og vælg \"Føj til hjemmeskærm\".", en: "On iPhone: tap the Share button at the bottom and choose \"Add to Home Screen\"." },
    installAndroid: { da: "På Android: tryk på de tre prikker øverst og vælg \"Installer app\".", en: "On Android: tap the three dots at the top and choose \"Install app\"." },

    // ---------- NAVIGATION ----------
    navPlayer:      { da: "⏱️ Søvnur",      en: "⏱️ Sleep timer" },
    navCare:        { da: "🍼 Pleje",        en: "🍼 Care" },
    navHistory:     { da: "🌙 Søvn",         en: "🌙 Sleep" },
    navProfile:     { da: "Profil",          en: "Profile" },
    navMilestones:  { da: "⭐ Milepæle",     en: "⭐ Milestones" },
    navKnow:        { da: "📖 Viden",        en: "📖 Learn" },
    navGrowth:      { da: "📈 Vækst",        en: "📈 Growth" },
    navPlayerSounds:{ da: "Lyde",            en: "Sounds" },
    smartShort:     { da: "Smart-lyt",       en: "Smart listen" },

    // ---------- FÆLLES ----------
    save:           { da: "Gem",             en: "Save" },
    cancel:         { da: "Annullér",        en: "Cancel" },
    close:          { da: "✕ Luk",           en: "✕ Close" },
    today:          { da: "I dag",           en: "Today" },
    yesterday:      { da: "I går",           en: "Yesterday" },
    dayBefore:      { da: "Dagen før",       en: "Day before" },
    tomorrow:       { da: "I morgen",        en: "Tomorrow" },
    date:           { da: "Dato",            en: "Date" },
    time:           { da: "Tidspunkt",       en: "Time" },
    note:           { da: "Note (valgfri)",  en: "Note (optional)" },
    from:           { da: "Fra",             en: "From" },
    to:             { da: "Til",             en: "To" },
    none:           { da: "Endnu ingen",     en: "None yet" },
    loginToSave:    { da: "Log ind med Google under Profil for at gemme dine oplysninger.", en: "Sign in with Google under Profile to save your details." },

    // ---------- SØVNUR ----------
    timerLabel:     { da: "Søvnur",              en: "Sleep timer" },
    btnStart:       { da: "▶ Start lur",         en: "▶ Start nap" },
    btnResume:      { da: "▶ Fortsæt lur",       en: "▶ Resume nap" },
    btnPause:       { da: "⏸ Pause lur",         en: "⏸ Pause nap" },
    btnSaveNap:     { da: "Gem lur",             en: "Save nap" },
    btnReset:       { da: "Nulstil",             en: "Reset" },
    timerHelp:      { da: "Uret kan bruges helt uden lyd, og det kører videre, selv om du lukker siden. Afspiller du en lyd, starter det af sig selv.", en: "The timer works with no sound at all and keeps running even if you close the page. Playing a sound starts it automatically." },
    resetConfirm:   { da: "Vil du nulstille luren uden at gemme?", en: "Reset the nap without saving?" },
    timerZero:      { da: "Søvnuret er på nul. Tryk 'Start lur' eller afspil en lyd først.", en: "The timer is at zero. Press 'Start nap' or play a sound first." },
    autoStopTitle:  { da: "Sluk lyden blødt efter", en: "Fade out sound after" },
    autoStopSub:    { da: "Tones ned over 5 minutter, så barnet ikke vågner af stilheden", en: "Fades over 5 minutes so silence doesn't wake the baby" },
    autoStopTip:    { da: "I stedet for at stoppe brat skruer BabyBasen langsomt ned over de sidste 5 minutter. Et brat lydskift er en af de hyppigste grunde til, at en baby vågner.", en: "Instead of stopping abruptly, BabyBase fades down over the last 5 minutes. A sudden change in sound is one of the most common reasons a baby wakes." },
    asAlways:       { da: "Hele tiden",   en: "Keep playing" },
    as30:           { da: "30 min",       en: "30 min" },
    as60:           { da: "1 time",       en: "1 hour" },
    as120:          { da: "2 timer",      en: "2 hours" },
    as240:          { da: "4 timer",      en: "4 hours" },
    as720:          { da: "12 timer",     en: "12 hours" },
    play:           { da: "Afspil",       en: "Play" },
    pauseSound:     { da: "Pause lyd",    en: "Pause sound" },
    stopAll:        { da: "Sluk alt lyd", en: "Stop all sound" },

    // ---------- DAGENS PLAN ----------
    planTitle:      { da: "Dagens plan",       en: "Today's plan" },
    planTip:        { da: "BabyBasen regner næste sovetid ud fra, hvornår sidste lur sluttede, plus den vågetid der passer til barnets alder. Kræver at fødselsdatoen er udfyldt under Profil.", en: "BabyBase works out the next sleep from when the last nap ended plus the wake window for your baby's age. Requires a date of birth under Profile." },
    planNext:       { da: "Næste søvn",        en: "Next sleep" },
    planOpens:      { da: "Næste søvnvindue åbner", en: "Next sleep window opens" },
    planOpensIn:    { da: "Næste søvnvindue åbner om", en: "Next sleep window opens in" },
    atClockWord:    { da: "Klokken", en: "At" },
    planOpenNow:    { da: "Søvnvinduet er åbent — luk inden for", en: "Sleep window is open — settle within" },
    planClosed:     { da: "Vinduet er lukket", en: "The window has closed" },
    planNoData:     { da: "Gem en lur, så regner BabyBasen næste sovetid ud.", en: "Save a nap and BabyBase will work out the next sleep time." },
    planSleepToday: { da: "Søvn i dag",        en: "Sleep today" },
    planTarget:     { da: "Anbefalet",         en: "Recommended" },
    planNaps:       { da: "Lure i dag",        en: "Naps today" },
    planSinceFeed:  { da: "Siden mad",         en: "Since feed" },
    planNoBirth:    { da: "Indtast <strong>fødselsdato</strong> under Profil, så regner BabyBasen vågetider og næste sovetid ud.", en: "Enter a <strong>date of birth</strong> under Profile and BabyBase will work out wake windows and next sleep." },
    planCloseBy:    { da: "Luk senest",        en: "Down by" },
    sleepingNow:    { da: "{navn} sover nu 😴",  en: "{navn} is asleep 😴" },
    napPaused:      { da: "Luren er på pause",   en: "Nap is paused" },
    sleepingSince:  { da: "Faldt i søvn kl. {tid}. Tryk <strong>Gem lur</strong>, når {navn} vågner.", en: "Fell asleep at {tid}. Press <strong>Save nap</strong> when {navn} wakes." },
    napRunning:     { da: "Uret kører. Tryk <strong>Gem lur</strong>, når {navn} vågner.", en: "The timer is running. Press <strong>Save nap</strong> when {navn} wakes." },
    sleepingNote:   { da: "Næste vågetid regnes ud, så snart luren er gemt.", en: "The next wake window is calculated as soon as the nap is saved." },
    napPausedNote:  { da: "Tryk Fortsæt lur for at tælle videre, eller Gem lur for at gemme tiden.", en: "Press Resume nap to keep counting, or Save nap to store the time." },
    wakeWindowIs:   { da: "Vågetid i denne alder er", en: "The wake window at this age is" },
    typically:      { da: "Typisk",           en: "Typically" },
    napsPerDayAge:  { da: "lure om dagen i denne alder.", en: "naps a day at this age." },
    awakeFor:       { da: "har været vågen i", en: "has been awake for" },
    inTime:         { da: "Om",               en: "In" },
    windowOpenFrom: { da: "Vinduet er åbent fra", en: "The window is open from" },
    windowTo:       { da: "til",              en: "to" },
    windowHit:      { da: "Ram det, og putningen bliver meget lettere.", en: "Hit it and settling gets much easier." },
    timeToSettle:   { da: "— det er tid til at putte.", en: "— time to settle them." },
    maxIs:          { da: "hvor",             en: "where" },
    isTypicalMax:   { da: "er det typiske maksimum.", en: "is the typical maximum." },
    planOver:       { da: "over",              en: "over" },
    planNoteWindow: { da: "Kig efter tegn: gnider øjne, kigger væk, gaber, bliver fjern. Start putterutinen nu.", en: "Watch for cues: rubbing eyes, looking away, yawning, going glassy-eyed. Start the bedtime routine now." },
    planNoteLate:   { da: "Et overtræt barn har sværere ved at falde i søvn, ikke lettere. Dæmp lys og lyd, og prøv en rolig putning nu.", en: "An overtired baby finds it harder to fall asleep, not easier. Dim the lights and sounds and settle them calmly now." },
    enableNotif:    { da: "🔔 Slå påmindelser til", en: "🔔 Turn on reminders" },
    disableNotif:   { da: "🔕 Slå påmindelser fra", en: "🔕 Turn off reminders" },

    // ---------- LYDE ----------
    smartTitle:     { da: "🎙️ Smart-lyt",     en: "🎙️ Smart listen" },
    smartTip:       { da: "Telefonen lytter via mikrofonen. Hører den vedvarende gråd i ca. 1,5 sekund, starter den automatisk din valgte lyd. Skærmen må gerne slukke.", en: "The phone listens through the microphone. If it hears sustained crying for about 1.5 seconds, it starts your chosen sound. The screen may switch off." },
    smartSound:     { da: "Lyd der startes:", en: "Sound to start:" },
    smartSens:      { da: "Følsomhed:",       en: "Sensitivity:" },
    smartSensTip:   { da: "Høj følsomhed reagerer på små lyde — godt i et stille rum. Lav følsomhed kræver kraftigere gråd og undgår falsk alarm.", en: "High sensitivity reacts to small sounds — good in a quiet room. Low sensitivity needs louder crying and avoids false alarms." },
    smartOff:       { da: "Smart-lyt er slukket.", en: "Smart listen is off." },
    smartStart:     { da: "Start Smart-lyt",  en: "Start Smart listen" },
    smartStop:      { da: "Stop Smart-lyt",   en: "Stop Smart listen" },
    smartQuiet:     { da: "Lytter... alt er roligt. 💤", en: "Listening... all quiet. 💤" },
    smartHears:     { da: "Hører uro... 👂",  en: "Hearing something... 👂" },
    smartPlaying:   { da: "Beroligende lyd kører 🎵 — lytter igen, når den stopper.", en: "Soothing sound playing 🎵 — listening again when it stops." },
    smartTriggered: { da: "Uro registreret! Starter beroligende lyd... 🎵", en: "Crying detected. Starting soothing sound... 🎵" },
    smartNoMic:     { da: "Kunne ikke få adgang til mikrofonen. Tjek tilladelser.", en: "Couldn't access the microphone. Check your permissions." },

    // ---------- SØVN I DAG ----------
    todayTitle:     { da: "Søvn i dag",       en: "Sleep today" },
    todayNone:      { da: "Ingen lure gemt endnu i dag.", en: "No naps saved yet today." },
    totalSleep:     { da: "Samlet sovetid:",  en: "Total sleep:" },

    // ---------- SØVNLOG ----------
    historyTitle:   { da: "Søvnlog",          en: "Sleep log" },
    historySub:     { da: "Her samles alt {navns} søvn, dag for dag.", en: "All of {navns} sleep, day by day." },
    tabOverview:    { da: "📊 Overblik",      en: "📊 Overview" },
    tabDiary:       { da: "📅 Dagbog",        en: "📅 Diary" },
    showPeriod:     { da: "Vis periode",      en: "Show period" },
    days7:          { da: "7 dage",  en: "7 days" },
    days14:         { da: "14 dage", en: "14 days" },
    days21:         { da: "21 dage", en: "21 days" },
    days28:         { da: "28 dage", en: "28 days" },
    days30:         { da: "30 dage", en: "30 days" },
    days60:         { da: "60 dage", en: "60 days" },
    days90:         { da: "90 dage", en: "90 days" },
    chTotal:        { da: "Søvn pr. dag",  en: "Sleep per day" },
    chTrend:        { da: "Udvikling",     en: "Trend" },
    chNaps:         { da: "Antal lure",    en: "Number of naps" },
    chLength:       { da: "Lurlængde",     en: "Nap length" },
    chClock:        { da: "Døgnkort",      en: "Day map" },
    statAvgDay:     { da: "Gns. pr. dag",     en: "Avg. per day" },
    statTotal:      { da: "I alt i perioden", en: "Total for period" },
    statNaps:       { da: "Lure i alt",       en: "Total naps" },
    statAvgNap:     { da: "Gns. lurlængde",   en: "Avg. nap length" },
    statBest:       { da: "Bedste dag",       en: "Best day" },
    daysWithData:   { da: "dage med data",    en: "days with data" },
    longest:        { da: "Længste:",         en: "Longest:" },
    dayTotal:       { da: "Dagens total:",    en: "Day total:" },
    noNapsPeriod:   { da: "Ingen gemte lure i den valgte periode.", en: "No naps saved in the selected period." },
    addSleep:       { da: "+ Tilføj søvn manuelt", en: "+ Add sleep manually" },
    editSleep:      { da: "Ret sovetid",      en: "Edit sleep time" },
    fellAsleep:     { da: "Faldt i søvn",     en: "Fell asleep" },
    wokeUp:         { da: "Vågnede",          en: "Woke up" },
    deleteNap:      { da: "Slet denne lur",   en: "Delete this nap" },
    napSaved:       { da: "Sovetiden er rettet ✅", en: "Sleep time updated ✅" },
    editSleepHelp:  { da: "Ret tidspunkterne, hvis uret blev startet eller stoppet for sent. Varigheden regnes automatisk.", en: "Correct the times if the timer was started or stopped late. The duration is calculated for you." },
    durationLabel:  { da: "Sov i alt", en: "Total sleep" },
    edit:           { da: "Ret", en: "Edit" },
    endBeforeStart: { da: "Sluttidspunktet skal ligge efter starttidspunktet.", en: "The end time must come after the start time." },
    tooLong:        { da: "Sovetiden er over 24 timer. Tjek tidspunkterne.", en: "That's over 24 hours. Please check the times." },

    // ---------- PLEJE ----------
    careTitle:      { da: "Mad & bleer",  en: "Feeding & nappies" },
    careSub:        { da: "Ét tryk, når det sker — så husker BabyBasen resten.", en: "One tap when it happens — BabyBase remembers the rest." },
    careRegister:   { da: "Registrér nu", en: "Log it now" },
    careRegHelp:    { da: "Tryk, når det sker. Tidspunktet sættes automatisk — du kan rette det bagefter.", en: "Tap when it happens. The time is set automatically — you can correct it afterwards." },
    careHeroTip:    { da: "Tallene tæller kun i dag og nulstilles ved midnat. 'Siden' viser, hvor længe der er gået, siden det sidst skete — også hvis det var i går.", en: "The counts cover today only and reset at midnight. 'Since' shows how long ago it last happened — even if that was yesterday." },
    breastfeed:     { da: "Amning",       en: "Breastfeed" },
    bottle:         { da: "Flaske",       en: "Bottle" },
    solids:         { da: "Fast føde",    en: "Solids" },
    nappy:          { da: "Ble",          en: "Nappy" },
    wet:            { da: "Våd ble",      en: "Wet nappy" },
    dirty:          { da: "Afføring",     en: "Dirty" },
    both:           { da: "Våd + afføring", en: "Wet + dirty" },
    wetShort:       { da: "💧 Våd",       en: "💧 Wet" },
    dirtyShort:     { da: "💩 Afføring",  en: "💩 Dirty" },
    bothShort:      { da: "🌊 Våd + afføring", en: "🌊 Wet + dirty" },
    feedsToday:     { da: "måltider i dag", en: "feeds today" },
    feedToday:      { da: "måltid i dag",   en: "feed today" },
    nappiesToday:   { da: "bleer i dag",    en: "nappies today" },
    nappyToday:     { da: "ble i dag",      en: "nappy today" },
    lastAt:         { da: "Sidst kl.",      en: "Last at" },
    ago:            { da: "siden",          en: "ago" },
    detailToggle:   { da: "✏️ Tilføj med eget tidspunkt og detaljer", en: "✏️ Add with your own time and details" },
    careType:       { da: "Type",           en: "Type" },
    careSide:       { da: "Side",           en: "Side" },
    left:           { da: "Venstre",        en: "Left" },
    right:          { da: "Højre",          en: "Right" },
    bothSides:      { da: "Begge",          en: "Both" },
    minutes:        { da: "Minutter",       en: "Minutes" },
    amountMl:       { da: "Mængde (ml)",    en: "Amount (ml)" },
    nappyHeld:      { da: "Bleen indeholdt", en: "The nappy had" },
    saveEntry:      { da: "Gem registrering", en: "Save entry" },
    dayEntries:     { da: "Dagens registreringer", en: "Today's entries" },
    noEntriesToday: { da: "Ingen registreringer i dag.", en: "No entries today." },
    noEntriesDay:   { da: "Ingen registreringer denne dag.", en: "No entries this day." },
    editTime:       { da: "Ret tidspunktet", en: "Correct the time" },
    askTime:        { da: "Hvad var klokken? (f.eks. 14:35)", en: "What time was it? (e.g. 14:35)" },
    badTime:        { da: "Skriv tidspunktet som timer:minutter, f.eks. 14:35.", en: "Enter the time as hours:minutes, e.g. 14:35." },
    deleteEntry:    { da: "Slet denne registrering?", en: "Delete this entry?" },
    feedsPerDay:    { da: "Måltider pr. dag", en: "Feeds per day" },
    nappiesPerDay:  { da: "Bleer pr. dag",    en: "Nappies per day" },
    milkMl:         { da: "Mælk (ml)",        en: "Milk (ml)" },
    bottleToday:    { da: "Flaske i dag",     en: "Bottle today" },
    noEntriesYet:   { da: "Ingen registreringer i dag endnu. Tryk på en knap ovenfor, når det sker.", en: "No entries yet today. Tap a button above when it happens." },
    helpFeeds:      { da: "Antal måltider pr. dag. Nyfødte spiser typisk 8-12 gange i døgnet; det falder gradvist med alderen.", en: "Feeds per day. Newborns typically feed 8-12 times a day; this falls gradually with age." },
    helpNappies:    { da: "Antal bleer pr. dag. Mindst 6 våde bleer i døgnet tyder på, at barnet får nok at drikke.", en: "Nappies per day. At least 6 wet nappies a day suggests your baby is getting enough to drink." },
    helpMl:         { da: "Mælk fra flaske pr. dag. Amning kan ikke måles i ml og tælles derfor ikke med her.", en: "Bottle milk per day. Breastfeeding can't be measured in ml and isn't counted here." },
    helpCareClock:  { da: "Hvornår på døgnet der blev spist og skiftet. Her ser du hurtigt, om der er ved at komme rytme i det.", en: "When during the day feeds and changes happened. A quick way to see if a rhythm is forming." },
    helpSleepTotal: { da: "Samlet søvn pr. dag i timer. Den stiplede linje er dit gennemsnit for perioden.", en: "Total sleep per day in hours. The dashed line is your average for the period." },
    helpTrend:      { da: "Den lyse linje viser den enkelte dag, den mørke jævner udsvingene ud. Se efter retningen, ikke enkeltdage.", en: "The light line shows each day; the dark one smooths out the swings. Look at the direction, not single days." },
    helpNaps:       { da: "Antal gemte lure pr. dag.", en: "Number of saved naps per day." },
    helpNapLength:  { da: "Gennemsnitlig længde pr. lur i minutter. Korte lure under 45 min. kan betyde, at barnet vågner mellem søvncyklusserne.", en: "Average nap length in minutes. Naps under 45 min can mean your baby wakes between sleep cycles." },
    helpSleepClock: { da: "Hvornår på døgnet der blev sovet. Her ser du hurtigt, om rytmen er ved at falde på plads.", en: "When during the day sleep happened. A quick way to see whether a rhythm is settling." },
    napsTypical:    { da: "I {navns} alder er {antal} lure typisk.", en: "At {navns} age, {antal} naps is typical." },
    addSleepTitle:  { da: "Tilføj søvn", en: "Add sleep" },
    fillBothTimes:  { da: "Udfyld både dato og klokkeslæt for begge tidspunkter.", en: "Fill in both the date and time for each moment." },
    atClock:        { da: "Kl.", en: "At" },
    belowRec:       { da: "Under anbefalet", en: "Below recommended" },
    aboveRec:       { da: "Over anbefalet", en: "Above recommended" },
    withinRec:      { da: "Inden for anbefalet", en: "Within recommended" },
    showing:        { da: "Viser", en: "Showing" },
    days:           { da: "dage", en: "days" },

    // ---------- VÆKST ----------
    growthTitle:    { da: "Vækst",  en: "Growth" },
    growthSub:      { da: "Følg {navns} kurver mellem besøgene.", en: "Follow {navns} curves between check-ups." },
    tabCurves:      { da: "📈 Mål & kurver", en: "📈 Measure & curves" },
    tabMeasures:    { da: "📋 Alle målinger", en: "📋 All measurements" },
    addMeasure:     { da: "Tilføj måling", en: "Add measurement" },
    addMeasureTip:  { da: "Brug komma som decimaltegn — f.eks. 7,45. Du behøver ikke udfylde alle felter; udfyld kun det, du har målt.", en: "Use a comma as the decimal mark — e.g. 7,45. You don't need to fill in every field; just what you measured." },
    weight:         { da: "Vægt",   en: "Weight" },
    length:         { da: "Længde", en: "Length" },
    head:           { da: "Hovedomfang", en: "Head circumference" },
    weightKg:       { da: "Vægt (kg)", en: "Weight (kg)" },
    lengthCm:       { da: "Længde (cm)", en: "Length (cm)" },
    headCm:         { da: "Hovedomfang (cm)", en: "Head circumference (cm)" },
    weightLength:   { da: "Vægt & længde", en: "Weight & length" },
    saveMeasure:    { da: "Gem måling", en: "Save measurement" },
    addOwn:         { da: "+ Tilføj egen måling", en: "+ Add your own measure" },
    allMeasures:    { da: "Alle målinger", en: "All measurements" },
    noMeasures:     { da: "Ingen målinger gemt endnu.", en: "No measurements saved yet." },
    age:            { da: "Alder", en: "Age" },
    months:         { da: "mdr", en: "mo" },
    whoHelp:        { da: "Det skyggede felt er, hvor ca. 95 % af alle raske børn ligger (WHO). Ligger dit barn uden for, betyder det ikke i sig selv noget galt — det er kurvens <em>form</em> over tid, der er interessant.", en: "The shaded band is where about 95 % of healthy children fall (WHO). Being outside it isn't a problem in itself — what matters is the <em>shape</em> of the curve over time." },
    whoMedian:      { da: "WHO median", en: "WHO median" },
    normalRange:    { da: "Normalområde", en: "Normal range" },
    noBirthDate:    { da: "Indtast fødselsdato under Profil, så kan kurven tegnes efter alder.", en: "Enter a date of birth under Profile so the curve can be drawn by age." },
    latestBoth:     { da: "Seneste måling: {v} kg og {l} cm.", en: "Latest measurement: {v} kg and {l} cm." },
    proportional:   { da: "Vægt og længde følges pænt ad — barnet vokser proportionalt.", en: "Weight and length track each other nicely — your baby is growing proportionally." },
    heavierThanLong:{ da: "Vægten ligger et stykke over længden. Det ses ofte hos velnærede babyer og udjævner sig typisk, når barnet begynder at bevæge sig mere.", en: "Weight sits some way above length. That's common in well-fed babies and usually evens out once they start moving more." },
    longerThanHeavy:{ da: "Længden ligger et stykke over vægten — altså et langt, slankt barn. Nævn det gerne ved næste besøg, hvis afstanden vokser.", en: "Length sits some way above weight — a long, slender baby. Worth mentioning at the next check-up if the gap widens." },
    sameLevelMatters:{ da: "Det vigtigste er, at begge kurver holder <em>samme</em> niveau over tid.", en: "What matters most is that both curves hold the <em>same</em> level over time." },
    needBoth:       { da: "Tilføj både vægt og længde på samme dato for at kunne sammenligne dem.", en: "Add both weight and length on the same date to compare them." },
    disclaimer:     { da: "BabyBasen erstatter ikke sundhedsplejersken eller lægen. Er du i tvivl om dit barns vækst eller trivsel, så tag altid kontakt.", en: "BabyBase does not replace your health visitor or doctor. If you have any concerns about your child's growth or wellbeing, always get in touch." },

    // ---------- MILEPÆLE ----------
    msTitle:        { da: "Milepæle", en: "Milestones" },
    msSub:          { da: "De øjeblikke, man tror man husker — men ikke gør.", en: "The moments you think you'll remember — but won't." },
    msNew:          { da: "Ny milepæl", en: "New milestone" },
    msWhat:         { da: "Hvad skete der?", en: "What happened?" },
    msNote:         { da: "Fortæl om det (valgfri)", en: "Tell the story (optional)" },
    msPhoto:        { da: "Billede (valgfri)", en: "Photo (optional)" },
    msPhotoTip:     { da: "Billedet skaleres automatisk ned i din browser til ca. 40 KB, før det gemmes. Originalen bliver ikke sendt nogen steder.", en: "The photo is scaled down in your browser to about 40 KB before saving. The original is never uploaded." },
    msSave:         { da: "Gem milepæl", en: "Save milestone" },
    msTimeline:     { da: "Tidslinje", en: "Timeline" },
    msNone:         { da: "Ingen milepæle endnu. Den første kommer hurtigere, end du tror.", en: "No milestones yet. The first one comes sooner than you think." },
    msDelete:       { da: "Slet denne milepæl?", en: "Delete this milestone?" },
    daysOld:        { da: "dage gammel", en: "days old" },
    monthsOld:      { da: "mdr. gammel", en: "months old" },
    yearsOld:       { da: "år gammel", en: "years old" },

    // ---------- PROFIL ----------
    profileTitle:   { da: "Profil & Indstillinger", en: "Profile & settings" },
    tabChild:       { da: "👶 Barnet", en: "👶 Child" },
    tabChildren:    { da: "👨‍👩‍👧 Børn & deling", en: "👨‍👩‍👧 Children & sharing" },
    tabNotif:       { da: "🔔 Påmindelser", en: "🔔 Reminders" },
    tabApp:         { da: "⚙️ App & konto", en: "⚙️ App & account" },
    yourChild:      { da: "Dit barn", en: "Your child" },
    name:           { da: "Navn", en: "Name" },
    genderQ:        { da: "Dreng eller pige? (skifter farver og vækstkurver)", en: "Boy or girl? (changes colours and growth curves)" },
    boy:            { da: "👦 Dreng", en: "👦 Boy" },
    girl:           { da: "👧 Pige", en: "👧 Girl" },
    neutral:        { da: "🌿 Neutral", en: "🌿 Neutral" },
    birthDate:      { da: "Fødselsdato", en: "Date of birth" },
    birthDateTip:   { da: "Bruges til vågetider, søvnplan, vækstkurver og barnets alder. Uden den kan BabyBasen ikke regne næste sovetid ud.", en: "Used for wake windows, the sleep plan, growth curves and your baby's age. Without it BabyBase can't work out the next sleep." },
    dueDate:        { da: "Terminsdato", en: "Due date" },
    dueDateTip:     { da: "Tigerspring regnes altid fra terminsdatoen, ikke fødselsdagen. Et barn født før tid rammer springene tilsvarende senere.", en: "Leaps are always counted from the due date, not the birthday. A baby born early reaches them correspondingly later." },
    saveDetails:    { da: "Gem oplysninger", en: "Save details" },
    savedOk:        { da: "Oplysningerne er gemt ✅", en: "Details saved ✅" },
    birthTitle:     { da: "Fødslen", en: "The birth" },
    birthSub:       { da: "De oplysninger, man aldrig kan huske bagefter.", en: "The details you can never remember afterwards." },
    birthTime:      { da: "Fødselstidspunkt", en: "Time of birth" },
    birthPlace:     { da: "Fødested", en: "Place of birth" },
    birthWeight:    { da: "Fødselsvægt (g)", en: "Birth weight (g)" },
    birthLength:    { da: "Fødselslængde (cm)", en: "Birth length (cm)" },
    gestWeek:       { da: "Graviditetsuge", en: "Gestational week" },
    parent1:        { da: "Forælder 1", en: "Parent 1" },
    parent2:        { da: "Forælder 2", en: "Parent 2" },
    birthStory:     { da: "Historien om fødslen (valgfri)", en: "The story of the birth (optional)" },
    saveBirth:      { da: "Gem fødselsoplysninger", en: "Save birth details" },

    // ---------- RAPPORT ----------
    reportTitle:    { da: "📄 Rapport til sundhedsplejersken", en: "📄 Report for the health visitor" },
    reportTip:      { da: "Samler søvn, mad, bleer, vækstkurver og milepæle på én side, klar til print eller PDF. Vælg selv perioden.", en: "Gathers sleep, feeding, nappies, growth curves and milestones on one page, ready to print or save as PDF. Choose the period yourself." },
    reportPeriod:   { da: "Vælg hvor lang en periode rapporten skal dække.", en: "Choose how long a period the report should cover." },
    reportOr:       { da: "Eller fra", en: "Or from" },
    reportCompare:  { da: "Sammenlign med et andet barn (valgfrit)", en: "Compare with another child (optional)" },
    reportNoCompare:{ da: "Ingen sammenligning", en: "No comparison" },
    reportMake:     { da: "📄 Lav rapporten", en: "📄 Create the report" },
    reportBuilding: { da: "Bygger rapporten...", en: "Building the report..." },
    reportCovers:   { da: "Rapporten dækker", en: "The report covers" },

    // ---------- BØRN & DELING ----------
    yourChildren:   { da: "Dine børn", en: "Your children" },
    addChild:       { da: "+ Tilføj et barn til", en: "+ Add another child" },
    archived:       { da: "Gemt væk", en: "Archived" },
    archivedTip:    { da: "Et gemt barn forsvinder fra vælgeren øverst, men alle data er i behold. Du kan hente det frem igen når som helst.", en: "An archived child disappears from the picker at the top, but all data is kept. You can bring them back at any time." },
    shareTitle:     { da: "Del med den anden forælder", en: "Share with the other parent" },
    shareSub:       { da: "Lav en kode og send den. Så ser I begge de samme data — søvn, mad, vækst og milepæle opdateres for jer begge.", en: "Create a code and send it. You'll both see the same data — sleep, feeding, growth and milestones update for both of you." },
    gotCode:        { da: "Har du fået en kode?", en: "Got a code?" },
    joinChild:      { da: "Tilslut mig barnet", en: "Join this child" },
    pick:           { da: "Vælg", en: "Select" },
    selected:       { da: "Valgt", en: "Selected" },
    archive:        { da: "Gem væk", en: "Archive" },
    unarchive:      { da: "Hent frem", en: "Restore" },
    del:            { da: "Slet", en: "Delete" },
    noBirthDateShort:{ da: "Ingen fødselsdato", en: "No date of birth" },
    sharedWith:     { da: "delt med", en: "shared with" },

    // ---------- PÅMINDELSER ----------
    notifTitle:     { da: "Påmindelser", en: "Reminders" },
    notifTip:       { da: "BabyBasen sender en besked, inden søvnvinduet åbner, så barnet når at falde til ro. På iPhone kræver det, at appen er lagt på hjemmeskærmen fra Safari.", en: "BabyBase sends a message before the sleep window opens so your baby has time to settle. On iPhone the app must be added to the home screen from Safari." },
    notifSub:       { da: "Du får besked, inden det er tid til næste lur.", en: "You'll be notified before it's time for the next nap." },
    notifLead:      { da: "Varsel før sovetid (minutter)", en: "Warning before sleep time (minutes)" },
    notifTest:      { da: "Send en testbesked", en: "Send a test message" },
    notifOff:       { da: "Påmindelser er slået fra.", en: "Reminders are off." },

    // ---------- APP & KONTO ----------
    installTitle:   { da: "📱 Installér BabyBasen", en: "📱 Install BabyBase" },
    installText:    { da: "Læg BabyBasen på hjemmeskærmen, så den åbner som en rigtig app — og så påmindelserne virker.", en: "Add BabyBase to your home screen so it opens like a real app — and so reminders work." },
    installBtn:     { da: "Installér appen", en: "Install the app" },
    installed:      { da: "BabyBasen er installeret på denne enhed. ✅", en: "BabyBase is installed on this device. ✅" },
    loginTitle:     { da: "Log ind for at gemme", en: "Sign in to save" },
    loginSub:       { da: "Du kan bruge alle lyde, søvnuret og loggen med det samme. Log ind, hvis du vil gemme det sikkert, dele med den anden forælder og have det med på tværs af telefoner.", en: "You can use all the sounds, the timer and the log right away. Sign in to save it safely, share with the other parent and keep it across phones." },
    loginGoogle:    { da: "Log ind med Google", en: "Sign in with Google" },
    yourAccount:    { da: "Din konto", en: "Your account" },
    logout:         { da: "Log ud af BabyBasen", en: "Sign out of BabyBase" },
    logoutConfirm:  { da: "Er du sikker på, at du vil logge ud?", en: "Are you sure you want to sign out?" },
    themeTitle:     { da: "Tema & Design", en: "Theme & design" },
    themeSub:       { da: "Skån øjnene om natten.", en: "Easier on the eyes at night." },
    toNight:        { da: "Skift til Nattilstand 🌙", en: "Switch to night mode 🌙" },
    toDay:          { da: "Skift til Dagstilstand ☀️", en: "Switch to day mode ☀️" },
    summaryTitle:   { da: "Oversigt over alt", en: "Everything in one place" },
    summarySub:     { da: "Åbn en samlet, læsbar side med alt om dit barn — klar til print eller PDF.", en: "Open one readable page with everything about your child — ready to print or save as PDF." },
    summaryBtn:     { da: "📖 Åbn min oversigt", en: "📖 Open my overview" },

    // ---------- VIDEN ----------
    tabPlanExplain: { da: "🧭 Søvnplanen", en: "🧭 The sleep plan" },

    // ---------- SÅDAN VIRKER PLANEN ----------
    peTitle:        { da: "Sådan virker Dagens plan", en: "How Today's plan works" },
    peSub:          { da: "Hvorfor BabyBasen tror, den ved hvornår {navn} skal sove.", en: "Why BabyBase thinks it knows when {navn} needs to sleep." },
    peShortTitle:   { da: "Den korte version", en: "The short version" },
    peShortBody:    { da: "BabyBasen gætter ikke. Den regner sådan her:", en: "BabyBase isn't guessing. Here's the maths:" },
    peF1:           { da: "Sidste lur sluttede", en: "Last nap ended" },
    peF2:           { da: "Vågetid for alderen", en: "Wake window for the age" },
    peF3:           { da: "Næste søvnvindue", en: "Next sleep window" },
    peShortNote:    { da: "Det eneste, appen selv skal bruge, er <strong>fødselsdatoen</strong>, og at du trykker <strong>Gem lur</strong>. Resten regner den ud.", en: "All the app needs from you is the <strong>date of birth</strong> and a tap on <strong>Save nap</strong>. It works out the rest." },
    peWakeTitle:    { da: "Hvad er en vågetid?", en: "What is a wake window?" },
    peWakeBody1:    { da: "En baby kan kun holde til at være vågen et bestemt stykke tid, før hjernen bliver overstimuleret. Det stykke tid kaldes <strong>vågetiden</strong>, og det er den vigtigste enkeltfaktor for, om putningen bliver let eller svær.", en: "A baby can only stay awake for so long before the brain becomes overstimulated. That stretch is called the <strong>wake window</strong>, and it's the single biggest factor in whether settling is easy or hard." },
    peWakeBody2:    { da: "Rammer du vinduet, falder barnet i søvn på få minutter. Rammer du ved siden af, kæmper I begge to.", en: "Hit the window and your baby falls asleep in minutes. Miss it and you'll both struggle." },
    peTiredTitle:   { da: "Derfor er det svært at putte et overtræt barn", en: "Why an overtired baby is hard to settle" },
    peTiredBody1:   { da: "Det virker bagvendt, men et barn, der har været vågent for længe, sover <em>dårligere</em> — ikke bedre. Når vinduet lukker, udskiller kroppen stresshormonerne kortisol og adrenalin for at holde barnet i gang. De hormoner er stik modsatte af det, der skal til for at falde i søvn.", en: "It seems backwards, but a baby who has been awake too long sleeps <em>worse</em>, not better. Once the window closes, the body releases the stress hormones cortisol and adrenaline to keep going. Those hormones are the opposite of what's needed to fall asleep." },
    peTiredBody2:   { da: "Resultatet kender de fleste forældre: et barn der er hektisk, buer ryggen, griner skingert — og så pludselig græder utrøsteligt.", en: "Most parents know the result: a baby who's hectic, arches their back, laughs shrilly — and then suddenly cries inconsolably." },
    peNumbersTitle: { da: "Tallene BabyBasen bruger", en: "The numbers BabyBase uses" },
    peNumbersBody:  { da: "Vågetiderne følger de gængse anbefalinger fra bl.a. Sundhedsstyrelsen og American Academy of Sleep Medicine. Den række, der gælder for {navn} lige nu, er markeret.", en: "The wake windows follow common guidance from bodies such as the Danish Health Authority and the American Academy of Sleep Medicine. The row that applies to {navn} right now is highlighted." },
    peNumbersNote:  { da: "Alle tal er vejledende. Nogle børn kan mere, andre mindre — se dem som et udgangspunkt, ikke en facitliste.", en: "All figures are guidelines. Some children manage more, some less — treat them as a starting point, not a rulebook." },
    peCardTitle:    { da: "Sådan læser du kortet på forsiden", en: "How to read the card on the front page" },
    peCard1:        { da: "<strong>Næste søvnvindue åbner om …</strong> — der er stadig tid. Brug den på leg, mad og frisk luft.", en: "<strong>Next sleep window opens in …</strong> — there's still time. Use it for play, food and fresh air." },
    peCard2:        { da: "<strong>Søvnvinduet er åbent</strong> — kortet bliver gult. Start putterutinen. Det er her, det er lettest.", en: "<strong>The sleep window is open</strong> — the card turns yellow. Start the bedtime routine. This is when it's easiest." },
    peCard3:        { da: "<strong>Vinduet er lukket</strong> — I er forbi det gode tidspunkt. Dæmp lys og lyd, og put roligt alligevel.", en: "<strong>The window has closed</strong> — you're past the sweet spot. Dim the lights and sounds and settle calmly anyway." },
    peCardBar:      { da: "Bjælken nederst viser dagens samlede søvn mod det anbefalede. Den fyldes op i løbet af dagen og bliver grøn, når I er inde i det anbefalede spænd.", en: "The bar at the bottom shows today's total sleep against what's recommended. It fills through the day and turns green once you're inside the recommended range." },
    peSignsTitle:   { da: "Tegn på træthed — bedre end uret", en: "Tiredness cues — better than the clock" },
    peSignsBody:    { da: "Uret er en hjælp, ikke en chef. Barnets signaler slår altid tabellen:", en: "The clock is a helper, not a boss. Your baby's cues always beat the table:" },
    peSign1:        { da: "Tidligt (put nu)", en: "Early (settle now)" },
    peSign1b:       { da: "Kigger væk · gaber · bliver stille · gnider øjne og ører", en: "Looking away · yawning · going quiet · rubbing eyes and ears" },
    peSign2:        { da: "Sent (skynd dig)", en: "Late (hurry)" },
    peSign2b:       { da: "Pylret · klynker · mister interessen for leg", en: "Fretful · whining · losing interest in play" },
    peSign3:        { da: "For sent (overtræt)", en: "Too late (overtired)" },
    peSign3b:       { da: "Hektisk · buer ryggen · skingert grin · utrøstelig gråd", en: "Hectic · arching the back · shrill laughter · inconsolable crying" },
    peNotifTitle:   { da: "Hvad påmindelsen gør", en: "What the reminder does" },
    peNotifBody:    { da: "Slår du påmindelser til, sender BabyBasen en besked <strong>15 minutter før</strong> vinduet åbner (du kan selv ændre varslet). Kvarteret er ikke tilfældigt: det er nogenlunde den tid, det tager at afslutte legen, skifte ble, dæmpe lyset og få barnet ned uden hastværk.", en: "With reminders on, BabyBase sends a message <strong>15 minutes before</strong> the window opens (you can change the lead time). That quarter of an hour isn't random: it's roughly what it takes to finish playing, change a nappy, dim the lights and settle your baby without rushing." },
    peNotifNote:    { da: "Beskeden sendes fra en server, så den kommer, selv når telefonen er lukket — hvis appen er lagt på hjemmeskærmen.", en: "The message is sent from a server, so it arrives even when your phone is locked — as long as the app is on your home screen." },
    peWrongTitle:   { da: "Når planen ikke passer", en: "When the plan doesn't fit" },
    peWrongBody:    { da: "Er der noget, der ikke stemmer, er det næsten altid én af disse:", en: "If something looks wrong, it's almost always one of these:" },
    peWrong1:       { da: "<strong>Fødselsdatoen mangler.</strong> Uden den kender appen ikke vågetiden.", en: "<strong>The date of birth is missing.</strong> Without it the app doesn't know the wake window." },
    peWrong2:       { da: "<strong>Luren blev ikke gemt.</strong> Planen regner fra sidste <em>gemte</em> lur.", en: "<strong>The nap wasn't saved.</strong> The plan counts from the last <em>saved</em> nap." },
    peWrong3:       { da: "<strong>Barnet er i et tigerspring.</strong> Så ryger rytmen — helt normalt, og det går over.", en: "<strong>Your baby is in a leap.</strong> The rhythm goes out the window — completely normal, and it passes." },
    peWrong4:       { da: "<strong>Dit barn kan bare mere eller mindre end tabellen.</strong> Følg barnet, ikke appen.", en: "<strong>Your child simply manages more or less than the table says.</strong> Follow your child, not the app." },
    peDayFor:       { da: "En typisk dag for {navn}", en: "A typical day for {navn}" },
    peAwake:        { da: "min vågen", en: "min awake" },
    peLegendWake:   { da: "Vågen", en: "Awake" },
    peLegendNap:    { da: "Lur", en: "Nap" },
    peLegendMark:   { da: "Her åbner søvnvinduet", en: "The sleep window opens here" },
    peExampleNote:  { da: "Forenklet eksempel med {lure} lure og sengetid kl. 19. Din dag ser anderledes ud — pointen er afstanden mellem lurene.", en: "Simplified example with {lure} naps and a 7 pm bedtime. Your day will look different — the point is the gap between naps." },
    peWindow:       { da: "Søvnvinduet", en: "The sleep window" },
    peHigh:         { da: "højt", en: "high" },
    peLow:          { da: "lavt", en: "low" },
    peWoke:         { da: "Vågnet", en: "Woke up" },
    peEasy:         { da: "Let at putte", en: "Easy to settle" },
    peOvertired:    { da: "Overtræt", en: "Overtired" },
    peAxisTime:     { da: "Tid siden barnet vågnede →", en: "Time since waking →" },
    peSleepPressure:{ da: "Søvntryk — trætheden der hjælper", en: "Sleep pressure — the tiredness that helps" },
    peStress:       { da: "Stresshormoner — modarbejder søvn", en: "Stress hormones — working against sleep" },
    peTiredCaption: { da: "I det grønne felt er søvntrykket højt, mens stresshormonerne stadig er lave. Det er dér, putningen tager fem minutter i stedet for fyrre.", en: "In the green band, sleep pressure is high while stress hormones are still low. That's where settling takes five minutes instead of forty." },
    peTableAge:     { da: "Alder", en: "Age" },
    peTableWake:    { da: "Vågetid mellem lure", en: "Wake window between naps" },
    peTableSleep:   { da: "Søvn i døgnet", en: "Sleep per day" },
    peTableNaps:    { da: "Lure", en: "Naps" },
    peNow:          { da: "← nu", en: "← now" },
    peMonths:       { da: "mdr.", en: "mo" },
    tabSleepKnow:   { da: "👶 Søvn", en: "👶 Sleep" },
    tabLeaps:       { da: "🐯 Tigerspring", en: "🐯 Leaps" },
    leapWord:       { da: "Spring", en: "Leap" },
    weekWord:       { da: "Uge", en: "Week" },
    leapNoDue:      { da: "Indtast terminsdatoen under <strong>Profil</strong>, så viser BabyBasen automatisk, hvilket spring {navn} er i.", en: "Enter the due date under <strong>Profile</strong> and BabyBase will show which leap {navn} is in." },
    leapBeforeDue:  { da: "Der er ca. {uger} uger til termin. Det første spring kommer omkring uge {foerste}. 💛", en: "About {uger} weeks until the due date. The first leap arrives around week {foerste}. 💛" },
    leapAge:        { da: "{navn} er ca. <strong>{uger} uger</strong> (fra termin).", en: "{navn} is about <strong>{uger} weeks</strong> (from the due date)." },
    leapInNow:      { da: "I er sandsynligvis midt i <strong>Spring {nr}</strong> (uge {fra}-{til}). Hold ud — der er en solskinsperiode på vej! ⭐", en: "You're most likely in the middle of <strong>Leap {nr}</strong> (weeks {fra}-{til}). Hang in there — a sunny period is on its way! ⭐" },
    leapNext:       { da: "I er i en rolig periode. Næste er <strong>Spring {nr}</strong> om ca. {uger} uger. ☀️", en: "You're in a calm period. Next is <strong>Leap {nr}</strong> in about {uger} weeks. ☀️" },
    leapDone:       { da: "Alle tigerspring er overstået — godt klaret! 🎉", en: "All the leaps are behind you — well done! 🎉" },

    // ---------- GÆST ----------
    guestWarning:   { da: "<strong>⚠️ Kun gemt på denne telefon</strong><br>Du er ikke logget ind. Dine data kan gå tabt. Gå til Profil-fanen for at logge ind og gemme sikkert i skyen.", en: "<strong>⚠️ Saved on this phone only</strong><br>You're not signed in, so your data could be lost. Go to the Profile tab to sign in and save safely in the cloud." },
    lockedNote:     { da: "<strong>🔒 Log ind for at gemme</strong><br>Felterne herunder kan først gemmes, når du er logget ind.", en: "<strong>🔒 Sign in to save</strong><br>The fields below can only be saved once you're signed in." },
    lockedGrowth:   { da: "<strong>🔒 Log ind for at gemme</strong><br>Vækstdata følger dit barn i årevis — derfor gemmes de kun i skyen. Gå til Profil og log ind.", en: "<strong>🔒 Sign in to save</strong><br>Growth data follows your child for years, so it's only stored in the cloud. Go to Profile and sign in." },
    lockedMs:       { da: "<strong>🔒 Log ind for at gemme</strong><br>Milepæle og billeder gemmes i skyen, så de følger dit barn. Gå til Profil og log ind.", en: "<strong>🔒 Sign in to save</strong><br>Milestones and photos are stored in the cloud so they follow your child. Go to Profile and sign in." },
    resetGuest:     { da: "🗑 Nulstil alt og start forfra", en: "🗑 Reset everything and start over" },

    // ---------- GÆSTELÅS ----------
    guestLockTitle: { da: "Log ind for at bruge {hvad}", en: "Sign in to use {hvad}" },
    guestLockBody:  { da: "Som gæst kan du bruge søvnuret og lydene. Log ind med Google, så gemmes alt sikkert — og du får søvnlog, pleje, vækst, milepæle, rapporter og deling med den anden forælder.", en: "As a guest you can use the sleep timer and the sounds. Sign in with Google to save everything safely — and unlock the sleep log, care, growth, milestones, reports and sharing with the other parent." },
    guestLockBtn:   { da: "Log ind med Google", en: "Sign in with Google" },
    guestBadge:     { da: "Gæst", en: "Guest" },
    guestHint:      { da: "Du bruger BabyBasen som gæst. Søvnuret og lydene virker — log ind for resten.", en: "You're using BabyBase as a guest. The timer and sounds work — sign in for everything else." },

    // ---------- FARVER ----------
    colorPick:      { da: "Vælg farve", en: "Choose a colour" },
    colorPickHelp:  { da: "Farven gælder hele appen. Dreng og pige sætter blå og lyserød automatisk — eller vælg din egen.", en: "The colour applies to the whole app. Boy and girl set blue and pink automatically — or pick your own." },
    colorOwn:       { da: "🎨 Egen farve", en: "🎨 Own colour" },
    cBlue:          { da: "Himmelblå", en: "Sky blue" },
    cPink:          { da: "Rosa", en: "Rose" },
    cMint:          { da: "Mint", en: "Mint" },
    cLavender:      { da: "Lavendel", en: "Lavender" },
    cPeach:         { da: "Fersken", en: "Peach" },
    cSage:          { da: "Salvie", en: "Sage" },
    cButter:        { da: "Smørgul", en: "Butter" },
    cSand:          { da: "Sand", en: "Sand" },
    cSeafoam:       { da: "Havskum", en: "Seafoam" },
    cClay:          { da: "Ler", en: "Clay" },

    // ---------- FEEDBACK ----------
    fbTitle:        { da: "💬 Godt og skidt", en: "💬 What works and what doesn't" },
    fbSub:          { da: "Hvad fungerer, og hvad driller? Skriv det her — det er sådan, BabyBasen bliver bedre.", en: "What's working, and what's annoying? Tell us here — it's how BabyBase gets better." },
    fbType:         { da: "Hvad handler det om?", en: "What's it about?" },
    fbGood:         { da: "😊 Noget der virker godt", en: "😊 Something that works well" },
    fbBad:          { da: "😕 Noget der driller", en: "😕 Something that's annoying" },
    fbIdea:         { da: "💡 En idé", en: "💡 An idea" },
    fbBug:          { da: "🐛 En fejl", en: "🐛 A bug" },
    fbText:         { da: "Fortæl om det", en: "Tell us about it" },
    fbPlaceholder:  { da: "Skriv så meget eller lidt, du vil...", en: "Write as much or as little as you like..." },
    fbSend:         { da: "Send til udvikleren", en: "Send to the developer" },
    fbSending:      { da: "Sender...", en: "Sending..." },
    fbThanks:       { da: "Tak! Det er sendt. 💛", en: "Thank you! It's on its way. 💛" },
    fbEmpty:        { da: "Skriv lidt om det først.", en: "Write something first." },
    fbFailed:       { da: "Kunne ikke sendes lige nu. Prøv igen senere.", en: "Couldn't send right now. Please try again later." },

    // ---------- LÅSESKÆRM ----------
    lockTitle:      { da: "Vis på låseskærmen", en: "Show on the lock screen" },
    lockHelp:       { da: "Sætter en bjælke på låseskærmen, mens {navn} sover, så du kan se tiden og stoppe luren uden at låse op.", en: "Puts a bar on your lock screen while {navn} sleeps, so you can see the time and stop the nap without unlocking." },
    lockOn:         { da: "🔒 Vis på låseskærm", en: "🔒 Show on lock screen" },
    lockOff:        { da: "Slå fra", en: "Turn off" },
    lockSleeping:   { da: "{navn} sover", en: "{navn} is asleep" },
    lockWindow:     { da: "Søvnvindue åbner {tid}", en: "Sleep window opens {tid}" },
    lockNotSupported:{ da: "Din browser understøtter det ikke. Prøv Chrome på Android eller Safari på iPhone.", en: "Your browser doesn't support this. Try Chrome on Android or Safari on iPhone." },

    // ---------- DIAGRAM-ORD ----------
    avgLabel:       { da: "Gennemsnit", en: "Average" },
    perDayLabel:    { da: "Pr. dag", en: "Per day" },
    sleepWord:      { da: "Søvn", en: "Sleep" },
    nightWord:      { da: "Nat (20-06)", en: "Night (8pm-6am)" },
    noDataPeriod:   { da: "Ingen data i den valgte periode.", en: "No data in the selected period." },
    noDataYet:      { da: "Ingen data endnu.", en: "No data yet." },

    // ---------- HJØRNEMENU ----------
    menuProfile:    { da: "Profil & barnet", en: "Profile & child" },
    menuReport:     { da: "Rapport til sundhedsplejersken", en: "Report for the health visitor" },
    menuOverview:   { da: "Min oversigt", en: "My overview" },
    menuChildren:   { da: "Børn & deling", en: "Children & sharing" },
    menuNotif:      { da: "Påmindelser", en: "Reminders" },
    menuFeedback:   { da: "Godt og skidt", en: "Feedback" },
    menuApp:        { da: "App & konto", en: "App & account" },
    menuLogin:      { da: "Log ind", en: "Sign in" },
    menuLogout:     { da: "Log ud", en: "Sign out" },
    resetDone:      { da: "Alt er nulstillet. Du starter forfra. 👶", en: "Everything has been reset. You're starting fresh. 👶" },
    resetAsk:       { da: "Slet alt i BabyBasen på denne telefon?\n\nSøvnlog, pleje, vækst og milepæle forsvinder. Det kan ikke fortrydes.", en: "Delete everything in BabyBase on this phone?\n\nSleep log, care, growth and milestones will be gone. This cannot be undone." },
    loginForChildren:{ da: "Log ind for at have flere børn i BabyBasen.", en: "Sign in to have more than one child in BabyBase." },
    askChildName:   { da: "Hvad hedder barnet?", en: "What's the child's name?" },
    childAdded:     { da: "{navn} er tilføjet. Udfyld fødselsdato under Profil, så virker søvnplan og vækstkurver.", en: "{navn} has been added. Fill in the date of birth under Profile so the sleep plan and growth curves work." },
    cantArchiveOnly:{ da: "Du kan ikke gemme dit eneste barn væk. Tilføj et andet først, eller slet barnet i stedet.", en: "You can't archive your only child. Add another first, or delete this one instead." },
    couldNotSave:   { da: "Kunne ikke gemme: ", en: "Couldn't save: " },
    couldNotDelete: { da: "Kunne ikke slette: ", en: "Couldn't delete: " },
    loginFirst:     { da: "Log ind først.", en: "Sign in first." },
    loginToJoin:    { da: "Log ind, før du tilslutter dig et barn.", en: "Sign in before joining a child." },
    writeCode:      { da: "Skriv koden, du har fået.", en: "Enter the code you were given." },
    codeNotFound:   { da: "Koden findes ikke. Tjek stavemåden.", en: "That code doesn't exist. Check the spelling." },
    alreadyJoined:  { da: "Du er allerede tilsluttet det barn.", en: "You've already joined that child." },
    joinedOk:       { da: "Du deler nu {navn} 🎉\nI ser begge de samme data fremover.", en: "You're now sharing {navn} 🎉\nYou'll both see the same data from now on." },
    copied:         { da: "Kopieret!", en: "Copied!" },
    makeCode:       { da: "Lav delingskode", en: "Create sharing code" },
    newCode:        { da: "Lav en ny kode", en: "Create a new code" },
    copy:           { da: "Kopiér", en: "Copy" },
    codeHelp:       { da: "Send koden til den anden forælder. Den virker, indtil du laver en ny.", en: "Send the code to the other parent. It works until you create a new one." },
    sharingNow:     { da: "Deler nu <strong>{navn}</strong> med", en: "Currently sharing <strong>{navn}</strong> with" },
    nobodyYet:      { da: "ingen endnu", en: "nobody yet" },
    loginToShare:   { da: "Log ind for at kunne dele.", en: "Sign in to share." },
    loginForMulti:  { da: "Log ind for at oprette og skifte mellem flere børn.", en: "Sign in to create and switch between children." },
    loginToSaveMs:  { da: "Log ind for at gemme milepæle.", en: "Sign in to save milestones." },
    loginToSaveGrowth:{ da: "Log ind med Google under Profil for at gemme målinger.", en: "Sign in with Google under Profile to save measurements." },
    msWhatHappened: { da: "Skriv hvad der skete.", en: "Write what happened." },
    pickDate:       { da: "Vælg en dato.", en: "Choose a date." },
    fillOne:        { da: "Udfyld mindst én måling.", en: "Fill in at least one measurement." },
    popupBlocked:   { da: "Browseren blokerede vinduet. Tillad pop op-vinduer for denne side og prøv igen.", en: "Your browser blocked the window. Allow pop-ups for this page and try again." }
};

// Ejefald af et navn. "Magnus" må ikke blive til "Magnuss" —
// navne der ender på s, x eller z får kun en apostrof.
function ejefald(navn) {
    const n = String(navn || "").trim();
    if (!n) return "";
    if (/[sxzSXZ]$/.test(n)) return n + "'";
    return n + "s";
}

function T(key, vars) {
    const e = ORD[key];
    let s = e ? (e[SPROG] || e.da) : key;
    if (vars) Object.keys(vars).forEach(k => { s = s.replaceAll('{' + k + '}', vars[k]); });
    if (typeof babyName !== 'undefined') {
        s = s.replaceAll('{navns}', ejefald(babyName));
        s = s.replaceAll('{navn}', babyName);
    }
    return s;
}

// Sprogkode til dato- og talformater
function locale() { return SPROG === 'en' ? 'en-GB' : 'da-DK'; }

// ==========================================
// ANVEND SPROGET PÅ SIDEN
// ==========================================
function anvendSprog() {
    document.documentElement.lang = SPROG;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = T(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = T(el.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-tip]').forEach(el => { el.setAttribute('data-tip', T(el.dataset.i18nTip)); });

    const knap = document.getElementById('btn-lang');
    if (knap) {
        knap.textContent = SPROG === 'da' ? 'EN' : 'DA';
        knap.title = SPROG === 'da' ? 'Switch to English' : 'Skift til dansk';
    }
    opdaterEfterSprog();
}

function opdaterEfterSprog() {
    if (typeof visAutoStopValg === 'function') visAutoStopValg();
    if (typeof opdaterSoeskendeBjaelke === 'function') opdaterSoeskendeBjaelke();
}

function skiftSprog() {
    if (typeof spor === 'function') spor('sprogSkift');
    SPROG = SPROG === 'da' ? 'en' : 'da';
    localStorage.setItem('babyRoLang', SPROG);
    anvendSprog();
    if (typeof opdaterAlt === 'function') opdaterAlt();
    if (typeof opdaterUrKnap === 'function') opdaterUrKnap();
    if (typeof opdaterKnap === 'function') opdaterKnap();
    if (typeof renderPlanForklaring === 'function') renderPlanForklaring();
    if (typeof opdaterInstall === 'function') opdaterInstall();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-lang')?.addEventListener('click', skiftSprog);
    anvendSprog();
});
