// https://v3.lucia-auth.com/reference/main/Adapter

import type { Adapter } from 'lucia';
import prisma from '~/lib/prisma';

export function PrismaLuciaAdapter(): Adapter {
	return {
		async getSessionAndUser(sessionId: string) {
			const session = await prisma.session.findUnique({
				where: { id: sessionId },
				include: { user: true },
			});
			if (!session) return [null, null];

			const { user, ...sessionData } = session;
			const { id, ...userAttributes } = user;

			return [
				{
					id: sessionData.id,
					userId: sessionData.userId,
					expiresAt: sessionData.expiresAt,
					attributes: {},
				},
				{
					id,
					attributes: userAttributes,
				},
			];
		},

		async setSession(session) {
			await prisma.session.create({
				data: {
					id: session.id,
					userId: session.userId,
					expiresAt: session.expiresAt,
				},
			});
		},

		async deleteSession(sessionId) {
			await prisma.session.delete({
				where: { id: sessionId },
			}).catch(() => {}); // optional: Fehler ignorieren
		},

		async deleteUserSessions(userId) {
			await prisma.session.deleteMany({
				where: { userId },
			});
		},

		async deleteExpiredSessions() {
			await prisma.session.deleteMany({
				where: {
					expiresAt: {
						lt: new Date(), // löscht alle Sessions, deren Ablaufdatum < jetzt ist
					},
				},
			});
		},

		async getUserSessions(userId: number) {
			const sessions = await prisma.session.findMany({
				where: {
					userId,
					expiresAt: {
						gt: new Date(), // optional: nur aktive Sessions holen
					},
				},
			});
			return sessions.map(s => ({ attributes: {}, ...s }));
		},

		async updateSessionExpiration(sessionId: string, expiresAt: Date) {
			await prisma.session.update({
				where: { id: sessionId },
				data: { expiresAt },
			});
		},
	};
}
