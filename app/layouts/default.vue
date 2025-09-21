<!-- layouts/default.vue -->

<script setup lang="ts">
const user = useUserSession();
const isMenuOpen = ref(false);

// Close menu when clicking outside
const closeMenu = () => {
  isMenuOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Modern Navigation Bar -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Brand -->
          <div class="flex items-center">
            <NuxtLink 
              to="/" 
              class="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <!-- optional: Icon -->
              <span>Starter App</span>
            </NuxtLink>
          </div>

          <!-- User Section - Aligned to the right -->
          <div class="flex items-center">
            <!-- Logged in user - Dropdown Menu -->
            <div v-if="user.current.value" class="relative">
              <!-- User Avatar Button -->
              <button
                @click="isMenuOpen = !isMenuOpen"
                class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ user.currentUser.value?.name?.charAt(0).toUpperCase() || user.currentUser.value?.email?.charAt(0).toUpperCase() || user.current.value.providerUid?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ user.currentUser.value?.name || user.currentUser.value?.email || user.current.value.providerUid }}
                </span>
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div 
                v-if="isMenuOpen"
                @click="closeMenu"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
              >
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ user.currentUser.value?.name || user.currentUser.value?.email || user.current.value.providerUid }}
                  </p>
                  <p v-if="user.currentUser.value?.name" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ user.currentUser.value?.email }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Signed in</p>
                </div>
                
                <NuxtLink
                  to="/profile"
                  class="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </NuxtLink>

                <button
                  @click="user.logout()"
                  class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>

              <!-- Backdrop to close menu -->
              <div 
                v-if="isMenuOpen"
                @click="closeMenu"
                class="fixed inset-0 z-40"
              ></div>
            </div>

            <!-- Login Button -->
            <NuxtLink 
              v-else 
              to="/login" 
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
            </svg>
            <span>&copy; 2025 Idea Tracker. Built with Nuxt & Tailwind CSS.</span>
          </div>
          <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">Privacy</a>
            <a href="#" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">Terms</a>
            <a href="#" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200">Support</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
