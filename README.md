# Thumbnail Generator

AI YouTube thumbnail generator gebouwd met Claude + FLUX Thumbnails LoRA.

## Deployen naar Vercel

### Stap 1 — Zet op GitHub
1. Maak een nieuw repository op [github.com](https://github.com/new)
2. Upload alle bestanden uit deze map daarnaar

Of via terminal:
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/JOUW-NAAM/thumbnail-generator.git
git push -u origin main
```

### Stap 2 — Importeer in Vercel
1. Ga naar [vercel.com](https://vercel.com) en log in
2. Klik op **"Add New Project"**
3. Importeer je GitHub repository
4. Klik op **"Deploy"** (Vercel herkent Next.js automatisch)

### Stap 3 — Voeg API keys toe
In Vercel → je project → **Settings → Environment Variables**, voeg toe:

| Naam | Waarde |
|------|--------|
| `ANTHROPIC_API_KEY` | Je Anthropic API key (van console.anthropic.com) |
| `REPLICATE_API_KEY` | Je Replicate API key (van replicate.com/account/api-tokens) |

Klik daarna op **Redeploy**.

### Kosten
- Claude (prompt schrijven): ~$0,001 per thumbnail
- Replicate (FLUX generatie): ~$0,003–0,005 per thumbnail
- Vercel hosting: gratis

## Lokaal draaien
```bash
npm install
# Maak .env.local aan:
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
echo "REPLICATE_API_KEY=r8_..." >> .env.local
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)
