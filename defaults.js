// ==================================================
// BabyRo — Standardindhold
// Alt indhold i appen kommer herfra, indtil du gemmer
// dine egne ændringer via admin.html.
// Bruges af BÅDE index.html og admin.html
// ==================================================

const DEFAULT_SOUNDS = [
    { id: "stovsuger", icon: "💨", title: "Støvsuger", variants: [
        { label: "Standard", url: "lyde/stovsuger-1.mp3" },
        { label: "Dyb", url: "lyde/stovsuger-2.mp3" },
        { label: "Let", url: "lyde/stovsuger-3.mp3" }
    ]},
    { id: "hartorrer", icon: "💇‍♀️", title: "Hårtørrer", variants: [
        { label: "Mild", url: "lyde/hartorrer-1.mp3" },
        { label: "Kraftig", url: "lyde/hartorrer-2.mp3" },
        { label: "Fjern", url: "lyde/hartorrer-3.mp3" }
    ]},
    { id: "hjerte", icon: "❤️", title: "Hjerte", variants: [
        { label: "Rolig", url: "lyde/hjerte-1.mp3" },
        { label: "Med sus", url: "lyde/hjerte-2.mp3" },
        { label: "Dyb puls", url: "lyde/hjerte-3.mp3" }
    ]},
    { id: "regn", icon: "🌧️", title: "Regnvejr", variants: [
        { label: "Let regn", url: "lyde/regn-1.mp3" },
        { label: "Tung regn", url: "lyde/regn-2.mp3" },
        { label: "Torden", url: "lyde/regn-3.mp3" }
    ]},
    { id: "hav", icon: "🌊", title: "Havet", variants: [
        { label: "Bølger", url: "lyde/hav-1.mp3" },
        { label: "Havbund", url: "lyde/hav-2.mp3" },
        { label: "Strand", url: "lyde/hav-3.mp3" }
    ]},
    { id: "noise", icon: "📻", title: "Støj", variants: [
        { label: "White Noise", url: "lyde/noise-1.mp3" },
        { label: "Pink Noise", url: "lyde/noise-2.mp3" },
        { label: "Brown Noise", url: "lyde/noise-3.mp3" }
    ]},
    { id: "vask", icon: "🧺", title: "Vask", variants: [
        { label: "Tromle", url: "lyde/vask-1.mp3" },
        { label: "Centrifuge", url: "lyde/vask-2.mp3" },
        { label: "Gammel", url: "lyde/vask-3.mp3" }
    ]},
    { id: "bil", icon: "🚗", title: "Bilkørsel", variants: [
        { label: "Motorvej", url: "lyde/bil-1.mp3" },
        { label: "Motor", url: "lyde/bil-2.mp3" },
        { label: "Natkørsel", url: "lyde/bil-3.mp3" }
    ]},
    { id: "andet", icon: "✨", title: "Andet", variants: [
        { label: "Lyd 1", url: "lyde/andet-1.mp3" },
        { label: "Lyd 2", url: "lyde/andet-2.mp3" },
        { label: "Lyd 3", url: "lyde/andet-3.mp3" }
    ]}
];

// {navn} bliver automatisk erstattet med barnets navn overalt.
const DEFAULT_TEXTS = {
    appTitle: "BabyRo",
    appSubtitle: "Beroligende lyde til {navn}",

    navPlayer: "🎧 Lyde",
    navHistory: "🌙 Log",
    navSleep: "👶 Søvn",
    navLeaps: "🐯 Spring",
    navProfile: "👤 Profil",

    timerLabel: "{navn}s Søvnur",
    autoStopLabel: "Sluk lyden blødt efter:",
    stopAllLabel: "Sluk alt lyd",
    todayBoxTitle: "{navn}s søvn i dag",

    smartTitle: "🎙️ Smart-lyt",
    smartDesc: "Læg telefonen i nærheden af {navn}. Hvis der høres gråd eller uro, starter BabyRo automatisk en beroligende lyd.",
    smartSoundLabel: "Lyd der startes:",
    smartSensitivityLabel: "Følsomhed:",

    historyTitle: "Søvnlog",
    historySub: "Her samles alt {navn}s søvn, dag for dag.",
    statsTitle: "Sidste 7 dage",
    guestWarning: "<strong>⚠️ Kun gemt på denne telefon</strong><br>Du er ikke logget ind. Dine data kan gå tabt. Gå til Profil-fanen for at logge ind og gemme sikkert i skyen.",

    sleepTitle: "Viden om Søvn",
    sleepSub: "Sådan sover børn fra fødslen til 3-års alderen.",
    sleepCards: [
        { title: "0-3 måneder: Den fjerde trimester", body: "<p>Nyfødte sover typisk 14-17 timer i døgnet, men i små bidder på 2-4 timer – uden forskel på nat og dag. Døgnrytmen (det indre ur) er slet ikke udviklet endnu, og kroppen producerer først sit eget søvnhormon (melatonin) omkring 2-3 måneders alderen.</p><p>Søvncyklussen er kun ca. 40-50 minutter, og halvdelen af søvnen er \"aktiv\" REM-søvn, hvor baby grynter, smiler, spjætter og laver lyde. Det er helt normalt – lad være med at tage baby op ved den mindste lyd, for ofte sover barnet stadig.</p><p><strong>Brug lyden:</strong> I livmoderen var der konstant larm fra puls, blodgennemstrømning og mave. Total stilhed er faktisk utrygt for en nyfødt. Konstante, monotone lyde genskaber livmoderens lydtapet og aktiverer beroligelsesrefleksen.</p>" },
        { title: "3-6 måneder: Søvnen bliver \"voksen\"", body: "<p>Omkring 4 måneder sker en stor og permanent ændring: {navn}s søvn omorganiseres til voksne søvnstadier med lette og dybe faser. Det er den berømte <strong>4-måneders søvnregression</strong> – barnet vågner nu kortvarigt op mellem hver søvncyklus, og hvis omstændighederne har ændret sig (lyden er væk, sutten er faldet ud), vågner det helt.</p><p>Samlet søvn: 12-16 timer i døgnet, typisk fordelt på 3-4 lure om dagen. Nattesøvnen begynder langsomt at samle sig i længere stræk.</p><p><strong>Brug lyden:</strong> En konstant lyd fungerer som en bro mellem søvncyklusserne. Når barnet vågner let op og hører præcis det samme som ved indsovning, glider det videre i søvnen uden at vågne helt.</p>" },
        { title: "6-12 måneder: Rytme og separationsangst", body: "<p>Søvnen bliver mere forudsigelig, og de fleste går fra 3 til 2 lure (typisk formiddag og eftermiddag). Samlet søvnbehov: 12-15 timer i døgnet. Mange kan nu sove længere stræk om natten, men opvågninger er stadig normale.</p><p>To ting kan drille: <strong>Motorisk udvikling</strong> (kravle, rejse sig, stå) betyder, at hjernen \"øver\" om natten, og barnet kan vågne stående i tremmesengen. Og omkring 8-10 måneder rammer <strong>separationsangsten</strong> – barnet forstår nu, at mor og far findes, selv når de er væk, og protesterer derfor ved puttetid.</p><p><strong>Brug lyden:</strong> Lyden er nu blevet et betinget søvnsignal: Når barnet hører den, ved hjernen, at nu er det sovetid. Den maskerer også lyde fra resten af hjemmet.</p>" },
        { title: "1-2 år: Fra to lure til én", body: "<p>Søvnbehov: 11-14 timer i døgnet. Et sted mellem 12 og 18 måneder dropper de fleste formiddagsluren og går til én lang middagslur på 1,5-3 timer. Overgangen kan give nogle rodede uger med et overtræt barn sidst på dagen – ryk puttetiden tidligere i den periode.</p><p>Nye udfordringer: Sprogeksplosionen og viljen! Barnet kan nu protestere aktivt mod at skulle sove, og omkring 18 måneder kommer ofte en ny søvnregression drevet af selvstændighedstrang og tandfrembrud.</p><p><strong>Brug lyden:</strong> En fast lyd som en del af putteritualet giver forudsigelighed og tryghed – to ting, som et 1-2-årigt barn har brug for, netop fordi verden føles stor og vild.</p>" },
        { title: "2-3 år: Drømme, mørkeræd og den store seng", body: "<p>Søvnbehov: 10-13 timer i døgnet. Middagsluren skrumper – nogle dropper den helt omkring 3-års alderen, andre holder fast til 4-5 år. Barnet kan nu udskyde og forhandle (\"én historie til!\"), og faste, kærlige rammer omkring sengetid bliver vigtigere end nogensinde.</p><p>Fantasien eksploderer, og med den kommer <strong>mareridt</strong> (barnet vågner bange og kan trøstes) og hos nogle <strong>natterædsler</strong> (barnet skriger og virker vågent, men sover faktisk – det bedste er at blive hos barnet uden at vække det). Mørkeræd er også almindeligt nu – en svag natlampe med varmt lys er fint.</p><p><strong>Brug lyden:</strong> Rolige, ensartede lyde hjælper det tankemylder, som et 2-3-årigt hoved er fuldt af, med at falde til ro – og maskerer de \"uhyggelige\" lyde, huset laver om natten.</p>" },
        { title: "⏱️ Vågetider: Hvor længe kan barnet være vågen?", body: "<p>Et af de bedste værktøjer mod putte-kampe er at ramme \"søvnvinduet\" – putte barnet, inden det bliver overtræt. Vejledende vågetid mellem lure:</p><table class=\"wake-table\"><tr><th>Alder</th><th>Vågetid</th><th>Antal lure</th></tr><tr><td>0-3 mdr.</td><td>45-90 min.</td><td>4-6</td></tr><tr><td>3-6 mdr.</td><td>1,5-2,5 timer</td><td>3-4</td></tr><tr><td>6-9 mdr.</td><td>2-3 timer</td><td>2-3</td></tr><tr><td>9-12 mdr.</td><td>2,5-3,5 timer</td><td>2</td></tr><tr><td>12-18 mdr.</td><td>3-5 timer</td><td>1-2</td></tr><tr><td>18 mdr.-3 år</td><td>5-6 timer</td><td>0-1</td></tr></table><p style=\"margin-top:10px;\">Tegn på træthed: gnider øjne, kigger væk, gaber, bliver \"fjern\". Tegn på overtræthed: hektisk, pylret, buer ryggen – så er vinduet ved at lukke.</p>" },
        { title: "🌙 Den gode putterutine", body: "<p>Børn elsker forudsigelighed. En kort, fast rutine på 15-30 minutter i samme rækkefølge hver aften fortæller kroppen, at søvnen er på vej:</p><ul class=\"leap-list\"><li>Dæmp lys og tempo i hjemmet den sidste time.</li><li>Bad eller vask → ren ble → nattøj.</li><li>Mad/amning (gerne før barnet er helt væk, så det ikke KUN kan sove ved mad).</li><li>Historie, sang eller stille pusletid.</li><li>Tænd den samme lyd i BabyRo – {navn}s eget søvnsignal.</li><li>Læg barnet døsigt, men vågent, i sengen.</li></ul>" },
        { title: "🛡️ Tryg søvn – de vigtigste råd", body: "<ul class=\"leap-list\"><li>Læg altid baby til at sove på ryggen det første år.</li><li>Fast madras, ingen løse dyner, puder eller bamser i sengen de første måneder – brug evt. sovepose.</li><li>Sov i samme rum som barnet de første 6 måneder (egen seng).</li><li>Hold soveværelset køligt (ca. 18-20 °C) og røgfrit.</li><li>Lydstyrke: Placér højttaleren mindst 1-2 meter fra barnet og hold lyden dæmpet – som en stille bruser, ikke højere.</li></ul><p style=\"margin-top:10px; font-size:0.85rem; color:var(--text-light);\">BabyRo er en hjælp til hverdagen – ikke sundhedsfaglig rådgivning. Er du bekymret for dit barns søvn, så tal med sundhedsplejersken eller lægen.</p>" }
    ],

    leapTitle: "Tigerspring",
    leapSub: "De 10 mentale udviklingsspring i barnets første 20 måneder.",
    leapStatusTitle: "Hvor er {navn} lige nu?",
    leapIntroTitle: "Hvad er et tigerspring?",
    leapIntroBody: "<p>Udover at vokse fysisk gennemgår alle babyer 10 store <strong>mentale</strong> udviklingsspring i løbet af de første ca. 20 måneder. Ved hvert spring modnes hjernen pludseligt, og barnet kan opfatte verden på en helt ny måde. Det er fantastisk – men også skræmmende, for alt det velkendte føles pludselig anderledes.</p><p>Springene kommer på overraskende faste tidspunkter og regnes altid fra <strong>terminsdatoen</strong> – ikke fødselsdagen. Et barn født 3 uger før termin rammer altså springene ca. 3 uger \"senere\" end kalenderalderen.</p><h4 style=\"margin-top: 15px;\">De typiske tegn (de tre G'er):</h4><ul class=\"leap-list\"><li><strong>Grædende</strong> – mere pylret og let til tårer end normalt.</li><li><strong>Grenagtig/klæbende</strong> – vil bæres og være tæt på mor eller far hele tiden.</li><li><strong>Gnaven</strong> – urolig søvn, dårlig appetit, humørsvingninger.</li></ul><p style=\"margin-top: 15px;\"><strong>Sådan hjælper lyden:</strong> Under et spring bombarderes hjernen med nye indtryk. Monotone, brummende lyde skærmer for indtrykkene og giver hjernen en tiltrængt pause – derfor virker støvsugeren ofte som magi netop i springperioderne.</p>",
    leapCards: [
        { nr: 1, from: 4, to: 5, title: "Sanseindtryk", body: "<p>Alle sanser skærpes på én gang. Verden bliver skarpere, lysere og mere larmende – indefra mærker baby nu også sin egen fordøjelse tydeligere. Det er ofte her, den første \"hvorfor græder mit ellers rolige barn?\"-uge rammer.</p><p><strong>Bagefter kan baby:</strong> Kigge længere og mere fokuseret, reagere tydeligere på lyde og berøring – og give jer det allerførste rigtige smil.</p>" },
        { nr: 2, from: 7, to: 9, title: "Mønstre", body: "<p>Baby begynder at opdage simple mønstre – både i det, den ser (striber, kontraster, egne hænder!), og i det, den mærker. Mange babyer bliver i denne periode dybt fascinerede af deres egne hænder.</p><p><strong>Bagefter kan baby:</strong> Holde hovedet mere stabilt, lave små kontrollerede bevægelser, pludre (\"åh\" og \"eh\") og studere ting længe.</p>" },
        { nr: 3, from: 11, to: 12, title: "Glidende overgange", body: "<p>Nu opfattes bløde, glidende forandringer: en stemme der går op og ned, en bevægelse der glider hen over rummet. Babys egne bevægelser bliver også mere flydende og mindre robotagtige.</p><p><strong>Bagefter kan baby:</strong> Følge ting med øjnene i én glidende bevægelse, hvine og \"synge\" med tonefald, og gribe mere målrettet efter ting.</p>" },
        { nr: 4, from: 14, to: 19, title: "Begivenheder", body: "<p>Det længste og ofte hårdeste spring – og det falder typisk sammen med 4-måneders søvnregressionen. Baby forstår nu korte \"begivenheder\": at én ting fører til den næste (rasle → lyd, række ud → gribe → putte i munden).</p><p><strong>Bagefter kan baby:</strong> Gribe, vende og undersøge ting bevidst, putte alt i munden, reagere på sit eget navn og måske trille rundt.</p>" },
        { nr: 5, from: 22, to: 26, title: "Sammenhænge", body: "<p>Baby forstår nu afstande – og dermed den skræmmende opdagelse, at mor og far kan bevæge sig VÆK. Det er startskuddet til separationsangsten. Baby forstår også, at ting hænger sammen: knappen og lyden, låget og gryden.</p><p><strong>Bagefter kan baby:</strong> Sidde mere selv, flytte ting fra hånd til hånd, kigge efter tabte ting og protestere højlydt, når du forlader rummet.</p>" },
        { nr: 6, from: 33, to: 37, title: "Kategorier", body: "<p>Verden bliver sorteret! Baby opdager, at ting kan grupperes: en hund er en hund, uanset om den er stor, lille, på billede eller i virkeligheden. Baby undersøger alt systematisk – klemmer, banker, smider og smager for at finde ud af, hvad ting \"er\".</p><p><strong>Bagefter kan baby:</strong> Genkende kategorier (dyr, mad, mennesker), vise tydelige præferencer og forstå enkelte ord.</p>" },
        { nr: 7, from: 41, to: 46, title: "Rækkefølger", body: "<p>Baby forstår nu, at ting skal gøres i en bestemt rækkefølge for at lykkes: Først klodsen op, SÅ slippe den i spanden. Nu peges der ivrigt, og baby elsker at \"hjælpe til\" med små opgaver.</p><p><strong>Bagefter kan baby:</strong> Stable, putte ting i og ud af beholdere, pege på ting den vil have, sige de første rigtige ord og måske tage de første skridt.</p>" },
        { nr: 8, from: 50, to: 55, title: "Programmer", body: "<p>Efter rækkefølger kommer \"programmer\": fleksible planer med et mål. Barnet forstår nu hele forløb som \"at spise frokost\" eller \"at gå tur\" – og VIL selv! Det vil selv holde skeen, selv vaske, selv bestemme.</p><p><strong>Bagefter kan barnet:</strong> Efterligne hverdagsopgaver (feje, tale i telefon), hjælpe med påklædning og lege begyndende \"som om\"-lege.</p>" },
        { nr: 9, from: 59, to: 64, title: "Principper", body: "<p>Barnet begynder at tænke over sin egen tænkning: at planlægge, forhandle og – ja – teste grænser med fuldt overlæg. Nu opdages det, at man kan få sin vilje på flere måder: charme, drama, list. Trodsalderens spæde start!</p><p><strong>Bagefter kan barnet:</strong> Planlægge små \"projekter\", lave sjov med jer, efterligne strategisk og vise begyndende forståelse for \"mit\" og \"dit\".</p>" },
        { nr: 10, from: 70, to: 76, title: "Systemer", body: "<p>Det sidste store spring (ca. 17 måneder). Barnet forstår nu \"systemer\": familien er ét system, naboens familie et andet. Samvittigheden vågner – barnet kan nu føle empati, trøste andre og forstå, at det selv er et \"jeg\" med egne valg.</p><p><strong>Bagefter kan barnet:</strong> Vise omsorg, genkende sig selv i spejlet, lege mere avancerede fantasilege og sætte ord sammen til små sætninger.</p>" }
    ],
    leapOutroTitle: "Godt at huske",
    leapOutroBody: "<ul class=\"leap-list\"><li>Springperioderne varer typisk 1-6 uger – de tidlige er korte, de sene længere.</li><li>Uro og dårlig søvn i et spring er et sundhedstegn: hjernen arbejder på højtryk.</li><li>Efter hvert spring kommer en solskinsperiode, hvor barnet pludselig kan nye ting.</li><li>Alle datoer er vejledende – dit barn er ikke \"bagud\", fordi et spring kommer en uge senere.</li></ul>",

    profileTitle: "Profil & Indstillinger",
    planTitle: "Dagens plan",
    growthTitle: "Vækst & udvikling",
    navGrowth: "📈 Vækst"
};
