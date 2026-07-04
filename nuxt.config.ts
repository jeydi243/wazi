// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    "@nuxtjs/supabase",
    "@pinia/nuxt",
  ],
  app: {
    rootAttrs: {
      "data-vaul-drawer-wrapper": "",
      "class": "bg-(--ui-bg)",
    },
    // pageTransition: { name: 'page', mode: 'out-in' },
    // layoutTransition: { name: 'layout', mode: 'out-in' }
  },
  runtimeConfig: {
    // Private keys are only available on the server
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,

    // Public keys that are exposed to the client
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },
  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true
    }
  },
  supabase: {
    clientOptions: {
      auth: {
        experimental: {
          passkey: true // Active le support des passkeys
        }
      }
    },
    redirectOptions: {
      login: "/auth",
      callback: "/confirm",
      include: undefined,
      exclude: [],
      saveRedirectToCookie: false,
    },
  },
  devServer: {
    port: 3005
  },
  compatibilityDate: '2026-04-03',
  nitro: {
    externals: {
      inline: ["@supabase/supabase-js"]
    }
  },
  icon: {
    serverBundle: 'local',
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
