<template>
  <div class="logs-container">
    <!-- Search Bar -->
    <div class="mb-6">
      <div class="flex gap-4 mb-4">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('admin.logs.searchPlaceholder')"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="fetchLogs"
        />
        <button
          @click="fetchLogs"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {{ $t('admin.logs.search') }}
        </button>
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          {{ $t('common.clear') }}
        </button>
      </div>

      <!-- Activity Filter -->
      <div class="flex gap-2 flex-wrap">
        <button
          @click="setActivityFilter(null)"
          :class="[
            'px-3 py-1 rounded text-sm transition',
            activityFilter === null 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ $t('common.all') }}
        </button>
        <button
          v-for="activity in availableActivities"
          :key="activity"
          @click="setActivityFilter(activity)"
          :class="[
            'px-3 py-1 rounded text-sm transition',
            activityFilter === activity 
              ? getActivityClass(activity) 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          {{ getActivityLabel(activity) }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-600">{{ $t('admin.logs.loading') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- No Logs -->
    <div v-else-if="logs.length === 0" class="text-center py-8">
      <p class="text-gray-600">{{ $t('admin.logs.noLogs') }}</p>
    </div>

    <!-- Logs Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-300 rounded-lg">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              {{ $t('admin.logs.timestamp') }}
            </th>
            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              {{ $t('admin.logs.activity') }}
            </th>
            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              {{ $t('admin.logs.details') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(log, index) in logs"
            :key="index"
            class="border-t border-gray-200 hover:bg-gray-50"
          >
            <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
              {{ formatTimestamp(log.timestamp) }}
            </td>
            <td class="px-4 py-3 text-sm">
              <span
                :class="getActivityClass(log.activity)"
                class="px-2 py-1 rounded text-xs font-semibold"
              >
                {{ getActivityLabel(log.activity) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <div class="p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="mt-6 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          {{ $t('admin.logs.showing', { from: offset + 1, to: Math.min(offset + limit, total), total }) }}
        </div>
        <div class="flex gap-2">
          <button
            @click="previousPage"
            :disabled="offset === 0"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ $t('common.previous') }}
          </button>
          <button
            @click="nextPage"
            :disabled="offset + limit >= total"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ $t('common.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

interface LogEntry {
  timestamp: string;
  level: string;
  activity: string;
  data: any;
}

const logs = ref<LogEntry[]>([]);
const loading = ref(false);
const error = ref('');
const searchQuery = ref('');
const activityFilter = ref<string | null>(null);
const availableActivities = ref<string[]>([]);

// Pagination
const limit = ref(50);
const offset = ref(0);
const total = ref(0);

// Fetch logs from API
const fetchLogs = async () => {
  loading.value = true;
  error.value = '';

  try {
    const params = new URLSearchParams({
      limit: limit.value.toString(),
      offset: offset.value.toString(),
    });

    if (searchQuery.value) {
      params.append('search', searchQuery.value);
    }

    if (activityFilter.value) {
      params.append('search', activityFilter.value);
    }

    const response = await $fetch<{
      success: boolean;
      logs: LogEntry[];
      total: number;
    }>(`/api/logs?${params.toString()}`);

    if (response.success) {
      logs.value = response.logs;
      total.value = response.total;

      // Extract unique activities for filter
      const activities = new Set(response.logs.map(log => log.activity));
      availableActivities.value = Array.from(activities).sort();
    } else {
      error.value = 'Failed to load logs';
    }
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load logs';
    console.error('Error fetching logs:', err);
  } finally {
    loading.value = false;
  }
};

// Clear search and reload
const clearSearch = () => {
  searchQuery.value = '';
  offset.value = 0;
  fetchLogs();
};

// Set activity filter
const setActivityFilter = (activity: string | null) => {
  activityFilter.value = activity;
  offset.value = 0;
  fetchLogs();
};

// Format timestamp for display
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

// Get CSS class based on activity type
const getActivityClass = (activity: string) => {
  if (activity.includes('email')) return 'bg-blue-100 text-blue-800';
  if (activity.includes('user')) return 'bg-green-100 text-green-800';
  if (activity.includes('group')) return 'bg-purple-100 text-purple-800';
  if (activity.includes('permission')) return 'bg-orange-100 text-orange-800';
  if (activity.includes('settings')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

// Get activity label with fallback - computed to react to locale changes
const getActivityLabel = computed(() => (activity: string) => {
  // Replace dots with underscores to match translation keys
  const key = `admin.logs.activities.${activity.replace(/\./g, '_')}`;
  const translated = t(key);
  // If translation doesn't exist, vue-i18n returns the key, so we use the activity as fallback
  return translated === key ? activity.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : translated;
});

// Pagination controls
const nextPage = () => {
  if (offset.value + limit.value < total.value) {
    offset.value += limit.value;
    fetchLogs();
  }
};

const previousPage = () => {
  if (offset.value > 0) {
    offset.value = Math.max(0, offset.value - limit.value);
    fetchLogs();
  }
};

// Load logs on mount
onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.logs-container {
  padding: 1rem;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
