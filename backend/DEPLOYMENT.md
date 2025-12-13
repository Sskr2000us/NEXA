# NEXA Backend - Deployment Guide

## 📦 Deployment Options

### Option 1: Deploy to Render (Recommended)

#### Using Render Blueprint (Automated)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Backend Phase 1 complete"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Select the `backend` directory
   - Render will auto-detect `render.yaml`

3. **Set Environment Variables**
   In Render Dashboard, add:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `JWT_SECRET` - Must match Supabase JWT secret
   - `CORS_ORIGINS` - Your frontend URL (e.g., `https://nexa.vercel.app`)

4. **Deploy**
   - Click "Apply" - Render will build and deploy automatically
   - Your API will be available at: `https://nexa-backend.onrender.com`

#### Manual Render Setup

1. **Create Web Service**
   - New → Web Service
   - Connect repository
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node
   - **Plan**: Starter (or higher for production)

2. **Add Environment Variables** (same as above)

3. **Deploy** - Render will auto-deploy on every push

---

### Option 2: Deploy with Docker

#### Build Docker Image

```bash
cd backend
docker build -t nexa-backend .
```

#### Run Locally

```bash
docker run -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e JWT_SECRET=your-secret \
  -e CORS_ORIGINS=http://localhost:3000 \
  nexa-backend
```

#### Deploy to Cloud

**AWS ECS / Fargate**
```bash
# Tag image
docker tag nexa-backend:latest YOUR_ECR_URL/nexa-backend:latest

# Push to ECR
docker push YOUR_ECR_URL/nexa-backend:latest

# Deploy via ECS Console or AWS CLI
```

**Google Cloud Run**
```bash
# Tag image
docker tag nexa-backend gcr.io/YOUR_PROJECT/nexa-backend

# Push to GCR
docker push gcr.io/YOUR_PROJECT/nexa-backend

# Deploy
gcloud run deploy nexa-backend \
  --image gcr.io/YOUR_PROJECT/nexa-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

### Option 3: Serverless (AWS Lambda + API Gateway)

While possible, NestJS with WebSocket support is better suited for long-running processes. Use Option 1 or 2 for full feature support.

---

## 🔧 Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `SUPABASE_URL` configured
- [ ] `SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (keep secure!)
- [ ] `JWT_SECRET` matches Supabase JWT secret
- [ ] `CORS_ORIGINS` set to production frontend URL
- [ ] `NODE_ENV=production`

### 2. Database
- [ ] All 10 schema files executed on Supabase
- [ ] RLS policies enabled
- [ ] TimescaleDB extension installed (optional)
- [ ] Materialized views created
- [ ] Test data seeded (optional)

### 3. Security
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Helmet.js middleware active
- [ ] JWT secret is strong and secure
- [ ] Service role key never exposed to frontend

### 4. Testing
- [ ] Run tests: `npm test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Test authentication flow
- [ ] Test protected endpoints
- [ ] Verify RLS policies work

---

## 🧪 Testing Production Build Locally

```bash
# Build
npm run build

# Run production build
npm run start:prod

# Test endpoints
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/docs
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint
`GET /api/v1/health`

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600
}
```

### Add to Supabase Service:

```typescript
// In app.controller.ts or health.controller.ts
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### Render Health Check
Render automatically checks `/api/v1/health` every 30 seconds. Configure in `render.yaml`:
```yaml
healthCheckPath: /api/v1/health
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Render

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Build
        run: cd backend && npm run build
      
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## 🚀 Post-Deployment Steps

### 1. Update Frontend Environment
Update your Vercel frontend `.env`:
```
NEXT_PUBLIC_API_URL=https://nexa-backend.onrender.com/api/v1
```

### 2. Test API Endpoints
```bash
# Test health
curl https://nexa-backend.onrender.com/api/v1/health

# Test signup
curl -X POST https://nexa-backend.onrender.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'

# View API docs
open https://nexa-backend.onrender.com/api/docs
```

### 3. Configure Supabase
Update Supabase dashboard:
- **API Settings** → Add Render URL to allowed origins
- **Auth Settings** → Add Render URL to redirect URLs

### 4. Monitor Logs
```bash
# Render logs
# Go to Render Dashboard → Your Service → Logs

# Or use Render CLI
render logs -f nexa-backend
```

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate JWT_SECRET** regularly
3. **Monitor API usage** - Set up alerts for unusual activity
4. **Enable rate limiting** - Configured in main.ts
5. **Use HTTPS only** - Render provides SSL certificates automatically
6. **Validate all inputs** - ValidationPipe configured globally
7. **Keep dependencies updated** - Run `npm audit` regularly

---

## 📈 Scaling Considerations

### Horizontal Scaling (Multiple Instances)
Render Pro plan supports auto-scaling:
- Set in `render.yaml`:
  ```yaml
  scaling:
    minInstances: 2
    maxInstances: 10
    targetCPUPercent: 70
  ```

### Database Connection Pooling
For high traffic, use Supabase connection pooling:
```typescript
// Add to supabase.service.ts
const client = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false,
  },
  global: {
    headers: {
      'x-connection-pool': 'transaction',
    },
  },
});
```

### Caching
Add Redis for caching:
```bash
npm install @nestjs/cache-manager cache-manager
```

### Load Balancing
Render automatically load balances across instances on Pro plan.

---

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Run `npm install` locally to verify dependencies
- Check build logs in Render dashboard

### Health Check Fails
- Verify `/api/v1/health` endpoint exists
- Check if app is listening on PORT env variable
- Review application logs

### CORS Errors
- Verify `CORS_ORIGINS` includes frontend URL
- Check protocol (http vs https)
- Ensure no trailing slash in URLs

### Database Connection Issues
- Verify Supabase URL and keys
- Check network connectivity
- Ensure RLS policies don't block service role

### JWT Validation Fails
- Ensure `JWT_SECRET` matches Supabase JWT secret
- Check token expiration
- Verify token format in Authorization header

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

**Status**: ✅ Ready for Production Deployment!
