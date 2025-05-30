import ensureRole from '~/server/utils/ensureRole';

export default defineEventHandler((event) => {
	ensureRole(event, ['MEMBER', 'ADMIN']);

	return event.context.user;
});
