<template>
  <div class="max-w-7xl mx-auto py-6 px-4 sm:py-8 sm:px-6 lg:px-8">
    <div class="sm:px-0">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
        {{ $t('home.welcome', { appName }) }}
      </h1>
      <p class="text-base sm:text-lg text-gray-600">
        {{ $t('home.description') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig();
const appName = computed(() => config.public.appName || 'My App');

definePageMeta({
  layout: 'default',
});
</script>