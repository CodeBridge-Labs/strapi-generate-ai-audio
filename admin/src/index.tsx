import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    app.customFields.register({
      name: "ai-audio-generator",
      pluginId: pluginId,
      type: "string",
      intlLabel: {
        id: "generate-ai-audio.ai-audio-generator.label",
        defaultMessage: "AI Audio Generator"
      },
      intlDescription: {
        id: "generate-ai-audio.ai-audio-generator.description",
        defaultMessage: "Generate audio narration from content using OpenAI TTS"
      },
      icon: PluginIcon,
      components: {
        Input: async () => import("./components/GenerateAudioButton")
      },
    });
  },

  bootstrap(app: any) {},

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
