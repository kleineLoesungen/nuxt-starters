<!-- components/authForm.vue -->

<script setup lang="ts">
const props = defineProps({
  handleSubmit: {
    type: Function,
    required: true,
  },
  submitType: {
    type: String,
    required: true,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <form
    class="space-y-6 w-full max-w-md"
    @submit.prevent="handleSubmit"
  >
    <!-- Error Message -->
    <div 
      v-if="errorMessage" 
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
    >
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        {{ errorMessage }}
      </div>
    </div>

    <div class="space-y-4">
      <!-- Email Input -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <div class="relative">
          <input
            type="email"
            name="email"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Enter your email"
            :disabled="isLoading"
            required
          />
        </div>
      </div>
      
      <!-- Password Input -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <div class="relative">
          <input
            type="password"
            name="password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            placeholder="Enter your password"
            :disabled="isLoading"
            required
          />
        </div>
      </div>
    </div>
    
    <!-- Submit Button -->
    <div class="pt-4">
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
        :aria-label="submitType"
      >
        <!-- Loading Spinner -->
        <svg 
          v-if="isLoading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {{ isLoading ? 'Please wait...' : submitType }}
      </button>
    </div>
  </form>
</template>
