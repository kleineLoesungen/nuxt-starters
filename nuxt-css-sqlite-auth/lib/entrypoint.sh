#!/bin/sh

npx prisma generate
npx prisma migrate deploy

node index.mjs