<!-- pages/profile.vue -->

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'

const user = useUserSession();

// Simple loading state - no redirects, just show appropriate content
const isLoading = ref(true);

// Check if session is loaded after mount
onMounted(async () => {
  // Give some time for the session to load
  await new Promise(resolve => setTimeout(resolve, 300));
  isLoading.value = false;
});

// User information reactive data
const userInfo = computed(() => {
  if (!user.currentUser.value) return null;
  
  return {
    name: user.currentUser.value.name || 'No name set',
    email: user.currentUser.value.email || 'No email',
    userId: user.currentUser.value.$id || 'No ID',
    provider: user.current.value?.provider || 'email',
    createdAt: user.currentUser.value.$createdAt ? new Date(user.currentUser.value.$createdAt).toLocaleDateString() : 'Unknown',
    updatedAt: user.currentUser.value.$updatedAt ? new Date(user.currentUser.value.$updatedAt).toLocaleDateString() : 'Unknown',
  };
});

const isEditing = ref(false);
const showDeactivateConfirm = ref(false);
const deactivateError = ref('');
const isDeleting = ref(false);

// Edit form states
const editForm = ref({
  name: '',
  email: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const editError = ref('');
const isUpdating = ref(false);
const successMessage = ref('');
const editMode = ref(''); // 'name', 'email', 'password', or ''

// Initialize edit form when editing starts
const startEdit = (mode: string) => {
  editMode.value = mode;
  editError.value = '';
  successMessage.value = '';
  
  if (mode === 'name') {
    editForm.value.name = userInfo.value?.name || '';
  } else if (mode === 'email') {
    editForm.value.email = userInfo.value?.email || '';
    editForm.value.currentPassword = '';
  } else if (mode === 'password') {
    editForm.value.currentPassword = '';
    editForm.value.newPassword = '';
    editForm.value.confirmPassword = '';
  }
};

const cancelEdit = () => {
  editMode.value = '';
  editError.value = '';
  successMessage.value = '';
  editForm.value = {
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
};

const saveChanges = async () => {
  editError.value = '';
  successMessage.value = '';
  isUpdating.value = true;
  
  try {
    if (editMode.value === 'name') {
      if (!editForm.value.name.trim()) {
        throw new Error('Name cannot be empty');
      }
      await user.updateName(editForm.value.name.trim());
      successMessage.value = 'Name updated successfully!';
    } else if (editMode.value === 'email') {
      if (!editForm.value.email.trim() || !editForm.value.currentPassword) {
        throw new Error('Email and current password are required');
      }
      await user.updateEmail(editForm.value.email.trim(), editForm.value.currentPassword);
      successMessage.value = 'Email updated successfully!';
    } else if (editMode.value === 'password') {
      if (!editForm.value.currentPassword || !editForm.value.newPassword) {
        throw new Error('Current password and new password are required');
      }
      if (editForm.value.newPassword !== editForm.value.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      if (editForm.value.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }
      await user.updatePassword(editForm.value.newPassword, editForm.value.currentPassword);
      successMessage.value = 'Password updated successfully!';
    }
    
    // Success - close edit mode after showing message
    setTimeout(() => {
      cancelEdit();
      successMessage.value = '';
    }, 3000);
  } catch (error: any) {
    console.error('Failed to update profile:', error);
    editError.value = error.message || 'Failed to update profile. Please try again.';
  } finally {
    isUpdating.value = false;
  }
};

const handleDeactivateAccount = () => {
  showDeactivateConfirm.value = true;
  deactivateError.value = ''; // Clear any previous errors
};

const confirmDeactivate = async () => {
  deactivateError.value = '';
  isDeleting.value = true;
  
  try {
    await user.deactivateAccount();
    // User will be redirected automatically by the deactivateAccount function
  } catch (error: any) {
    console.error('Failed to deactivate account:', error);
    deactivateError.value = error.message || 'Failed to deactivate account. Please try again.';
    isDeleting.value = false;
  }
};

const cancelDeactivate = () => {
  showDeactivateConfirm.value = false;
  deactivateError.value = '';
  isDeleting.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>

      <!-- Not Authenticated State -->
      <div v-else-if="!user.current.value" class="flex items-center justify-center min-h-[400px]">
        <div class="text-center max-w-md">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to access your profile.</p>
          <NuxtLink 
            to="/login" 
            class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Go to Login
          </NuxtLink>
        </div>
      </div>

      <!-- Authenticated State - Profile Content -->
      <div v-else>
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
        </div>

      <!-- Profile Card -->
      <div class="bg-white dark:bg-gray-800 shadow-lg rounded-2xl overflow-hidden">
        <!-- Profile Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div class="flex items-center space-x-4">
            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span class="text-3xl font-bold text-white">
                {{ userInfo?.name?.charAt(0).toUpperCase() || userInfo?.email?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">{{ userInfo?.name || userInfo?.email }}</h2>
              <p class="text-blue-100">{{ userInfo?.email }}</p>
              <p class="text-blue-100">Member since {{ userInfo?.createdAt }}</p>
            </div>
          </div>
        </div>

        <!-- Profile Content -->
        <div class="p-6 space-y-6">
          <!-- Account Information -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Account Information</h3>
              <div class="flex space-x-2">
                <template v-if="!editMode">
                  <!-- Individual edit buttons for each field -->
                </template>
                <template v-else>
                  <button
                    @click="saveChanges"
                    :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 focus:outline-none disabled:opacity-50"
                  >
                    <svg v-if="!isUpdating" class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else class="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ isUpdating ? 'Saving...' : 'Save' }}
                  </button>
                  <button
                    @click="cancelEdit"
                    :disabled="isUpdating"
                    class="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 focus:outline-none disabled:opacity-50"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </template>
              </div>
            </div>

            <!-- Edit Error Message -->
            <div 
              v-if="editError" 
              class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
            >
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                {{ editError }}
              </div>
            </div>

            <!-- Success Message -->
            <div 
              v-if="successMessage" 
              class="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm"
            >
              <div class="flex items-center">
                <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ successMessage }}
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <!-- Name Field -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <button
                      v-if="editMode !== 'name' && !editMode"
                      @click="startEdit('name')"
                      class="text-xs text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                      Edit
                    </button>
                  </div>
                  <div v-if="editMode !== 'name'" class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-gray-900 dark:text-white">{{ userInfo?.name }}</span>
                  </div>
                  <input
                    v-else
                    v-model="editForm.name"
                    type="text"
                    :disabled="isUpdating"
                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    placeholder="Enter your full name"
                  />
                </div>

                <!-- Email Field -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <button
                      v-if="editMode !== 'email' && !editMode"
                      @click="startEdit('email')"
                      class="text-xs text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                      Edit
                    </button>
                  </div>
                  <div v-if="editMode !== 'email'" class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-gray-900 dark:text-white">{{ userInfo?.email }}</span>
                  </div>
                  <div v-else class="space-y-3">
                    <input
                      v-model="editForm.email"
                      type="email"
                      :disabled="isUpdating"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="Enter your email address"
                    />
                    <input
                      v-model="editForm.currentPassword"
                      type="password"
                      :disabled="isUpdating"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="Current password (required)"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400">Enter your current password to change email</p>
                  </div>
                </div>

                <!-- Password Field -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <button
                      v-if="editMode !== 'password' && !editMode"
                      @click="startEdit('password')"
                      class="text-xs text-blue-600 hover:text-blue-700 focus:outline-none"
                    >
                      Change
                    </button>
                  </div>
                  <div v-if="editMode !== 'password'" class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-gray-900 dark:text-white">••••••••</span>
                  </div>
                  <div v-else class="space-y-3">
                    <input
                      v-model="editForm.currentPassword"
                      type="password"
                      :disabled="isUpdating"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="Current password"
                    />
                    <input
                      v-model="editForm.newPassword"
                      type="password"
                      :disabled="isUpdating"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="New password (min 8 characters)"
                    />
                    <input
                      v-model="editForm.confirmPassword"
                      type="password"
                      :disabled="isUpdating"
                      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      placeholder="Confirm new password"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400">Password must be at least 8 characters long</p>
                  </div>
                </div>

                <!-- User ID (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User ID</label>
                  <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-gray-900 dark:text-white font-mono text-sm">{{ userInfo?.userId }}</span>
                  </div>
                </div>
              </div>
              <div class="space-y-4">
                <!-- Provider (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider</label>
                  <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-gray-900 dark:text-white capitalize">{{ userInfo?.provider }}</span>
                  </div>
                </div>
                <!-- Last Updated (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Updated</label>
                  <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span class="text-gray-900 dark:text-white">{{ userInfo?.updatedAt }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Actions</h3>
            <div class="flex flex-col sm:flex-row gap-4">
              <button
                @click="user.logout()"
                class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>

              <button
                @click="handleDeactivateAccount"
                class="inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Deactivate Confirmation Modal -->
      <div v-if="showDeactivateConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Deactivate Account</h3>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to deactivate your account? This action cannot be undone and all your data will be permanently removed.
          </p>
          
          <!-- Deactivate Error Message -->
          <div 
            v-if="deactivateError" 
            class="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
          >
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              {{ deactivateError }}
            </div>
          </div>

          <div class="flex justify-end space-x-4">
            <button
              @click="cancelDeactivate"
              :disabled="isDeleting"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="confirmDeactivate"
              :disabled="isDeleting"
              class="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <!-- Loading Spinner -->
              <svg 
                v-if="isDeleting"
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isDeleting ? 'Deactivating...' : 'Deactivate Account' }}
            </button>
          </div>
        </div>
      </div>

      <!-- End of authenticated content -->
      </div>
    </div>
  </div>
</template>