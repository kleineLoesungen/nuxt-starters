<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-lg font-medium">{{ $t('auth.profile.tokens.title') }}</h3>
        <p class="text-sm text-gray-600">{{ $t('auth.profile.tokens.description') }}</p>
      </div>
      <button
        @click="showCreateDialog = true"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {{ $t('auth.profile.tokens.create') }}
      </button>
    </div>

    <!-- Tokens list -->
    <div v-if="tokens.length > 0" class="space-y-2">
      <div
        v-for="token in tokens"
        :key="token.id"
        class="flex items-center justify-between p-4 border rounded-lg"
      >
        <div class="flex-1">
          <div class="font-medium">{{ token.name }}</div>
          <div class="text-sm text-gray-500">
            {{ $t('auth.profile.tokens.created') }}: {{ formatDate(token.created_at) }}
          </div>
          <div v-if="token.last_used_at" class="text-sm text-gray-500">
            {{ $t('auth.profile.tokens.lastUsed') }}: {{ formatDate(token.last_used_at) }}
          </div>
          <div v-else class="text-sm text-gray-400">
            {{ $t('auth.profile.tokens.neverUsed') }}
          </div>
        </div>
        <button
          @click="deleteToken(token.id)"
          class="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
        >
          {{ $t('common.delete') }}
        </button>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      {{ $t('auth.profile.tokens.noTokens') }}
    </div>

    <!-- Create token dialog -->
    <div v-if="showCreateDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium mb-4">{{ $t('auth.profile.tokens.createNew') }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ $t('auth.profile.tokens.tokenName') }}</label>
            <input
              v-model="newTokenName"
              type="text"
              :placeholder="$t('auth.profile.tokens.tokenNamePlaceholder')"
              class="w-full px-3 py-2 border rounded"
              maxlength="100"
            />
          </div>

          <div class="flex gap-2">
            <button
              @click="createToken"
              :disabled="!newTokenName.trim() || creating"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {{ creating ? $t('common.loading') : $t('common.create') }}
            </button>
            <button
              @click="showCreateDialog = false"
              class="px-4 py-2 border rounded hover:bg-gray-50"
            >
              {{ $t('common.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Token created success dialog -->
    <div v-if="createdToken" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium mb-4 text-green-600">{{ $t('auth.profile.tokens.tokenCreated') }}</h3>
        
        <div class="space-y-4">
          <div class="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
            {{ $t('auth.profile.tokens.copyWarning') }}
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t('auth.profile.tokens.yourToken') }}</label>
            <div class="flex gap-2">
              <input
                :value="createdToken"
                type="text"
                readonly
                class="flex-1 px-3 py-2 border rounded bg-gray-50 font-mono text-sm"
              />
              <button
                @click="copyToken"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {{ copied ? $t('common.copied') : $t('common.copy') }}
              </button>
            </div>
          </div>

          <button
            @click="closeSuccessDialog"
            class="w-full px-4 py-2 border rounded hover:bg-gray-50"
          >
            {{ $t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Token {
  id: number;
  name: string;
  last_used_at: string | null;
  created_at: string;
}

const tokens = ref<Token[]>([]);
const showCreateDialog = ref(false);
const newTokenName = ref('');
const creating = ref(false);
const createdToken = ref('');
const copied = ref(false);

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const fetchTokens = async () => {
  try {
    const response = await $fetch<{ success: boolean; tokens: Token[] }>('/api/tokens/list');
    if (response.success) {
      tokens.value = response.tokens || [];
    }
  } catch (error) {
    console.error('Failed to fetch tokens:', error);
    tokens.value = []; // Ensure tokens is always an array
  }
};

const createToken = async () => {
  if (!newTokenName.value.trim()) return;

  creating.value = true;
  try {
    const response = await $fetch<{ success: boolean; token: string }>('/api/tokens/create', {
      method: 'POST',
      body: { name: newTokenName.value.trim() },
    });

    if (response.success) {
      createdToken.value = response.token;
      showCreateDialog.value = false;
      newTokenName.value = '';
      await fetchTokens();
    }
  } catch (error) {
    console.error('Failed to create token:', error);
    alert('Failed to create token');
  } finally {
    creating.value = false;
  }
};

const deleteToken = async (id: number) => {
  if (!confirm('Are you sure you want to delete this token?')) return;

  try {
    await $fetch(`/api/tokens/${id}`, { method: 'DELETE' });
    await fetchTokens();
  } catch (error) {
    console.error('Failed to delete token:', error);
    alert('Failed to delete token');
  }
};

const copyToken = async () => {
  try {
    await navigator.clipboard.writeText(createdToken.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy token:', error);
  }
};

const closeSuccessDialog = () => {
  createdToken.value = '';
  copied.value = false;
};

onMounted(() => {
  fetchTokens();
});
</script>
