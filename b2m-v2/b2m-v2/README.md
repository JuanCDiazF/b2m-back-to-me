# B2M – Back to Me v2.0

## Deploy en Vercel

### 1. Sube a GitHub
- Crea repo en github.com → sube todos estos archivos

### 2. Conecta Vercel
- vercel.com → Add New Project → selecciona el repo → Deploy

### 3. CRÍTICO — API Key
En Vercel → Settings → Environment Variables:
- Key: `ANTHROPIC_API_KEY`
- Value: tu key de console.anthropic.com

Sin este paso la app NO genera historias.

### 4. Redeploy
Después de añadir la variable → Redeploy

---

## Estructura
- `pages/index.js` — App completa con capas progresivas
- `pages/api/story.js` — Backend seguro (llama a Anthropic)
- `styles/globals.css` — Diseño completo
- `pages/_app.js` — Wrapper

## Lo nuevo en v2
- Sistema de capas progresivas (5 capas)
- Preguntas acumulativas (ciudad, hora, padres, pregunta libre)
- El Cronista adapta la narrativa con cada respuesta
- Estrellas visibles con animación
- Paywall aparece después de la experiencia completa
- Barra de progreso por capítulos
