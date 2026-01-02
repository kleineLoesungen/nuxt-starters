<template>
  <div class="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
    <div class="sm:px-0">
      <div class="mb-4 sm:mb-6">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">{{ $t('admin.title') }}</h1>
        <p class="mt-1 sm:mt-2 text-sm text-gray-600">{{ $t('admin.subtitle') }}</p>
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 mb-6">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            @click="activeTab = 'users'"
            :class="[
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ $t('admin.tabs.users') }}
          </button>
          <button
            @click="activeTab = 'groups'"
            :class="[
              activeTab === 'groups'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ $t('admin.tabs.groups') }}
          </button>
          <button
            @click="activeTab = 'permissions'"
            :class="[
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ $t('admin.tabs.permissions') }}
          </button>
          <button
            @click="activeTab = 'settings'"
            :class="[
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ $t('admin.tabs.settings') }}
          </button>
          <button
            @click="activeTab = 'logs'"
            :class="[
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ $t('admin.tabs.logs') }}
          </button>
        </nav>
      </div>

      <div v-if="error" class="mb-4 rounded-md bg-red-50 p-4">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>

      <div v-if="success" class="mb-4 rounded-md bg-green-50 p-4">
        <p class="text-sm text-green-800">{{ success }}</p>
      </div>

      <!-- Tab Content -->
      <AdminUserManagement
        v-show="activeTab === 'users'"
        @success="showSuccess"
        @error="showError"
      />

      <AdminGroupManagement
        v-show="activeTab === 'groups'"
        :users="users"
        @success="showSuccess"
        @error="showError"
      />

      <AdminAppSettings
        v-show="activeTab === 'settings'"
        @success="showSuccess"
        @error="showError"
      />

      <AdminPermissionManagement
        v-show="activeTab === 'permissions'"
        @success="showSuccess"
        @error="showError"
      />

      <AdminLogs
        v-show="activeTab === 'logs'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

interface User {
  id: number;
  username: string;
  email: string;
}

const users = ref<User[]>([]);
const error = ref('');
const success = ref('');
const activeTab = ref('users');

let successTimeout: NodeJS.Timeout | null = null;

onMounted(async () => {
  await fetchUsers();
});

onBeforeUnmount(() => {
  if (successTimeout) {
    clearTimeout(successTimeout);
  }
});

async function fetchUsers() {
  try {
    const data = await $fetch('/api/users/admin/list') as any;
    users.value = data.users;
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load users';
  }
}

function showSuccess(message: string) {
  success.value = message;
  error.value = '';
  
  if (successTimeout) {
    clearTimeout(successTimeout);
  }
  
  successTimeout = setTimeout(() => {
    success.value = '';
    successTimeout = null;
  }, 5000);
}

function showError(message: string) {
  error.value = message;
  success.value = '';
}
</script>
