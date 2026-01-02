// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  
  modules: [
    '@nuxtjs/i18n',
  ],
  
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix', // URLs stay the same, no /en or /de prefix
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en',
    },
    locales: [
      { code: 'en', iso: 'en-US', name: 'English', files: ['en.json'] },
      { code: 'de', iso: 'de-DE', name: 'Deutsch', files: ['de.json'] },
    ],
  },
  
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig: {
    // Private runtime config - only available server-side
    // These can be overridden by environment variables at runtime
    database: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      name: 'myapp',
      user: 'postgres',
      password: '',
      schema: 'public',
      ssl: false,
      maxConnections: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    email: {
      host: '',
      port: 587,
      user: '',
      password: '',
      from: 'App <noreply@example.com>',
    },
    // Public runtime config - available client and server-side
    public: {
      appName: 'My App',
    },
  },
})
