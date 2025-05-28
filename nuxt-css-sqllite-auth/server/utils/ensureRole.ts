import type { H3Event } from 'h3';
import { createError } from 'h3';

export default (event: H3Event, allowedRoles: string[]) => {
	const user = event.context.user;

	if (!user || !allowedRoles.includes(user.role)) {
		throw createError({
			statusCode: 403,
			message: 'Forbidden: Insufficient role',
		});
	}
};
