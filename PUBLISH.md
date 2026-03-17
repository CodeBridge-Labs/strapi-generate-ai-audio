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
