import type { User } from 'lucia';
import useUser from '~/composables/useUser';

export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();

	try {
		const userData = await $fetch<User>('/api/users/me');
		user.value = userData || null;
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	catch (err) {
		// Optional: Log error or handle unauthenticated state
		user.value = null;
	}
});
