import { Strapi } from '@strapi/strapi';
import { convert } from 'html-to-text';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const getElevenLabsConfig = () => {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error('ELEVENLABS_VOICE_ID environment variable is required');
  }
  return {
    voiceId,
    model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
    stability: parseFloat(process.env.ELEVENLABS_STABILITY || '0.30'),
    similarity: parseFloat(process.env.ELEVENLABS_SIMILARITY || '0.85'),
    style: parseFloat(process.env.ELEVENLABS_STYLE || '0.30'),
  };
};

const htmlToPlainText = (html: string): string => {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  });
};

const formatBibleVerse = (text: string): string => {
  return text
    .replace(/(\d+):(\d+)/g, '$1, versículo $2')
    .replace(/\bNTV\b/g, 'Nueva Traducción Viviente')
    .replace(/\bRVR\b/g, 'Reina Valera Revisada')
    .replace(/\bNVI\b/g, 'Nueva Versión Internacional');
};

const buildTextForBlog = (title: string, content: string): string => {
  const cleanTitle = htmlToPlainText(title || '');
  const cleanContent = htmlToPlainText(content || '');
  
  let text = '';
  if (cleanTitle) {
    text += cleanTitle + '.\n\n';
  }
  if (cleanContent) {
    text += cleanContent;
  }
  
  return formatBibleVerse(text);
};

const buildTextForDevotional = (
  title: string,
  bibleVerse: string,
  content: string,
  prayer: string,
  action: string,
  publishedAt?: string | Date | null
): string => {
  const cleanTitle = htmlToPlainText(title || '');
  const cleanVerse = htmlToPlainText(bibleVerse || '');
  const cleanContent = htmlToPlainText(content || '');
  const cleanPrayer = htmlToPlainText(prayer || '');
  const cleanAction = htmlToPlainText(action || '');
  
  const dateToUse = publishedAt ? new Date(publishedAt) : new Date();
  const dateStr = dateToUse.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  let text = `${capitalizedDate}: ${cleanTitle}.\n\n`;
  
  if (cleanVerse) {
    text += formatBibleVerse(cleanVerse) + '\n\n';
  }
  
  if (cleanContent) {
    text += formatBibleVerse(cleanContent) + '\n\n';
  }
  
  if (cleanPrayer) {
    text += 'Oremos:\n\n' + cleanPrayer + '\n\n';
  }
  
  if (cleanAction) {
    text += 'Acción del día:\n\n' + cleanAction;
  }
  
  return text;
};

const generateAudioWithElevenLabs = async (text: string): Promise<Buffer> => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY environment variable not set');
  }

  const config = getElevenLabsConfig();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: config.model,
        voice_settings: {
          stability: config.stability,
          similarity_boost: config.similarity,
          style: config.style,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

interface GenerateAudioParams {
  contentType: string;
  entityId: number;
  locale?: string;
}

interface ContentFields {
  title?: string;
  content?: string;
  bible_verse?: string;
  prayer?: string;
  action?: string;
  publishedAt?: string | Date | null;
  published_at?: string | Date | null;
}

const service = ({ strapi }: { strapi: Strapi }) => ({
  async generateAudioFromContent({ contentType, entityId, locale }: GenerateAudioParams) {
    try {
      const uid = contentType as any;
      
      const entity = await strapi.db.query(uid).findOne({
        where: { id: entityId },
        populate: ['narration_audio'],
      }) as ContentFields & { id: number; narration_audio?: any };

      if (!entity) {
        throw new Error(`Entity not found: ${contentType} with id ${entityId}`);
      }

      let text = '';
      let characterCount = 0;

      if (contentType === 'api::blog.blog') {
        text = buildTextForBlog(entity.title || '', entity.content || '');
        characterCount = text.length;
      } else if (contentType === 'api::devotional.devotional') {
        const publishedAt = entity.publishedAt ?? (entity as any).published_at ?? null;
        text = buildTextForDevotional(
          entity.title || '',
          entity.bible_verse || '',
          entity.content || '',
          entity.prayer || '',
          entity.action || '',
          publishedAt
        );
        characterCount = text.length;
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      if (characterCount === 0) {
        throw new Error('No content available to generate audio');
      }

      console.log(`Generating audio for ${characterCount} characters using ElevenLabs`);
      console.log(`Text preview: ${text.substring(0, 300)}...`);

      const audioBuffer = await generateAudioWithElevenLabs(text);
      
      console.log(`Audio generated: ${audioBuffer.length} bytes`);

      const title = entity.title || `content-${entityId}`;
      const safeTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
      const fileName = `narration-${safeTitle}-${Date.now()}.mp3`;

      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, fileName);
      
      fs.writeFileSync(tempFilePath, audioBuffer);
      console.log(`Temp file written to: ${tempFilePath}`);

      const uploadService = strapi.plugin('upload').service('upload');
      
      const stats = fs.statSync(tempFilePath);
      const fileStream = fs.createReadStream(tempFilePath);
      
      const fileData = {
        path: tempFilePath,
        name: fileName,
        type: 'audio/mpeg',
        size: stats.size,
        stream: fileStream,
      };

      let uploadedFile;
      try {
        [uploadedFile] = await uploadService.upload({
          data: {},
          files: fileData,
        });
      } finally {
        fs.unlinkSync(tempFilePath);
        console.log(`Temp file deleted: ${tempFilePath}`);
      }

      console.log(`Audio uploaded: ${uploadedFile.id}`);

      await strapi.entityService.update(uid, entityId, {
        data: {
          narration_audio: uploadedFile.id,
        },
      });

      console.log(`Entity updated with audio file`);

      return {
        success: true,
        audioFile: uploadedFile,
        characterCount,
        chunksProcessed: 1,
      };

    } catch (error: any) {
      console.error('Error generating audio:', error);
      throw error;
    }
  },
});

export default service;
