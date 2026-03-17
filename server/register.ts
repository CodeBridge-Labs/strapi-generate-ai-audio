import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => {
  strapi.customFields.register({
    name: 'ai-audio-generator',
    pluginId: 'generate-ai-audio',
    // @ts-ignore
    plugin: 'generate-ai-audio',
    type: 'string'
  });
};
