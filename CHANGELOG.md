# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-16

### Added

- Generate audio narration from Strapi content (Blog, Devotional) using ElevenLabs TTS
- Custom field in admin: one-click "Generate Audio" button
- Automatic upload of generated MP3 to Strapi media (provider-agnostic)
- Devotional format: published date, title, Bible verse, content, "Oremos:", prayer, "Acción del día:", action
- Blog format: title + content
- Bible verse formatting: e.g. `1:1` → "1, versículo 1"
- Version abbreviations spoken in full: NTV → "Nueva Traducción Viviente", RVR, NVI
- Configurable via env: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL`, stability, similarity, style
- Support for `publishedAt` so narration date matches content publish date

### Requirements

- Strapi 4.x
- ElevenLabs API key and voice ID (no defaults; set in project `.env`)
