import { defineEventHandler } from 'h3';
import prisma from '~/lib/prisma';
import ensureRole from '~/server/utils/ensureRole';

export default defineEventHandler(async (event) => {
	ensureRole(event, ['ADMIN']);

	const users = await prisma.user.findMany({
		select: {
			id: true,
			username: true,
			role: true,
		},
		orderBy: { id: 'asc' },
	});
	return users;
});
