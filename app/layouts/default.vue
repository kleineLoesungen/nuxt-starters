<template>
    <div class="min-h-screen bg-gray-50">
        <header class="sticky top-0 z-50 bg-white shadow">
            <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <NuxtLink to="/" class="text-xl sm:text-2xl font-bold text-blue-600">
                            {{ appName }}
                        </NuxtLink>
                    </div>

                    <!-- Desktop Navigation -->
                    <div class="hidden md:flex items-center space-x-4">
                        <template v-if="user">
                            <NuxtLink v-can="'permissions.list'" to="/permissions"
                                class="flex items-center gap-1.5 text-gray-600 hover:text-green-600 text-sm font-medium transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {{ $t('nav.permissions') }}
                            </NuxtLink>
                            <NuxtLink v-can="'admin.manage'" to="/users/admin"
                                class="flex items-center gap-1.5 text-gray-600 hover:text-purple-600 text-sm font-medium transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {{ $t('nav.admin') }}
                            </NuxtLink>

                            <!-- Account Menu -->
                            <div class="relative">
                                <button @click.stop="accountMenuOpen = !accountMenuOpen"
                                    class="flex items-center justify-center p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </button>
                                
                                <!-- Account Dropdown Menu -->
                                <div v-if="accountMenuOpen"
                                    class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                    <!-- User Info -->
                                    <div class="px-4 py-3 border-b border-gray-200">
                                        <p class="text-sm font-semibold text-gray-900">{{ user.username }}</p>
                                        <span v-can="'admin.manage'"
                                            class="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                                            Admin
                                        </span>
                                    </div>
                                    
                                    <!-- Profile Link -->
                                    <NuxtLink to="/users/profile" @click="accountMenuOpen = false"
                                        class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        {{ $t('nav.profile') || 'Profile' }}
                                    </NuxtLink>
                                    
                                    <!-- Language Switcher in Menu -->
                                    <div class="border-t border-gray-200 mt-1 pt-1">
                                        <div class="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                                            {{ $t('nav.lang') || 'Language' }}
                                        </div>
                                        <button v-for="loc in availableLocales" :key="loc.code"
                                            @click="setLocale(loc.code); accountMenuOpen = false"
                                            class="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            :class="{ 'bg-blue-50 text-blue-600 font-medium': locale === loc.code }">
                                            <span>{{ loc.name }}</span>
                                            <svg v-if="locale === loc.code" class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                    
                                    <!-- Logout Button -->
                                    <div class="border-t border-gray-200 mt-1 pt-1">
                                        <button @click="logout"
                                            class="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            {{ $t('nav.logout') }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <NuxtLink to="/users/login"
                                class="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                {{ $t('nav.login') }}
                            </NuxtLink>
                            <NuxtLink v-if="registrationEnabled" to="/users/register"
                                class="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                {{ $t('nav.register') }}
                            </NuxtLink>
                            
                            <!-- Language Switcher (logged out) -->
                            <div class="relative">
                                <button @click="handleLangClick"
                                    class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                    <span class="uppercase">{{ locale }}</span>
                                </button>
                                <div v-if="showLangMenu && langMenuOpen" @click="langMenuOpen = false"
                                    class="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50">
                                    <button v-for="loc in availableLocales" :key="loc.code"
                                        @click="setLocale(loc.code)"
                                        class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        :class="{ 'bg-blue-50 text-blue-600 font-medium': locale === loc.code }">
                                        {{ loc.name }}
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Mobile Menu Button -->
                    <div class="flex items-center md:hidden">
                        <button @click="mobileMenuOpen = !mobileMenuOpen"
                            class="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            aria-expanded="false">
                            <span class="sr-only">Open main menu</span>
                            <!-- Hamburger icon -->
                            <svg v-if="!mobileMenuOpen" class="block h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <!-- Close icon -->
                            <svg v-else class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu -->
                <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200">
                    <div class="pt-2 pb-3 space-y-1">
                        <template v-if="user">
                            <!-- Navigation Links -->
                            <NuxtLink v-can="'permissions.list'" to="/permissions" @click="mobileMenuOpen = false"
                                class="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {{ $t('nav.permissions') }}
                            </NuxtLink>
                            <NuxtLink v-can="'admin.manage'" to="/users/admin" @click="mobileMenuOpen = false"
                                class="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {{ $t('nav.admin') }}
                            </NuxtLink>

                            <!-- Profile Section -->
                            <div class="border-t border-gray-200 mt-2 pt-2">
                                <!-- User Info Header -->
                                <div class="px-3 py-3 bg-gray-100">
                                    <div class="flex items-center gap-2">
                                        <span class="text-gray-900 text-sm font-semibold">{{ user.username }}</span>
                                        <span v-can="'admin.manage'"
                                            class="ml-auto px-2 py-1 text-xs font-semibold rounded-full bg-purple-600 text-white">
                                            Admin
                                        </span>
                                    </div>
                                </div>

                                <!-- Profile Link -->
                                <NuxtLink to="/users/profile" @click="mobileMenuOpen = false"
                                    class="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {{ $t('nav.profile') || 'Profile' }}
                                </NuxtLink>

                                <!-- Language Switcher -->
                                <div class="px-3 py-2">
                                    <div class="text-xs font-semibold text-gray-500 uppercase mb-2">
                                        {{ $t('nav.lang') || 'Language' }}
                                    </div>
                                    <div class="space-y-1">
                                        <button v-for="loc in availableLocales" :key="loc.code"
                                            @click="setLocale(loc.code)"
                                            class="flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors"
                                            :class="locale === loc.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'">
                                            <span>{{ loc.name }}</span>
                                            <svg v-if="locale === loc.code" class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <!-- Logout Button -->
                                <button @click="logout"
                                    class="flex items-center gap-3 w-full text-left px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors border-t border-gray-200">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    {{ $t('nav.logout') }}
                                </button>
                            </div>
                        </template>
                        <template v-else>
                            <NuxtLink to="/users/login" @click="mobileMenuOpen = false"
                                class="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Login
                            </NuxtLink>
                            <NuxtLink v-if="registrationEnabled" to="/users/register" @click="mobileMenuOpen = false"
                                class="flex items-center gap-3 px-3 py-3 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Register
                            </NuxtLink>
                        </template>
                    </div>
                </div>
            </nav>
        </header>

        <main class="pb-8">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n();
const user = ref<any>(null);
const mobileMenuOpen = ref(false);
const langMenuOpen = ref(false);
const accountMenuOpen = ref(false);
const config = useRuntimeConfig();
const appName = computed(() => config.public.appName);
const registrationEnabled = computed(() => config.public.registrationEnabled);

// Available locales
const availableLocales = computed(() => locales.value);

// Check if we should show menu (more than 2 languages)
const showLangMenu = computed(() => availableLocales.value.length > 2);

// Toggle between languages when only 2 are available
function toggleLanguage() {
    if (availableLocales.value.length === 2) {
        const otherLocale = availableLocales.value.find(loc => loc.code !== locale.value);
        if (otherLocale) {
            setLocale(otherLocale.code);
        }
    }
}

// Handle language button click
function handleLangClick() {
    if (showLangMenu.value) {
        langMenuOpen.value = !langMenuOpen.value;
    } else {
        toggleLanguage();
    }
}

// Close account menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
    if (accountMenuOpen.value) {
        accountMenuOpen.value = false;
    }
};

// Fetch current user on mount
onMounted(async () => {
    await fetchUser();

    // Load permissions if user is logged in
    if (user.value) {
        const { loadPermissions } = useUserGroups();
        await loadPermissions();
    }

    // Add click outside handler
    document.addEventListener('click', handleClickOutside);
});

// Cleanup on unmount
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Close mobile menu on route change
const route = useRoute();
watch(() => route.path, () => {
    mobileMenuOpen.value = false;
});

async function fetchUser() {
    try {
        const response = await $fetch('/api/users/me') as any;
        user.value = response.user;
    } catch (error) {
        // User not logged in
        user.value = null;
    }
}

async function logout() {
    try {
        await $fetch('/api/users/logout', { method: 'POST' });
        user.value = null;
        mobileMenuOpen.value = false;

        // Clear permissions
        const { clearPermissions } = useUserGroups();
        clearPermissions();

        await navigateTo('/users/login');
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Expose fetchUser to child components
provide('fetchUser', fetchUser);
</script>
