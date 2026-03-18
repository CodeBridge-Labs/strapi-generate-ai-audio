# Publicar en GitHub

Repo: https://github.com/CodeBridge-Labs/strapi-generate-ai-audio

## Primera vez (subir el plugin al repo vacío)

Reemplaza `VAPP_BACKEND` por la ruta real a tu proyecto VApp-backend.

```bash
# Clonar el repo vacío
git clone https://github.com/CodeBridge-Labs/strapi-generate-ai-audio.git /tmp/strapi-generate-ai-audio
cd /tmp/strapi-generate-ai-audio

# Copiar contenido del plugin (excluye node_modules y dist)
rsync -av --exclude='node_modules' --exclude='dist' \
  VAPP_BACKEND/src/plugins/generate-ai-audio/ .

git add .
git commit -m "Initial commit: strapi-generate-ai-audio plugin"
git push -u origin main
```

## Actualizar el repo (después de cambios en el plugin)

```bash
cd /tmp/strapi-generate-ai-audio
git pull
rsync -av --exclude='node_modules' --exclude='dist' \
  VAPP_BACKEND/src/plugins/generate-ai-audio/ .
git add .
git commit -m "Update plugin"
git push
```

## Verificar antes de push

- No incluir `.env` ni archivos con API keys
- No incluir `node_modules/` ni `dist/` (están en .gitignore)

---

# Crear la primera release (v1.0.0)

## Opción A: Desde GitHub (recomendado)

1. Ve a https://github.com/CodeBridge-Labs/strapi-generate-ai-audio
2. Clic en **Releases** → **Create a new release**
3. **Choose a tag:** escribe `v1.0.0` → **Create new tag: v1.0.0**
4. **Release title:** `v1.0.0`
5. **Describe this release:** pega las notas de [CHANGELOG.md](./CHANGELOG.md) para 1.0.0 (o el texto abajo)
6. Clic en **Publish release**

## Opción B: Desde la terminal (gh cli)

Si tienes [GitHub CLI](https://cli.github.com/) instalado y autenticado:

```bash
cd /ruta/al/repo/strapi-generate-ai-audio
gh release create v1.0.0 --title "v1.0.0" --notes-file CHANGELOG.md
```

O con notas en línea:

```bash
gh release create v1.0.0 --title "v1.0.0" --notes "First release. Generate audio narrations from Blog and Devotional content using ElevenLabs TTS. See CHANGELOG.md for details."
```

## Opción C: Tag + push, luego release en la web

```bash
cd /ruta/al/repo/strapi-generate-ai-audio
git tag -a v1.0.0 -m "Release v1.0.0 - First release"
git push origin v1.0.0
```

Después crea la release en GitHub (Releases → Draft a new release → elegir tag `v1.0.0` y publicar).

---

### Texto sugerido para la descripción de la release v1.0.0

```markdown
## strapi-generate-ai-audio v1.0.0

First release. Generate audio narrations from Strapi content (Blog, Devotional) using [ElevenLabs](https://elevenlabs.io) TTS.

### Features
- One-click "Generate Audio" in Strapi admin
- Devotional format: date, title, verse, content, prayer, action
- Blog format: title + content
- Bible verse formatting (e.g. 1:1 → "versículo 1")
- NTV/RVR/NVI spoken in full
- Config via env vars (no secrets in code)

### Install
\`\`\`bash
npm install git+https://github.com/CodeBridge-Labs/strapi-generate-ai-audio.git#v1.0.0
\`\`\`

See [README.md](https://github.com/CodeBridge-Labs/strapi-generate-ai-audio#readme) for setup and env variables.
```
