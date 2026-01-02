<template>
  <div class="max-w-3xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
    <div class="sm:px-0">
      <div class="mb-4 sm:mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ $t('auth.profile.title') }}</h1>
        <p class="mt-1 sm:mt-2 text-sm text-gray-600">{{ $t('auth.profile.subtitle') }}</p>
      </div>

      <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <div v-if="success" class="mb-4 rounded-md bg-green-50 p-4">
        <p class="text-sm text-green-800">{{ success }}</p>
      </div>

      <div class="bg-white shadow rounded-lg">
        <form @submit.prevent="handleUpdate" class="divide-y divide-gray-200">
          <!-- Username Section -->
          <div class="px-4 py-4 sm:px-6 sm:py-5">
            <h3 class="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4">{{ $t('auth.profile.usernameSection') }}</h3>
            <div class="max-w-xl">
              <label for="username" class="block text-sm font-medium text-gray-700">{{ $t('auth.register.username') }}</label>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :placeholder="$t('auth.register.username')"
              />
              <p class="mt-2 text-sm text-gray-500">
                {{ $t('auth.profile.usernameHelp') }}
              </p>
            </div>
          </div>

          <!-- Email Section -->
          <div class="px-4 py-4 sm:px-6 sm:py-5">
            <h3 class="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4">{{ $t('auth.profile.emailSection') }}</h3>
            <div class="max-w-xl">
              <label for="email" class="block text-sm font-medium text-gray-700">{{ $t('auth.profile.email') }}</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                :placeholder="$t('auth.profile.email')"
              />
            </div>
          </div>

          <!-- Password Section -->
          <div class="px-4 py-4 sm:px-6 sm:py-5">
            <h3 class="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4">{{ $t('auth.profile.passwordSection') }}</h3>
            <div class="max-w-xl space-y-3 sm:space-y-4">
              <div>
                <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                  {{ $t('auth.profile.currentPassword') }}
                </label>
                <input
                  id="currentPassword"
                  v-model="formData.currentPassword"
                  type="password"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <p class="mt-1 text-sm text-gray-500">
                  {{ $t('auth.profile.currentPasswordHelp') }}
                </p>
              </div>

              <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700">
                  {{ $t('auth.profile.newPassword') }}
                </label>
                <input
                  id="newPassword"
                  v-model="formData.newPassword"
                  type="password"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <p class="mt-1 text-sm text-gray-500">
                  {{ $t('auth.profile.newPasswordHelp') }}
                </p>
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                  {{ $t('auth.profile.confirmPassword') }}
                </label>
                <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  type="password"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-4 py-4 sm:px-6 flex justify-between items-center bg-gray-50">
            <NuxtLink
              to="/"
              class="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {{ $t('common.cancel') }}
            </NuxtLink>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ loading ? $t('auth.profile.saving') : $t('auth.profile.saveChanges') }}
            </button>
          </div>
        </form>
      </div>

      <!-- API Tokens Section -->
      <div class="mt-6 bg-white shadow rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <ProfileTokenManagement />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

interface UserData {
  id: number;
  username: string;
  email: string;
}

const formData = ref({
  username: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const error = ref('');
const success = ref('');
const loading = ref(false);
const originalData = ref<UserData | null>(null);

const fetchUser = inject<() => Promise<void>>('fetchUser');

onMounted(async () => {
  await loadUserData();
});

async function loadUserData() {
  try {
    const response = await $fetch('/api/users/me') as any;
    const user = response.user;
    
    originalData.value = user;
    formData.value.username = user.username;
    formData.value.email = user.email;
  } catch (err) {
    error.value = 'Failed to load user data';
    await navigateTo('/users/login');
  }
}

async function handleUpdate() {
  error.value = '';
  success.value = '';
  loading.value = true;

  try {
    // Validate password fields if changing password
    if (formData.value.newPassword || formData.value.currentPassword || formData.value.confirmPassword) {
      if (!formData.value.currentPassword) {
        error.value = 'Current password is required to change password';
        loading.value = false;
        return;
      }

      if (formData.value.newPassword !== formData.value.confirmPassword) {
        error.value = 'New passwords do not match';
        loading.value = false;
        return;
      }

      if (formData.value.newPassword && formData.value.newPassword.length < 8) {
        error.value = 'New password must be at least 8 characters';
        loading.value = false;
        return;
      }
    }

    // Build update payload (only include changed fields)
    const updates: any = {};
    
    if (formData.value.username !== originalData.value?.username) {
      updates.username = formData.value.username;
    }
    
    if (formData.value.email !== originalData.value?.email) {
      updates.email = formData.value.email;
    }
    
    if (formData.value.newPassword) {
      updates.currentPassword = formData.value.currentPassword;
      updates.newPassword = formData.value.newPassword;
    }

    // Check if anything changed
    if (Object.keys(updates).length === 0 || (Object.keys(updates).length === 1 && updates.currentPassword)) {
      error.value = 'No changes to save';
      loading.value = false;
      return;
    }

    const response = await $fetch('/api/users/profile', {
      method: 'PATCH',
      body: updates,
    }) as any;

    if (response.success) {
      success.value = 'Profile updated successfully!';
      
      // Update original data
      originalData.value = response.user;
      formData.value.username = response.user.username;
      formData.value.email = response.user.email;
      
      // Clear password fields
      formData.value.currentPassword = '';
      formData.value.newPassword = '';
      formData.value.confirmPassword = '';
      
      // Refresh user data in layout
      if (fetchUser) {
        await fetchUser();
      }
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to update profile';
  } finally {
    loading.value = false;
  }
}
</script>
