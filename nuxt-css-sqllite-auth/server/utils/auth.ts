import { Lucia } from 'lucia';
import { PrismaLuciaAdapter } from '../lucia/adapter';

export const lucia = new Lucia(PrismaLuciaAdapter(), {
	sessionCookie: {
		attributes: {
			secure: !import.meta.dev,
		},
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username,
			role: attributes.role,
		};
	},
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
		UserId: number;
	}
}

interface DatabaseUserAttributes {
	username: string;
	role: 'MEMBER' | 'ADMIN';
}
