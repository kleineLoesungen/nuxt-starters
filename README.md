# app

A modern Nuxt 3 web application with **capability-based permissions**, PostgreSQL database, and Docker support.

## Features

- ✅ **Nuxt 4.2.2** with Vue 3 and TypeScript
- ✅ **PostgreSQL database** with flexible connector architecture
- ✅ **Capability-based permission system** - code-first permissions that auto-sync to database
- ✅ **Session-based authentication** with secure HTTP-only cookies
- ✅ **Internationalization (i18n)** - English and German support with language switcher
- ✅ **Admin panel** with protected system resources
  - User management (add, delete, reset passwords)
  - Group management with membership control
  - Permission assignment per group
  - Application settings
- ✅ **Email notifications** (optional SMTP)
- ✅ **Health monitoring** with comprehensive health check endpoints
- ✅ **Tailwind CSS** for styling
- ✅ **Docker Compose** setup for production
- ✅ **Vitest** testing framework (45+ tests)

## Documentation

- **[DEV_QUICK_REFERENCE.md](DEV_QUICK_REFERENCE.md)** - Quick reference for developers
- **[DEV_GUIDE.md](DEV_GUIDE.md)** - Comprehensive developer guide with detailed explanations
- [test/README.md](test/README.md) - Testing documentation

---

## Quick Start

Choose your preferred setup method:

- **[Docker Setup](#docker-setup)** (Recommended) - Everything in containers
- **[Local Setup](#local-setup)** - Run on your machine with external PostgreSQL

---

## Prerequisites

### For Docker Setup
- **Docker** 20.10+ and **Docker Compose** 2.0+

### For Local Setup
- **Node.js** 18+ and npm
- **PostgreSQL** 16+

---

## Docker Setup

### Option 1: Quick Start with Docker Compose

```bash
# 1. Clone the repository
git clone <repository-url>
cd nuxt-starters

# 2. Start everything (app + database)
docker-compose up -d

# 3. Open your browser
# → http://localhost:3000
```

**That's it!** The application will:
- Start PostgreSQL database
- Initialize database schema automatically
- Sync permissions from code
- Create default Admins group
- Make the app available at http://localhost:3000

### Option 2: With Custom Configuration

```bash
# 1. Create environment file
cp .env.example .env

# 2. Edit .env with your settings (see Configuration section below)
nano .env

# 3. Start with custom config
docker-compose --env-file .env up -d

# 4. View logs
docker-compose logs -f app
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Access database
docker exec -it app-db psql -U postgres -d app
```

---

## Local Setup

### Step 1: Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd nuxt-starters

# Install packages
npm install
```

### Step 2: Set Up PostgreSQL

**Option A: Use Docker for database only**
```bash
# Start PostgreSQL container
docker run -d \
  --name app-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app \
  -p 5432:5432 \
  postgres:16-alpine

# Or use docker-compose for just the database
docker-compose up -d db
```

**Option B: Use existing PostgreSQL**
```bash
# Connect to your PostgreSQL
psql -U postgres

# Create database and schema
CREATE DATABASE app;
\c app
CREATE SCHEMA app;
```

### Step 3: Configure Environment

```bash
# Create environment file
cp .env.example .env
```

Edit `.env` with your database connection:
```env
# Database Configuration (Required)
NUXT_DATABASE_TYPE=postgres
NUXT_DATABASE_HOST=localhost
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_NAME=app
NUXT_DATABASE_USER=postgres
NUXT_DATABASE_PASSWORD=postgres
NUXT_DATABASE_SCHEMA=app

# Email Configuration (Optional - leave commented to disable)
# NUXT_EMAIL_HOST=smtp.gmail.com
# NUXT_EMAIL_PORT=587
# NUXT_EMAIL_USER=your-email@gmail.com
# NUXT_EMAIL_PASSWORD=your-app-password
# NUXT_EMAIL_FROM=app <noreply@example.com>
```

### Step 4: Run the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm run start
```

Open http://localhost:3000

---

## Configuration

### Environment Variables

All configuration uses the `NUXT_` prefix for Nuxt's runtime config:

#### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NUXT_DATABASE_TYPE` | Database type | `postgres` | `postgres` |
| `NUXT_DATABASE_HOST` | Database host | `localhost` | `localhost` or `db` (Docker) |
| `NUXT_DATABASE_PORT` | Database port | `5432` | `5432` |
| `NUXT_DATABASE_NAME` | Database name | `app` | `app` |
| `NUXT_DATABASE_USER` | Database user | `postgres` | `postgres` |
| `NUXT_DATABASE_PASSWORD` | Database password | `''` | `your_secure_password` |

#### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NUXT_DATABASE_SCHEMA` | PostgreSQL schema | `public` | `app` |
| `NUXT_DATABASE_SSL` | Enable SSL connection | `false` | `true` |
| `NUXT_DATABASE_MAX_CONNECTIONS` | Connection pool size | `10` | `20` |
| `NUXT_DATABASE_IDLE_TIMEOUT` | Idle timeout (ms) | `30000` | `60000` |
| `NUXT_DATABASE_CONNECTION_TIMEOUT` | Connection timeout (ms) | `2000` | `5000` |
| `NUXT_PUBLIC_APP_NAME` | Application name | `app` | `My App` |

#### Email Configuration (Optional)

Leave `NUXT_EMAIL_HOST` empty to disable email notifications:

| Variable | Description | Example |
|----------|-------------|---------|
| `NUXT_EMAIL_HOST` | SMTP server | `smtp.gmail.com` |
| `NUXT_EMAIL_PORT` | SMTP port | `587` |
| `NUXT_EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `NUXT_EMAIL_PASSWORD` | SMTP password | `your-app-password` |
| `NUXT_EMAIL_FROM` | From address | `app <noreply@example.com>` |

### Example .env Files

**Development (.env)**:
```env
NUXT_DATABASE_TYPE=postgres
NUXT_DATABASE_HOST=localhost
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_NAME=app
NUXT_DATABASE_USER=postgres
NUXT_DATABASE_PASSWORD=postgres
NUXT_DATABASE_SCHEMA=app
```

**Production (.env.production)**:
```env
NODE_ENV=production
NUXT_DATABASE_TYPE=postgres
NUXT_DATABASE_HOST=your-production-host.com
NUXT_DATABASE_PORT=5432
NUXT_DATABASE_NAME=app_prod
NUXT_DATABASE_USER=app_user
NUXT_DATABASE_PASSWORD=strong_secure_password_here
NUXT_DATABASE_SCHEMA=app
NUXT_DATABASE_SSL=true
NUXT_DATABASE_MAX_CONNECTIONS=20
NUXT_EMAIL_HOST=smtp.gmail.com
NUXT_EMAIL_PORT=587
NUXT_EMAIL_USER=noreply@yourdomain.com
NUXT_EMAIL_PASSWORD=app_password
NUXT_EMAIL_FROM=app <noreply@yourdomain.com>
```

---

## First-Time Setup

### 1. Register First User

Navigate to http://localhost:3000/users/register and create your account.

### 2. Access Admin Panel

After registration:
1. Login at http://localhost:3000/users/login
2. Go to http://localhost:3000/users/admin
3. The first registered user is automatically added to the **Admins** group

### 3. System Groups

The application creates this default group on first startup:

- **Admins** (Protected system group)
  - Has `admin.manage` permission by default
  - Cannot be deleted or renamed
  - `admin.manage` permission cannot be removed

You can create additional groups through the admin panel at http://localhost:3000/users/admin.

---

## Building for Production

### Build Locally

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```

The build output will be in `.output/` directory.

### Build with Docker

```bash
# Build Docker image
docker build -t app:latest .

# Run container
docker run -d \
  --name app \
  -p 3000:3000 \
  -e NUXT_DATABASE_HOST=your-db-host \
  -e NUXT_DATABASE_PORT=5432 \
  -e NUXT_DATABASE_NAME=app \
  -e NUXT_DATABASE_USER=app_user \
  -e NUXT_DATABASE_PASSWORD=secure_password \
  -e NUXT_DATABASE_SSL=true \
  app:latest
```

### Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Use strong database credentials
- [ ] Enable `NUXT_DATABASE_SSL=true` for remote databases
- [ ] Configure firewall rules (allow only port 3000)
- [ ] Set up HTTPS with reverse proxy (nginx/traefik)
- [ ] Configure database backups
- [ ] Set up log rotation
- [ ] Monitor application health (`/api/health`)
- [ ] Use process manager (PM2) or container orchestration (Docker Swarm/Kubernetes)

---

## Database Management

### Initialization

The database schema is **automatically initialized** on first startup:

1. Creates tables (users, sessions, groups, user_groups, permissions)
2. Creates indexes for performance
3. Creates default Admins group
4. Syncs permissions from code to database

**Location**: `server/database/schema.ts`

### Schema

```
users
├── id (SERIAL PRIMARY KEY)
├── username (VARCHAR UNIQUE)
├── email (VARCHAR UNIQUE)
├── password (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

sessions
├── id (VARCHAR PRIMARY KEY)
├── user_id (INTEGER → users.id)
├── expires_at (TIMESTAMP)
└── created_at (TIMESTAMP)

groups
├── id (SERIAL PRIMARY KEY)
├── name (VARCHAR UNIQUE)
├── description (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

user_groups (junction table)
├── user_id (INTEGER → users.id)
├── group_id (INTEGER → groups.id)
├── joined_at (TIMESTAMP)
└── PRIMARY KEY (user_id, group_id)

permissions
├── id (SERIAL PRIMARY KEY)
├── group_id (INTEGER → groups.id)
├── permission_key (VARCHAR)
├── created_at (TIMESTAMP)
└── UNIQUE (group_id, permission_key)
```

### Manual Database Access

**Docker**:
```bash
# Access PostgreSQL CLI
docker exec -it app-db psql -U postgres -d app

# Set schema
\c app
SET search_path TO app, public;

# List tables
\dt

# Query users
SELECT * FROM users;
```

**Local**:
```bash
psql -U postgres -d app
SET search_path TO app, public;
```

### Backup and Restore

**Backup**:
```bash
# Docker
docker exec app-db pg_dump -U postgres app > backup.sql

# Local
pg_dump -U postgres -d app > backup.sql
```

**Restore**:
```bash
# Docker
docker exec -i app-db psql -U postgres -d app < backup.sql

# Local
psql -U postgres -d app < backup.sql
```

---

## Development

### Running Tests

```bash
# All tests
npm run test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific file
npm run test -- users.test.ts
```

### Project Structure

```
/
├── app/                          # Client application
│   ├── assets/css/               # Tailwind styles
│   ├── components/               # Vue components
│   │   └── admin/                # Admin UI components
│   ├── composables/              # Client composables
│   │   └── useUserGroups.ts      # Permission management
│   ├── layouts/                  # Layouts
│   │   └── default.vue           # Main layout with nav
│   ├── middleware/               # Route guards
│   │   └── permissions.global.ts # Permission checks
│   ├── pages/                    # File-based routing
│   │   ├── index.vue             # Home
│   │   ├── permissions.vue       # Permissions list - Protected page
│   │   └── users/                # User pages
│   └── plugins/                  # Vue plugins
│       └── permissions.ts        # v-can directive
│
├── server/                       # Server application
│   ├── api/                      # API endpoints
│   │   ├── users/                # Authentication
│   │   ├── groups/               # Group management
│   │   ├── permissions/          # Permission management
│   │   └── settings/             # App settings
│   ├── composables/              # Server composables
│   │   ├── useDatabase.ts        # DB utilities
│   │   ├── useUsers.ts           # User queries
│   │   └── usePermissions.ts     # Permission queries
│   ├── config/                   # Configuration
│   │   └── permissions.ts        # Permission registry
│   ├── database/                 # Database layer
│   │   ├── schema.ts             # Table definitions
│   │   ├── connector-factory.ts  # DB factory
│   │   └── connectors/           # Database drivers
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
├── .env                          # Environment variables
├── docker-compose.yml            # Docker setup
├── Dockerfile                    # App container
├── nuxt.config.ts                # Nuxt config
└── vitest.config.ts              # Test config
```

---

## Troubleshooting

### Database Connection Issues

**Error**: "Connection refused" or "Cannot connect to database"

**Solutions**:
1. Check if PostgreSQL is running:
   ```bash
   # Docker
   docker ps | grep postgres
   
   # Local
   pg_isready -h localhost -p 5432
   ```

2. Verify `.env` configuration matches your database

3. For Docker, ensure `NUXT_DATABASE_HOST=db` (service name in docker-compose)

4. For local, ensure `NUXT_DATABASE_HOST=localhost`

### Permission Issues

**Error**: "403 Permission denied" when accessing admin panel

**Solutions**:
1. Check user is in Admins group:
   ```sql
   SELECT u.username, g.name 
   FROM users u
   JOIN user_groups ug ON u.id = ug.user_id
   JOIN groups g ON ug.group_id = g.id
   WHERE u.username = 'your-username';
   ```

2. Verify Admins group has `admin.manage` permission:
   ```sql
   SELECT g.name, p.permission_key
   FROM permissions p
   JOIN groups g ON p.group_id = g.id
   WHERE g.name = 'Admins';
   ```

3. Clear session and login again

**Tip**: For pages that need multiple permissions, consider using **component-level protection** instead of route protection. This allows users to see sections they have access to rather than blocking the entire page. See [DEV_GUIDE.md](DEV_GUIDE.md#component-level-protection) for examples.

### Email Not Sending

**Issue**: Email notifications not working

**Solutions**:
1. Check SMTP configuration in `.env`
2. For Gmail, use [App Password](https://support.google.com/accounts/answer/185833)
3. Verify email settings are enabled in admin panel
4. Check server logs for errors:
   ```bash
   # Docker
   docker-compose logs app
   ```

### Port Already in Use

**Error**: "Port 3000 is already in use"

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"
```

### Schema Not Found

**Error**: "Schema app does not exist"

**Solutions**:
1. Verify `NUXT_DATABASE_SCHEMA=app` in `.env`
2. Create schema manually:
   ```sql
   CREATE SCHEMA app;
   ```
3. Restart application to initialize tables

---

## Internationalization (i18n)

The application supports multiple languages with automatic detection and user preference storage.

### Supported Languages

- 🇬🇧 **English** (default)
- 🇩🇪 **German** (Deutsch)

### Features

- **Language switcher** in the header (right side)
- **Browser detection** - Automatically uses browser language on first visit
- **Cookie persistence** - Remembers user's language preference
- **Clean URLs** - No `/en` or `/de` prefix (uses `no_prefix` strategy)
- **Full coverage** - All pages and components translated

### For Users

1. Click the language dropdown in the top-right corner
2. Select your preferred language (EN or DE)
3. The choice is saved in a cookie and persists across sessions

### For Developers

Translation files are located in `i18n/locales/`:
- `en.json` - English translations
- `de.json` - German translations (Deutsch)

**Using translations in templates**:
```vue
<template>
  <h1>{{ $t('auth.login.title') }}</h1>
  <button>{{ $t('common.save') }}</button>
</template>
```

**Using translations in scripts**:
```typescript
const { t } = useI18n()
const message = t('auth.login.title')
```

**Adding new translations**:
1. Add keys to both `en.json` and `de.json`
2. Use dot notation for organization: `section.subsection.key`
3. Keep structure consistent across all language files

**Adding a new language**:
1. Create `i18n/locales/xx.json` (e.g., `fr.json` for French)
2. Add locale config in [nuxt.config.ts](nuxt.config.ts#L13-L16):
   ```typescript
   { code: 'fr', iso: 'fr-FR', name: 'Français', files: ['fr.json'] }
   ```
3. Copy translations from `en.json` and translate

See [DEV_GUIDE.md](DEV_GUIDE.md#internationalization-i18n) for complete i18n documentation.

---

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login
- `POST /api/users/logout` - Logout
- `GET /api/users/me` - Get current user with permissions

### Admin - Users
- `GET /api/users/admin/list` - List all users
- `POST /api/users/admin/add` - Add new user
- `POST /api/users/admin/delete` - Delete user
- `POST /api/users/admin/reset-password` - Reset password

### Admin - Groups
- `GET /api/groups/list` - List all groups
- `POST /api/groups/create` - Create group
- `PATCH /api/groups/update` - Update group
- `POST /api/groups/delete` - Delete group (except Admins)
- `GET /api/groups/members` - Get group members
- `POST /api/groups/add-member` - Add user to group
- `POST /api/groups/remove-member` - Remove user from group

### Admin - Permissions
- `GET /api/permissions/registered` - Get all registered permissions
- `GET /api/permissions/group/[id]` - Get permissions for group
- `POST /api/permissions/add` - Add permission to group
- `POST /api/permissions/remove` - Remove permission from group

### Settings
- `GET /api/settings` - Get public settings
- `PATCH /api/settings/update` - Update settings (admin only)

### Health & Monitoring
- `GET /api/health` - Comprehensive health check with all dependencies
- `GET /api/healthz` - Simple liveness check (fast, no dependencies)
- `GET /api/ready` - Readiness check for load balancers

**Health Check Response Example**:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "responseTime": "15ms",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": "12ms"
    },
    "email": {
      "status": "configured",
      "critical": false
    },
    "application": {
      "status": "up",
      "name": "My App",
      "version": "1.0.0",
      "environment": "production",
      "uptime": 3600
    },
    "system": {
      "memory": {
        "used": "45MB",
        "total": "128MB"
      }
    }
  }
}
```

**For Coolify/Docker**: Configure health check in `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/healthz"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

See [DEV_QUICK_REFERENCE.md](DEV_QUICK_REFERENCE.md) for detailed examples.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Need Help?

- **Quick Reference**: [DEV_QUICK_REFERENCE.md](DEV_QUICK_REFERENCE.md)
- **Developer Guide**: [DEV_GUIDE.md](DEV_GUIDE.md)
- **Nuxt Docs**: https://nuxt.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
