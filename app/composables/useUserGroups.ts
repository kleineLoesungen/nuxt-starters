/**
 * Client-side composable for group-based permissions and public group management
 * Provides reactive permission checking and public group utilities in Vue components
 */

interface PublicGroup {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
}

export const useUserGroups = () => {
  const permissions = useState<string[]>('userPermissions', () => []);
  const permissionsLoaded = useState<boolean>('permissionsLoaded', () => false);
  const userGroups = useState<PublicGroup[]>('userPublicGroups', () => []);
  const publicGroups = useState<PublicGroup[]>('availablePublicGroups', () => []);

  /**
   * Load user permissions from server
   */
  const loadPermissions = async () => {
    try {
      const response = await $fetch('/api/users/me') as any;
      if (response.user && response.user.permissions) {
        permissions.value = response.user.permissions;
        permissionsLoaded.value = true;
        return true;
      }
      return false;
    } catch (error: any) {
      // If 401, user is not authenticated - this is ok
      if (error?.statusCode === 401 || error?.status === 401) {
        permissions.value = [];
        permissionsLoaded.value = false;
        throw error; // Re-throw to let middleware handle it
      }
      console.error('Failed to load permissions:', error);
      permissions.value = [];
      permissionsLoaded.value = false;
      return false;
    }
  };

  /**
   * Check if user has permission to access a resource
   */
  const hasPermission = (resource: string): boolean => {
    if (!permissionsLoaded.value) {
      return false;
    }
    
    // Check exact match
    if (permissions.value.includes(resource)) {
      return true;
    }

    return false;
  };

  /**
   * Check if user has any of the specified permissions (OR logic)
   */
  const hasAnyPermission = (resources: string[]): boolean => {
    return resources.some(resource => hasPermission(resource));
  };

  /**
   * Check if user has all of the specified permissions (AND logic)
   */
  const hasAllPermissions = (resources: string[]): boolean => {
    return resources.every(resource => hasPermission(resource));
  };

  /**
   * Load all available public groups
   */
  const loadPublicGroups = async () => {
    try {
      const response = await $fetch('/api/groups/list') as any;
      if (response.groups) {
        publicGroups.value = response.groups.filter((g: PublicGroup) => g.isPublic);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load public groups:', error);
      publicGroups.value = [];
      return false;
    }
  };

  /**
   * Load current user's public group memberships
   * Note: This requires the user to be authenticated
   */
  const loadUserGroups = async () => {
    try {
      const response = await $fetch('/api/users/me') as any;
      if (response.user?.groups) {
        userGroups.value = response.user.groups.filter((g: PublicGroup) => g.isPublic);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load user groups:', error);
      userGroups.value = [];
      return false;
    }
  };

  /**
   * Check if user is member of a specific public group
   */
  const isGroupMember = (groupId: number): boolean => {
    return userGroups.value.some(g => g.id === groupId);
  };

  /**
   * Check if user is member of any of the specified groups (OR logic)
   */
  const isAnyGroupMember = (groupIds: number[]): boolean => {
    return groupIds.some(id => isGroupMember(id));
  };

  /**
   * Check if user is member of all specified groups (AND logic)
   */
  const isAllGroupsMember = (groupIds: number[]): boolean => {
    return groupIds.every(id => isGroupMember(id));
  };

  /**
   * Get group by ID from available public groups
   */
  const getPublicGroup = (groupId: number): PublicGroup | undefined => {
    return publicGroups.value.find(g => g.id === groupId);
  };

  /**
   * Clear permissions and groups (on logout)
   */
  const clearPermissions = () => {
    permissions.value = [];
    permissionsLoaded.value = false;
    userGroups.value = [];
    publicGroups.value = [];
  };

  return {
    // Permissions
    permissions: readonly(permissions),
    permissionsLoaded: readonly(permissionsLoaded),
    loadPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Public Groups
    userGroups: readonly(userGroups),
    publicGroups: readonly(publicGroups),
    loadPublicGroups,
    loadUserGroups,
    isGroupMember,
    isAnyGroupMember,
    isAllGroupsMember,
    getPublicGroup,
    
    // Cleanup
    clearPermissions,
  };
};
