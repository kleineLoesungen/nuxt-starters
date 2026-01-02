# Developer Quick Reference

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev  # http://localhost:3000
```

## 📁 Project Structure

```
app/                    # Frontend (Nuxt)
├── components/         # Vue components
├── composables/        # Reusable composition functions
├── layouts/            # Page layouts
├── middleware/         # Route middleware
├── pages/              # File-based routing
└── plugins/            # Vue plugins

i8n/                    # Language packs
logs/                   # Log files

server/                 # Backend (Nitro)
├── api/                # API endpoints
├── composables/        # Server composables
├── config/             # Configuration (permissions)
├── database/           # Database connectors & schema
└── utils/              # Utility functions

test/                   # Test suite
```

## 🔐 Permission System

### Register a New Feature
```typescript
// server/config/permissions.ts
{
  key: 'feature.action',
  description: 'Action Description',
  includesAccess: ['Page: /path', 'API: /api/endpoint'],
  requiresAdminByDefault: false,
}
```

### Protect an API
```typescript
// server/api/endpoint.ts
import { requirePermission } from '../utils/session';

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'feature.action');
  // Your code here
});
```

### Protect a Page
```typescript
// app/middleware/permissions.global.ts
const routePermissions: Record<string, string | string[]> = {
  '/path': 'feature.action',                    // Single permission
  '/dashboard': ['feature1', 'feature2'],       // Multiple (OR logic)
};
```

### Conditional UI
```vue
<template>
  <!-- Single permission -->
  <button v-can="'feature.action'">Action</button>
  
  <!-- Component-level protection (recommended for multi-feature pages) -->
  <div v-can="'reports.view'" class="section">
    <ReportsList />
  </div>
  <div v-can="'analytics.view'" class="section">
    <AnalyticsChart />
  </div>
  
  <!-- Multiple permissions -->
  <div v-if="hasAnyPermission(['feature1', 'feature2'])">
    Dashboard available
  </div>
</template>

<script setup>
const { hasPermission, hasAnyPermission, hasAllPermissions } = useUserGroups();

// Single
if (hasPermission('feature.action')) { /* ... */ }

// Any (OR logic)
if (hasAnyPermission(['feature1', 'feature2'])) { /* ... */ }

// All (AND logic)
if (hasAllPermissions(['feature1', 'feature2'])) { /* ... */ }
</script>
```

## � Public Groups

### Overview
Public groups are user-facing groups that can be used for app features, while permission groups are admin-only for access control.

**Group Types**:
- **Public Groups** (`is_public: true`) - Visible to users, can be used in app features
- **Permission Groups** (`is_public: false`) - Admin-only, used for permissions
- **System Groups** - Special groups like "Admins" (always permission-only)

### Using Public Groups in Features

```vue
<script setup>
const { 
  loadPublicGroups,    // Load all available public groups
  loadUserGroups,      // Load current user's group memberships
  publicGroups,        // Available public groups
  userGroups,          // User's public groups
  isGroupMember,       // Check single group membership
  isAnyGroupMember,    // Check multiple groups (OR logic)
  isAllGroupsMember,   // Check multiple groups (AND logic)
  getPublicGroup       // Get group by ID
} = useUserGroups();

// Load on mount
onMounted(async () => {
  await loadPublicGroups();  // Load available groups
  await loadUserGroups();    // Load user's memberships
});
</script>

<template>
  <!-- Show content only to group members -->
  <div v-if="isGroupMember(5)" class="exclusive-content">
    <h2>Team Alpha Exclusive</h2>
    <p>Only visible to Team Alpha members</p>
  </div>

  <!-- List available groups -->
  <div v-for="group in publicGroups" :key="group.id">
    <h3>{{ group.name }}</h3>
    <p>{{ group.description }}</p>
    <span v-if="isGroupMember(group.id)">✓ Member</span>
    <span v-else>{{ group.memberCount }} members</span>
  </div>

  <!-- Multiple groups (OR logic) -->
  <div v-if="isAnyGroupMember([3, 5, 7])">
    Beta features for Beta Testers, Team Alpha, or VIP
  </div>

  <!-- Multiple groups (AND logic) -->
  <div v-if="isAllGroupsMember([5, 7])">
    Premium content for Team Alpha AND VIP members
  </div>
</template>
```

### Permission vs Group Membership

**Permissions** - For access control:
```typescript
// Check if user can perform action
if (hasPermission('reports.view')) {
  // User has permission
}
```

**Group Membership** - For feature access:
```typescript
// Check if user is in specific group
if (isGroupMember(5)) {
  // User is member of group ID 5
}
```

### Example Use Cases

**1. Team-based features**:
```typescript
const teamFeatures = computed(() => {
  const group = getPublicGroup(userTeamId.value);
  return group ? group.name : 'No team';
});
```

**2. Exclusive content**:
```vue
<div v-if="isGroupMember(premiumGroupId)" class="premium">
  <PremiumFeature />
</div>
```

**3. Group-based dashboards**:
```typescript
const dashboardSections = computed(() => {
  return publicGroups.value
    .filter(g => isGroupMember(g.id))
    .map(g => ({
      title: g.name,
      description: g.description,
    }));
});
```

**4. Feature flags by group**:
```typescript
const canAccessBeta = computed(() => 
  isAnyGroupMember([betaTestersId, developerGroupId])
);
```

### Managing Public Groups

**Admin Panel** (requires `admin.manage` permission):
1. Navigate to Admin Panel > Groups
2. Create group with "Public" toggle enabled
3. Add members to group

**API Endpoints**:
```bash
# List all groups (includes is_public field)
GET /api/groups/list

# Create public group
POST /api/groups/create
{ "name": "Team Alpha", "description": "...", "isPublic": true }

# Update group (toggle public/permission)
PATCH /api/groups/update
{ "groupId": 5, "isPublic": false }

# Add member
POST /api/groups/add-member
{ "groupId": 5, "userId": 123 }
```

**Note**: The "Admins" system group is always permission-only and cannot be changed to public.

## �🗄️ Database

### Query Functions
```typescript
// Simple query
const users = await dbQuery('SELECT * FROM users');

// Type-safe query
const users = await dbQuery<User>('SELECT * FROM users WHERE id = $1', [id]);

// Single result
const user = await dbQueryOne<User>('SELECT * FROM users WHERE id = $1', [id]);

// Transaction
await dbTransaction(async (db) => {
  await db.query('INSERT INTO ...');
  await db.query('UPDATE ...');
});
```

### Schema Location
```typescript
server/database/schema.ts  // Table definitions & initialization
```

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - Register user
- `POST /api/users/login` - Login
- `POST /api/users/logout` - Logout
- `GET /api/users/me` - Get current user
- `PATCH /api/users/profile` - Update profile

### Admin - Users
- `GET /api/users/admin/list` - List all users
- `POST /api/users/admin/add` - Add user
- `POST /api/users/admin/delete` - Delete user
- `POST /api/users/admin/reset-password` - Reset password

### Admin - Groups
- `GET /api/groups/list` - List groups
- `POST /api/groups/create` - Create group
- `PATCH /api/groups/update` - Update group
- `POST /api/groups/delete` - Delete group
- `POST /api/groups/add-member` - Add user to group
- `POST /api/groups/remove-member` - Remove user from group

### Admin - Permissions
- `GET /api/permissions/registered` - List registered permissions
- `GET /api/permissions/group/:id` - Get group permissions
- `POST /api/permissions/add` - Add permission to group
- `POST /api/permissions/remove` - Remove permission from group

### Health & Monitoring
- `GET /api/health` - Full health check (database, email, system)
- `GET /api/healthz` - Liveness probe (fast, no dependencies)
- `GET /api/ready` - Readiness probe (checks database)

```bash
# Check application health
curl http://localhost:3000/api/health

# Quick liveness check (for Coolify/K8s)
curl http://localhost:3000/api/healthz

# Readiness check
curl http://localhost:3000/api/ready
```

## 🎨 UI Components

### Admin Components
```
app/components/admin/
├── UserManagement.vue       # User CRUD
├── GroupManagement.vue      # Group & membership management
├── PermissionManagement.vue # Permission assignment
└── AppSettings.vue          # App configuration
```

### Using Components
```vue
<AdminUserManagement @success="showSuccess" @error="showError" />
```

## 🔧 Configuration

### Environment Variables
```env
# Required
NUXT_DATABASE_TYPE=postgres
NUXT_DATABASE_HOST=localhost
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_NAME=app
NUXT_DATABASE_USER=postgres
NUXT_DATABASE_PASSWORD=password

# Optional (with defaults)
NUXT_DATABASE_SCHEMA=public
NUXT_DATABASE_SSL=false
NUXT_DATABASE_MAX_CONNECTIONS=10
NUXT_PUBLIC_APP_NAME=vocaBox
NUXT_PUBLIC_REGISTRATION_ENABLED=true

# Email (optional - for notifications)
NUXT_EMAIL_HOST=smtp.gmail.com
NUXT_EMAIL_PORT=587
NUXT_EMAIL_USER=your-email@gmail.com
NUXT_EMAIL_PASSWORD=your-app-password
NUXT_EMAIL_FROM=My App <noreply@example.com>
```

### Runtime Config
```typescript
// Access in components
const config = useRuntimeConfig();
const appName = config.public.appName;

// Access in server
const config = useRuntimeConfig();
const dbHost = config.database.host;
```

## 🌍 Internationalization (i18n)

### Using Translations
```vue
<template>
  <!-- Simple translation -->
  <h1>{{ $t('home.welcome') }}</h1>
  
  <!-- With parameters -->
  <p>{{ $t('home.welcome', { appName: 'MyApp' }) }}</p>
  
  <!-- In script -->
  <button @click="showMessage">{{ $t('common.save') }}</button>
</template>

<script setup>
const { t, locale } = useI18n();

// Use in JavaScript
const message = computed(() => t('auth.login.success'));

// Get current locale
console.log(locale.value); // 'en' or 'de'
</script>
```

### Switching Locales
```typescript
const { locale, setLocale } = useI18n();

// Switch to German
setLocale('de');

// Switch to English
setLocale('en');
```

### Adding Translations
Add keys to translation files:

**locales/en.json**:
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

**locales/de.json**:
```json
{
  "myFeature": {
    "title": "Meine Funktion",
    "description": "Funktionsbeschreibung"
  }
}
```

### Available Locales
- `en` - English (default)
- `de` - Deutsch (German)

### Language Switcher
Automatically available in layout (top-right corner)

### Email Notifications

**Define Email Templates:**
```typescript
// server/config/emails.ts
{
  key: 'user.passwordReset',
  description: 'Password reset email with link',
  template: (data: { username: string; resetLink: string; appName: string }) => ({
    subject: `Password Reset - ${data.appName}`,
    text: `Hi ${data.username},\n\nClick here: ${data.resetLink}`,
    html: `<p>Hi <strong>${data.username}</strong>,</p>
           <p><a href="${data.resetLink}">Reset Password</a></p>`,
  }),
}
```

**Send Emails (configuration check is automatic):**
```typescript
import { sendEmailTemplate } from '~/server/composables/useEmail';

// Using registered template (recommended)
await sendEmailTemplate(
  'user@example.com',
  'user.welcome',
  { username: 'john', appName: config.public.appName }
);

// Send to multiple recipients
await sendEmailTemplate(
  ['admin1@example.com', 'admin2@example.com'],
  'admin.newUser',
  { username: 'john', email: 'john@example.com', appName: 'My App' }
);

// Custom email (not using template)
await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  text: 'Plain text',
  html: '<p>HTML content</p>',
});
```

**Configuration:**
- Email is **optional** - if not configured, emails are skipped silently
- No need to check `isEmailEnabled()` manually - built into send functions
- Set `NUXT_EMAIL_HOST`, `NUXT_EMAIL_USER`, and `NUXT_EMAIL_PASSWORD` to enable
- Uses SMTP with nodemailer
- Port 587 (TLS) or 465 (SSL) supported
- Gmail requires an app-specific password

**Built-in Templates:**
- `user.welcome` - Welcome email to new users
- `admin.newUser` - Notification to admins about new registration

## 📊 Logging System

### Overview
The application includes a comprehensive logging system that tracks all important actions for audit and debugging purposes. Logs are stored in files with automatic rotation and 14-day retention.

### Log Configuration
- **Location:** `./logs/` directory
- **Format:** JSON structured logs with timestamps
- **Rotation:** Daily rotation (new file each day)
- **Retention:** 14 days (old logs automatically deleted)
- **Compression:** Gzip compression for rotated files

### Available Logging Functions

```typescript
import { 
  logActivity,        // Generic activity logging
  logEmailSent,       // Email sending
  logUserEvent,       // User operations
  logGroupEvent,      // Group operations
  logPermissionEvent, // Permission changes
  logSettingsEvent    // Settings changes
} from '~/server/utils/logger';
```

### Usage Examples

**Generic Activity:**
```typescript
logActivity('custom.action', {
  userId: 123,
  details: 'Additional info',
  anyData: 'you want to log'
});
```

**Email Sent:**
```typescript
logEmailSent(
  'user@example.com',
  'Welcome to Our App',
  'user.welcome' // optional template name
);
```

**User Events:**
```typescript
// User created
logUserEvent('created', userId, username, adminUsername);

// User deleted
logUserEvent('deleted', userId, username, adminUsername);

// Password reset
logUserEvent('password_reset', userId, username, adminUsername);
```

**Group Events:**
```typescript
// Group created
logGroupEvent('created', groupId, groupName, adminUsername);

// Group updated
logGroupEvent('updated', groupId, groupName, adminUsername, {
  fields: ['name', 'description']
});

// Member added
logGroupEvent('member_added', groupId, groupName, adminUsername, {
  addedUser: 'john_doe'
});
```

**Permission Events:**
```typescript
// Permission added
logPermissionEvent('added', groupId, groupName, 'feature.action', adminUsername);

// Permission removed
logPermissionEvent('removed', groupId, groupName, 'feature.action', adminUsername);
```

**Settings Changes:**
```typescript
logSettingsEvent(
  'registration_enabled',
  false, // old value
  true,  // new value
  adminUsername
);
```

### Viewing Logs

**Admin Panel:**
- Navigate to Admin Panel > Logs tab
- Search logs by text content
- View detailed JSON data for each entry
- Pagination for large log files

**API Endpoint:**
```bash
# Get recent logs
curl http://localhost:3000/api/logs?limit=50

# Search logs
curl http://localhost:3000/api/logs?search=email

# Pagination
curl http://localhost:3000/api/logs?limit=50&offset=100
```

**Direct File Access:**
```bash
# View today's log
cat logs/app-$(date +%Y-%m-%d).log

# Search in logs
grep "email.sent" logs/*.log

# View compressed logs
zcat logs/app-2024-01-15.log.gz
```

### Logged Events

The system automatically logs:
- **Email Events:** All sent emails with recipients and subjects
- **User Management:** User creation, deletion, password resets
- **Group Operations:** Group CRUD, member additions/removals
- **Permission Changes:** Permission assignments and removals
- **Settings Changes:** Application setting modifications

### Best Practices

1. **Use Specific Functions:** Use the appropriate log function for each event type
2. **Include Context:** Always include who performed the action (`by` parameter)
3. **Structured Data:** Put additional context in the `data` object
4. **Don't Log Sensitive Info:** Never log passwords, tokens, or personal data
5. **Search-Friendly:** Use consistent activity names for easy searching

### Log Format

Each log entry contains:
```json
{
  "activity": "email.sent",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "data": {
    "to": "user@example.com",
    "subject": "Welcome Email"
  }
}
```


## 🧪 Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test
npm run test -- users.test.ts
```

### Test Structure
```
test/
├── server/
│   ├── api/              # API endpoint tests
│   ├── composables/      # Server composable tests
│   └── utils/            # Utility function tests
└── utils/
    └── test-helpers.ts   # Testing utilities
```

## 🐳 Docker

```bash
# Start all services
docker-compose up

# Build and start
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
```

## 📝 Key Concepts

### Session Management
- Session-based authentication
- 7-day session duration
- HTTP-only secure cookies
- Sessions stored in database

### Permission Model
- **Capability-based** (not resource-based)
- One permission = one feature
- Permissions assigned to groups
- Users inherit from group membership

### Groups
- Users can be in multiple groups
- Permissions accumulate (OR logic)
- "Admins" group is protected system group

## 🎯 Common Tasks

### Add a New Protected Feature
1. Register permission in `server/config/permissions.ts`
2. Add route mapping in `app/middleware/permissions.global.ts`
3. Protect API with `requirePermission(event, 'key')`
4. Use `v-can="'key'"` in UI
5. Restart app (auto-syncs to database)

## 🔑 API Token Authentication

### Overview
Users can create API tokens to authenticate applications and scripts. Tokens:
- Are hashed in database (SHA-256)
- Inherit user's group permissions
- Never expire (must be manually deleted)
- Are rate limited (100 requests/minute per token)
- Show plaintext only once at creation

### Usage Examples

**cURL:**
```bash
# Using Bearer token
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/users/me

# Any API endpoint that requires authentication
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/groups/list
```

**JavaScript/Fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});
```

**Node.js:**
```javascript
import fetch from 'node-fetch';

const token = process.env.API_TOKEN;
const response = await fetch('http://localhost:3000/api/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Token Management

**Create Token (Web UI):**
1. Navigate to Profile page
2. Scroll to "API Tokens" section
3. Click "Create New Token"
4. Enter name (e.g., "Mobile App", "CI/CD")
5. Copy token immediately (won't be shown again)

**API Endpoints:**
```typescript
// Create token
POST /api/tokens/create
Body: { name: "Token Name" }
Response: { success: true, token: "...", id: 1, name: "...", created_at: "..." }

// List user's tokens
GET /api/tokens/list
Response: { success: true, tokens: [...] }

// Delete token
DELETE /api/tokens/:id
Response: { success: true, message: "Token deleted successfully" }
```

### Rate Limiting
- 100 requests per minute per token
- Returns 429 status when exceeded
- Counter resets after 1 minute
- In-memory store (resets on server restart)

### Security Notes
- ⚠️ Tokens shown only once at creation
- Stored as SHA-256 hash in database
- Use HTTPS in production
- Tokens have same permissions as user
- Automatically logged in audit system

### Add a New API Endpoint
```typescript
// server/api/endpoint.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // Process request
  return { success: true };
});
```

### Add a New Page
```vue
<!-- app/pages/feature.vue -->
<template>
  <div>Your page content</div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});
</script>
```

## 🔍 Debugging

### Server Logs
- Database connection status
- Permission sync results
- API errors with stack traces

### Client Debugging
```typescript
// Check permissions
const { permissions, hasPermission } = useUserGroups();
console.log('User permissions:', permissions.value);
console.log('Has permission:', hasPermission('admin.manage'));
```

### Database Queries
```typescript
// Enable query logging in connector
console.log('Executing:', sql, params);
```

## 📚 Additional Resources

- [Developer Guide](DEV_GUIDE.md) - Detailed documentation
- [README.md](README.md) - Setup & deployment
- [PERMISSION_DEVELOPER_GUIDE.md](PERMISSION_DEVELOPER_GUIDE.md) - Permission system details
