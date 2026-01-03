# Test Suite

Comprehensive test suite for app covering authentication, permissions, database operations, and API endpoints.

## Quick Start

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Directory Structure

```
test/
├── setup.ts                          # Global test setup
├── utils/
│   └── test-helpers.ts              # Shared test utilities
└── server/
    ├── utils/
    │   └── auth.test.ts             # Password hashing, validation
    ├── composables/
    │   ├── useDatabase.test.ts      # Database operations
    │   ├── useEmail.test.ts         # Email functionality
    │   └── usePermissions.test.ts   # Permission checking logic
    └── api/
        ├── users.test.ts            # User authentication & admin
        ├── groups.test.ts           # Group management
        ├── permissions.test.ts      # Permission management
        ├── settings.test.ts         # Application settings
        ├── tokens.test.ts           # API token management
        └── logs.test.ts             # Application logs
```

## Prerequisites

1. **PostgreSQL**: Running and accessible
2. **Node.js**: Version 18+ with npm
3. **Dependencies**: Run `npm install`

The test database schema (`app_test`) is automatically created and initialized by the test setup.

## Writing New Tests

### Structure

Each test file should follow this pattern:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mockRuntimeConfig } from '../../utils/test-helpers';

describe('Feature Name', () => {
  beforeAll(() => {
    // Setup before all tests in this file
  });

  afterAll(() => {
    // Cleanup after all tests in this file
  });

  describe('Subfeature', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

### Adding Tests for New Features

1. **Composables**: Create test files in `test/server/composables/`
2. **API Routes**: Create test files in `test/server/api/`
3. **Connectors**: Create test files in `test/server/database/connectors/`
4. **Components**: Create test files in `test/app/components/`

### Test Helpers

Use shared utilities from `test/utils/test-helpers.ts`:

```typescript
import { mockRuntimeConfig, getTestDatabaseConfig } from '../../utils/test-helpers';

// Mock Nuxt runtime config
mockRuntimeConfig();
Test Summary

**Total: 75 tests passing** across 10 test files

### Server Utilities

**test/server/utils/auth.test.ts** (12 tests)
- ✅ Password hashing and verification (bcrypt)
- ✅ Session ID generation
- ✅ Email validation
- ✅ Username validation (alphanumeric + underscores)
- ✅ Password validation (minimum 8 characters)
- ✅ Random password generation

### Composables

**test/server/composables/useDatabase.test.ts** (12 tests)
- ✅ Database connection with environment variables
- ✅ Connection singleton pattern
- ✅ Simple query execution
- ✅ Parameterized queries with SQL injection protection
- ✅ Single result queries
- ✅ Transaction execution and commit
- ✅ Transaction rollback on error
- ✅ Nested queries in transactions

**test/server/composables/useEmail.test.ts** (7 tests)
- ✅ Email configuration detection
- ✅ Email enabled/disabled check
- ✅ Send email function (graceful failure when not configured)
- ✅ Welcome email generation
- ✅ Admin notification email generation

**test/server/composables/usePermissions.test.ts** (10 tests)
- ✅ Single permission checking (`checkPermission`)
- ✅ Case-sensitive permission matching
- ✅ Exact string matching (no partial matches)
- ✅ Empty permissions array handling
- ✅ Multiple permission checks (OR logic)
- ✅ Helper functions for `hasAnyPermission` logic

### API Endpoints

**test/server/api/users.test.ts** (14 tests)
- ✅ User registration with validation
- ✅ Duplicate username/email rejection
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Registration without email (optional)
- ✅ User login with username or email
- ✅ **Admin Functions** (require `admin.manage` permission):
  - Add new user
  - Reset user password
  - Delete user
  - List all users

**test/server/api/groups.test.ts** (9 tests)
- ✅ **Group Management** (require `admin.manage` permission):
  - List all groups
  - Create group (permission-only)
  - Create public group
  - Update group
  - Update group isPublic field
  - Delete group
  - Add group member
  - Remove group member
  - Get group members

**test/server/api/permissions.test.ts** (4 tests)
- ✅ **Permission Management** (require `admin.manage` permission):
  - List registered permissions
  - Add permission to group
  - Remove permission from group
  - Get group permissions

**test/server/api/settings.test.ts** (2 tests)
- ✅ **Settings Management** (require `admin.manage` permission):
  - Get application settings
  - Update application settings

**test/server/api/tokens.test.ts** (4 tests)
- ✅ **API Token Management**:
  - Create token requires authentication
  - List tokens requires authentication
  - Delete token requires authentication
  - Bearer token authentication with invalid token rejection

**test/server/api/logs.test.ts** (1 test)
- ✅ **Application Logs** (require `admin.manage` permission):
  - Get logs requires authentication

Test Coverage

### ✅ Covered Areas
- Database connection and query execution
- Transaction support with rollback
- User authentication (registration, login)
- Password hashing and validation
- Session management
- Email configuration and sending
- **Permission system**:
  - Permission checking logic
  - Single and multiple permission validation
  - OR logic for multi-permission routes
- Admin API authentication requirements
- Group management API (including isPublic field)
- Permission assignment API
- Settings management API
- API token management

### ⚠️ Not Yet Covered
- **Admins group protection**: Cannot change Admins to public type (requires authenticated session)
- Permission system integration (actual database queries)
- Protected route middleware behavior
- Component-level permission checks (v-can directive)
- Protected system resources (Admins group, admin.manage permission)
- Full API workflows with authenticated sessions
- Error handling edge cases
- Frontend component tests
- Email delivery (SMTP integration tests)

## Database Configuration

Tests use a separate test database (`app_test` schema) to avoid conflicts with development data.

**Environment Variables** (automatically configured by Nuxt test utils):
- `NUXT_DATABASE_TYPE=postgres`
- `NUXT_DATABASE_HOST=localhost`
- `NUXT_DATABASE_PORT=5432`
- `NUXT_DATABASE_NAME=app` (with `app_test` schema)
- `NUXT_DATABASE_USER=postgres`
- `NUXT_DATABASE_PASSWORD=<your-password>`
- `NUXT_DATABASE_SCHEMA=app_test`

## Writing New Tests

### Test File Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Feature Name', async () => {
  await setup({
    server: true,  // Start Nuxt server for API tests
  });

  describe('Endpoint or Function', () => {
    it('should do something', async () => {
      const response = await $fetch('/api/endpoint');
      expect(response).toBeDefined();
    });

    it('should require authentication', async () => {
      try {
        await $fetch('/api/protected');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
```

### Testing Permissions

```typescript
import { checkPermission } from '../../../server/composables/usePermissions';

it('should check permission correctly', () => {
  const permissions = ['admin.manage', 'reports.view'];
  expect(checkPermission(permissions, 'admin.manage')).toBe(true);
  expect(checkPermission(permissions, 'analytics.view')).toBe(false);
});
```

### Testing API Authentication

```typescript
it('should require authentication', async () => {
  try {
    await $fetch('/api/protected-endpoint', {
      method: 'POST',
      body: { data: 'value' },
    });
    expect.fail('Should have thrown an error');
  } catch (error: any) {
    expect(error.statusCode).toBe(401);
  }
});
```

## Test Organization

- **Unit Tests**: `test/server/composables/` - Test individual functions
- **API Tests**: `test/server/api/` - Test endpoints with full Nuxt server
- **Utility Tests**: `test/server/utils/` - Test helper functions

## Notes

- Tests automatically use `app_test` schema
- Each test file runs in isolation
- Database is initialized before API tests
- Permissions are synced from code on test startup
- Email sending is mocked (no actual SMTP required)
- Authentication checks test for 401/403 status codes
