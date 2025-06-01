// https://nuxt.com/docs/api/configuration/nuxt-config
import { join } from 'path'
import { copyFileSync, mkdirSync } from 'node:fs'

export default defineNuxtConfig({
	app: {
		head: {
			title: 'Default Page Title', // default fallback title
			htmlAttrs: {
				lang: 'en',
			},
		},
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
		// Production Dateien kopieren
		'nitro:build:public-assets'() {
			const outputServerDir = join(__dirname, '.output/server')
			const sourcePrismaLib = join(__dirname, 'lib/prisma.ts')
			const sourceDockerCmd = join(__dirname, 'lib/entrypoint.sh')
			const sourceSchema = join(__dirname, 'prisma/schema.prisma')

			copyFileSync(sourceDockerCmd, join(outputServerDir, 'entrypoint.sh'))
			
			mkdirSync(join(outputServerDir, 'lib'), { recursive: true })
			copyFileSync(sourcePrismaLib, join(outputServerDir, 'lib/prisma.ts'))

			mkdirSync(join(outputServerDir, 'prisma'), { recursive: true })
			copyFileSync(sourceSchema, join(outputServerDir, 'prisma/schema.prisma'))

			console.log('Deployment files copied')
		}
	}
});
