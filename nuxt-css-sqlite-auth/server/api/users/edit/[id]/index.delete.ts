import prisma from '~/lib/prisma';
import ensureRole from '~/server/utils/ensureRole';

export default defineEventHandler(async (event) => {
	ensureRole(event, ['ADMIN']);

	const idToDelete = Number(event.context.params?.id);
	const currentUserId = event.context.user?.id;

	if (!idToDelete || isNaN(idToDelete)) {
		throw createError({ statusCode: 400, message: 'Ungültige ID' });
	}

	// Nicht sich selbst löschen
	if (idToDelete === currentUserId) {
		throw createError({
			statusCode: 403,
			message: 'Du kannst dich nicht selbst löschen.',
		});
	}

	// Rolle des zu löschenden Benutzers prüfen
	const userToDelete = await prisma.user.findUnique({
		where: { id: idToDelete },
		select: { role: true },
	});

	if (!userToDelete) {
		throw createError({
			statusCode: 404,
			message: 'Benutzer nicht gefunden',
		});
	}

	// Wenn letzter Admin → Löschen verbieten
	if (userToDelete.role === 'ADMIN') {
		const adminCount = await prisma.user.count({
			where: { role: 'ADMIN' },
		});

		if (adminCount <= 1) {
			throw createError({
				statusCode: 403,
				message: 'Es muss mindestens ein Administrator bestehen bleiben.',
			});
		}
	}

	await prisma.user.delete({
		where: { id: idToDelete },
	});

	return { success: true };
});
