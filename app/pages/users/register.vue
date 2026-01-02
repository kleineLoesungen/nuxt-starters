<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-6 sm:space-y-8">
      <!-- Loading State -->
      <div v-if="checkingUsers" class="text-center py-12">
        <p class="text-gray-600">{{ $t('auth.register.checkingStatus') }}</p>
      </div>

      <!-- Registration Disabled Message (only if not first user) -->
      <div v-else-if="!registrationEnabled && !isFirstUser" class="rounded-md bg-yellow-50 p-4 border border-yellow-200">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">{{ $t('auth.register.disabled') }}</h3>
            <p class="mt-2 text-sm text-yellow-700">
              {{ $t('auth.register.disabledMessage') }}
            </p>
            <div class="mt-4">
              <NuxtLink to="/users/login" class="text-sm font-medium text-yellow-700 hover:text-yellow-600 underline">
                {{ $t('auth.register.goToLogin') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div>
          <h2 class="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            {{ $t('auth.register.title') }}
          </h2>
          <p v-if="!registrationEnabled && isFirstUser" class="mt-2 text-center text-sm text-gray-600">
            {{ $t('auth.register.firstAdmin') }}
          </p>
        </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div v-if="error" class="rounded-md bg-red-50 p-4">
          <p class="text-sm text-red-800">{{ error }}</p>
        </div>

        <div v-if="success" class="rounded-md bg-green-50 p-4">
          <p class="text-sm text-green-800">{{ success }}</p>
        </div>

        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">{{ $t('auth.register.username') }}</label>
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="username123"
            />
            <p class="mt-1 text-xs text-gray-500">{{ $t('auth.register.usernameHelp') }}</p>
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">{{ $t('auth.register.email') }}</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="you@example.com"
            />
            <p class="mt-1 text-xs text-gray-500">{{ $t('auth.register.emailHelp') }}</p>
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">{{ $t('auth.register.password') }}</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="••••••••"
            />
            <p class="mt-1 text-xs text-gray-500">{{ $t('auth.register.passwordHelp') }}</p>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">{{ $t('auth.register.confirmPassword') }}</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {{ loading ? $t('auth.register.creating') : $t('auth.register.submit') }}
          </button>
        </div>

        <div class="text-center">
          <NuxtLink to="/users/login" class="text-sm text-blue-600 hover:text-blue-500">
            {{ $t('auth.register.hasAccount') }} {{ $t('auth.register.loginLink') }}
          </NuxtLink>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

const registrationEnabled = ref(true);
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const checkingUsers = ref(true);
const isFirstUser = ref(false);

const fetchUser = inject<() => Promise<void>>('fetchUser');

// Check settings and user count on mount
onMounted(async () => {
  try {
    // Fetch registration settings
    const settingsResponse = await $fetch('/api/settings') as any;
    registrationEnabled.value = settingsResponse.settings.registrationEnabled;

    // Check if there are any users
    const usersResponse = await $fetch('/api/users') as any;
    isFirstUser.value = !usersResponse.data || usersResponse.data.length === 0;
  } catch (err) {
    // If endpoint fails, assume we can try registration
    isFirstUser.value = true;
  } finally {
    checkingUsers.value = false;
  }
});

async function handleRegister() {
  error.value = '';
  success.value = '';
  loading.value = true;

  // Validate passwords match
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    loading.value = false;
    return;
  }

  try {
    const response = await $fetch('/api/users/register', {
      method: 'POST',
      body: {
        username: username.value,
        email: email.value || null,
        password: password.value,
      },
    }) as any;

    if (response.success) {
      success.value = response.message || 'Account created successfully!';
      
      // Refresh user data in layout
      if (fetchUser) {
        await fetchUser();
      }
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigateTo('/');
      }, 1500);
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
