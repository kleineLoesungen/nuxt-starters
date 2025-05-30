# Nuxt App Starter
with preconfigured css, database and auth (user & password)

## Use
- RUN `npm i`
- CREATE `.env` with
  - `DATABASE_URL="postgresql://user:pass@localhost:5432/mydb?schema=test"`
- RUN `npx prisma db push` & `npx prisma generate`
- RUN `npm run dev`
- CREATE a user; first user is admin


## Packages
- nuxt/icon
- tailwind css (https://tailwindcss.nuxtjs.org/getting-started)
- vueuse (https://vueuse.org/guide/#nuxt)
- prisma (https://nuxt.com/modules/prisma)
- Lucia (https://v3.lucia-auth.com/getting-started/nuxt)


## Database (prisma)
- RUN `npx prisma db push` // deploy Prisma schema (overwrite, no migration)
- RUN `npx prisma generate` // generate Prisma client
- USE `prisma` object // use for db actions generated Prisma client as singleton
- RUN `npx prisma studio` // look db insight
- FILES 
  - `/prisma` (schema), 
  - `/lib/prisma.ts` (singleton)


## Auth (Lucia)
- Configured User/Password (https://v3.lucia-auth.com/tutorials/username-and-password/nuxt)
- FILES 
  - `/server/lucia/adapter.ts` (prisma-driver), 
  - `/server/utils/auth.ts` (config), 
  - `/server/api/users` (auth routes), 
  - `/server/middleware/auth.ts` (server-side auth), 
  - `/middleware/auth.global.ts` (client-side auth), 
  - `/composable/useUser.ts` (user composable)
- First registered User is role 'ADMIN'. Following 'MEMBER'


## Styling (tailwind css, nuxt/icon)
- <Icon /> with Iconify
- FILES 
  - `/assets/css/tailwind.css` (tailwind css), 
  - `/tailwind.config.js` (config)


## Deployment Nuxt App
- RUN `npm run build`
- RUN `cp -r ./.env ./.output/server/`
- RUN `node .output/server/index.mjs`


## Deployment Dockerized Nuxt App (Dev)
- *(macOS: RUN `colima start`)*
- RUN `docker build -t nuxt-app .`
- RUN `docker run -d -p 3000:3000 nuxt-app:latest`

## Open Topics
- use nuxt layers
- use ssr
