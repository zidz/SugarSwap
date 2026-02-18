# Rapport: Teknisk Specifikation och Beteendepsykologisk Arkitektur för Gamifierad Beroendesubstitution

## 1. Inledning och Projektets Kärnfilosofi

Denna rapport utgör en uttömmande teknisk och psykologisk kravspecifikation för utvecklingen av en progressiv webbapplikation (PWA) med arbetsnamnet "GlucoSwap". Projektets primära syfte är att facilitera en varaktig beteendeförändring hos en slutanvändare med svår fetma (180 kg) och ett identifierat sockerberoende, specifikt kopplat till läskedrycker. Interventionen baseras på principen om beroendesubstitution snarare än eliminering, där den digitala upplevelsen syftar till att ersätta den biokemiska belöningen från socker med en audiovisuell, dopaminergisk belöning genom gamification.

Att designa för en användare med en kroppsvikt på 180 kg kräver en djupgående förståelse för både de fysiologiska begränsningar som kan påverka interaktionen med gränssnittet (t.ex. motorik och räckvidd på skärmen) och de psykologiska barriärer som skam och tidigare misslyckanden har byggt upp. Applikationen måste fungera som en "neuro-protes" som överbryggar gapet mellan impulsen att konsumera och den rationella viljan att avstå, genom att erbjuda omedelbar gratifikation för hälsosamma val.

Detta dokument detaljerar den beteendevetenskapliga teorin bakom designvalen, den tekniska arkitekturen för streckkodsskanning och lokal datalagring via JSON, samt de specifika UI-mönster som krävs för att skapa en "Juicy UI"-upplevelse som kan konkurrera med sockrets belöningssignaler.

## 2. Psykologisk Arkitektur: Beroende, Dopamin och Substitution

För att effektivt kunna hjälpa en individ som beskrivs som "gravt beroende" och som bär på en betydande övervikt, måste vi först dekonstruera de neurologiska mekanismer som styr beteendet. Traditionella dietappar misslyckas ofta för denna demografi eftersom de fokuserar på kaloriräkning (logik) snarare än impulskontroll (känsla).

### 2.1 Neurobiologin bakom Sockerberoende och "Wanting" vs "Liking"
Forskning inom beroendepsykologi gör en kritisk distinktion mellan "liking" (den hedoniska upplevelsen eller njutningen av konsumtion) och "wanting" (incitamentsaliens eller det tvingande begäret att konsumera). Hos individer med långvarigt sockerberoende har hjärnans belöningssystem, specifikt de mesolimbiska dopaminbanorna, genomgått en neuroadaptering. Detta innebär att dopaminreceptorerna har nedreglerats för att hantera de ständiga "toppar" som sockret orsakar, vilket leder till att individen behöver större mängder socker bara för att känna sig normal – ett tillstånd känt som allostas.

I detta stadium drivs beteendet inte längre primärt av njutning ("liking"), utan av ett hyperaktivt begär ("wanting"). Applikationen måste därför intervenera exakt i det ögonblick då "wanting"-signalen är som starkast. Genom att introducera en ersättningshandling – att skanna en sockerfri produkt – och omedelbart belöna denna handling med starka sensoriska intryck (ljud och ljus), syftar vi till att kapa den dopaminergiska loopen. Vi ersätter inte behovet av dopamin, vi ersätter källan till det.

### 2.2 Substitutionsstrategin: Skiftet från Substans till Process
Att be en person som väger 180 kg och har ett djupt rotat beroende att sluta "cold turkey" är ofta dömt att misslyckas eftersom det skapar ett massivt dopaminunderskott, vilket leder till dysfori och återfall. Strategin här är istället Addiction Substitution eller överföringsberoende, där vi medvetet styr om beroendepersonligheten mot en mindre skadlig aktivitet.

Applikationen fungerar som ett "processberoende" (likt spelande eller sociala medier) som är designat för att vara hälsofrämjande. Genom att utnyttja mekanismer som Variable Ratio Reinforcement (variabel belöningsfrekvens), där användaren inte vet exakt vilken belöning (XP, animation, digitalt samlarobjekt) som kommer att dyka upp vid en skanning, skapar vi en "digital rush" som liknar den man får vid spelautomater. Detta är avgörande för att engagera en hjärna som är van vid supranormala stimuli från socker.

### 2.3 Skam-paradoxen och Vikten av Positiv Förstärkning
En central designprincip för detta projekt är total avsaknad av skam eller negativ feedback. Studier visar entydigt att upplevd stigmatisering eller skam ("fat shaming") leder till ökade kortisolnivåer och ofta utlöser tröstätande som en copingmekanism, vilket förvärrar problemet.

Gränssnittet får aldrig visa röd text, varningskryss eller "misslyckanden" om användaren råkar dricka en sockerläsk. Istället fokuserar vi uteslutande på ackumulering av positiva val. Varje sockerfri dryck är en "vinst" som läggs till i en "Vault" (skattkammare). Metaforen är att samla (hälsa, poäng, pengar) snarare än att förlora (vikt, frihet). Detta skiftar fokus från deprivation till prestation.

## 3. Kravspecifikation för Användargränssnitt (UI) och "Juicy" Design

För att konkurrera med den fysiska ritualen att öppna en läskburk måste den digitala interaktionen vara taktil, responsiv och visuellt överflödig – ett koncept som inom speldesign kallas för "Juiciness".

### 3.1 Designfilosofi: "Juicy UI"
"Juiciness" definieras som ett gränssnitt som ger betydligt mer feedback än vad som är strikt nödvändigt för funktionen. När användaren trycker på en knapp ska det inte bara hända något på skärmen; knappen ska "studsa", skärmen ska skaka, ljud ska spelas och partiklar ska spruta.

| UI-Element | Standard Design | "Juicy" Design (Krav för GlucoSwap) | Syfte |
| :--- | :--- | :--- | :--- |
| **Knapptryck** | Färgändring (hover/active). | Skalning (95% vid tryck), elastisk "bounce" vid släpp, ljudeffekt ("pop"). | Taktil känsla som imiterar fysiska objekt. |
| **Feedback vid lyckad skanning** | Text: "Produkt registrerad". | Skärmskakning (300ms), konfettiregn, partikelexplosion, "Jackpot"-ljud. | Omedelbar dopaminfrisättning. |
| **Progress Bar** | Fylls omedelbart. | Fylls med en "ease-out" animation, gnistrar vid spetsen, ljud som stiger i tonhöjd. | Bygger anticipation och känsla av progression. |
| **Siffror (XP/Socker)** | Uppdateras direkt. | "Rullande" siffror (odometer-effekt) som tickar upp snabbt. | Visualiserar ackumulering och mängd. |

### 3.2 Tillgänglighetsanpassning för Högt BMI (The Thumb Zone)
En användare på 180 kg kan ha begränsad rörlighet och större fingrar, vilket ställer specifika krav på gränssnittets ergonomi. Vi måste applicera Fitts lag, som säger att tiden det tar att träffa ett mål är en funktion av avståndet till målet och målets storlek.

*   **Placering av Interaktion:** Alla primära interaktionselement (Skanna, Logga) måste placeras i skärmens nedre tredjedel. Hamburger-menyer i övre vänstra hörnet ska undvikas helt då de är svåra att nå på moderna, stora mobilskärmar med en hand.
*   **Touch Targets:** Minsta storlek för interaktiva element ska vara 60x60 pixlar (standard är ofta 44-48px). Den primära "Skanna"-knappen bör vara en massiv "Floating Action Button" (FAB) eller en fullbredds "Bottom Bar" som är omöjlig att missa.
*   **Hög Kontrast:** För att underlätta snabba beslut i butiksmiljö (där belysningen kan vara stark eller flimrande) ska färgkodningen vara övertydlig. "Sockerfritt" ska inte bara vara grönt, utan associeras med en specifik ikonografi (t.ex. en sköld eller blixt), medan sockerinnehåll visas neutralt men tydligt.

### 3.3 Visuella Metaforer för Sockerbesparing
Abstrakta siffror som "40 gram socker" saknar ofta emotionell tyngd. För att motivera användaren måste datan översättas till konkreta, fysiska objekt som är lätta att visualisera.

*   **Sockerbits-konvertering:** Appen ska automatiskt konvertera gram till sockerbitar. 1 sockerbit ≈ 4 gram. En 50cl Coca-Cola (53g socker) visas inte som "53g" utan som en stapel av 13 sockerbitar på skärmen. Detta är visuellt chockerande och effektivt.
*   **Sockerpåsen:** När användaren sparat 1 kg socker (250 bitar), visas en animation av en standard 1 kg sockerpåse (t.ex. Dansukker) som läggs till i "valvet".
*   **Badkaret:** Ett långsiktigt mål kan vara "Fyll ett badkar". Genom att visualisera hur mycket volym sockret tar upp, blir prestationen påtaglig.

## 4. Gamification-Element och Spelmekanik

Appen ska inte kännas som ett medicinskt verktyg, utan som ett spel där användaren "levlar upp" sin karaktär i verkliga livet.

### 4.1 Kärnloopen (The Core Loop)
1.  **Trigger:** Användaren blir törstig eller sugen på läsk.
2.  **Handling:** Användaren öppnar appen och skannar streckkoden på flaskan/burken.
3.  **Variabel Belöning:**
    *   **Sockerfri:** "CRITICAL HIT!" – Skärmen exploderar i grönt och guld. +50 XP. Ett unikt ljud spelas.
    *   **Sockrad:** "Detected Hazard." – Ingen negativ feedback, men en neutral presentation av sockerbitarna. En knapp "SWAP & DOUBLE XP" pulserar och erbjuder dubbla poäng om användaren byter till en sockerfri variant inom 60 sekunder.
4.  **Investering:** Användaren ser sin totala sparade mängd öka och sin "Streak" förlängas.

### 4.2 Leveling och XP-system
För att utnyttja användarens "beroendepersonlighet" positivt, implementeras ett RPG-liknande progressionssystem.
XP-formel: `XP = (Gram socker undviket) * (Streak Multiplier)`.

**Nivåer:**
*   Level 1: "Sockerlärling"
*   Level 10: "Insulinväktare"
*   Level 50: "Glukos-Titan"

**Loot Drops:** Med en sannolikhet på 5% vid varje skanning kan användaren "hitta" ett digitalt samlarobjekt (t.ex. en sällsynt 8-bitars läskburk eller ett "Golden Ticket"). Detta utnyttjar den intermittenta förstärkning som gör spel så beroendeframkallande.

### 4.3 Streaks och Förlåtelse
"Streaks" (dagar i rad) är kraftfulla motivatorer, men de är också sköra. Om en användare på dag 45 missar en dag och nollställs, är risken för totalt avhopp stor ("What the hell"-effekten).

*   **Freeze Streaks:** Användaren kan tjäna eller köpa (för in-game valuta, dvs. sparade sockerbitar) en "Frysning" som skyddar streaken om man missar en dag.
*   **Mjuk återställning:** Om streaken bryts, nollställs den inte helt. Den faller tillbaka till närmaste milstolpe (t.ex. från 43 dagar till 40 dagar), vilket känns rättvist men inte förödande.

## 5. Teknisk Arkitektur och Implementering

Applikationen byggs som en **Python Flask-baserad webbapplikation** som distribueras som en Progressive Web App (PWA). Detta val är strategiskt: Python Flask fungerar som en robust och lättviktig backend för att hantera API-integration och serverlogik, medan PWA-formatet gör att den fungerar sömlöst på mobila enheter utan krav på App Store-nedladdning.

### 5.1 Flask Backend och PWA-struktur
*   **Webbserver:** Python Flask används för att serva både frontend-assets och hantera eventuella framtida server-side-interaktioner.
*   **PWA-fördelar:** Fungerar offline, tillåter push-notiser och kan installeras som en ikon på hemskärmen.
*   **Streckkodsskanning med html5-qrcode:**
För skanningsfunktionaliteten rekommenderas biblioteket `html5-qrcode`. Det är ett väl underhållet, prestandaeffektivt bibliotek som körs helt i webbläsaren via JavaScript, vilket innebär att ingen bilddata behöver skickas till en server för analys (integritetsvänligt och snabbt).

**Implementeringskrav:**
*   **Dynamisk QR-box:** Konfigurera skannern att använda en dynamisk inläsningsruta som anpassar sig efter skärmstorleken (70% av skärmbredden på mobil) för att guida användaren rätt.
*   **Formatstöd:** Begränsa skanningen till 1D-streckkoder (EAN-13 och UPC) för att optimera prestanda och minska CPU-användningen, vilket sparar batteri.
*   **Fallback:** Om ljusförhållandena är dåliga ska en stor, tydlig knapp för "Manuell inmatning" finnas tillgänglig.

### 5.2 Datakälla: Open Food Facts API
Vi använder Open Food Facts som datakälla. Det är en öppen databas med exceptionellt god täckning av den svenska livsmedelsmarknaden (inklusive lokala varumärken som Apotekarnes, Nocco, Ramlösa).

*   **API-anrop:** `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
*   **Fält att extrahera:**
    *   `product.product_name` (Produktnamn)
    *   `product.brands` (Varumärke)
    *   `product.nutriments.sugars_100g` (Socker per 100g/ml)
    *   `product.serving_size` (Portionsstorlek, om tillgänglig)
    *   `product.image_front_small_url` (Tumnagelbild)

**Logik för Sockerbesparing:**
Om produkten är sockerfri (socker < 0.5g/100g), beräknar appen "besparingen" genom att jämföra med en standardreferens för läsk (t.ex. Coca-Cola Original som har ~10.6g socker/100ml).

*Exempel:* Användaren skannar en Pepsi Max 33cl.
Besparing = 330ml * 0.106 g/ml = 34.98g socker.
Denna "virtuella" sockerhög läggs till i användarens vault.

### 5.3 Ljuddesign och Psykoakustik
Ljud är den snabbaste vägen till hjärnans emotionella centra. För att maximera den positiva feedbacken bör vi använda ljuddesign som triggar specifika känslolägen.

*   **Frekvenser:** Använd ljud i C-dur (t.ex. C-E-G arpeggion). Dessa associeras kulturellt och psykoakustiskt med "fullbordan" och "glädje". Undvik dissonanta toner helt.
*   **Positiv Förstärkning:** "Level Up"-ljud och myntinsamlingsljud (högfrekventa "dings" runt 1000-2000Hz) stimulerar vakenhet och belöning.
*   **Teknik:** Använd Web Audio API för låg latens. Ljuden måste förladdas (preload) så att de spelas exakt samtidigt som den visuella feedbacken. En fördröjning på 200ms kan bryta illusionen av kausalitet.

## 6. Datastruktur och JSON-Schema

För att uppfylla kravet på lokal lagring och datasäkerhet ska all data sparas lokalt på enheten. Vi använder en hybridmodell där `localStorage` används för inställningar och kortsiktig cache, medan `IndexedDB` används för den tunga transaktionsloggen (skanningshistoriken) eftersom den kan växa sig stor över tid och `localStorage` ofta är begränsat till 5MB. För att förenkla implementationen och exportbarheten definierar vi här ett normaliserat JSON-schema som appen arbetar mot.

### 6.1 Detaljerad JSON-modell
Denna struktur är designad för att vara uttömmande, skalbar och möjliggöra framtida funktioner som grafer och historisk analys.

```json
{
  "meta": {
    "version": "2.1.0",
    "created_at_timestamp": 1709820000,
    "last_sync_timestamp": 1715421200,
    "device_id": "dev_xyz_123"
  },
  "user_profile": {
    "id": "user_local_001",
    "nickname": "SugarSlayer",
    "avatar_id": "avatar_robot_happy",
    "metrics": {
      "start_weight_kg": 180,
      "current_weight_kg": 180,
      "goal_type": "substitution",
      "currency_name": "SugarCubes"
    },
    "preferences": {
      "sound_effects_volume": 1.0,
      "haptic_feedback_level": "high",
      "high_contrast_mode": true,
      "daily_reminder_time": "10:00"
    }
  },
  "gamification_state": {
    "level": 7,
    "current_xp": 8450,
    "xp_to_next_level": 10000,
    "lifetime_stats": {
      "total_sugar_saved_g": 12500.5,
      "total_cubes_saved": 3125,
      "total_calories_saved": 48000,
      "total_scans": 240
    },
    "streaks": {
      "current_streak_days": 12,
      "highest_streak_days": 12,
      "last_log_date": "2026-02-17",
      "freeze_items_available": 2
    },
    "inventory": {
      "unlocked_badges": ["badge_first_scan", "badge_1kg_saved", "badge_7_day_streak"],
      "collected_loot": []
    }
  },
  "scan_log": [],
  "product_cache": {
    "7310070005007": {
      "name": "Coca-Cola Zero Sugar",
      "brand": "Coca-Cola",
      "nutriments": { "sugars_100g": 0, "energy-kcal_100g": 0.3 },
      "image_url": "https://images.openfoodfacts.org/images/products/731/007/000/5007/front_sv.3.200.jpg",
      "cached_at": 1715421250
    }
  }
}
```

### 6.2 Förklaring av Datamodellens Komponenter
*   **`user_profile.metrics.goal_type`:** Genom att explicit sätta målet till "substitution" påverkas algoritmens belöningssystem. Systemet vet att det primära målet inte är kalorirestriktion i största allmänhet, utan specifikt bytet av sockerkällor.
*   **`gamification_state.streaks.freeze_items_available`:** Här lagras "livlinor" för streaken. Detta är en kritisk datapunkt för att förhindra demotivation.
*   **`product_cache`:** För att appen ska kännas "blixtsnabb" och fungera offline (t.ex. i en matbutik med dålig täckning), sparas all hämtad produktdata lokalt. Vid en skanning kollar appen först i `product_cache` innan den gör ett API-anrop. Detta sparar bandbredd och tid.
*   **`scan_log.outcome.is_substitution`:** Denna flagga är viktig för analys. Om användaren skannar en sockerläsk först, och sedan en sockerfri inom 2 minuter, kan vi programmatiskt identifiera detta som ett "lyckat byte" och ge extra XP.

## 7. Implementeringsstrategi och "Hälsosam" Spelmekanik

### 7.1 Ljud- och Bildbibliotek (Assets)
För att uppnå "stark positiv feedback" måste vi integrera specifika bibliotek som hanterar partiklar och ljud.

*   **Partikelsystem:** Använd biblioteket `tsparticles` eller `canvas-confetti`. Dessa är lätta JavaScript-bibliotek som kan rendera tusentals partiklar utan att sänka prestandan på mobilen.
*   **Konfiguration:** Partiklarna ska inte bara vara färgade prickar. De bör konfigureras som små ikoner: sockerbitar som spricker, blixtar eller små "tummen upp"-ikoner.
*   **Ljudbibliotek:**
    *   `scan_success.mp3`: Ett krispigt, mekaniskt sci-fi-ljud (bekräftelse).
    *   `jackpot_win.mp3`: Ett kaskadljud av mynt/klockor (belöning).
    *   `streak_fire.wav`: Ett lågfrekvent, sprakande eldljud (kontinuitet).

### 7.2 Riskhantering: Överföringsberoende
Det finns en teoretisk risk att användaren utvecklar ett tvångsmässigt beteende kring själva skannandet eller samlandet av poäng, ett fenomen som kallas överföringsberoende. I detta fall är det dock en kalkylerad risk. Att vara "beroende" av att skanna streckkoder och dricka sockerfri läsk har betydligt lägre hälsoriske än morbid fetma och metabolt syndrom. Appen bör dock ha inbyggda spärrar (t.ex. max XP per dag) för att motverka extremt beteende, men i startfasen är maximering av engagemang prioriterat.

### 7.3 Prototyp-flöde (Steg för Steg)
1.  **Onboarding:** Användaren anger inte viktmål (för att undvika skam). Användaren anger "Favoritläsk" (t.ex. Coca-Cola). Appen ställer in "Nemesis" (Sockerläsken) vs "Hero" (Sockerfri).
2.  **Första skanningen:** Appen ber användaren skanna en flaska.
3.  **Hjälte-ögonblicket:** Om det är Zero/Light: Appen spelar en fanfar, visar "0g Socker! Du undvek precis 13 sockerbitar!". En sockerpåse-ikon fylls pyttelite.
4.  **Daglig rutin:** Notiser skickas inte som "Kom ihåg att banta", utan som "Din Streak svalnar! Logga en dryck för att hålla elden vid liv."

## 9. Interaktionsguide för UI: Knapphandlingar och Framsteg

För en produktionsredo upplevelse måste varje UI-element ha en tydlig och taktil respons. Denna sektion definierar förväntat beteende för de primära gränssnittskomponenterna.

### 9.1 Dashboard-vy
*   **XP-framstegsmätare (Progress Bar):**
    *   **Handling:** Animeras mjukt från vänster till höger allt eftersom XP tjänas in.
    *   **Visuellt:** Pulserande guld-gradient. Glöder när den närmar sig 100%.
    *   **Etikett:** Visar nuvarande XP / XP till nästa nivå (t.ex. "450 / 1000 XP").
*   **Nivåbricka (Level Badge):**
    *   **Handling:** När en nivåökning sker förstoras brickan med 20% och ett "ping"-ljud spelas.
    *   **Visuellt:** Visar den aktuella nivån tydligt.
*   **Statistikkort:**
    *   **Total mängd socker:** Uppdateras med en rullande animation (odometer-stil).
    *   **Sockerbitar:** Visas som ett fysiskt antal. Inkluderar en liten ikon av en sockerbit.

### 9.2 Navigering och kontroller
*   **SCAN-knapp (FAB):**
    *   **Handling:** Öppnar skanner-vyn.
    *   **Visuellt:** Stor, intensivt grön knapp placerad i "Thumb Zone" (nedre delen av skärmen).
    *   **Interaktion:** 95% skalning vid tryck, elastisk återgång.
*   **AVBRYT-knapp:**
    *   **Handling:** Stänger skannern och återgår till dashboarden.
    *   **Visuellt:** Sekundär stil, placerad på säkert avstånd från skanningsytan för att undvika oavsiktliga klick.

### 9.3 Feedback och belöningar
*   **Feedback-overlay:**
    *   **Trigger:** Lyckad skanning av en sockerfri produkt.
    *   **Handling:** Glider in från toppen eller dyker upp i mitten av skärmen.
    *   **Innehåll:** Berättar exakt hur många gram/sockerbitar användaren undvek (t.ex. "Du undvek 13 sockerbitar!").
    *   **Längd:** Synlig i 3–5 sekunder, tonar sedan ut.
*   **Streak-eld:**
    *   **Handling:** Glider mer intensivt baserat på streaken längd.
    *   **Visuellt:** En liten eldikon bredvid streak-räknaren.

## 10. Teknisk Filstruktur (Flask Standard)

För att en LLM ska kunna generera koden korrekt, följer vi denna struktur:

```text
/SugarSwap
├── app.py              # Flask Backend & API Proxy
├── requirements.txt    # Python beroenden
├── static/             # Front-end Assets
│   ├── css/
│   │   └── style.css   # Juicy UI & Animations
│   ├── js/
│   │   ├── app.js      # Huvudlogik (Scanner, DB, Gamification)
│   │   └── sw.js       # Service Worker for PWA
│   ├── audio/          # Ljudfiler (Placeholders i början)
│   └── manifest.json   # PWA Manifest
└── templates/
    └── index.html      # Single Page Application Dashboard
```

## 11. API-specifikation och Backend-rutter

Flask-servern fungerar primärt som en proxy för att undvika CORS-problem vid anrop till Open Food Facts.

*   **`GET /`**: Serverar `index.html`.
*   **`GET /api/proxy/product/<barcode>`**: 
    - Tar emot en streckkod.
    - Anropar `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`.
    - Returnerar JSON-data till klienten.
*   **`GET /manifest.json`**: Serverar PWA-manifestet.

## 12. PWA-konfiguration

### 12.1 manifest.json
```json
{
  "name": "SugarSwap",
  "short_name": "SugarSwap",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#001a00",
  "theme_color": "#00ff00",
  "icons": [
    { "src": "/static/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/static/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 12.2 Service Worker (`sw.js`)
Service workern ska implementera en "Cache First"-strategi för statiska assets (CSS, JS, Audio) och en "Network First"-strategi för API-anrop för att säkerställa offline-funktionalitet.

## 13. Biblioteksversioner och Dependencies

För att säkerställa att applikationen är helt fristående och isolerad ska en virtuell miljö (**venv**) användas för alla Python-beroenden.

**Installationssteg:**
1. Skapa venv: `python3 -m venv venv`
2. Aktivera venv: `source venv/bin/activate`
3. Installera moduler: `pip install -r requirements.txt`

**Dependencies:**
*   **Flask & Requests**: Installeras via pip i venv.
*   **html5-qrcode**: `https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js`
*   **canvas-confetti**: `https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js`
*   **tsparticles**: `https://cdn.jsdelivr.net/npm/tsparticles@3.3.0/tsparticles.bundle.min.js`

## 14. Gamification-logik (Matematik)

### 14.1 XP-kurva
Nivåberäkningen följer en kvadratisk kurva för att göra det progressivt svårare:
`XP_för_nivå(n) = n^2 * 100`
*   Level 1: 100 XP
*   Level 2: 400 XP
*   Level 10: 10,000 XP

### 14.2 Daglig Streak-förlust
Om `last_log_date` är mer än 48 timmar från nuvarande tidpunkt, minskas `current_streak_days` med 20% (avrundat nedåt) istället för att nollställas helt – detta för att följa principen om "Mjuk återställning".

## 15. Felhantering och Edge Cases

*   **Produkt saknas:** Om streckkoden inte finns i API:et, visa en vy för "Manuell inmatning" där användaren själv får ange gram socker (standardvärde 10.6g om de anger "sockrad läsk").
*   **Offline:** Om nätverket är nere ska appen använda `product_cache` i `IndexedDB`. Om produkten inte finns i cachen, köa skanningen för synkning när nätet återkommer.
*   **Kamera nekas:** Visa en tydlig instruktion om hur man aktiverar kameran i webbläsarens inställningar och erbjuda manuell inmatning som primärt alternativ.

