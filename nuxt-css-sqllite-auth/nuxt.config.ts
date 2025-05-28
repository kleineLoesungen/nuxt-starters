// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
	modules: [
		'@nuxt/icon',
		'@nuxt/eslint',
		'@vueuse/nuxt',
		'@nuxtjs/tailwindcss',
	],
	ssr: false,
	devtools: { enabled: true },
	compatibilityDate: '2025-05-15',
});
