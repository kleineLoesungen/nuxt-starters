type FeedbackType = 'success' | 'error';

export const useFeedback = () => {
	const feedback = useState<{ message: string; type: FeedbackType } | null>('feedback', () => null);

	function show(message: string, type: FeedbackType = 'success') {
		feedback.value = { message, type };
	}

	function clear() {
		feedback.value = null;
	}

	return { feedback, show, clear };
};
