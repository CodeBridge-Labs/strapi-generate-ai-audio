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

const numberToSpanishWord = (n: number): string => {
  const ones = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (n < 1 || n > 199) return n.toString();
  
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n === 20) return 'veinte';
  if (n < 30) return 'veinti' + ones[n - 20];
  if (n === 100) return 'cien';
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return tens[ten] + (one > 0 ? ' y ' + ones[one] : '');
  }
  
  const hundred = Math.floor(n / 100);
  const remainder = n % 100;
  let result = hundreds[hundred];
  
  if (remainder > 0) {
    result += ' ' + numberToSpanishWord(remainder);
  }
  
  return result;
};

const formatRomanNumeral = (title: string): string => {
  const romanToOrdinal: { [key: string]: string } = {
    'I': 'Primera Parte',
    'II': 'Segunda Parte',
    'III': 'Tercera Parte',
    'IV': 'Cuarta Parte',
    'V': 'Quinta Parte',
    'VI': 'Sexta Parte',
    'VII': 'Séptima Parte',
    'VIII': 'Octava Parte',
    'IX': 'Novena Parte',
    'X': 'Décima Parte',
  };
  
  return title.replace(/\b(X|IX|VIII|VII|VI|V|IV|III|II|I)\s*$/i, (match, roman) => {
    const upperRoman = roman.toUpperCase();
    return romanToOrdinal[upperRoman] || match;
  });
};

const formatBibleVerse = (text: string): string => {
  return text
    .replace(/(\d+)\s*:\s*(\d+)\s*-\s*(\d+)/g, (match, chapter, verseStart, verseEnd) => {
      const chapterWord = numberToSpanishWord(parseInt(chapter));
      const verseStartWord = numberToSpanishWord(parseInt(verseStart));
      const verseEndWord = numberToSpanishWord(parseInt(verseEnd));
      return `${chapterWord}, versículo ${verseStartWord} al ${verseEndWord}`;
    })
    .replace(/(\d+)\s*:\s*(\d+)/g, (match, chapter, verse) => {
      const chapterWord = numberToSpanishWord(parseInt(chapter));
      const verseWord = numberToSpanishWord(parseInt(verse));
      return `${chapterWord}, versículo ${verseWord}`;
    })
    .replace(/\bNTV\b/g, 'Nueva Traducción Viviente')
    .replace(/\bRVR\b/g, 'Reina Valera Revisada')
    .replace(/\bNVI\b/g, 'Nueva Versión Internacional');
};

const buildTextForBlog = (title: string, content: string): string => {
  const cleanTitle = htmlToPlainText(title || '');
  const formattedTitle = formatRomanNumeral(cleanTitle);
  const cleanContent = htmlToPlainText(content || '');
  
  let text = '';
  if (formattedTitle) {
    text += formattedTitle + '.\n\n';
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
  const formattedTitle = formatRomanNumeral(cleanTitle);
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

  let text = `${capitalizedDate}: ${formattedTitle}.\n\n`;
  
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
