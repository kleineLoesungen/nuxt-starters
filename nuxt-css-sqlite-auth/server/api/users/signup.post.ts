import { hash } from '@node-rs/argon2';
import prisma from '~/lib/prisma';
import { lucia } from '~/server/utils/auth';

export default eventHandler(async (event) => {
	const body = await readBody<{ username: string; password: string }>(event);
	const { username, password } = body;

	if (
		typeof username !== 'string'
	) {
		throw createError({
			message: 'Invalid username',
			statusCode: 400,
		});
	}

	if (typeof password !== 'string') {
		throw createError({
			message: 'Invalid password',
			statusCode: 400,
		});
	}

	const passwordHash = await hash(password, {
		// recommended minimum parameters
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});

	const existingUser = await prisma.user.findUnique({
		where: { username },
	});

	if (existingUser) {
		throw createError({
			message: 'Username already taken',
			statusCode: 400,
		});
	}

	const userCount = await prisma.user.count();

	const response = await prisma.user.create({
		data: {
			username,
			password_hash: passwordHash,
			role: userCount === 0 ? 'ADMIN' : 'MEMBER',
		},
	});

	const session = await lucia.createSession(response.id, {});
	appendHeader(event, 'Set-Cookie', lucia.createSessionCookie(session.id).serialize());

	return { success: true, userId: response.id };
});
