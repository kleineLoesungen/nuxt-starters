<template>
	<div class="min-h-screen flex items-center justify-center">
		<div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-md">
			<h1 class="text-2xl font-bold mb-6 text-center text-gray-800">
				Login
			</h1>
			<form
				class="space-y-4"
				@submit.prevent="login"
			>
				<div>
					<label
						for="username"
						class="block text-sm font-medium text-gray-700"
					>Username</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
				</div>

				<div>
					<label
						for="password"
						class="block text-sm font-medium text-gray-700"
					>Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
				</div>

				<button
					type="submit"
					class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-semibold"
				>
					Continue
				</button>
			</form>
		</div>
	</div>
</template>

<script lang="ts" setup>
const { show } = useFeedback();

async function login(e: Event) {
	const form = e.target as HTMLFormElement;
	const formData = new FormData(form);

	const username = formData.get('username');
	const password = formData.get('password');

	try {
		await $fetch('/api/users/login', {
			method: 'POST',
			body: { username, password },
		});

		await navigateTo('/');
		show('Done', 'success');
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}
</script>
