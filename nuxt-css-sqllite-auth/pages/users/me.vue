<template>
	<div class="min-h-screen flex items-center justify-center">
		<div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-md text-center">
			<h1 class="text-2xl font-bold text-gray-800 mb-4">
				Your Profile
			</h1>

			<div class="space-y-4">
				<!-- Rolle -->
				<p class="text-center text-sm text-gray-600">
					<strong>Role:</strong> {{ user.role }}
				</p>

				<!-- Username -->
				<div class="text-left space-y-2 mt-6">
					<h3 class="font-semibold text-gray-700 text-sm">
						Username
					</h3>
					<div class="flex flex-row items-center space-x-2">
						<input
							v-model="username"
							class="flex-grow border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
						<button
							class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
							@click="changeUsername"
						>
							<Icon
								name="mdi:content-save"
								class="text-base"
							/>
						</button>
					</div>
				</div>

				<!-- Passwort ändern -->
				<div class="text-left space-y-2 mt-6">
					<h3 class="font-semibold text-gray-700 text-sm">
						Passwort ändern
					</h3>
					<input
						v-model="currentPassword"
						type="password"
						placeholder="Aktuelles Passwort"
						class="w-full border border-gray-300 rounded px-4 py-2"
					>
					<div class="flex flex-row w-full space-x-2">
						<input
							v-model="newPassword"
							type="password"
							placeholder="Neues Passwort"
							class="w-full border border-gray-300 rounded px-4 py-2"
						>
						<button
							class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
							@click="changePassword"
						>
							<Icon
								name="mdi:content-save"
								class="text-base"
							/>
						</button>
					</div>
				</div>
			</div>

			<!-- Logout -->
			<div class="mt-6">
				<button
					class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
					@click="logout"
				>
					Logout
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
definePageMeta({
	middleware: ['protected'],
	allowedRoles: ['MEMBER', 'ADMIN'],
});

const { show } = useFeedback();
const user = useUser();

const username = ref(user.value?.username || '');
const currentPassword = ref('');
const newPassword = ref('');

async function changeUsername() {
	try {
		await $fetch(`/api/users/edit/${user.value?.id}`, {
			method: 'POST',
			body: { username: username.value, role: user.value.role },
		});
		show('Done', 'success');
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}

async function changePassword() {
	if (!currentPassword.value || !newPassword.value) {
		show('Old and New Passwords', 'error');
		return;
	}

	try {
		await $fetch('/api/users/edit/password', {
			method: 'POST',
			body: {
				currentPassword: currentPassword.value,
				newPassword: newPassword.value,
			},
		});
		show('Done', 'success');
		currentPassword.value = '';
		newPassword.value = '';
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}

async function logout() {
	try {
		await $fetch('/api/users/logout', { method: 'POST' });
		await navigateTo('/users/login');
		show('Done', 'success');
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}
</script>
