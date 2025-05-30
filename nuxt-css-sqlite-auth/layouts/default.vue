<template>
	<div class="min-h-screen flex flex-col bg-gray-50">
		<!-- Navbar -->
		<header class="bg-white shadow px-6 py-4 flex justify-between items-center">
			<NuxtLink
				to="/"
			>
				<h1 class="text-xl font-semibold text-gray-800">
					MyApp
				</h1>
			</NuxtLink>

			<!-- User Icon & Menu -->
			<div
				ref="menuRef"
				class="relative"
			>
				<!-- Login status icon -->
				<Icon
					:name="user !== null ? 'mdi:account-circle' : 'mdi:account-circle-outline'"
					class="text-2xl text-gray-700 cursor-pointer hover:text-blue-500 transition"
					@click="toggleMenu"
				/>

				<!-- Dropdown menu -->
				<div
					v-if="menuOpen"
					class="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg z-50 py-2 border border-gray-200"
				>
					<template v-if="user">
						<NuxtLink
							to="/users/me"
							class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Icon
								name="mdi:account"
								class="text-base"
							/> Profil
						</NuxtLink>
						<button
							class="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
							@click="logout"
						>
							<Icon
								name="mdi:logout"
								class="text-base"
							/> Logout
						</button>
					</template>
					<template v-if="!user">
						<NuxtLink
							to="/users/login"
							class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Icon
								name="mdi:login"
								class="text-base"
							/> Login
						</NuxtLink>
						<NuxtLink
							to="/users/signup"
							class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Icon
								name="mdi:account-plus"
								class="text-base"
							/> Registrieren
						</NuxtLink>
					</template>
					<template v-if="user && user.role === 'ADMIN'">
						<div class="flex items-center px-4 py-2 text-xs text-gray-400 uppercase">
							<div class="flex-grow border-t border-gray-200" />
							<span class="px-2">Admin</span>
							<div class="flex-grow border-t border-gray-200" />
						</div>
						<NuxtLink
							to="/users"
							class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
						>
							<Icon
								name="mdi:account-cog"
								class="text-base"
							/>
							Nutzerverwaltung
						</NuxtLink>
					</template>
				</div>
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-grow px-4 sm:px-6 lg:px-8 container mx-auto">
			<slot />
		</main>
		<FeedbackAlert
			v-if="feedback"
			:message="feedback.message"
			:type="feedback.type"
			class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
			@close="clear"
		/>
	</div>
</template>

<script lang="ts" setup>
import FeedbackAlert from '~/components/FeedbackAlert.vue';
import { useFeedback } from '~/composables/useFeedback';

const { feedback, clear, show } = useFeedback();

const menuOpen = ref(false);
const menuRef = ref(null);
const user = useUser();

onClickOutside(menuRef, () => (menuOpen.value = false));

function toggleMenu() {
	menuOpen.value = !menuOpen.value;
}

async function logout() {
	try {
		await $fetch('/api/users/logout', { method: 'POST' });
		user.value = null;
		menuOpen.value = false;
		await navigateTo('/');
		show('Done', 'success');
	}
	catch (err: unknown) {
		show(err?.data?.message || 'Error', 'error');
	}
}
</script>
