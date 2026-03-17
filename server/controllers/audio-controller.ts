import { Strapi } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Strapi }) => ({
  async generate(ctx) {
    try {
      const { contentType, entityId, locale } = ctx.request.body;

      if (!contentType || !entityId) {
        ctx.throw(400, 'Missing required fields: contentType and entityId');
      }

      const allowedContentTypes = ['api::blog.blog', 'api::devotional.devotional'];
      if (!allowedContentTypes.includes(contentType)) {
        ctx.throw(400, `Content type not supported: ${contentType}`);
      }

      const result = await strapi
        .plugin('generate-ai-audio')
        .service('ttsService')
        .generateAudioFromContent({
          contentType,
          entityId: parseInt(entityId, 10),
          locale,
        });

      ctx.body = result;
    } catch (error: any) {
      console.error('Error in audio generation controller:', error);
      ctx.throw(500, error.message || 'Failed to generate audio');
    }
  },
});

export default controller;
