# strapi-generate-ai-audio

Strapi plugin to generate audio narrations from content (e.g. blog posts, devotionals) using [ElevenLabs](https://elevenlabs.io) Text-to-Speech.

## Features

- Generate MP3 narration from richtext content with one click in the admin panel
- Supports Blog and Devotional content types (configurable)
- Uses ElevenLabs API for natural-sounding voice
- Formatted output for devotionals (date, verse, content, prayer, action)
- Bible verse formatting (e.g. "1:1" → "1, versículo 1")
- Version abbreviations (NTV, RVR, NVI) spoken in full

## Requirements

- Strapi 4.x
- ElevenLabs API key

## Installation

```bash
npm install strapi-generate-ai-audio
# or from git
npm install git+https://github.com/CodeBridge-Labs/strapi-generate-ai-audio.git
```

## Configuration

### 1. Enable the plugin

In `config/plugins.js`:

```js
module.exports = ({ env }) => ({
  'generate-ai-audio': {
    enabled: true,
    resolve: './src/plugins/generate-ai-audio', // or omit if installed from npm
  },
});
```

### 2. Environment variables

Set these in your `.env` (no defaults for API key or voice – required for security):

| Variable | Required | Description |
|----------|----------|-------------|
| `ELEVENLABS_API_KEY` | Yes | Your ElevenLabs API key |
| `ELEVENLABS_VOICE_ID` | Yes | ElevenLabs voice ID (from voice library) |
| `ELEVENLABS_MODEL` | No | Model ID (default: `eleven_multilingual_v2`) |
| `ELEVENLABS_STABILITY` | No | 0–1 (default: 0.30) |
| `ELEVENLABS_SIMILARITY` | No | 0–1 (default: 0.85) |
| `ELEVENLABS_STYLE` | No | 0–1 (default: 0.30) |

### 3. Content types

Add the custom field and media field to your schemas (e.g. Blog, Devotional):

- `narration_audio` (type: media, single, allowedTypes: audios, files)
- `generate_audio` (customField: `plugin::generate-ai-audio.ai-audio-generator`)

## License

MIT
