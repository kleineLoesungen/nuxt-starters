export default defineNuxtRouteMiddleware((to) => {
	const user = useUser();
	if (!user.value) return navigateTo('/users/login');

	const requiredRoles: string[] = to.meta.allowedRoles as string[] || [];
	if (requiredRoles.length && !requiredRoles.includes(user.value.role)) {
		return navigateTo('/403');
	}
});
