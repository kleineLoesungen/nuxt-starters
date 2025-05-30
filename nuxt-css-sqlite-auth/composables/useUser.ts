import type { User } from 'lucia';

export default () => {
	const user = useState<User | null>('user', () => null);
	return user;
};
