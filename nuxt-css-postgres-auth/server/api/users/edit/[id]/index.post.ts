import type { H3Event } from 'h3';
import prisma from '~/lib/prisma';

export default defineEventHandler(async (event: H3Event) => {
	const currentUser = event.context.user;
	const id = Number(event.context.params?.id);
	const body = await readBody<{ username?: string; role?: 'ADMIN' | 'MEMBER' }>(event);

	if (!currentUser) {
		throw createError({ statusCode: 401, message: 'Nicht authentifiziert' });
	}

	if (!body.username || typeof body.username !== 'string') {
		throw createError({ statusCode: 400, message: 'Ungültiger Benutzername' });
	}

	const isAdmin = currentUser.role === 'ADMIN';
	const isSelf = currentUser.id === id;

	if (!isAdmin && !isSelf) {
		throw createError({
			statusCode: 403,
			message: 'Du darfst nur dein eigenes Profil bearbeiten.',
		});
	}

	// Wenn MEMBER: Nur den eigenen Namen ändern, keine Rolle!
	if (!isAdmin) {
		await prisma.user.update({
			where: { id },
			data: {
				username: body.username,
			},
		});
		return { success: true };
	}

	// ADMIN-Zweig: validiere Rolle
	if (!['ADMIN', 'MEMBER'].includes(body.role || '')) {
		throw createError({ statusCode: 400, message: 'Ungültige Rolle' });
	}

	// Hole Rolle des betroffenen Nutzers
	const existingUser = await prisma.user.findUnique({
		where: { id },
		select: { role: true },
	});

	if (!existingUser) {
		throw createError({ statusCode: 404, message: 'Benutzer nicht gefunden' });
	}

	// ADMIN darf nicht den letzten Admin zu MEMBER machen
	if (existingUser.role === 'ADMIN' && body.role !== 'ADMIN') {
		const adminCount = await prisma.user.count({
			where: { role: 'ADMIN' },
		});
		if (adminCount <= 1) {
			throw createError({
				statusCode: 403,
				message: 'Mindestens ein Administrator muss bestehen bleiben.',
			});
		}
	}

	// ADMIN darf alles ändern
	await prisma.user.update({
		where: { id },
		data: {
			username: body.username,
			role: body.role,
		},
	});

	return { success: true };
});
