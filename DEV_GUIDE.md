# Developer Guide

Complete reference for developing with app.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Permission System](#permission-system)
3. [Database Layer](#database-layer)
4. [Authentication & Sessions](#authentication--sessions)
5. [Email Notifications](#email-notifications)
6. [API Development](#api-development)
7. [Frontend Development](#frontend-development)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Architecture Overview

### Technology Stack

- **Frontend**: Nuxt 4.2.2, Vue 3.5, TypeScript
- **Backend**: Nitro 2.12.9 (server-side Nuxt)
- **Database**: PostgreSQL 16+
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest

### Project Structure

```
/
├── app/                          # Client-side application
│   ├── assets/css/               # Global styles
│   ├── components/               # Vue components
│   │   └── admin/                # Admin-specific components
│   ├── composables/              # Reusable composition functions
│   │   └── useUserGroups.ts      # Permission checking
│   ├── layouts/                  # Page layouts
│   │   └── default.vue           # Main layout with navigation
│   ├── middleware/               # Route middleware
│   │   └── permissions.global.ts # Permission checking for routes
│   ├── pages/                    # File-based routes
│   │   ├── index.vue             # Home page
│   │   ├── permissions.vue       # Permissions list - protected page
│   │   └── users/                # User-related pages
│   └── plugins/                  # Vue plugins
│       └── permissions.ts        # v-can directive
│
├── server/                       # Server-side application
│   ├── api/                      # API endpoints
│   │   ├── users/                # User authentication
│   │   ├── groups/               # Group management
│   │   ├── permissions/          # Permission management
│   │   └── settings/             # App settings
│   ├── composables/              # Server composables
│   │   ├── useDatabase.ts        # Database utilities
│   │   ├── useEmail.ts           # Email sending
│   │   ├── usePermissions.ts     # Permission queries
│   │   └── useUsers.ts           # User queries
│   ├── config/                   # Configuration
│   │   ├── emails.ts             # Email template registry
│   │   └── permissions.ts        # Permission registry
│   ├── database/                 # Database layer
│   │   ├── schema.ts             # Table definitions
│   │   ├── connector-factory.ts  # Database factory
│   │   └── connectors/           # Database connectors
│   │       ├── base.ts           # Base interface
│   │       └── postgres.ts       # PostgreSQL implementation
│   ├── plugins/                  # Server plugins
│   │   └── database.ts           # DB initialization
│   └── utils/                    # Utilities
│       ├── auth.ts               # Password hashing
│       ├── session.ts            # Session management
│       └── sync-permissions.ts   # Permission sync
│
├── test/                         # Test suite
│   ├── server/api/               # API tests
│   └── utils/test-helpers.ts     # Test utilities
│
├── public/                       # Static files
├── .env                          # Environment variables (create from .env.example)
├── docker-compose.yml            # Docker configuration
├── Dockerfile                    # App container definition
├── nuxt.config.ts                # Nuxt configuration
└── vitest.config.ts              # Test configuration
```

---

## Permission System

### Overview

app uses a **capability-based permission system** where:
- Each permission represents a complete feature/capability
- One permission covers all related pages, APIs, and UI sections
- Developers register permissions in code
- Admins assign permissions to groups via UI
- Users inherit permissions from their group memberships

### Architecture

```
Permission Registry (Code)
    ↓
Auto-Sync on Startup
    ↓
Database Tables
    ├── permissions (id, group_id, permission_key)
    ├── groups (id, name, description)
    └── user_groups (user_id, group_id)
    ↓
Session Cache (permissions: string[])
    ↓
Client-Side State (useState)
```

### Registering a Permission

**Location**: `server/config/permissions.ts`

```typescript
export interface RegisteredPermission {
  key: string;                    // Unique identifier (e.g., 'reports.view')
  description: string;            // Human-readable name
  includesAccess?: string[];      // Documentation of what it grants
  requiresAdminByDefault?: boolean; // Auto-assign to Admins group
}

export const PERMISSION_REGISTRY: RegisteredPermission[] = [
  {
    key: 'admin.manage',
    description: 'Manage Page (Admin)',
    includesAccess: [
      'Page: /users/admin',
      'API: /api/users/admin/* (all user management)',
      'API: /api/groups/* (all group management)',
      'API: /api/settings/update (app settings)',
      'API: /api/permissions/* (permission management)',
    ],
    requiresAdminByDefault: true,
  },
  {
    key: 'permissions.list',
    description: 'View permissions list Page',
    includesAccess: [
      'Page: /permissions',
      'Section: Permission list view',
    ],
    requiresAdminByDefault: false,
  },
];
```

### Protecting Server-Side Resources

#### API Endpoints

```typescript
// server/api/reports/list.get.ts
import { requirePermission } from '../../utils/session';

export default defineEventHandler(async (event) => {
  // Check permission - throws 403 if user lacks permission
  await requirePermission(event, 'reports.view');
  
  // Your endpoint logic
  const reports = await dbQuery('SELECT * FROM reports');
  return { reports };
});
```

**What `requirePermission` does**:
1. Extracts session from cookie
2. Loads user permissions from database
3. Checks if permission exists
4. Throws 401 if not authenticated
5. Throws 403 if permission denied
6. Returns user with permissions if successful

#### Multiple Permissions (OR logic)

```typescript
// User needs either permission
const { hasAnyPermission } = await import('../composables/usePermissions');
const user = await getCurrentUserWithPermissions(event);

if (!user || !hasAnyPermission(user.permissions, ['reports.view', 'reports.admin'])) {
  throw createError({ statusCode: 403, message: 'Permission denied' });
}
```

### Protecting Client-Side Resources

#### Route-Level Protection

**Location**: `app/middleware/permissions.global.ts`

**Single Permission (exact match required)**:
```typescript
const routePermissions: Record<string, string | string[]> = {
  '/users/admin': 'admin.manage',  // Requires admin.manage
  '/permissions': 'permissions.list',           // Requires permissions.list
};
```

**Multiple Permissions (OR logic - any permission grants access)**:
```typescript
const routePermissions: Record<string, string | string[]> = {
  '/reports': 'reports.view',                           // Single permission
  '/dashboard': ['reports.view', 'analytics.view'],     // Access with ANY
  '/sensitive': ['admin.manage', 'sensitive.access'],   // Access with ANY
};

// Middleware automatically checks on navigation
// For arrays: redirects to /forbidden if user has NONE of the permissions
// For strings: redirects to /forbidden if user lacks the permission
```

#### Component-Level Protection

**Recommended for Multi-Feature Pages**: Instead of protecting routes, protect individual sections within a page.

**Example: Shared Dashboard Page**

```vue
<!-- app/pages/dashboard.vue -->
<template>
  <div class="max-w-7xl mx-auto py-6 px-4">
    <h1 class="text-3xl font-bold">Dashboard</h1>
    
    <!-- Section 1: Reports (requires reports.view) -->
    <div v-can="'reports.view'" class="mt-6">
      <h2 class="text-xl font-semibold">Reports</h2>
      <ReportsList />
    </div>
    
    <!-- Section 2: Analytics (requires analytics.view) -->
    <div v-can="'analytics.view'" class="mt-6">
      <h2 class="text-xl font-semibold">Analytics</h2>
      <AnalyticsChart />
    </div>
    
    <!-- Section 3: Admin Tools (requires admin.manage) -->
    <div v-can="'admin.manage'" class="mt-6">
      <h2 class="text-xl font-semibold">Admin Tools</h2>
      <AdminQuickActions />
    </div>
    
    <!-- Show message if user has no permissions -->
    <div v-if="!hasAnyDashboardPermissions" class="mt-6 p-4 bg-yellow-50 rounded">
      <p>You don't have access to any dashboard features.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasPermission, hasAnyPermission, hasAllPermissions } = useUserGroups();

// Check if user has any dashboard-related permissions
const hasAnyDashboardPermissions = computed(() => 
  hasAnyPermission(['reports.view', 'analytics.view', 'admin.manage'])
);

// Complex logic examples
const canExportReports = computed(() => 
  hasAllPermissions(['reports.view', 'reports.export'])
);

const isReportAdmin = computed(() => 
  hasPermission('admin.manage') || hasPermission('reports.admin')
);
</script>
```

**Key Benefits**:
- ✅ **No route protection needed** - page is public, sections are protected
- ✅ **Better UX** - users see what they can access, not a "forbidden" error
- ✅ **Flexible** - easy to add more features to the same page
- ✅ **Clear separation** - each feature controls its own visibility

**When to Use Route vs Component Protection**:

| Use Route Protection | Use Component Protection |
|---------------------|-------------------------|
| Entire page needs one permission | Page has multiple sections with different permissions |
| Page is admin-only | Page is public with conditional features |
| Clear single-feature page | Shared/dashboard pages |
| Example: `/users/admin` | Example: `/dashboard` |

**Programmatic Permission Checks**:

```typescript
// Single permission
if (hasPermission('reports.view')) {
  await loadReports();
}

// Any permission (OR logic)
if (hasAnyPermission(['reports.view', 'reports.admin'])) {
  showReportsSection.value = true;
}

// All permissions (AND logic)
if (hasAllPermissions(['reports.view', 'reports.export', 'admin.manage'])) {
  enableAdvancedExport.value = true;
}
```

#### The `v-can` Directive

```typescript
// app/plugins/permissions.ts
// Automatically registered, SSR-safe
// Usage: v-can="'permission.key'"
```

**How it works**:
1. Checks `useUserGroups()` for permission
2. Sets `display: none` if permission denied
3. Shows element if permission granted
4. Reactive - updates when permissions change

### Permission Sync Process

**When**: Every app startup
**Location**: `server/utils/sync-permissions.ts`

```typescript
// Called by server/plugins/database.ts after schema initialization
export async function syncPermissionsToDatabase()
```

**Process**:
1. Read `PERMISSION_REGISTRY` from code
2. For each permission:
   - Check if exists in database for any group
   - If `requiresAdminByDefault: true`, ensure Admins group has it
3. Insert missing permissions
4. Log sync results: "✓ Synced X permissions (Y new)"

**Important**: Permissions are never deleted from database automatically. This is intentional to preserve admin configurations.

### Group Management

#### System Groups

- **Admins**: Protected system group
  - Cannot be deleted
  - Cannot be renamed
  - Always has all `requiresAdminByDefault` permissions
  - `admin.manage` permission is required and protected

#### Creating Groups

```typescript
// server/api/groups/create.post.ts
await requirePermission(event, 'admin.manage');

const { name, description } = await readBody(event);
const group = await dbQueryOne(
  'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
  [name, description]
);
```

#### Assigning Permissions

```typescript
// server/api/permissions/add.post.ts
await requirePermission(event, 'admin.manage');

const { groupId, permissionKey } = await readBody(event);

// Check if permission is registered
const registered = PERMISSION_REGISTRY.find(p => p.key === permissionKey);
if (!registered) {
  throw createError({ statusCode: 400, message: 'Permission not registered' });
}

await dbQuery(
  'INSERT INTO permissions (group_id, permission_key) VALUES ($1, $2)',
  [groupId, permissionKey]
);
```

### Client-Side Permission Loading

**Location**: `app/composables/useUserGroups.ts`

```typescript
// Permissions stored in global state
const permissions = useState<string[]>('userPermissions', () => []);
const permissionsLoaded = useState<boolean>('permissionsLoaded', () => false);

// Load from server
const loadPermissions = async () => {
  const response = await $fetch('/api/users/me');
  permissions.value = response.user.permissions; // ['admin.manage', 'permissions.list']
  permissionsLoaded.value = true;
};

// Check permission
const hasPermission = (resource: string): boolean => {
  return permissions.value.includes(resource);
};
```

**When permissions are loaded**:
1. On app mount (if user logged in)
2. After successful login
3. After permission changes in admin panel
4. After group membership changes

**When permissions are cleared**:
- On logout

---

## Public Groups System

### Overview

app supports two types of groups:

1. **Public Groups** (`is_public: true`)
   - Visible to users in the application
   - Can be used for feature access control
   - Members can see group name, description, and membership
   - Used for team-based features, exclusive content, feature flags
   - Example: "Beta Testers", "Team Alpha", "VIP Members"

2. **Permission Groups** (`is_public: false`)
   - Admin-only visibility
   - Used exclusively for permission assignment
   - Users don't see these groups
   - Used for access control to admin features
   - Example: "Content Moderators", "Report Viewers"

**Note**: Public groups also have permissions (they inherit both capabilities), but permission groups are not visible to users.

### Architecture

```
Database: groups.is_public (boolean)
    ↓
API: Filters groups by type
    ↓
Composable: useUserGroups()
    ├── publicGroups (all public groups)
    ├── userGroups (user's public groups)
    └── Group membership checking functions
    ↓
Components: Feature-based access control
```

### Database Schema

**Groups Table**:
```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,  -- false = permission-only, true = public
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_is_public ON groups(is_public);
```

**Group Memberships**:
```sql
CREATE TABLE user_groups (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, group_id)
);
```

### Using Public Groups in Features

#### Client-Side Composable

**Location**: `app/composables/useUserGroups.ts`

```typescript
interface PublicGroup {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  memberCount: number;
}

export const useUserGroups = () => {
  // State
  const userGroups = useState<PublicGroup[]>('userPublicGroups', () => []);
  const publicGroups = useState<PublicGroup[]>('availablePublicGroups', () => []);
  
  // Load all available public groups
  const loadPublicGroups = async () => {
    const response = await $fetch('/api/groups/list');
    publicGroups.value = response.groups.filter(g => g.isPublic);
  };
  
  // Load current user's public group memberships
  const loadUserGroups = async () => {
    const response = await $fetch('/api/users/me');
    userGroups.value = response.user.groups.filter(g => g.isPublic);
  };
  
  // Check if user is member of specific group
  const isGroupMember = (groupId: number): boolean => {
    return userGroups.value.some(g => g.id === groupId);
  };
  
  // Check if user is member of any of the specified groups (OR logic)
  const isAnyGroupMember = (groupIds: number[]): boolean => {
    return groupIds.some(id => isGroupMember(id));
  };
  
  // Check if user is member of all specified groups (AND logic)
  const isAllGroupsMember = (groupIds: number[]): boolean => {
    return groupIds.every(id => isGroupMember(id));
  };
  
  // Get group by ID from available public groups
  const getPublicGroup = (groupId: number): PublicGroup | undefined => {
    return publicGroups.value.find(g => g.id === groupId);
  };
  
  return {
    userGroups: readonly(userGroups),
    publicGroups: readonly(publicGroups),
    loadPublicGroups,
    loadUserGroups,
    isGroupMember,
    isAnyGroupMember,
    isAllGroupsMember,
    getPublicGroup,
  };
};
```

#### Feature Access Patterns

**Pattern 1: Exclusive Content for Group Members**

```vue
<template>
  <div class="page">
    <!-- Public content -->
    <section class="public-section">
      <h1>Welcome to Our App</h1>
    </section>

    <!-- Exclusive content for Team Alpha -->
    <section v-if="isGroupMember(teamAlphaId)" class="exclusive">
      <h2>Team Alpha Dashboard</h2>
      <TeamAlphaDashboard />
    </section>

    <!-- Exclusive content for VIP members -->
    <section v-if="isGroupMember(vipGroupId)" class="exclusive">
      <h2>VIP Features</h2>
      <VipFeatures />
    </section>
  </div>
</template>

<script setup lang="ts">
const { loadUserGroups, isGroupMember } = useUserGroups();

const teamAlphaId = 5;  // Team Alpha group ID
const vipGroupId = 7;   // VIP group ID

onMounted(() => {
  loadUserGroups();
});
</script>
```

**Pattern 2: Browse and Join Public Groups**

```vue
<template>
  <div class="groups-browser">
    <h1>Available Groups</h1>
    
    <div v-for="group in publicGroups" :key="group.id" class="group-card">
      <h3>{{ group.name }}</h3>
      <p>{{ group.description }}</p>
      
      <div class="group-meta">
        <span>{{ group.memberCount }} members</span>
        
        <button 
          v-if="isGroupMember(group.id)"
          class="btn-member"
          disabled
        >
          ✓ Member
        </button>
        <button 
          v-else
          class="btn-join"
          @click="joinGroup(group.id)"
        >
          Join Group
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { 
  loadPublicGroups, 
  loadUserGroups,
  publicGroups, 
  isGroupMember 
} = useUserGroups();

onMounted(async () => {
  await loadPublicGroups();
  await loadUserGroups();
});

async function joinGroup(groupId: number) {
  try {
    await $fetch('/api/groups/join', {
      method: 'POST',
      body: { groupId }
    });
    
    // Reload user's groups
    await loadUserGroups();
  } catch (error) {
    console.error('Failed to join group:', error);
  }
}
</script>
```

**Pattern 3: Feature Flags by Group**

```vue
<template>
  <div class="app">
    <!-- Beta features for specific groups -->
    <div v-if="canAccessBeta" class="beta-features">
      <BetaFeaturePanel />
    </div>
    
    <!-- Premium features for VIP or Team Alpha -->
    <div v-if="hasPremiumAccess" class="premium">
      <PremiumDashboard />
    </div>
    
    <!-- Admin features (requires ALL groups) -->
    <div v-if="isFullAdmin" class="admin">
      <AdminPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
const { 
  loadUserGroups,
  isAnyGroupMember, 
  isAllGroupsMember 
} = useUserGroups();

// Beta access for any of these groups (OR logic)
const canAccessBeta = computed(() => 
  isAnyGroupMember([3, 5, 8])  // Beta Testers, Team Alpha, Developers
);

// Premium access for VIP or Team Alpha
const hasPremiumAccess = computed(() => 
  isAnyGroupMember([5, 7])  // Team Alpha, VIP
);

// Admin requires membership in ALL groups (AND logic)
const isFullAdmin = computed(() => 
  isAllGroupsMember([1, 5])  // Admins AND Team Alpha
);

onMounted(() => {
  loadUserGroups();
});
</script>
```

**Pattern 4: Dynamic Content Based on Groups**

```vue
<template>
  <div class="dashboard">
    <h1>Your Dashboard</h1>
    
    <!-- Show section for each group user is in -->
    <section 
      v-for="group in userGroups" 
      :key="group.id"
      class="group-section"
    >
      <h2>{{ group.name }}</h2>
      <p>{{ group.description }}</p>
      
      <!-- Load group-specific content -->
      <component :is="getGroupComponent(group.id)" />
    </section>
    
    <p v-if="userGroups.length === 0" class="text-gray-500">
      You're not a member of any groups yet.
    </p>
  </div>
</template>

<script setup lang="ts">
import TeamAlphaContent from './groups/TeamAlphaContent.vue';
import VipContent from './groups/VipContent.vue';
import BetaTesterContent from './groups/BetaTesterContent.vue';

const { loadUserGroups, userGroups } = useUserGroups();

const groupComponents: Record<number, Component> = {
  5: TeamAlphaContent,
  7: VipContent,
  3: BetaTesterContent,
};

function getGroupComponent(groupId: number) {
  return groupComponents[groupId] || 'div';
}

onMounted(() => {
  loadUserGroups();
});
</script>
```

### Server-Side Group Checking

For server-side feature access control based on group membership:

```typescript
// server/api/feature/access.get.ts
import { requireAuth } from '../../utils/session';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  
  // Get user's public groups
  const groups = await dbQuery<{ group_id: number, is_public: boolean }>(
    `SELECT g.id as group_id, g.is_public
     FROM groups g
     INNER JOIN user_groups ug ON g.id = ug.group_id
     WHERE ug.user_id = $1 AND g.is_public = true`,
    [user.id]
  );
  
  const groupIds = groups.map(g => g.group_id);
  const TEAM_ALPHA_ID = 5;
  const VIP_ID = 7;
  
  // Check group membership
  if (!groupIds.includes(TEAM_ALPHA_ID) && !groupIds.includes(VIP_ID)) {
    throw createError({
      statusCode: 403,
      message: 'This feature requires Team Alpha or VIP membership',
    });
  }
  
  // Return feature data
  return { success: true, data: await loadFeatureData() };
});
```

### Managing Public Groups

#### Admin API Endpoints

**Create Public Group**:
```typescript
// server/api/groups/create.post.ts
// POST /api/groups/create
// Body: { name: string, description: string, isPublic: boolean }

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');
  
  const { name, description, isPublic } = await readBody(event);
  
  const group = await dbQueryOne<Group>(
    `INSERT INTO groups (name, description, is_public) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [name, description, isPublic ?? false]
  );
  
  return { success: true, group };
});
```

**Update Group Type**:
```typescript
// server/api/groups/update.patch.ts
// PATCH /api/groups/update
// Body: { groupId: number, name?: string, description?: string, isPublic?: boolean }

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.manage');
  
  const { groupId, name, description, isPublic } = await readBody(event);
  
  // Protect Admins group from becoming public
  const currentGroup = await dbQueryOne<Group>(
    'SELECT * FROM groups WHERE id = $1',
    [groupId]
  );
  
  if (currentGroup?.name === 'Admins' && isPublic === true) {
    throw createError({
      statusCode: 403,
      message: 'The Admins group cannot be changed to public',
    });
  }
  
  // Build dynamic UPDATE query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(description);
  }
  if (isPublic !== undefined) {
    updates.push(`is_public = $${paramIndex++}`);
    values.push(isPublic);
  }
  
  values.push(groupId);
  
  const group = await dbQueryOne<Group>(
    `UPDATE groups SET ${updates.join(', ')}, updated_at = NOW() 
     WHERE id = $${paramIndex} 
     RETURNING *`,
    values
  );
  
  return { success: true, group };
});
```

**List Groups with Type Filter**:
```typescript
// server/api/groups/list.get.ts
// GET /api/groups/list

export default defineEventHandler(async (event) => {
  const groups = await dbQuery<Group>(
    `SELECT 
       g.id, 
       g.name, 
       g.description, 
       g.is_public,
       g.created_at,
       g.updated_at,
       COUNT(ug.user_id) as member_count
     FROM groups g
     LEFT JOIN user_groups ug ON g.id = ug.group_id
     GROUP BY g.id
     ORDER BY g.is_public DESC, g.name ASC`  // Public groups first
  );
  
  return {
    success: true,
    groups: groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      isPublic: g.is_public,
      memberCount: parseInt(g.member_count),
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    })),
  };
});
```

### Permission vs Group Membership

**When to use Permissions** (capability-based):
- ✅ Access control for admin features
- ✅ Feature availability (can user do X?)
- ✅ API endpoint protection
- ✅ Example: "Can this user view reports?"

**When to use Group Membership** (identity-based):
- ✅ Team-based features
- ✅ User segmentation
- ✅ Exclusive content
- ✅ Feature flags
- ✅ Example: "Is this user part of Team Alpha?"

**Comparison Table**:

| Aspect | Permissions | Group Membership |
|--------|-------------|------------------|
| Purpose | Access control | Feature access |
| Visibility | Admin-only | User-facing |
| Check function | `hasPermission()` | `isGroupMember()` |
| Use case | "Can view reports" | "Is in Team Alpha" |
| Example | `v-can="'reports.view'"` | `v-if="isGroupMember(5)"` |
| API protection | `requirePermission()` | Custom check |
| Assignable by | Admin only | Admin or self-service |

**Combined Usage Example**:

```vue
<template>
  <div>
    <!-- Admin feature protected by permission -->
    <div v-can="'admin.manage'" class="admin-panel">
      <h2>Admin Controls</h2>
      <AdminPanel />
    </div>
    
    <!-- Team feature protected by group membership -->
    <div v-if="isGroupMember(teamAlphaId)" class="team-features">
      <h2>Team Alpha Dashboard</h2>
      <TeamDashboard />
    </div>
    
    <!-- Hybrid: Admin OR team member can access -->
    <div v-if="hasPermission('admin.manage') || isGroupMember(teamAlphaId)">
      <h2>Shared Reports</h2>
      <Reports />
    </div>
  </div>
</template>

<script setup lang="ts">
const { hasPermission } = useUserGroups();  // For permissions
const { isGroupMember, loadUserGroups } = useUserGroups();  // For groups

const teamAlphaId = 5;

onMounted(() => {
  loadUserGroups();
});
</script>
```

### Best Practices

1. **Use Permissions for Access Control**:
   ```typescript
   // ✅ Good - permission for admin feature
   v-can="'admin.manage'"
   
   // ❌ Bad - group membership for admin feature
   v-if="isGroupMember(adminGroupId)"
   ```

2. **Use Groups for Feature Segmentation**:
   ```typescript
   // ✅ Good - group membership for team features
   v-if="isGroupMember(teamAlphaId)"
   
   // ❌ Bad - permission for team identity
   v-can="'team.alpha.member'"  // Don't create permissions for teams
   ```

3. **Load Groups Early**:
   ```typescript
   // Load in layout or app initialization
   onMounted(async () => {
     await loadPublicGroups();  // All available groups
     await loadUserGroups();    // User's memberships
   });
   ```

4. **Cache Group IDs**:
   ```typescript
   // Define group IDs as constants
   const GROUP_IDS = {
     TEAM_ALPHA: 5,
     VIP: 7,
     BETA_TESTERS: 3,
   };
   
   // Use in checks
   if (isGroupMember(GROUP_IDS.TEAM_ALPHA)) { /* ... */ }
   ```

5. **Combine Permissions and Groups**:
   ```typescript
   // Admin can always access, OR team member with permission
   const canAccessFeature = computed(() => 
     hasPermission('admin.manage') || 
     (isGroupMember(GROUP_IDS.TEAM_ALPHA) && hasPermission('feature.access'))
   );
   ```

### Migration Guide

If you have existing groups and want to make some public:

```sql
-- Add is_public column (if not exists)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);

-- Make specific groups public
UPDATE groups SET is_public = true WHERE name IN ('Team Alpha', 'VIP', 'Beta Testers');

-- Ensure Admins stays permission-only
UPDATE groups SET is_public = false WHERE name = 'Admins';
```

---

## Database Layer

### Architecture

app uses an extensible database connector architecture that supports PostgreSQL and can be extended for other databases.

### Configuration

**Environment Variables**:
```env
# Required
NUXT_DATABASE_TYPE=postgres
NUXT_DATABASE_HOST=localhost
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_NAME=app
NUXT_DATABASE_USER=postgres
NUXT_DATABASE_PASSWORD=secret

# Optional (with defaults)
NUXT_DATABASE_SCHEMA=public
NUXT_DATABASE_SSL=false
NUXT_DATABASE_MAX_CONNECTIONS=10
NUXT_DATABASE_IDLE_TIMEOUT=30000
NUXT_DATABASE_CONNECTION_TIMEOUT=2000
```

### Core Components

#### 1. Base Interface

**Location**: `server/database/connectors/base.ts`

```typescript
export interface DatabaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
}

export abstract class BaseDatabaseConnector implements DatabaseConnector {
  protected config: DatabaseConfig;
  protected transactionActive = false;
  
  // Common methods
  abstract connect(): Promise<void>;
  abstract query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  // ...
}
```

#### 2. PostgreSQL Connector

**Location**: `server/database/connectors/postgres.ts`

```typescript
export class PostgresConnector extends BaseDatabaseConnector {
  private pool: Pool;
  
  async connect(): Promise<void> {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.name,
      user: this.config.user,
      password: this.config.password,
      max: this.config.maxConnections || 10,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
    });
  }
  
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // Set schema for each query
    const client = await this.pool.connect();
    try {
      await client.query(`SET search_path TO ${this.config.schema}, public`);
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

#### 3. Connector Factory

**Location**: `server/database/connector-factory.ts`

```typescript
class DatabaseFactory {
  private static instance: DatabaseConnector | null = null;
  private static connectorRegistry: Map<string, ConnectorConstructor> = new Map();

  static registerConnector(type: string, constructor: ConnectorConstructor): void {
    this.connectorRegistry.set(type.toLowerCase(), constructor);
  }

  static async getConnector(config: DatabaseConfig): Promise<DatabaseConnector> {
    if (this.instance) return this.instance;
    
    const constructor = this.connectorRegistry.get(config.type.toLowerCase());
    if (!constructor) {
      throw new Error(`No connector registered for type: ${config.type}`);
    }
    
    this.instance = new constructor(config);
    await this.instance.connect();
    return this.instance;
  }
}

// Register PostgreSQL
DatabaseFactory.registerConnector('postgres', PostgresConnector);
```

### Composable Functions

**Location**: `server/composables/useDatabase.ts`

```typescript
// Get database instance
export async function useDatabase(): Promise<DatabaseConnector> {
  const config = useRuntimeConfig();
  return await DatabaseFactory.getConnector(config.database as DatabaseConfig);
}

// Execute query
export async function dbQuery<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const db = await useDatabase();
  return await db.query<T>(sql, params);
}

// Execute query, return single result
export async function dbQueryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const db = await useDatabase();
  return await db.queryOne<T>(sql, params);
}

// Execute transaction
export async function dbTransaction(
  callback: (db: DatabaseConnector) => Promise<void>
): Promise<void> {
  const db = await useDatabase();
  try {
    await db.beginTransaction();
    await callback(db);
    await db.commitTransaction();
  } catch (error) {
    await db.rollbackTransaction();
    throw error;
  }
}
```

### Usage Examples

#### Simple Query

```typescript
const users = await dbQuery('SELECT * FROM users WHERE active = $1', [true]);
```

#### Type-Safe Query

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
}

const users = await dbQuery<User>('SELECT * FROM users');
```

#### Single Result

```typescript
const user = await dbQueryOne<User>(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

if (!user) {
  throw createError({ statusCode: 404, message: 'User not found' });
}
```

#### Transaction

```typescript
await dbTransaction(async (db) => {
  // Insert user
  const userResult = await db.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
    [username, email, hashedPassword]
  );
  const userId = userResult[0].id;
  
  // Add to default group
  await db.query(
    'INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)',
    [userId, defaultGroupId]
  );
});
```

### Schema Definition

**Location**: `server/database/schema.ts`

```typescript
export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database schema...');
  
  const db = await useDatabase();
  
  // Create users table
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create sessions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create groups table
  await db.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create user_groups junction table
  await db.query(`
    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, group_id)
    )
  `);
  
  // Create permissions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      permission_key VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, permission_key)
    )
  `);
  
  // Create indexes
  await db.query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id)');
  await db.query('CREATE INDEX IF NOT EXISTS idx_permissions_group_id ON permissions(group_id)');
  
  // Initialize default data
  await initializeDefaultGroups();
  
  // Sync permissions from code
  await syncPermissionsToDatabase();
  
  console.log('Database schema initialized successfully');
}
```

### Adding Support for Another Database

1. **Create connector**:
```typescript
// server/database/connectors/mysql.ts
import { BaseDatabaseConnector } from './base';
import mysql from 'mysql2/promise';

export class MySQLConnector extends BaseDatabaseConnector {
  private connection: mysql.Connection;
  
  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      database: this.config.name,
      user: this.config.user,
      password: this.config.password,
    });
  }
  
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.connection.execute(sql, params);
    return rows as T[];
  }
  
  // Implement other methods...
}
```

2. **Register connector**:
```typescript
// server/database/connector-factory.ts
import { MySQLConnector } from './connectors/mysql';

DatabaseFactory.registerConnector('mysql', MySQLConnector);
```

3. **Update configuration**:
```env
NUXT_DATABASE_TYPE=mysql
```

---

## Authentication & Sessions

### Overview

app uses **session-based authentication** with:
- Password hashing (bcrypt)
- HTTP-only secure cookies
- 7-day session duration
- Database-stored sessions
- Session cleanup on expiry

### Password Security

**Location**: `server/utils/auth.ts`

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateRandomPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
```

### Session Management

**Location**: `server/utils/session.ts`

```typescript
const SESSION_COOKIE_NAME = 'app_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Create session
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await dbQuery(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionId, userId, expiresAt]
  );
  
  return sessionId;
}

// Get user by session
export async function getUserBySession(sessionId: string): Promise<User | null> {
  return await dbQueryOne<User>(
    `SELECT u.id, u.username, u.email, u.created_at, u.updated_at 
     FROM users u 
     INNER JOIN sessions s ON u.id = s.user_id 
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );
}

// Get user with permissions
export async function getUserBySessionWithPermissions(
  sessionId: string
): Promise<UserWithPermissions | null> {
  const user = await getUserBySession(sessionId);
  if (!user) return null;
  
  const permissions = await loadUserPermissions(user.id);
  return { ...user, permissions };
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  await dbQuery('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

// Set cookie
export function setSessionCookie(event: H3Event, sessionId: string): void {
  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

// Clear cookie
export function clearSessionCookie(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE_NAME);
}

// Require authentication
export async function requireAuth(event: H3Event): Promise<User> {
  const user = await getCurrentUser(event);
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' });
  }
  return user;
}

// Require permission
export async function requirePermission(
  event: H3Event,
  resource: string
): Promise<UserWithPermissions> {
  const user = await getCurrentUserWithPermissions(event);
  
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' });
  }
  
  const { checkPermission } = await import('../composables/usePermissions');
  
  if (!checkPermission(user.permissions, resource)) {
    throw createError({ statusCode: 403, message: 'Permission denied' });
  }
  
  return user;
}
```

### Authentication Flow

#### Registration

```typescript
// server/api/users/register.post.ts
export default defineEventHandler(async (event) => {
  const { username, email, password } = await readBody(event);
  
  // Validate input
  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'Username and password required' });
  }
  
  // Hash password
  const hashedPassword = hashPassword(password);
  
  // Create user
  const user = await dbQueryOne(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
    [username, email || null, hashedPassword]
  );
  
  // Add to default groups
  const defaultGroups = await dbQuery('SELECT id FROM groups WHERE name IN ($1, $2)', ['Family', 'Adults']);
  for (const group of defaultGroups) {
    await dbQuery('INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [user.id, group.id]);
  }
  
  // Create session
  const sessionId = await createSession(user.id);
  setSessionCookie(event, sessionId);
  
  return { success: true, user: { id: user.id, username, email } };
});
```

#### Login

```typescript
// server/api/users/login.post.ts
export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);
  
  // Authenticate
  const user = await authenticateUser(username, password);
  
  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' });
  }
  
  // Create session
  const sessionId = await createSession(user.id);
  setSessionCookie(event, sessionId);
  
  // Load permissions
  const permissions = await loadUserPermissions(user.id);
  
  return {
    success: true,
    user: { ...user, permissions }
  };
});
```

#### Logout

```typescript
// server/api/users/logout.post.ts
export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  
  if (sessionId) {
    await deleteSession(sessionId);
  }
  
  clearSessionCookie(event);
  
  return { success: true };
});
```

### Session Cleanup

**Automatic cleanup** happens on session access (expired sessions return null).

**Manual cleanup**:
```typescript
// server/utils/session.ts
export async function cleanupExpiredSessions(): Promise<void> {
  await dbQuery('DELETE FROM sessions WHERE expires_at <= NOW()');
}

// Call periodically (e.g., cron job)
```

---

## Email Notifications

### Overview

app provides an **optional email notification system** using:
- SMTP-based email delivery (nodemailer)
- Template registry pattern (similar to permissions)
- Automatic configuration checking (no manual checks needed)
- Graceful degradation (app works without email configured)
- Type-safe template definitions

### Architecture

```
Email Template Registry (Code)
    ↓
server/config/emails.ts
    ↓
sendEmailTemplate() Function
    ↓
Automatic Config Check
    ↓
SMTP Server (if configured)
    ↓
Email Delivery
```

### Configuration

**Environment Variables**:

```env
# Optional - uncomment to enable email notifications
NUXT_EMAIL_HOST=smtp.gmail.com
NUXT_EMAIL_PORT=587
NUXT_EMAIL_USER=your-email@gmail.com
NUXT_EMAIL_PASSWORD=your-app-password
NUXT_EMAIL_FROM=My App <noreply@example.com>
```

**Runtime Config** (`nuxt.config.ts`):

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    email: {
      host: '',              // SMTP host
      port: 587,             // 587 (TLS) or 465 (SSL)
      user: '',              // SMTP username
      password: '',          // SMTP password
      from: 'App <noreply@example.com>', // Sender address
    },
  },
})
```

**Important Notes**:
- Email is **completely optional** - if not configured, emails are skipped silently
- App functionality is not affected by missing email configuration
- Gmail requires an [app-specific password](https://support.google.com/accounts/answer/185833)
- Port 587 uses STARTTLS, port 465 uses SSL/TLS

### Defining Email Templates

**Location**: `server/config/emails.ts`

Email templates follow the same registry pattern as permissions - all templates are defined in one central configuration file.

```typescript
export interface EmailTemplate {
  key: string;  // Unique identifier for the email type
  description: string;  // Human-readable description
  template: (data: any) => {
    subject: string;
    text: string;
    html: string;
  };
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    key: 'user.welcome',
    description: 'Welcome email sent to newly registered users',
    template: (data: { username: string; appName: string }) => ({
      subject: `Welcome to ${data.appName}!`,
      text: `Hi ${data.username},

Your account has been created successfully.

You can now log in with your username and password.

Best regards,
${data.appName} Team`,
      html: `
        <h2>Welcome to ${data.appName}!</h2>
        <p>Hi <strong>${data.username}</strong>,</p>
        <p>Your account has been created successfully.</p>
        <p>You can now log in with your username and password.</p>
        <p>Best regards,<br>${data.appName} Team</p>
      `,
    }),
  },
  
  {
    key: 'admin.newUser',
    description: 'Notification to admins when a new user registers',
    template: (data: { username: string; email: string | null; appName: string }) => {
      const emailText = data.email || '(not provided)';
      return {
        subject: `New user registered on ${data.appName}`,
        text: `A new user has registered:

Username: ${data.username}
Email: ${emailText}

${data.appName} Admin`,
        html: `
          <h2>New User Registration</h2>
          <p>A new user has registered on ${data.appName}:</p>
          <ul>
            <li><strong>Username:</strong> ${data.username}</li>
            <li><strong>Email:</strong> ${emailText}</li>
          </ul>
          <p>${data.appName} Admin</p>
        `,
      };
    },
  },
];
```

**Adding a New Template**:

```typescript
// server/config/emails.ts
{
  key: 'user.passwordReset',
  description: 'Password reset email with secure link',
  template: (data: { username: string; resetLink: string; expiresIn: string; appName: string }) => ({
    subject: `Password Reset Request - ${data.appName}`,
    text: `Hi ${data.username},

You requested a password reset for your account.

Click the link below to reset your password:
${data.resetLink}

This link will expire in ${data.expiresIn}.

If you didn't request this, please ignore this email.

Best regards,
${data.appName} Team`,
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi <strong>${data.username}</strong>,</p>
      <p>You requested a password reset for your account.</p>
      <p>
        <a href="${data.resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          Reset Password
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        This link will expire in ${data.expiresIn}.
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        If you didn't request this, please ignore this email.
      </p>
      <p>Best regards,<br>${data.appName} Team</p>
    `,
  }),
}
```

### Sending Emails

**Location**: `server/composables/useEmail.ts`

#### Using Template Registry (Recommended)

```typescript
import { sendEmailTemplate } from '~/server/composables/useEmail';

// Single recipient
await sendEmailTemplate(
  'user@example.com',
  'user.welcome',
  { 
    username: 'john', 
    appName: config.public.appName 
  }
);

// Multiple recipients
await sendEmailTemplate(
  ['admin1@example.com', 'admin2@example.com'],
  'admin.newUser',
  { 
    username: 'john', 
    email: 'john@example.com',
    appName: config.public.appName 
  }
);

// With error handling
try {
  const sent = await sendEmailTemplate(
    user.email,
    'user.passwordReset',
    {
      username: user.username,
      resetLink: `https://example.com/reset/${token}`,
      expiresIn: '1 hour',
      appName: config.public.appName,
    }
  );
  
  if (sent) {
    console.log('Email sent successfully');
  } else {
    console.log('Email not configured, skipped');
  }
} catch (error) {
  console.error('Failed to send email:', error);
  // Handle error (e.g., log to monitoring service)
}
```

**Function Signature**:

```typescript
async function sendEmailTemplate(
  to: string | string[],           // Recipient(s)
  templateKey: string,              // Key from EMAIL_TEMPLATES
  data: any                         // Data for template function
): Promise<boolean>                 // true if sent, false if not configured
```

**Key Features**:
- ✅ **Automatic configuration check** - no need to check if email is enabled
- ✅ **Type-safe** - template data is validated by TypeScript
- ✅ **Graceful failure** - returns `false` if email not configured, doesn't throw
- ✅ **Multi-recipient** - accepts string or array of email addresses
- ✅ **Error handling** - throws only on actual send failures, not config issues

#### Custom Emails (Without Template)

For one-off emails or dynamic content not suitable for templates:

```typescript
import { sendEmail } from '~/server/composables/useEmail';

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  text: 'Plain text version of email',
  html: '<p>HTML version of email</p>',
});
```

### Usage Examples

#### User Registration Flow

```typescript
// server/api/users/register.post.ts
import { sendEmailTemplate } from '../../composables/useEmail';

export default defineEventHandler(async (event) => {
  const { username, email, password } = await readBody(event);
  
  // Create user
  const user = await createUser(username, email, password);
  
  // Send welcome email (optional - won't break if email not configured)
  if (email) {
    await sendEmailTemplate(email, 'user.welcome', {
      username,
      appName: useRuntimeConfig().public.appName,
    });
  }
  
  return { success: true, user };
});
```

#### Admin Notification

```typescript
// server/api/users/register.post.ts
import { sendEmailTemplate } from '../../composables/useEmail';

// Get admin emails
const admins = await dbQuery<User>(
  `SELECT u.email 
   FROM users u
   INNER JOIN user_groups ug ON u.id = ug.user_id
   INNER JOIN groups g ON ug.group_id = g.id
   WHERE g.name = 'Admins' AND u.email IS NOT NULL`
);

const adminEmails = admins.map(a => a.email).filter(e => e);

if (adminEmails.length > 0) {
  await sendEmailTemplate(adminEmails, 'admin.newUser', {
    username: newUser.username,
    email: newUser.email,
    appName: useRuntimeConfig().public.appName,
  });
}
```

#### Password Reset Flow

```typescript
// server/api/users/reset-password.post.ts
import { sendEmailTemplate } from '../../composables/useEmail';
import { generateResetToken } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event);
  
  // Find user
  const user = await dbQueryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  
  if (!user) {
    // Don't reveal if email exists
    return { success: true };
  }
  
  // Generate reset token
  const token = await generateResetToken(user.id);
  const resetLink = `${useRuntimeConfig().public.baseUrl}/reset/${token}`;
  
  // Send reset email
  await sendEmailTemplate(user.email, 'user.passwordReset', {
    username: user.username,
    resetLink,
    expiresIn: '1 hour',
    appName: useRuntimeConfig().public.appName,
  });
  
  return { success: true };
});
```

### Built-in Templates

app includes these email templates by default:

| Key | Description | Data Required | Trigger |
|-----|-------------|---------------|---------|
| `user.welcome` | Welcome new users | `username`, `appName` | User registration |
| `admin.newUser` | Notify admins of registrations | `username`, `email`, `appName` | User registration (optional) |

### Email Composable Reference

**Location**: `server/composables/useEmail.ts`

```typescript
// Main function - use templates from registry
export async function sendEmailTemplate(
  to: string | string[],
  templateKey: string,
  data: any
): Promise<boolean>

// Low-level function - custom emails
export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean>

// Legacy functions (deprecated but still work)
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<boolean>

export async function sendAdminNotificationEmail(
  adminEmails: string[],
  username: string,
  email: string | null
): Promise<boolean>
```

### Testing

**Manual Testing**:

1. Configure SMTP in `.env`
2. Trigger an email action (e.g., register user)
3. Check console logs: "Email sent successfully to: user@example.com"
4. Check recipient inbox

**Test Without SMTP**:

1. Leave email configuration empty in `.env`
2. Trigger an email action
3. Check console logs: "Email not configured, skipping email to: user@example.com"
4. App should function normally

**Unit Tests**:

```typescript
// test/server/composables/useEmail.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sendEmailTemplate } from '../../../server/composables/useEmail';

describe('Email Composable', () => {
  it('should skip email when not configured', async () => {
    const result = await sendEmailTemplate(
      'user@example.com',
      'user.welcome',
      { username: 'test', appName: 'Test App' }
    );
    
    expect(result).toBe(false);
  });
  
  it('should send email when configured', async () => {
    vi.mock('~/server/config', () => ({
      useRuntimeConfig: () => ({
        email: {
          host: 'smtp.test.com',
          user: 'test@test.com',
          password: 'password',
          port: 587,
          from: 'Test <noreply@test.com>',
        },
      }),
    }));
    
    const result = await sendEmailTemplate(
      'user@example.com',
      'user.welcome',
      { username: 'test', appName: 'Test App' }
    );
    
    expect(result).toBe(true);
  });
});
```

### Troubleshooting

**Email not being sent**:

1. Check environment variables are set correctly
2. Verify SMTP credentials
3. Check console logs for errors
4. Test SMTP connection manually:
   ```bash
   telnet smtp.gmail.com 587
   ```

**Gmail-specific issues**:

- Enable "Less secure app access" OR use app-specific password
- Check "Allow less secure apps" setting
- Verify 2FA is configured if using app passwords

**Common errors**:

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
→ Check SMTP credentials

Error: Connection timeout
→ Check SMTP host/port, firewall rules

Error: self signed certificate
→ Add `rejectUnauthorized: false` for SSL (dev only)
```

### Production Considerations

**Security**:
- ✅ Use environment variables for SMTP credentials
- ✅ Never commit credentials to version control
- ✅ Use TLS/SSL (port 587 or 465)
- ✅ Use app-specific passwords for Gmail

**Reliability**:
- ⚠️ Email sending can fail - don't block critical operations
- ⚠️ Consider using email queue for high-volume sending
- ⚠️ Monitor email delivery rates
- ⚠️ Implement retry logic for transient failures

**Email Service Providers**:

Consider using dedicated email services for production:
- **SendGrid** - 100 emails/day free
- **Mailgun** - 5,000 emails/month free
- **AWS SES** - $0.10 per 1,000 emails
- **Postmark** - 100 emails/month free

**Rate Limiting**:

Implement rate limiting to prevent abuse:

```typescript
// server/utils/email-rate-limit.ts
const emailSentMap = new Map<string, number>();

export function canSendEmail(identifier: string): boolean {
  const now = Date.now();
  const lastSent = emailSentMap.get(identifier);
  
  // Limit: 1 email per 5 minutes
  if (lastSent && now - lastSent < 5 * 60 * 1000) {
    return false;
  }
  
  emailSentMap.set(identifier, now);
  return true;
}
```

---

## API Development

### Creating an Endpoint

**File naming convention**:
- `endpoint.get.ts` - GET request
- `endpoint.post.ts` - POST request
- `endpoint.patch.ts` - PATCH request
- `endpoint.delete.ts` - DELETE request
- `[param].get.ts` - Dynamic route parameter

**Basic structure**:
```typescript
// server/api/example.post.ts
export default defineEventHandler(async (event) => {
  // 1. Check authentication/permissions
  await requirePermission(event, 'example.action');
  
  // 2. Parse request body
  const body = await readBody(event);
  const { field1, field2 } = body;
  
  // 3. Validate input
  if (!field1) {
    throw createError({
      statusCode: 400,
      message: 'field1 is required',
    });
  }
  
  // 4. Process request
  try {
    const result = await dbQuery(
      'INSERT INTO table (field1, field2) VALUES ($1, $2) RETURNING *',
      [field1, field2]
    );
    
    // 5. Return response
    return {
      success: true,
      data: result[0],
    };
  } catch (error) {
    console.error('Error:', error);
    throw createError({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
});
```

### Error Handling

```typescript
// Built-in error creation
throw createError({
  statusCode: 400,
  message: 'Bad request',
});

// Catch database errors
try {
  await dbQuery('...');
} catch (error) {
  console.error('Database error:', error);
  throw createError({
    statusCode: 500,
    message: 'Database operation failed',
  });
}
```

### Request Parsing

```typescript
// Body
const body = await readBody(event);

// Query parameters
const query = getQuery(event);
const { page, limit } = query;

// Route parameters
const id = getRouterParam(event, 'id');

// Headers
const headers = getHeaders(event);
const contentType = getHeader(event, 'content-type');

// Cookies
const sessionId = getCookie(event, 'app_session');
```

### Response Types

```typescript
// JSON (default)
return { success: true, data: [] };

// Specific status code
setResponseStatus(event, 201);
return { created: true };

// Headers
setResponseHeader(event, 'Cache-Control', 'no-cache');

// Redirect
return sendRedirect(event, '/login', 302);
```

---

## Frontend Development

### Page Creation

**Location**: `app/pages/`

```vue
<!-- app/pages/feature.vue -->
<template>
  <div class="max-w-7xl mx-auto py-6 px-4">
    <h1 class="text-3xl font-bold">{{ title }}</h1>
    
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="text-red-600">{{ error }}</div>
    <div v-else>
      <!-- Content -->
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

const title = ref('Feature Page');
const loading = ref(true);
const error = ref('');
const data = ref<any[]>([]);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await $fetch('/api/feature/data');
    data.value = response.data;
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load data';
  } finally {
    loading.value = false;
  }
}
</script>
```

### Component Creation

**Location**: `app/components/`

```vue
<!-- app/components/FeatureCard.vue -->
<template>
  <div class="bg-white shadow rounded-lg p-4">
    <h3 class="text-lg font-medium">{{ title }}</h3>
    <p class="text-gray-600 mt-2">{{ description }}</p>
    <button @click="handleClick" class="mt-4 btn-primary">
      {{ buttonText }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  description: string;
  buttonText?: string;
}

interface Emits {
  (e: 'action', id: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  buttonText: 'Action',
});

const emit = defineEmits<Emits>();

function handleClick() {
  emit('action', 123);
}
</script>
```

### Composables

**Location**: `app/composables/`

```typescript
// app/composables/useFeature.ts
export const useFeature = () => {
  const data = useState<any[]>('featureData', () => []);
  const loading = useState<boolean>('featureLoading', () => false);
  
  const loadData = async () => {
    loading.value = true;
    try {
      const response = await $fetch('/api/feature/data');
      data.value = response.data;
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      loading.value = false;
    }
  };
  
  const processItem = (id: number) => {
    // Process logic
  };
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    loadData,
    processItem,
  };
};
```

### State Management

```typescript
// Global state with useState
const globalState = useState('key', () => initialValue);

// Reactive refs
const count = ref(0);
const user = ref<User | null>(null);

// Computed values
const doubleCount = computed(() => count.value * 2);

// Watch changes
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});
```

### API Calls

```typescript
// GET request
const data = await $fetch('/api/endpoint');

// POST request
const result = await $fetch('/api/endpoint', {
  method: 'POST',
  body: { field: 'value' },
});

// Error handling
try {
  const data = await $fetch('/api/endpoint');
} catch (error: any) {
  if (error.statusCode === 401) {
    await navigateTo('/login');
  } else {
    console.error('Error:', error.data?.message);
  }
}

// With type safety
interface Response {
  success: boolean;
  data: Item[];
}

const response = await $fetch<Response>('/api/items');
```

---

### Internationalization (i18n)

#### Overview

The application uses `@nuxtjs/i18n` for multilingual support with static JSON translation files.

**Supported Languages:**
- English (`en`) - Default
- German (`de`)

#### Configuration

Located in `nuxt.config.ts`:

```typescript
i18n: {
  locales: [
    { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' },
    { code: 'de', iso: 'de-DE', name: 'Deutsch', file: 'de.json' },
  ],
  lazy: true,
  langDir: 'locales',
  defaultLocale: 'en',
  strategy: 'no_prefix', // No /en or /de in URLs
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_locale',
  },
}
```

#### Using Translations

**In Templates:**
```vue
<template>
  <h1>{{ $t('home.welcome') }}</h1>
  <p>{{ $t('home.welcome', { appName: 'MyApp' }) }}</p>
  <button>{{ $t('common.save') }}</button>
</template>
```

**In Script:**
```typescript
const { t, locale, setLocale } = useI18n();

// Get translation
const message = computed(() => t('auth.login.success'));

// Get current locale
console.log(locale.value); // 'en' or 'de'

// Switch language
setLocale('de');
```

#### Translation Files

Located in `locales/` directory:

```
locales/
├── en.json    # English translations
└── de.json    # German translations
```

**Example Structure:**
```json
{
  "nav": {
    "example": "Example",
    "admin": "Admin",
    "logout": "Logout"
  },
  "auth": {
    "login": {
      "title": "Login",
      "username": "Username",
      "password": "Password",
      "submit": "Sign In"
    }
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

#### Adding New Translation Keys

**Step 1:** Add to both language files

**locales/en.json:**
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Description"
  }
}
```

**locales/de.json:**
```json
{
  "myFeature": {
    "title": "Meine Funktion",
    "description": "Beschreibung"
  }
}
```

**Step 2:** Use in components
```vue
<h1>{{ $t('myFeature.title') }}</h1>
```

Changes are auto-reloaded in development mode.

#### Language Switcher

Built into `app/layouts/default.vue`. Shows current locale and dropdown to switch between languages. User preference saved in cookie.

#### Best Practices

- Organize translations by feature area (`auth`, `admin`, `common`)
- Use meaningful key names (`auth.login.submit` not `btn1`)
- Provide all translations before deploying
- Use parameters for dynamic content: `{{ $t('msg', { user: name }) }}`

---

## Testing

For detailed testing documentation, see [test/README.md](test/README.md).

### Running Tests

```bash
# All tests
npm run test

# With coverage
npm run test:coverage

# Specific test file
npm run test -- users.test.ts

# Watch mode
npm run test:watch
```

### Test Structure

```typescript
// test/server/api/example.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setup, cleanup } from '../../utils/test-helpers';

describe('Example API', () => {
  beforeEach(async () => {
    await setup();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should return data', async () => {
    const response = await $fetch('/api/example');
    expect(response).toHaveProperty('data');
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('should require authentication', async () => {
    await expect($fetch('/api/protected')).rejects.toThrow('401');
  });
});
```

### Test Helpers

**Location**: `test/utils/test-helpers.ts`

```typescript
export async function setup() {
  // Initialize test database
  // Create test data
}

export async function cleanup() {
  // Clear test data
  // Close connections
}

export async function createTestUser(data: Partial<User> = {}) {
  const username = data.username || 'testuser';
  const email = data.email || 'test@example.com';
  const password = data.password || 'testpassword';
  
  // Create user
  return await $fetch('/api/users/register', {
    method: 'POST',
    body: { username, email, password },
  });
}
```

---

## Deployment

### Environment Setup

1. **Create production `.env`**:
```env
NODE_ENV=production
NUXT_DATABASE_TYPE=postgres
NUXT_DATABASE_HOST=your-production-host
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_NAME=app_prod
NUXT_DATABASE_USER=app_user
NUXT_DATABASE_PASSWORD=secure_password
NUXT_DATABASE_SCHEMA=app
NUXT_DATABASE_SSL=true
NUXT_PUBLIC_APP_NAME=app
```

2. **Build application**:
```bash
npm run build
```

3. **Start production server**:
```bash
npm run start
```

### Docker Deployment

**Using Docker Compose** (recommended):

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

**Manual Docker**:

```bash
# Build image
docker build -t app .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name app \
  app
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Enable SSL for database connection
- [ ] Set secure session cookie (`secure: true`)
- [ ] Configure CORS if needed
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set up monitoring
- [ ] Configure firewall rules
- [ ] Use reverse proxy (nginx/traefik)
- [ ] Enable HTTPS
- [ ] Set up CI/CD pipeline

### Monitoring

**Health check endpoint**:
```typescript
// server/api/health.get.ts
export default defineEventHandler(async (event) => {
  try {
    await dbQuery('SELECT 1');
    return { status: 'ok', database: 'connected' };
  } catch (error) {
    return { status: 'error', database: 'disconnected' };
  }
});
```

**Database connection status**:
```typescript
const db = await useDatabase();
const isConnected = db.pool?.totalCount > 0;
```

---

## Additional Resources

- [Quick Reference](DEV_QUICK_REFERENCE.md)
- [README](README.md)
- [Permission Developer Guide](PERMISSION_DEVELOPER_GUIDE.md)
- [Nuxt Documentation](https://nuxt.com/docs)
- [Vue Documentation](https://vuejs.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
