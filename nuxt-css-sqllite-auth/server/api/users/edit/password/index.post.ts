import { hash, verify } from '@node-rs/argon2';
import { readBody, createError } from 'h3';
import prisma from '~/lib/prisma';

export default defineEventHandler(async (event) => {
	const user = event.context.user;

	if (!user) {
		throw createError({ statusCode: 401, message: 'Nicht authentifiziert' });
	}

	const body = await readBody<{ currentPassword: string; newPassword: string }>(event);

	if (!body.currentPassword || !body.newPassword) {
		throw createError({
			statusCode: 400,
			message: 'Beide Passwortfelder müssen ausgefüllt sein.',
		});
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { password_hash: true },
	});

	if (!dbUser) {
		throw createError({ statusCode: 404, message: 'Benutzer nicht gefunden.' });
	}

	const valid = await verify(dbUser.password_hash, body.currentPassword);

	if (!valid) {
		throw createError({
			statusCode: 403,
			message: 'Das aktuelle Passwort ist falsch.',
		});
	}

	const newHash = await hash(body.newPassword, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});

	await prisma.user.update({
		where: { id: user.id },
		data: {
			password_hash: newHash,
		},
	});

	return { success: true };
});
