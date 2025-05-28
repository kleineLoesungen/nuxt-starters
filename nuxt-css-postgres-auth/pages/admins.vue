<template>
	<div
		class="min-h-screen flex flex-col items-center justify-center"
	>
		<div class="font-bold">
			My App '/admins' (protected: only 'ADMIN')
		</div>
		<div>- <NuxtLink to="/">/ (unprotected)</NuxtLink></div>
		<div>- <NuxtLink to="/members">/members (only 'MEMBER')</NuxtLink></div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: ['protected'],
	allowedRoles: ['ADMIN'],
});
</script>
