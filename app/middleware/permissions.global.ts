/**
 * Global navigation middleware for permission-based page protection
 * Maps routes to required capability keys
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip permission check for public routes
  const publicRoutes = [
    '/',
    '/users/login',
    '/users/register',
    '/users/profile',
    '/forbidden',
  ];

  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Map routes to required permissions (capability keys)
  // Can be a single permission (string) or multiple permissions (string[] - OR logic)
  const routePermissions: Record<string, string | string[]> = {
    '/users/admin': 'admin.manage',
    '/permissions': 'permissions.list',
    // Add more route mappings here as you create new features
    // '/reports': 'reports.view',
    // '/dashboard': ['reports.view', 'analytics.view'], // Access with ANY permission
  };

  // Check if this route requires a permission
  const requiredPermission = routePermissions[to.path];
  
  // If route doesn't require any permission, allow access
  if (!requiredPermission) {
    return;
  }

  // Route requires permission - user must be authenticated
  // Only run on client-side to avoid SSR issues with cookies
  if (process.server) {
    return;
  }

  // Get user permissions
  const { hasPermission, hasAnyPermission, loadPermissions, permissionsLoaded } = useUserGroups();

  // Load permissions if not already loaded
  if (!permissionsLoaded.value) {
    try {
      await loadPermissions();
    } catch (error) {
      // If loading fails, redirect to login
      return navigateTo('/users/login');
    }
  }

  // If still not loaded after attempt, user is not authenticated
  if (!permissionsLoaded.value) {
    return navigateTo('/users/login');
  }
  
  // Route requires permission - check if user has it
  // Handle array of permissions (OR logic - user needs ANY permission)
  if (Array.isArray(requiredPermission)) {
    if (!hasAnyPermission(requiredPermission)) {
      return navigateTo('/forbidden');
    }
  } else {
    // Handle single permission
    if (!hasPermission(requiredPermission)) {
      return navigateTo('/forbidden');
    }
  }
});
