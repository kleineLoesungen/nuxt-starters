<!-- pages/login.vue -->

<script setup lang="ts">

// Access user composable functions
const user = useUserSession();

const isSignUp = ref(false);
const errorMessage = ref('');
const isLoading = ref(false);

// Login user event handler
const handleLogin = async (event) => {
  const form = event.target;
  const formData = new FormData(form);
  
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await user.login(formData.get("email"), formData.get("password"));
    form.reset(); // Clear the form
  } catch (error: any) {
    console.error('Login error:', error);
    errorMessage.value = error.message || 'Login failed. Please check your credentials and try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleRegistration = async (event) => {
  const form = event.target;
  const formData = new FormData(form);
  
  errorMessage.value = '';
  isLoading.value = true;

  try {
    await user.register(
      formData.get("email"), 
      formData.get("password"), 
      formData.get("name")
    );
    form.reset(); // Clear the form
  } catch (error: any) {
    console.error('Registration error:', error);
    errorMessage.value = error.message || 'Registration failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Clear error when switching between login/signup
watch(isSignUp, () => {
  errorMessage.value = '';
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full">
      <!-- Card Container -->
      <div class="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 border border-gray-200 dark:border-gray-700">
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {{ isSignUp ? 'Create Account' : 'Welcome Back' }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ isSignUp ? 'Sign up to get started' : 'Sign in to your account' }}
          </p>
        </div>

        <!-- Auth Form -->
        <div class="flex justify-center">
          <AuthForm
            v-if="isSignUp"
            :handle-submit="handleRegistration"
            submit-type="Create Account"
            :error-message="errorMessage"
            :is-loading="isLoading"
            :show-name-field="true"
          />
          <AuthForm
            v-else
            :handle-submit="handleLogin"
            submit-type="Sign In"
            :error-message="errorMessage"
            :is-loading="isLoading"
            :show-name-field="false"
          />
        </div>

        <!-- Toggle Auth Mode -->
        <div class="text-center border-t border-gray-200 dark:border-gray-700 pt-6">
          <button
            v-if="isSignUp"
            @click="isSignUp = false"
            class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
          >
            Already have an account? Sign in
          </button>
          <button 
            v-else 
            @click="isSignUp = true" 
            class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
          >
            Don't have an account? Sign up
          </button>
        </div>

        <!-- Back to Home Link -->
        <div class="text-center">
          <NuxtLink 
            to="/" 
            class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
