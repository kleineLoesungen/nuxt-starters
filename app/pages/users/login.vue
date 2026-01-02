<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 sm:space-y-8">
      <div>
        <h2 class="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
          {{ $t('auth.login.title') }}
        </h2>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="username" class="sr-only">{{ $t('auth.login.username') }}</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              :placeholder="$t('auth.login.username')"
            />
          </div>
          <div>
            <label for="password" class="sr-only">{{ $t('auth.login.password') }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              :placeholder="$t('auth.login.password')"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ loading ? $t('auth.login.signingIn') : $t('auth.login.submit') }}
          </button>
        </div>

        <div class="text-center">
          <NuxtLink to="/users/register" class="text-sm text-blue-600 hover:text-blue-500">
            {{ $t('auth.login.noAccount') }} {{ $t('auth.login.registerLink') }}
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const fetchUser = inject<() => Promise<void>>('fetchUser');

async function handleLogin() {
  error.value = '';
  loading.value = true;

  try {
    const response = await $fetch('/api/users/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value,
      },
    }) as any;

    if (response.success) {
      // Refresh user data in layout
      if (fetchUser) {
        await fetchUser();
      }
      
      // Load user permissions
      const { loadPermissions } = useUserGroups();
      await loadPermissions();
      
      // Redirect to home page
      await navigateTo('/');
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
