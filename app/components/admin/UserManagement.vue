<template>
  <div>
    <div class="mb-4 sm:mb-6 flex items-center justify-between gap-4">
      <div class="flex-1 max-w-2xl">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('admin.users.searchPlaceholder')"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        @click="openAddUserModal"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {{ $t('admin.users.addUser') }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-600">{{ $t('admin.users.loading') }}</p>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
      <p class="text-gray-600">
        {{ searchQuery ? $t('admin.users.noResults') : $t('admin.users.noUsers') }}
      </p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-medium text-gray-900">{{ user.username }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ user.email || $t('admin.users.noEmail') }}</p>
          </div>
          <div v-if="!isCurrentUser(user.id)" class="flex gap-1 ml-2">
            <button
              @click="confirmResetPassword(user)"
              class="text-blue-600 hover:text-blue-900 p-1"
              :title="$t('admin.users.resetPassword')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </button>
            <button
              @click="confirmDelete(user)"
              class="text-red-600 hover:text-red-900 p-1"
              :title="$t('common.delete')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div v-else class="ml-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {{ $t('admin.users.you') }}
            </span>
          </div>
        </div>
        
        <div class="space-y-2 mb-3">
          <div class="flex items-center justify-between pt-2">
            <span class="text-sm text-gray-500">{{ $t('admin.users.created') }}</span>
            <span class="text-sm text-gray-900">{{ formatDate(user.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add User Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="closeAddUserModal"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">{{ $t('admin.users.addUserTitle') }}</h3>
          
          <div v-if="modalError" class="mb-4 rounded-md bg-red-50 p-3">
            <p class="text-sm text-red-800">{{ modalError }}</p>
          </div>
          
          <form @submit.prevent="addUser" class="space-y-4">
            <div>
              <label for="new-username" class="block text-sm font-medium text-gray-700">{{ $t('admin.users.newUsername') }}</label>
              <input
                id="new-username"
                v-model="newUser.username"
                type="text"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :placeholder="$t('admin.users.usernamePlaceholder')"
              />
            </div>
            
            <div>
              <label for="new-email" class="block text-sm font-medium text-gray-700">{{ $t('admin.users.newEmail') }}</label>
              <input
                id="new-email"
                v-model="newUser.email"
                type="email"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :placeholder="$t('admin.users.emailPlaceholder')"
              />
              <p class="mt-1 text-xs text-gray-500">{{ $t('auth.register.emailHelp') }}</p>
            </div>
            
            <div>
              <label for="new-password" class="block text-sm font-medium text-gray-700">{{ $t('admin.users.newPassword') }}</label>
              <div class="mt-1 flex gap-2">
                <input
                  id="new-password"
                  v-model="newUser.password"
                  type="text"
                  required
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  :placeholder="$t('admin.users.passwordPlaceholder')"
                />
                <button
                  type="button"
                  @click="generatePassword"
                  class="px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
                >
                  {{ $t('admin.users.generate') }}
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500">{{ $t('auth.register.passwordHelp') }}</p>
            </div>
            
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="closeAddUserModal"
                class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="adding"
                class="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ adding ? 'Adding...' : 'Add User' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="cancelDelete"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3 text-center">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
          <div class="mt-2 px-4 sm:px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete user <strong>{{ deleteTarget.username }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex gap-3 sm:gap-4 px-4 py-3">
            <button
              @click="cancelDelete"
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              @click="deleteUser"
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div
      v-if="resetPasswordTarget"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="cancelResetPassword"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4 text-center">Reset Password</h3>
          
          <div v-if="!generatedPassword" class="text-center">
            <p class="text-sm text-gray-500 mb-4">
              Generate a new password for user <strong>{{ resetPasswordTarget.username }}</strong>?
            </p>
            <div class="flex gap-3 px-4 py-3">
              <button
                @click="cancelResetPassword"
                class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                @click="resetPassword"
                :disabled="resettingPassword"
                class="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ resettingPassword ? 'Generating...' : 'Generate Password' }}
              </button>
            </div>
          </div>

          <div v-else class="text-center">
            <p class="text-sm text-gray-500 mb-4">
              New password for <strong>{{ resetPasswordTarget.username }}</strong>:
            </p>
            <div class="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <p class="text-lg font-mono font-bold text-gray-900 break-all select-all">
                {{ generatedPassword }}
              </p>
            </div>
            <p class="text-xs text-red-600 mb-4">
              ⚠️ Save this password now! It won't be shown again.
            </p>
            <div class="flex gap-3 px-4 py-3">
              <button
                @click="copyPasswordToClipboard"
                class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
              >
                {{ passwordCopied ? 'Copied!' : 'Copy Password' }}
              </button>
              <button
                @click="closeResetPassword"
                class="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface User {
  id: number;
  username: string;
  email: string;

  createdAt: string;
  updatedAt: string;
}

const emit = defineEmits<{
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>();

const users = ref<User[]>([]);
const currentUserId = ref<number | null>(null);
const loading = ref(false);
const deleteTarget = ref<User | null>(null);
const deleting = ref(false);
const showAddModal = ref(false);
const adding = ref(false);
const modalError = ref('');
const searchQuery = ref('');
const newUser = ref({
  username: '',
  email: '',
  password: '',
});
const resetPasswordTarget = ref<User | null>(null);
const resettingPassword = ref(false);
const generatedPassword = ref('');
const passwordCopied = ref(false);

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  
  let filtered = users.value;
  
  // Filter by search query
  if (query) {
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  }
  
  return filtered;
});

onMounted(async () => {
  await fetchUsers();
  await fetchCurrentUser();
});

async function fetchUsers() {
  loading.value = true;
  
  try {
    const response = await $fetch('/api/users/admin/list') as any;
    users.value = response.users;
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to load users');
    
    if (err.statusCode === 403 || err.statusCode === 401) {
      await navigateTo('/');
    }
  } finally {
    loading.value = false;
  }
}

async function fetchCurrentUser() {
  try {
    const response = await $fetch('/api/users/me') as any;
    currentUserId.value = response.user.id;
  } catch (err) {
    await navigateTo('/users/login');
  }
}

function isCurrentUser(userId: number): boolean {
  return userId === currentUserId.value;
}

function openAddUserModal() {
  showAddModal.value = true;
  newUser.value = {
    username: '',
    email: '',
    password: '',
    role: 'member',
  };
  modalError.value = '';
}

function closeAddUserModal() {
  showAddModal.value = false;
  newUser.value = {
    username: '',
    email: '',
    password: '',
    role: 'member',
  };
  modalError.value = '';
}

function generatePassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  newUser.value.password = password;
}

async function addUser() {
  adding.value = true;
  modalError.value = '';

  try {
    const response = await $fetch('/api/users/admin/add', {
      method: 'POST',
      body: {
        username: newUser.value.username,
        email: newUser.value.email || null,
        password: newUser.value.password,

      },
    }) as any;

    if (response.success) {
      emit('success', response.message || 'User added successfully');
      closeAddUserModal();
      await fetchUsers();
    }
  } catch (err: any) {
    modalError.value = err.data?.message || err.message || 'Failed to add user';
  } finally {
    adding.value = false;
  }
}

function confirmResetPassword(user: User) {
  resetPasswordTarget.value = user;
  generatedPassword.value = '';
  passwordCopied.value = false;
}

function cancelResetPassword() {
  resetPasswordTarget.value = null;
  generatedPassword.value = '';
  passwordCopied.value = false;
}

function closeResetPassword() {
  resetPasswordTarget.value = null;
  generatedPassword.value = '';
  passwordCopied.value = false;
}

async function resetPassword() {
  if (!resetPasswordTarget.value) return;

  resettingPassword.value = true;

  try {
    const response = await $fetch('/api/users/admin/reset-password', {
      method: 'POST',
      body: {
        userId: resetPasswordTarget.value.id,
      },
    }) as any;

    if (response.success && response.password) {
      generatedPassword.value = response.password;
      emit('success', `Password reset for user ${resetPasswordTarget.value.username}`);
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to reset password');
    cancelResetPassword();
  } finally {
    resettingPassword.value = false;
  }
}

async function copyPasswordToClipboard() {
  try {
    await navigator.clipboard.writeText(generatedPassword.value);
    passwordCopied.value = true;
    setTimeout(() => {
      passwordCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy password:', err);
  }
}

function confirmDelete(user: User) {
  deleteTarget.value = user;
}

function cancelDelete() {
  deleteTarget.value = null;
}

async function deleteUser() {
  if (!deleteTarget.value) return;

  deleting.value = true;

  try {
    const response = await $fetch('/api/users/admin/delete', {
      method: 'POST',
      body: {
        userId: deleteTarget.value.id,
      },
    }) as any;

    if (response.success) {
      emit('success', response.message || 'User deleted successfully');
      deleteTarget.value = null;
      await fetchUsers();
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to delete user');
  } finally {
    deleting.value = false;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
</script>
