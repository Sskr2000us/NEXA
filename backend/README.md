# NEXA Backend - Setup & Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- PostgreSQL database with NEXA schema deployed

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the following values:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `JWT_SECRET` - Secure random string (use the same secret as Supabase JWT)
- `CORS_ORIGINS` - Your frontend URL(s)

### 3. Run Development Server

```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs

## 📖 API Documentation

### Authentication Endpoints

**POST /api/v1/auth/signup**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**POST /api/v1/auth/signin**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**GET /api/v1/auth/me** (Protected)
- Headers: `Authorization: Bearer <token>`

### Homes Endpoints

**GET /api/v1/homes** - Get all homes for current user

**POST /api/v1/homes** - Create a new home
```json
{
  "name": "My Smart Home",
  "address_line1": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "timezone": "America/Los_Angeles"
}
```

**GET /api/v1/homes/:id/dashboard** - Get home dashboard summary (uses materialized view)

### Devices Endpoints

**GET /api/v1/homes/:homeId/devices** - Get all devices
- Query params: `?deviceType=light&isOnline=true&isFavorite=true`

**POST /api/v1/homes/:homeId/devices** - Register new device

**GET /api/v1/homes/:homeId/devices/:id/health** - Get device health (uses materialized view)

**POST /api/v1/homes/:homeId/devices/:id/state** - Update device state
```json
{
  "state": {
    "power": true,
    "brightness": 80
  }
}
```

## 🏗️ Architecture

### Project Structure
```
backend/
├── src/
│   ├── common/              # Shared utilities
│   │   ├── decorators/      # Custom decorators (@GetCurrentUser, @Public)
│   │   ├── guards/          # Auth guards (JWT)
│   │   └── supabase/        # Supabase client service
│   │
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication (JWT, Supabase Auth)
│   │   ├── homes/           # Home management
│   │   ├── devices/         # Device CRUD & control
│   │   ├── automations/     # Automation engine
│   │   ├── diagnostics/     # Device diagnostics
│   │   ├── energy/          # Energy monitoring
│   │   ├── alerts/          # Alert management
│   │   ├── insights/        # AI insights
│   │   ├── telemetry/       # Telemetry streams
│   │   └── realtime/        # WebSocket gateway
│   │
│   ├── app.module.ts        # Root module
│   └── main.ts              # Application entry point
│
├── .env.example             # Environment template
├── package.json
└── tsconfig.json
```

### Key Design Patterns

1. **BFF (Backend for Frontend)** - API tailored for frontend needs
2. **Row Level Security** - All queries respect Supabase RLS policies
3. **Materialized Views** - Dashboard queries use pre-aggregated views
4. **JWT Authentication** - Supabase Auth tokens validated
5. **Soft Deletes** - Data preserved with `deleted_at` timestamp
6. **Audit Logging** - Automatic via database triggers

## 🔒 Security

### Authentication Flow
1. User signs in → Supabase Auth returns JWT
2. Frontend sends JWT in `Authorization: Bearer <token>` header
3. JwtAuthGuard validates token
4. Token payload extracted to `@GetCurrentUser()` decorator
5. All DB queries include user context (RLS enforced)

### Protected Routes
All routes are protected by default via APP_GUARD. Use `@Public()` decorator for public routes:

```typescript
@Public()
@Post('signup')
async signUp(@Body() signUpDto: SignUpDto) {
  return this.authService.signUp(signUpDto);
}
```

## 📊 Database Integration

### Supabase Client
- **Client**: Respects RLS, used for user-context operations
- **Service Client**: Bypasses RLS, used for admin operations

```typescript
// User-context query (RLS applied)
const client = this.supabaseService.getClient();

// Admin query (bypasses RLS)
const serviceClient = this.supabaseService.getServiceClient();

// Query with specific user token
const userClient = this.supabaseService.getClientWithToken(token);
```

### Materialized Views
Refresh materialized views for updated analytics:

```typescript
await this.supabaseService.refreshMaterializedViews();
```

Or manually:
```sql
SELECT refresh_materialized_views();
```

## 🚀 Deployment to Render

### 1. Create Render Account
Sign up at [render.com](https://render.com)

### 2. Create Web Service
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment**: Node

### 3. Add Environment Variables
Add all variables from `.env`:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET
- CORS_ORIGINS (your Vercel frontend URL)
- NODE_ENV=production

### 4. Deploy
Push to GitHub → Render auto-deploys

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Development Tips

### 1. Add New Module
```bash
nest g module modules/my-feature
nest g service modules/my-feature
nest g controller modules/my-feature
```

### 2. Database Schema Changes
After updating database schema, restart the server to clear caches.

### 3. Debugging
```bash
npm run start:debug
```
Then attach debugger to port 9229.

### 4. Code Quality
```bash
# Lint
npm run lint

# Format
npm run format
```

## 🔄 Next Steps

1. ✅ Implement remaining modules (Automations, Diagnostics, Energy, Alerts, Insights, Telemetry)
2. ✅ Add WebSocket gateway for real-time updates
3. ✅ Implement scheduled tasks (health checks, materialized view refresh)
4. ✅ Add comprehensive error handling
5. ✅ Write unit tests
6. ✅ Set up CI/CD pipeline

## 🐛 Troubleshooting

**CORS errors**
- Add frontend URL to `CORS_ORIGINS` in .env

**JWT validation fails**
- Ensure `JWT_SECRET` matches Supabase JWT secret
- Check token expiration

**RLS policy denies access**
- Verify user has proper permissions in `home_members` table
- Check `users` table has correct user record

**Supabase connection fails**
- Verify SUPABASE_URL and keys are correct
- Check network connectivity

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [NEXA Database Schema](../database/README.md)

---

**Status**: ✅ Phase 1 Complete - Backend Foundation Ready!
