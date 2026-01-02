<template>
  <div>
    <div class="mb-4 sm:mb-6 flex items-center justify-between">
      <div class="flex-1 max-w-md">
        <div class="relative" @click.stop>
          <input
            v-model="userFilterQuery"
            @input="showUserDropdown = true"
            @focus="showUserDropdown = true"
            @click="showUserDropdown = true"
            type="text"
            :placeholder="$t('admin.groups.searchUsers')"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div
            v-show="showUserDropdown && filteredUsersForFilter.length > 0"
            class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          >
            <button
              v-if="selectedUserFilter"
              @click="clearUserFilter"
              type="button"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span class="font-medium">{{ $t('admin.groups.clearFilter') }}</span>
            </button>
            <button
              v-for="user in filteredUsersForFilter"
              :key="user.id"
              @click="selectUserFilter(user)"
              type="button"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <div class="font-medium">{{ user.username }}</div>
              <div class="text-xs text-gray-500">{{ user.email || $t('admin.users.noEmail') }}</div>
            </button>
          </div>
        </div>
      </div>
      <button
        @click="openCreateGroupModal"
        class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {{ $t('admin.groups.createGroup') }}
      </button>
    </div>

    <div v-if="loadingGroups" class="text-center py-12">
      <p class="text-gray-600">{{ $t('admin.groups.loading') }}</p>
    </div>

    <div v-else-if="filteredGroups.length === 0" class="text-center py-12">
      <p class="text-gray-600">
        {{ selectedUserFilter ? $t('admin.groups.noGroupsForUser', { username: selectedUserFilter.username }) : $t('admin.groups.noGroups') }}
      </p>
    </div>

    <div v-else>
      <!-- Public Groups Section -->
      <div v-if="publicGroups.length > 0" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('admin.groups.publicGroups') }}</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="group in publicGroups"
            :key="group.id"
            class="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ group.name }}
                  <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {{ $t('admin.groups.public') }}
                  </span>
                </h3>
                <p v-if="group.description" class="text-sm text-gray-500 mt-1">{{ group.description }}</p>
              </div>
              <div class="flex gap-1 ml-2">
                <button
                  @click="openEditGroupModal(group)"
                  class="text-blue-600 hover:text-blue-900 p-1"
                  :title="$t('common.edit')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeleteGroup(group)"
                  class="text-red-600 hover:text-red-900 p-1"
                  :title="$t('common.delete')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <span class="text-sm text-gray-500">
                {{ group.memberCount }} {{ group.memberCount === 1 ? $t('admin.groups.member') : $t('admin.groups.members') }}
              </span>
              <button
                @click="openManageMembersModal(group)"
                class="text-sm text-blue-600 hover:text-blue-900"
              >
                {{ $t('admin.groups.manageMembers') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Permission Groups Section -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ $t('admin.groups.permissionGroups') }}</h2>
        <div v-if="permissionGroups.length === 0" class="text-center py-8 text-gray-500">
          {{ $t('admin.groups.noPermissionGroups') }}
        </div>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="group in permissionGroups"
            :key="group.id"
            class="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900">
                  {{ group.name }}
                  <span v-if="group.name === 'Admins'" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    {{ $t('admin.groups.system') }}
                  </span>
                </h3>
                <p v-if="group.description" class="text-sm text-gray-500 mt-1">{{ group.description }}</p>
              </div>
              <div v-if="group.name !== 'Admins'" class="flex gap-1 ml-2">
                <button
                  @click="openEditGroupModal(group)"
                  class="text-blue-600 hover:text-blue-900 p-1"
                  :title="$t('common.edit')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="confirmDeleteGroup(group)"
                  class="text-red-600 hover:text-red-900 p-1"
                  :title="$t('common.delete')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <span class="text-sm text-gray-500">
                {{ group.memberCount }} {{ group.memberCount === 1 ? $t('admin.groups.member') : $t('admin.groups.members') }}
              </span>
              <button
                @click="openManageMembersModal(group)"
                class="text-sm text-blue-600 hover:text-blue-900"
              >
                {{ $t('admin.groups.manageMembers') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Group Modal -->
    <div
      v-if="showGroupModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="closeGroupModal"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            {{ editingGroup ? $t('admin.groups.editGroup') : $t('admin.groups.createGroupTitle') }}
          </h3>
          
          <div v-if="groupModalError" class="mb-4 rounded-md bg-red-50 p-3">
            <p class="text-sm text-red-800">{{ groupModalError }}</p>
          </div>
          
          <form @submit.prevent="saveGroup" class="space-y-4">
            <div>
              <label for="group-name" class="block text-sm font-medium text-gray-700">{{ $t('admin.groups.groupName') }}</label>
              <input
                id="group-name"
                v-model="groupForm.name"
                type="text"
                required
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :placeholder="$t('admin.groups.groupNamePlaceholder')"
              />
            </div>
            
            <div>
              <label for="group-description" class="block text-sm font-medium text-gray-700">{{ $t('admin.groups.description') }}</label>
              <textarea
                id="group-description"
                v-model="groupForm.description"
                rows="3"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                :placeholder="$t('admin.groups.descriptionPlaceholder')"
              />
            </div>

            <div v-if="!(editingGroup?.name === 'Admins')">
              <div class="flex items-center justify-between">
                <div>
                  <label class="block text-sm font-medium text-gray-700">{{ $t('admin.groups.groupType') }}</label>
                  <p class="text-xs text-gray-500 mt-1">{{ $t('admin.groups.groupTypeHelp') }}</p>
                </div>
                <button
                  type="button"
                  @click="groupForm.isPublic = !groupForm.isPublic"
                  :class="[
                    groupForm.isPublic ? 'bg-green-600' : 'bg-gray-200',
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  ]"
                >
                  <span
                    :class="[
                      groupForm.isPublic ? 'translate-x-5' : 'translate-x-0',
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                    ]"
                  />
                </button>
              </div>
              <div class="mt-2 text-sm">
                <span v-if="groupForm.isPublic" class="text-green-700 font-medium">{{ $t('admin.groups.publicGroupLabel') }}</span>
                <span v-else class="text-gray-700 font-medium">{{ $t('admin.groups.permissionGroupLabel') }}</span>
              </div>
            </div>
            
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="closeGroupModal"
                class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
              >
                {{ $t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="savingGroup"
                class="flex-1 px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {{ savingGroup ? $t('common.saving') : $t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Manage Members Modal -->
    <div
      v-if="showMembersModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="closeMembersModal"
    >
      <div class="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3">
          <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
            {{ $t('admin.groups.manageMembersTitle', { name: selectedGroup?.name }) }}
          </h3>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ $t('common.search') }}</label>
            <input
              v-model="userSearchQuery"
              type="text"
              :placeholder="$t('admin.groups.searchByNameOrEmail')"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div v-if="loadingMembers" class="text-center py-8">
            <p class="text-gray-600">{{ $t('admin.groups.loadingMembers') }}</p>
          </div>

          <div v-else class="max-h-96 overflow-y-auto">
            <ul class="divide-y divide-gray-200">
              <li
                v-for="user in filteredAndSortedUsers"
                :key="user.id"
                class="py-3 flex items-center justify-between"
              >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ user.username }}
                    <span v-if="isGroupMember(user.id)" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Member
                    </span>
                  </p>
                  <p class="text-sm text-gray-500">{{ user.email || '(no email)' }}</p>
                </div>
                <button
                  v-if="isGroupMember(user.id)"
                  @click="removeMemberFromGroup(user.id)"
                  class="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-900 border border-red-300 rounded hover:bg-red-50"
                >
                  Remove
                </button>
                <button
                  v-else
                  @click="addMemberToGroup(user.id)"
                  :disabled="addingMember"
                  class="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                  Add
                </button>
              </li>
            </ul>
          </div>

          <div class="mt-4 flex justify-end">
            <button
              @click="closeMembersModal"
              class="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Group Confirmation Modal -->
    <div
      v-if="deleteGroupTarget"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
      @click="cancelDeleteGroup"
    >
      <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white" @click.stop>
        <div class="mt-3 text-center">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Delete Group</h3>
          <div class="mt-2 px-4 sm:px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete the group <strong>{{ deleteGroupTarget.name }}</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div class="flex gap-3 sm:gap-4 px-4 py-3">
            <button
              @click="cancelDeleteGroup"
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              @click="deleteGroup"
              :disabled="deletingGroup"
              class="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {{ deletingGroup ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Group {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const props = defineProps<{
  users: User[]
}>();

const emit = defineEmits<{
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>();

const groups = ref<Group[]>([]);
const loadingGroups = ref(false);
const showGroupModal = ref(false);
const editingGroup = ref<Group | null>(null);
const groupForm = ref({ name: '', description: '', isPublic: false });
const savingGroup = ref(false);
const groupModalError = ref('');
const deleteGroupTarget = ref<Group | null>(null);
const deletingGroup = ref(false);
const showMembersModal = ref(false);
const selectedGroup = ref<Group | null>(null);
const groupMembers = ref<User[]>([]);
const loadingMembers = ref(false);
const userSearchQuery = ref('');
const addingMember = ref(false);
const userFilterQuery = ref('');
const selectedUserFilter = ref<User | null>(null);
const showUserDropdown = ref(false);
const groupUserMemberships = ref<Map<number, number[]>>(new Map());

onMounted(async () => {
  await fetchGroups();
  await fetchAllGroupMemberships();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

async function fetchGroups() {
  loadingGroups.value = true;
  try {
    const response = await $fetch('/api/groups/list') as any;
    groups.value = response.groups;
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to load groups');
  } finally {
    loadingGroups.value = false;
  }
}

async function fetchAllGroupMemberships() {
  try {
    const memberships = new Map<number, number[]>();
    for (const group of groups.value) {
      const response = await $fetch(`/api/groups/members?groupId=${group.id}`) as any;
      memberships.set(group.id, response.members.map((m: User) => m.id));
    }
    groupUserMemberships.value = memberships;
  } catch (err: any) {
    // Silently fail, filter won't work but groups will still display
  }
}

const filteredUsersForFilter = computed(() => {
  const query = userFilterQuery.value.toLowerCase().trim();
  if (!query) return props.users.slice(0, 10); // Show first 10 users when empty
  
  return props.users.filter(user => 
    user.username.toLowerCase().includes(query) ||
    (user.email && user.email.toLowerCase().includes(query))
  ).slice(0, 10); // Limit to 10 results
});

const filteredGroups = computed(() => {
  if (!selectedUserFilter.value) return groups.value;
  
  const userId = selectedUserFilter.value.id;
  return groups.value.filter(group => {
    const members = groupUserMemberships.value.get(group.id) || [];
    return members.includes(userId);
  });
});

const publicGroups = computed(() => {
  return filteredGroups.value.filter(g => g.isPublic);
});

const permissionGroups = computed(() => {
  return filteredGroups.value.filter(g => !g.isPublic);
});

function handleClickOutside(event: MouseEvent) {
  // Close dropdown when clicking outside
  showUserDropdown.value = false;
}

function selectUserFilter(user: User) {
  selectedUserFilter.value = user;
  userFilterQuery.value = user.username;
  showUserDropdown.value = false;
}

function clearUserFilter() {
  selectedUserFilter.value = null;
  userFilterQuery.value = '';
  showUserDropdown.value = false;
}

function handleUserDropdownBlur() {
  setTimeout(() => {
    showUserDropdown.value = false;
    // Restore display text if a user was selected
    if (selectedUserFilter.value) {
      userFilterQuery.value = selectedUserFilter.value.username;
    }
  }, 200);
}

function openCreateGroupModal() {
  editingGroup.value = null;
  groupForm.value = { name: '', description: '', isPublic: false };
  groupModalError.value = '';
  showGroupModal.value = true;
}

function openEditGroupModal(group: Group) {
  editingGroup.value = group;
  groupForm.value = { name: group.name, description: group.description, isPublic: group.isPublic };
  groupModalError.value = '';
  showGroupModal.value = true;
}

function closeGroupModal() {
  showGroupModal.value = false;
  editingGroup.value = null;
  groupForm.value = { name: '', description: '', isPublic: false };
  groupModalError.value = '';
}

async function saveGroup() {
  savingGroup.value = true;
  groupModalError.value = '';

  try {
    if (editingGroup.value) {
      const response = await $fetch('/api/groups/update', {
        method: 'PATCH',
        body: {
          groupId: editingGroup.value.id,
          name: groupForm.value.name,
          description: groupForm.value.description,
          isPublic: groupForm.value.isPublic,
        },
      }) as any;

      if (response.success) {
        emit('success', 'Group updated successfully');
        closeGroupModal();
        await fetchGroups();
      }
    } else {
      const response = await $fetch('/api/groups/create', {
        method: 'POST',
        body: {
          name: groupForm.value.name,
          description: groupForm.value.description,
          isPublic: groupForm.value.isPublic,
        },
      }) as any;

      if (response.success) {
        emit('success', 'Group created successfully');
        closeGroupModal();
        await fetchGroups();
      }
    }
  } catch (err: any) {
    groupModalError.value = err.data?.message || err.message || 'Failed to save group';
  } finally {
    savingGroup.value = false;
  }
}

function confirmDeleteGroup(group: Group) {
  deleteGroupTarget.value = group;
}

function cancelDeleteGroup() {
  deleteGroupTarget.value = null;
}

async function deleteGroup() {
  if (!deleteGroupTarget.value) return;

  deletingGroup.value = true;

  try {
    const response = await $fetch('/api/groups/delete', {
      method: 'POST',
      body: {
        groupId: deleteGroupTarget.value.id,
      },
    }) as any;

    if (response.success) {
      emit('success', 'Group deleted successfully');
      deleteGroupTarget.value = null;
      await fetchGroups();
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to delete group');
  } finally {
    deletingGroup.value = false;
  }
}

async function openManageMembersModal(group: Group) {
  selectedGroup.value = group;
  userSearchQuery.value = '';
  showMembersModal.value = true;
  await fetchGroupMembers(group.id);
}

function closeMembersModal() {
  showMembersModal.value = false;
  selectedGroup.value = null;
  groupMembers.value = [];
  userSearchQuery.value = '';
}

async function fetchGroupMembers(groupId: number) {
  loadingMembers.value = true;
  try {
    const response = await $fetch(`/api/groups/members?groupId=${groupId}`) as any;
    groupMembers.value = response.members;
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to load group members');
  } finally {
    loadingMembers.value = false;
  }
}

function isGroupMember(userId: number): boolean {
  return groupMembers.value.some(m => m.id === userId);
}

const filteredAndSortedUsers = computed(() => {
  const query = userSearchQuery.value.toLowerCase().trim();
  
  // Filter users based on search query
  const filtered = props.users.filter(user => {
    if (!query) return true;
    return user.username.toLowerCase().includes(query) ||
           (user.email && user.email.toLowerCase().includes(query));
  });
  
  // Sort: members first, then non-members
  return filtered.sort((a, b) => {
    const aIsMember = isGroupMember(a.id);
    const bIsMember = isGroupMember(b.id);
    
    if (aIsMember && !bIsMember) return -1;
    if (!aIsMember && bIsMember) return 1;
    return a.username.localeCompare(b.username);
  });
});

async function addMemberToGroup(userId: number) {
  if (!selectedGroup.value) return;

  addingMember.value = true;
  try {
    const response = await $fetch('/api/groups/add-member', {
      method: 'POST',
      body: {
        groupId: selectedGroup.value.id,
        userId: userId,
      },
    }) as any;

    if (response.success) {
      emit('success', 'User added to group successfully');
      await fetchGroupMembers(selectedGroup.value.id);
      await fetchGroups();
      await fetchAllGroupMemberships();
      
      // Reload user permissions to reflect changes
      const { loadPermissions } = useUserGroups();
      await loadPermissions();
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to add user to group');
  } finally {
    addingMember.value = false;
  }
}

async function removeMemberFromGroup(userId: number) {
  if (!selectedGroup.value) return;

  try {
    const response = await $fetch('/api/groups/remove-member', {
      method: 'POST',
      body: {
        groupId: selectedGroup.value.id,
        userId,
      },
    }) as any;

    if (response.success) {
      emit('success', 'User removed from group successfully');
      await fetchGroupMembers(selectedGroup.value.id);
      await fetchGroups();
      await fetchAllGroupMemberships();
      
      // Reload user permissions to reflect changes
      const { loadPermissions } = useUserGroups();
      await loadPermissions();
    }
  } catch (err: any) {
    emit('error', err.data?.message || 'Failed to remove user from group');
  }
}
</script>
