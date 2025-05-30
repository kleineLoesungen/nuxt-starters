import type { User } from 'lucia';
import useUser from '~/composables/useUser';

export default defineNuxtRouteMiddleware(async () => {
	const user = useUser();

	try {
		const userData = await $fetch<User>('/api/users/me');
		user.value = userData || null;
	}
	catch (err) {
		console.log(err);
		// Optional: Log error or handle unauthenticated state
		user.value = null;
	}
});
