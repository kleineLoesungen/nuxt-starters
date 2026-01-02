<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-600">{{ $t('admin.permissions.loading') }}</p>
    </div>

    <div v-else>
      <!-- Group Selection -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('admin.permissions.selectGroup') }}</label>
        <select
          v-model="selectedGroupId"
          @change="loadGroupPermissions"
          class="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option :value="null">{{ $t('admin.permissions.selectGroupPlaceholder') }}</option>
          <option v-for="group in groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </div>

      <!-- Permissions List -->
      <div v-if="selectedGroupId" class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            {{ $t('admin.permissions.permissionsFor', { name: selectedGroup?.name }) }}
          </h3>
          <button
            @click="showAddModal = true"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            {{ $t('admin.permissions.addPermission') }}
          </button>
        </div>
        
        <div class="border-t border-gray-200">
          <ul v-if="permissions.length > 0" class="divide-y divide-gray-200">
            <li v-for="perm in permissions" :key="perm.id" class="px-4 py-4 sm:px-6 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center">
                  <span class="text-sm font-medium text-gray-900 font-mono mr-3">
                    {{ perm.permissionKey }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ getPermissionDescription(perm.permissionKey) }}
                  </span>
                  <span v-if="isProtectedPermission(perm.permissionKey)" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {{ $t('admin.permissions.required') }}
                  </span>
                </div>
                <div v-if="getPermissionIncludes(perm.permissionKey).length > 0" class="mt-1 text-xs text-gray-500">
                  {{ $t('admin.permissions.includes', { list: getPermissionIncludes(perm.permissionKey).join(', ') }) }}
                </div>
              </div>
              <button
                v-if="!isProtectedPermission(perm.permissionKey)"
                @click="removePermission(perm.id)"
                class="text-red-600 hover:text-red-900 text-sm"
              >
                {{ $t('admin.permissions.remove') }}
              </button>
              <span v-else class="text-gray-400 text-sm cursor-not-allowed" :title="$t('admin.permissions.protectedTooltip')">
                {{ $t('admin.permissions.protected') }}
              </span>
            </li>
          </ul>
          <div v-else class="px-4 py-8 text-center text-gray-500">
            {{ $t('admin.permissions.noPermissions') }}
          </div>
        </div>
      </div>

      <!-- Registered Permissions Reference -->
      <div v-if="registeredPermissions.length > 0" class="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('admin.permissions.availablePermissions') }}</h3>
        <p class="text-sm text-gray-600 mb-4">
          {{ $t('admin.permissions.availablePermissionsDesc') }}
        </p>
        <div class="space-y-3">
          <div v-for="perm in registeredPermissions" :key="perm.key" class="bg-white rounded-md p-4 border border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center">
                  <code class="text-sm font-semibold text-blue-600">{{ perm.key }}</code>
                  <span v-if="perm.defaultAdmin" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    Auto-Admin
                  </span>
                </div>
                <p class="mt-1 text-sm text-gray-600">{{ perm.description }}</p>
                <ul v-if="perm.includesAccess && perm.includesAccess.length > 0" class="mt-2 space-y-1">
                  <li v-for="access in perm.includesAccess" :key="access" class="text-xs text-gray-500 font-mono">
                    • {{ access }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Permission Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="closeAddModal"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ $t('admin.permissions.addPermissionTitle') }}</h3>
        
        <form @submit.prevent="addPermission" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('admin.permissions.selectPermission') }}</label>
            <select
              v-model="newPermission.permissionKey"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{{ $t('admin.permissions.choosePermission') }}</option>
              <option v-for="perm in availablePermissions" :key="perm.key" :value="perm.key">
                {{ perm.key }} - {{ perm.description }}
              </option>
            </select>
            <p v-if="selectedPermissionDetails" class="mt-2 text-xs text-gray-600 p-2 bg-gray-50 rounded">
              {{ selectedPermissionDetails.description }}
            </p>
          </div>
          
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeAddModal"
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="adding || !newPermission.permissionKey"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ adding ? $t('admin.permissions.adding') : $t('common.add') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Group {
  id: number;
  name: string;
  description: string;
}

interface Permission {
  id: number;
  groupId: number;
  permissionKey: string;
}

interface RegisteredPermission {
  key: string;
  description: string;
  includesAccess?: string[];
  defaultAdmin: boolean;
}

const emit = defineEmits<{
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>();

const loading = ref(false);
const groups = ref<Group[]>([]);
const selectedGroupId = ref<number | null>(null);
const permissions = ref<Permission[]>([]);
const registeredPermissions = ref<RegisteredPermission[]>([]);
const showAddModal = ref(false);
const adding = ref(false);
const newPermission = ref({
  permissionKey: '',
});

const selectedGroup = computed(() => 
  groups.value.find(g => g.id === selectedGroupId.value)
);

const availablePermissions = computed(() => {
  // Filter out permissions that are already assigned to the selected group
  const assignedKeys = permissions.value.map(p => p.permissionKey);
  return registeredPermissions.value.filter(p => !assignedKeys.includes(p.key));
});

const selectedPermissionDetails = computed(() => {
  if (!newPermission.value.permissionKey) return null;
  return registeredPermissions.value.find(p => p.key === newPermission.value.permissionKey);
});

function getPermissionDescription(key: string): string {
  const perm = registeredPermissions.value.find(p => p.key === key);
  return perm ? perm.description : '';
}

function getPermissionIncludes(key: string): string[] {
  const perm = registeredPermissions.value.find(p => p.key === key);
  return perm?.includesAccess || [];
}

function isProtectedPermission(permissionKey: string): boolean {
  // Protect admin.manage in Admins group
  return selectedGroup.value?.name === 'Admins' && permissionKey === 'admin.manage';
}

onMounted(async () => {
  await loadGroups();
  await loadRegisteredPermissions();
});

async function loadRegisteredPermissions() {
  try {
    const response = await $fetch('/api/permissions/registered') as any;
    registeredPermissions.value = response.permissions;
  } catch (err) {
    console.error('Failed to load registered permissions');
  }
}

async function loadGroups() {
  loading.value = true;
  try {
    const response = await $fetch('/api/groups/list') as any;
    groups.value = response.groups;
  } catch (err: any) {
    emit('error', 'Failed to load groups');
  } finally {
    loading.value = false;
  }
}

async function loadGroupPermissions() {
  if (!selectedGroupId.value) return;
  
  try {
    const response = await $fetch(`/api/permissions/group/${selectedGroupId.value}`) as any;
    permissions.value = response.permissions;
  } catch (err: any) {
    emit('error', 'Failed to load permissions');
  }
}

async function addPermission() {
  if (!selectedGroupId.value || !newPermission.value.permissionKey) return;
  
  adding.value = true;
  try {
    await $fetch('/api/permissions/add', {
      method: 'POST',
      body: {
        groupId: selectedGroupId.value,
        permissionKey: newPermission.value.permissionKey,
      },
    });
    
    emit('success', 'Permission added successfully');
    closeAddModal();
    await loadGroupPermissions();
    
    // Reload user permissions to reflect changes
    const { loadPermissions } = useUserGroups();
    await loadPermissions();
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to add permission');
  } finally {
    adding.value = false;
  }
}

async function removePermission(permissionId: number) {
  if (!confirm('Are you sure you want to remove this permission?')) return;
  
  try {
    await $fetch('/api/permissions/remove', {
      method: 'POST',
      body: { permissionId },
    });
    
    emit('success', 'Permission removed successfully');
    await loadGroupPermissions();
    
    // Reload user permissions to reflect changes
    const { loadPermissions } = useUserGroups();
    await loadPermissions();
  } catch (err: any) {
    emit('error', 'Failed to remove permission');
  }
}

function closeAddModal() {
  showAddModal.value = false;
  newPermission.value = {
    permissionKey: '',
  };
}
</script>
