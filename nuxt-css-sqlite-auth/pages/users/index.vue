<template>
	<div class="max-w-5xl mx-auto px-4 py-8">
		<div class="bg-white shadow rounded-2xl p-6">
			<h1 class="text-3xl font-bold text-gray-800 mb-6">
				Benutzerverwaltung
			</h1>

			<!-- User Grid List -->
			<div class="space-y-6">
				<div
					v-for="user in users"
					:key="user.id"
					class="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border rounded-lg shadow-sm bg-gray-50"
				>
					<!-- ID -->
					<div class="text-sm text-gray-500">
						<p class="font-medium text-gray-600 sm:hidden">
							ID
						</p>
						<p>#{{ user.id }}</p>
					</div>

					<!-- Username -->
					<div>
						<p class="font-medium text-gray-600 sm:hidden mb-1">
							Username
						</p>
						<input
							v-model="user.username"
							class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
					</div>

					<!-- Rolle -->
					<div>
						<p class="font-medium text-gray-600 sm:hidden mb-1">
							Rolle
						</p>
						<select
							v-model="user.role"
							class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="ADMIN">
								Admin
							</option>
							<option value="MEMBER">
								Member
							</option>
						</select>
					</div>

					<!-- Aktion Buttons -->
					<div class="flex gap-2 sm:justify-end">
						<button
							class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
							@click="saveUser(user)"
						>
							Speichern
						</button>

						<!-- Nur anzeigen, wenn nicht der aktuelle Nutzer -->
						<button
							v-if="currentUser?.id !== user.id"
							class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
							@click="deleteUser(user.id)"
						>
							Löschen
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
definePageMeta({
	middleware: ['protected'],
	allowedRoles: ['ADMIN'],
});

const { show } = useFeedback();
const { data: users, refresh } = await useFetch('/api/users');

async function saveUser(user: User) {
	try {
		await $fetch(`/api/users/edit/${user.id}`, {
			method: 'POST',
			body: {
				username: user.username,
				role: user.role,
			},
		});
		await refresh();
		show('Done', 'success');
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}

const currentUser = useUser(); // importiert aus deinem Composable

async function deleteUser(userId: number) {
	if (!confirm('Möchtest du diesen Benutzer wirklich löschen?')) return;

	try {
		await $fetch(`/api/users/edit/${userId}`, {
			method: 'DELETE',
		});
		await refresh(); // aktualisiere Benutzerliste
		show('Done', 'success');
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}
</script>
