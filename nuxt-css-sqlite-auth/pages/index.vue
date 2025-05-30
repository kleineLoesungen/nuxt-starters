<template>
	<div class="min-h-screen flex flex-col items-center justify-center">
		<div class="font-bold">
			My App '/' (unprotected)
		</div>
		<div>- <NuxtLink to="/members">/members (only 'MEMBER')</NuxtLink></div>
		<div>- <NuxtLink to="/admins">/members (only 'ADMIN')</NuxtLink></div>
	</div>
</template>
