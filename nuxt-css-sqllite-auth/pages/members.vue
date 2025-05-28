<template>
	<div
		class="min-h-screen flex flex-col items-center justify-center"
	>
		<div class="font-bold">
			My App '/members' (protected: only 'MEMBER')
		</div>
		<div>- <NuxtLink to="/">/ (unprotected)</NuxtLink></div>
		<div>- <NuxtLink to="/admins">/members (only 'ADMIN')</NuxtLink></div>
	</div>
</template>

<script setup lang="ts">
definePageMeta({
	middleware: ['protected'],
	allowedRoles: ['MEMBER', 'ADMIN'],
});
</script>
