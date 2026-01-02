<template>
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <div v-if="savingSettings" class="mb-4 rounded-md bg-blue-50 p-3">
        <p class="text-sm text-blue-800">{{ $t('admin.settings.savingSettings') }}</p>
      </div>

      <div v-if="!emailConfigured" class="mb-6 rounded-md bg-yellow-50 p-3">
        <p class="text-sm text-yellow-800">
          {{ $t('admin.settings.emailNotConfigured') }}
        </p>
      </div>

      <div class="divide-y divide-gray-200">
        <div class="flex items-start justify-between pb-4">
          <div class="flex-1 pr-8">
            <p class="text-sm font-medium text-gray-700">{{ $t('admin.settings.allowRegistration') }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ $t('admin.settings.allowRegistrationDesc') }}</p>
          </div>
          <div class="flex-shrink-0 pt-0.5">
            <button
              @click="toggleSetting('allowRegistration')"
              :disabled="savingSettings"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                settingsForm.allowRegistration ? 'bg-blue-600' : 'bg-gray-200',
                savingSettings ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  settingsForm.allowRegistration ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>

        <div class="flex items-start justify-between py-4">
          <div class="flex-1 pr-8">
            <p class="text-sm font-medium text-gray-700">{{ $t('admin.settings.notifyUserOnRegistration') }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ $t('admin.settings.notifyUserOnRegistrationDesc') }}</p>
            <p v-if="!emailConfigured" class="text-xs text-red-600 mt-1.5">{{ $t('admin.settings.emailNotConfiguredShort') }}</p>
          </div>
          <div class="flex-shrink-0 pt-0.5">
            <button
              @click="toggleSetting('notifyUserOnRegistration')"
              :disabled="savingSettings || !emailConfigured"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                settingsForm.notifyUserOnRegistration && emailConfigured ? 'bg-blue-600' : 'bg-gray-200',
                (savingSettings || !emailConfigured) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  settingsForm.notifyUserOnRegistration ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>

        <div class="flex items-start justify-between py-4">
          <div class="flex-1 pr-8">
            <p class="text-sm font-medium text-gray-700">{{ $t('admin.settings.notifyAdminOnRegistration') }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ $t('admin.settings.notifyAdminOnRegistrationDesc') }}</p>
            <p v-if="!emailConfigured" class="text-xs text-red-600 mt-1.5">{{ $t('admin.settings.emailNotConfiguredShort') }}</p>
          </div>
          <div class="flex-shrink-0 pt-0.5">
            <button
              @click="toggleSetting('notifyAdminOnRegistration')"
              :disabled="savingSettings || !emailConfigured"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                settingsForm.notifyAdminOnRegistration && emailConfigured ? 'bg-blue-600' : 'bg-gray-200',
                (savingSettings || !emailConfigured) ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  settingsForm.notifyAdminOnRegistration ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();

interface Settings {
  allowRegistration: boolean;
  notifyUserOnRegistration: boolean;
  notifyAdminOnRegistration: boolean;
  emailConfigured: boolean;
}

const emit = defineEmits<{
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>();

const settingsForm = ref({
  allowRegistration: true,
  notifyUserOnRegistration: true,
  notifyAdminOnRegistration: true,
});

const emailConfigured = ref(true);
const savingSettings = ref(false);

onMounted(async () => {
  await fetchSettings();
});

async function fetchSettings() {
  try {
    const response = await $fetch('/api/settings') as any;
    if (response.settings) {
      settingsForm.value = {
        allowRegistration: response.settings.registrationEnabled ?? true,
        notifyUserOnRegistration: response.settings.notifyUserCreation ?? true,
        notifyAdminOnRegistration: response.settings.notifyAdminRegistration ?? true,
      };
      emailConfigured.value = response.settings.emailConfigured ?? true;
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to load settings');
  }
}

function toggleSetting(settingName: keyof typeof settingsForm.value) {
  settingsForm.value[settingName] = !settingsForm.value[settingName];
  updateSettings();
}

async function updateSettings() {
  savingSettings.value = true;

  try {
    const response = await $fetch('/api/settings/update', {
      method: 'PATCH',
      body: {
        registrationEnabled: settingsForm.value.allowRegistration,
        notifyUserCreation: settingsForm.value.notifyUserOnRegistration,
        notifyAdminRegistration: settingsForm.value.notifyAdminOnRegistration,
      },
    }) as any;

    if (response.success) {
      emit('success', t('admin.settings.saved'));
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to update settings');
    await fetchSettings();
  } finally {
    savingSettings.value = false;
  }
}
</script>
