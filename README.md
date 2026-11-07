# shotbyjulian

En fotoutställning på webben. Hela arkivet läses från mappen `shotbyjulian/` — lägger du in en ny bild där finns den på sidan nästa gång den byggs, utan att du rör någon kod.

## Lägg till en bild

```bash
npm run sync    # uppdaterar photos.json
npm run dev     # förhandsgranska på http://localhost:4173
```

- `npm run dev` tittar på mappen: lägger du in en bild medan servern kör är det bara att ladda om sidan.
- Ligger bilderna i en annan mapp? Importera dem direkt:

```bash
node scripts/sync-photos.mjs --from "C:/Users/julia/shotbyjulian"
```

- Ordningen är nyast först — den senaste bilden blir startsidans bild, de tre nästa blir kap 01–03.
- Format: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`.

## Bildtexter (frivilligt)

Skapa `shotbyjulian/captions.json` och koppla en text till filnamnet:

```json
{
  "bild (13).jpg": "Lamborghini, sommar och svart lack"
}
```

Texterna syns i ljuslådan och som alt-text för skärmläsare.

## Så är sidan byggd

En enda lång utställning, inga menyer i vägen:

1. **Hero** — titel och en bild som öppnas från ett fönster till fullskärm när du scrollar (CSS-variabler styr insets, GSAP scrubb styr dem).
2. **Tre kapitel** — sticky bildsidor med liten parallax (±7 %) och en etikett som tonar in.
3. **The archive** — alla bilder i ett masonry-flöde som avslöjas i grupper när de kommer in i vyn.
4. **Contact** — e-postadressen, inget formulär.

Rörelsen ligger i `app.js` under `initMotion()` och är byggd med GSAP 3.13 + ScrollTrigger (lokalt i `vendor/`, inga externa anrop):

| Grepp | Teknik |
| --- | --- |
| Hero-fönster → fullskärm | `scrub: 0.6`, `ease: "none"` över sektionens höjd |
| Kapitel-parallax | `yPercent: -7 → 7`, `scrub: true` |
| Arkivavslöjande | `ScrollTrigger.batch`, `stagger: 0.06`, `power3.out` |
| Intro | tidslinje på 0,6–1,1 s, `power3.out` |
| Ljuslåda | GSAP-övergångar, piltangenter, swipe, fokusfälla |

Typsnitt, färger och mått: `-apple-system`/SF Pro med Inter Tight som fallback, `#000` canvas, `#f5f5f7` text, `#86868b` sekundärtext, 18 px radie på bilder.

`prefers-reduced-motion` stänger av all scrollanimation — då är sidan helt statisk men komplett.

## Publicera

`.github/workflows/deploy.yml` bygger och publicerar sidan till GitHub Pages vid varje push till `main`.

**Engångssteg:** gå till **Settings → Pages** i repot och välj **Source: GitHub Actions**. Efter nästa push ligger sidan på `https://<användarnamn>.github.io/shotbyjulian/`.

## Bygga manuellt

```bash
npm run build     # skapar dist/ (index.html, styles.css, app.js, photos.json, shotbyjulian/, vendor/)
npm run preview   # serverar dist/ på http://localhost:4173
```

Inga npm-beroenden, ingen bundler. Node 18+ räcker.

## Anpassa

| Vad | Var |
| --- | --- |
| E-post, texter, sektionsordning | `index.html` |
| Färger, typografi, radier, kolumner | `styles.css` (`:root` och `.grid`) |
| Animationer, hero-bildval, kapitelval | `app.js` (`initMotion`, `renderHero`, `renderChapters`) |
| Vilka bilder som blir kapitel | `renderChapters()` — `state.photos.slice(1, 4)` |
