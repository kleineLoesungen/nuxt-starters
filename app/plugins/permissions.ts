/**
 * Vue directive for conditional rendering based on permissions
 * Usage: v-can="'admin.manage'" 
 */
export default defineNuxtPlugin((nuxtApp) => {
  // SSR-safe directive registration
  nuxtApp.vueApp.directive('can', {
    getSSRProps(binding) {
      // During SSR, hide by default (will be shown on client if user has permission)
      return {
        style: { display: 'none' }
      };
    },
    mounted(el, binding) {
      const { hasPermission, permissionsLoaded } = useUserGroups();
      const resource = binding.value;

      // Hide by default if permissions not loaded or user doesn't have permission
      if (!permissionsLoaded.value || !hasPermission(resource)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    },
    updated(el, binding) {
      const { hasPermission, permissionsLoaded } = useUserGroups();
      const resource = binding.value;

      // Update visibility when permissions change
      if (!permissionsLoaded.value || !hasPermission(resource)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    },
  });
});
