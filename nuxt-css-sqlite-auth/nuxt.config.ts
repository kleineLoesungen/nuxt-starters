// https://nuxt.com/docs/api/configuration/nuxt-config
import { join } from 'path'
import { copyFileSync, mkdirSync } from 'node:fs'

export default defineNuxtConfig({
	app: {
	    	head: {
			title: 'Nuxt App', // default fallback title
	      		htmlAttrs: {
	        		lang: 'en',
	      		},
	      		link: [
	        		{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
	      		]
	    	}
  	},
	modules: [
		'@nuxt/icon',
		'@nuxt/eslint',
		'@vueuse/nuxt',
		'@nuxtjs/tailwindcss',
	],
	ssr: false,
	devtools: { enabled: process.env.NODE_ENV !== 'production' },
	compatibilityDate: '2025-05-15',
	hooks: {
		// Prisma Dateien kopieren
		'nitro:build:public-assets'() {
			const outputServerDir = join(__dirname, '.output/server')
			const sourcePrismaLib = join(__dirname, 'lib/prisma.ts')
			const sourceSchema = join(__dirname, 'prisma/schema.prisma')
			const sourceDB = join(__dirname, 'prisma/dev.db')

			mkdirSync(join(outputServerDir, 'lib'), { recursive: true })
			copyFileSync(sourcePrismaLib, join(outputServerDir, 'lib/prisma.ts'))

			mkdirSync(join(outputServerDir, 'prisma'), { recursive: true })
			copyFileSync(sourceSchema, join(outputServerDir, 'prisma/schema.prisma'))
			copyFileSync(sourceSchema, join(sourceDB, 'prisma/dev.db'))

			console.log('Prisma files copied')
		}
	}
});
