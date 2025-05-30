import { verify } from '@node-rs/argon2';
import prisma from '~/lib/prisma';
import { lucia } from '~/server/utils/auth';

export default eventHandler(async (event) => {
	const body = await readBody<{ username?: string; password?: string }>(event);

	const username = body.username;
	if (typeof username !== 'string') {
		throw createError({
			message: 'Invalid username',
			statusCode: 400,
		});
	}

	const password = body.password;
	if (typeof password !== 'string') {
		throw createError({
			message: 'Invalid password',
			statusCode: 400,
		});
	}

	const existingUser = await prisma.user.findUnique({
		where: { username },
	});
	if (!existingUser) {
		throw createError({
			message: 'Incorrect username or password',
			statusCode: 400,
		});
	}

	const validPassword = await verify(existingUser.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
	if (!validPassword) {
		throw createError({
			message: 'Incorrect username or password',
			statusCode: 400,
		});
	}

	const session = await lucia.createSession(existingUser.id, {});
	appendHeader(event, 'Set-Cookie', lucia.createSessionCookie(session.id).serialize());
});
