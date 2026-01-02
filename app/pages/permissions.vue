<template>
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ $t('permissions.title') }}</h1>
      <p class="text-gray-600">{{ $t('permissions.description') }}</p>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-600">{{ $t('permissions.loading') }}</p>
    </div>

    <div v-else-if="error" class="rounded-md bg-red-50 p-4 mb-6">
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <div v-else>
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">{{ $t('permissions.registeredPermissions') }}</h2>
          <p class="mt-1 text-sm text-gray-500">
            {{ $t('permissions.allCapabilities') }}
          </p>
        </div>
        
        <ul class="divide-y divide-gray-200">
          <li
            v-for="permission in permissions"
            :key="permission.key"
            class="px-4 py-5 sm:px-6"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <code class="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {{ permission.key }}
                  </code>
                  <span
                    v-if="permission.defaultAdmin"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {{ $t('permissions.autoAdmin') }}
                  </span>
                </div>
                
                <p class="text-sm text-gray-700 mb-3">
                  {{ permission.description }}
                </p>
                
                <div v-if="permission.includesAccess && permission.includesAccess.length > 0">
                  <p class="text-xs font-medium text-gray-500 mb-2">{{ $t('permissions.grantsAccess') }}</p>
                  <ul class="space-y-1">
                    <li
                      v-for="access in permission.includesAccess"
                      :key="access"
                      class="text-xs text-gray-600 font-mono flex items-center gap-2"
                    >
                      <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {{ access }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-blue-800 mb-1">{{ $t('permissions.howItWorks') }}</h3>
            <p class="text-sm text-blue-700">
              {{ $t('permissions.explanation') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

interface RegisteredPermission {
  key: string;
  description: string;
  includesAccess?: string[];
  defaultAdmin: boolean;
}

const loading = ref(true);
const error = ref('');
const permissions = ref<RegisteredPermission[]>([]);

onMounted(async () => {
  await loadPermissions();
});

async function loadPermissions() {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await $fetch('/api/permissions/registered') as any;
    permissions.value = response.permissions;
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load permissions';
  } finally {
    loading.value = false;
  }
}
</script>
