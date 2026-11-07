# shotbyjulian

Portföljsida för Juliáns fotografier. Hela arkivet läses från mappen `shotbyjulian/` — lägger du in en ny bild där finns den på sidan nästa gång den byggs, utan att du rör någon kod.

## Lägg till en bild

```bash
# lägg bilden i shotbyjulian/ (eller kopiera in den):
npm run sync    # uppdaterar photos.json
npm run dev     # förhandsgranska på http://localhost:4173
```

- `npm run dev` tittar på mappen: lägger du in en bild medan servern kör är det bara att ladda om sidan.
- Ligger bilderna kvar i en annan mapp? Importera dem direkt:

```bash
node scripts/sync-photos.mjs --from "C:/Users/julia/shotbyjulian"
```

- Ordningen är nyast först. Format som stöds: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`.

## Bildtexter (frivilligt)

Skapa `shotbyjulian/captions.json` och koppla en text till filnamnet:

```json
{
  "bild (13).jpg": "Lamborghini, sommar och svart lack",
  "bild (1).jpg": "Väntan på trottoaren"
}
```

Texterna syns i galleriet, i ljuslådan och som alt-text för skärmläsare.

## Publicera

`.github/workflows/deploy.yml` bygger och publicerar sidan till GitHub Pages vid varje push till `main`.

**Engångssteg:** gå till **Settings → Pages** i repot och välj **Source: GitHub Actions**. Efter nästa push ligger sidan på `https://<ditt-användarnamn>.github.io/<repo-namn>/`.

## Bygga manuellt

```bash
npm run build     # skapar dist/ (index.html, styles.css, app.js, photos.json, shotbyjulian/)
npm run preview   # serverar dist/ på http://localhost:4173
```

Inga beroenden, ingen bundler. Node 18+ räcker.

## Anpassa

| Vad | Var |
| --- | --- |
| E-postadress, texter, rubriker | `index.html` |
| Färger, typsnitt, mellanrum | `styles.css` (`:root`) |
| Antal kolumner i galleriet | `styles.css` → `.grid` |
| Startsidans bilder | `app.js` → `renderHero()` (första och fjärde bilden i arkivet) |
