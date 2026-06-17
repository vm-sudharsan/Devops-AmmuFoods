# 🚀 Production Deployment Guide - AmmuFoods

## Pre-Deployment Checklist

### 1. Security Configuration ✅

#### A. Generate New Secrets
```bash
# Generate JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### B. Update Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in all production values
3. **NEVER** use development credentials in production

#### C. Rotate All Credentials
- [ ] New MongoDB password
- [ ] New JWT secret
- [ ] New Gmail app password
- [ ] New Cloudinary API keys
- [ ] New Google OAuth credentials

### 2. Code Preparation ✅

#### A. Remove Development Code
```bash
# Remove console.logs in production
# Update error messages (no stack traces)
# Remove debug endpoints
```

#### B. Update Dependencies
```bash
cd backend
npm audit fix
npm update

cd ../frontend
npm audit fix
npm update
```

#### C. Build Frontend
```bash
cd frontend
npm run build
# This creates optimized production build in /dist
```

### 3. Database Setup ✅

#### A. MongoDB Atlas Configuration
1. Create production cluster
2. Set up IP whitelist
3. Enable encryption at rest
4. Configure backup schedule
5. Set up monitoring alerts

#### B. Database Indexes
```javascript
// Run these in MongoDB shell
db.users.createIndex({ email: 1 }, { unique: true });
db.products.createIndex({ name: 1 });
db.orders.createIndex({ userId: 1, createdAt: -1 });
db.shoprequests.createIndex({ userId: 1 });
db.eventrequests.createIndex({ userId: 1, status: 1 });
```

### 4. Backend Deployment Options

#### Option A: Vercel (Recommended for Node.js)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Create vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy**
```bash
cd backend
vercel --prod
```

4. **Set Environment Variables**
```bash
vercel env add MONGO_URI
vercel env add JWT_SECRET
# ... add all other env variables
```

#### Option B: Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and Deploy**
```bash
cd backend
railway login
railway init
railway up
```

3. **Add Environment Variables**
- Go to Railway dashboard
- Select your project
- Add all environment variables from .env

#### Option C: Render

1. **Create render.yaml**
```yaml
services:
  - type: web
    name: ammufoods-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

2. **Deploy**
- Connect GitHub repository
- Render auto-deploys on push

### 5. Frontend Deployment

#### Option A: Vercel (Recommended)

1. **Create vercel.json**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

2. **Deploy**
```bash
cd frontend
vercel --prod
```

3. **Set Environment Variables**
```bash
vercel env add VITE_API_URL
vercel env add VITE_GOOGLE_CLIENT_ID
```

#### Option B: Netlify

1. **Create netlify.toml**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy**
```bash
cd frontend
netlify deploy --prod
```

### 6. Domain Configuration

#### A. Backend Domain
1. Get backend URL from deployment (e.g., `https://api.ammufoods.com`)
2. Update CORS whitelist in backend
3. Update `VITE_API_URL` in frontend

#### B. Frontend Domain
1. Get frontend URL (e.g., `https://ammufoods.com`)
2. Update `FRONTEND_URL` in backend
3. Configure custom domain in hosting platform

#### C. SSL Certificates
- Vercel/Netlify provide automatic SSL
- For custom domains, use Let's Encrypt

### 7. Post-Deployment Configuration

#### A. Update CORS
```javascript
// backend/src/app.js
const allowedOrigins = [
  'https://ammufoods.com',
  'https://www.ammufoods.com',
  process.env.FRONTEND_URL
].filter(Boolean);
```

#### B. Update Cookie Settings
```javascript
// Set secure cookies in production
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

#### C. Enable Rate Limiting
```javascript
// Reduce rate limit in production
max: process.env.NODE_ENV === 'production' ? 100 : 1000
```

### 8. Monitoring & Logging

#### A. Set Up Sentry (Error Tracking)
```bash
npm install @sentry/node
```

```javascript
// backend/server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

#### B. Set Up Logging Service
- Use Winston for structured logging
- Send logs to CloudWatch/Datadog
- Set up log rotation

#### C. Set Up Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

### 9. Testing in Production

#### A. Smoke Tests
```bash
# Test health endpoint
curl https://api.ammufoods.com/health

# Test authentication
curl -X POST https://api.ammufoods.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### B. Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://api.ammufoods.com/health
```

#### C. Security Testing
- Run OWASP ZAP scan
- Check SSL configuration (ssllabs.com)
- Verify CORS configuration
- Test rate limiting

### 10. Backup Strategy

#### A. Database Backups
- Enable MongoDB Atlas automated backups
- Set retention period (7-30 days)
- Test restore procedure

#### B. Code Backups
- Use Git tags for releases
- Keep production branch protected
- Document rollback procedure

#### C. Media Backups
- Cloudinary has built-in backups
- Consider additional backup to S3

### 11. Performance Optimization

#### A. Enable Compression
```javascript
const compression = require('compression');
app.use(compression());
```

#### B. Add Caching Headers
```javascript
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  next();
});
```

#### C. Use CDN
- Cloudflare (free tier available)
- AWS CloudFront
- Fastly

### 12. Documentation

#### A. API Documentation
- Use Swagger/OpenAPI
- Document all endpoints
- Include authentication requirements

#### B. Deployment Documentation
- Document deployment process
- Include rollback procedures
- Document environment variables

#### C. Runbook
- Common issues and solutions
- Emergency contacts
- Escalation procedures

---

## Quick Deployment Commands

### Backend (Vercel)
```bash
cd backend
vercel --prod
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod
```

### Environment Variables
```bash
# Backend
vercel env add MONGO_URI production
vercel env add JWT_SECRET production
vercel env add SMTP_EMAIL production
vercel env add SMTP_APP_PASSWORD production
vercel env add GOOGLE_CLIENT_ID production
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
vercel env add FRONTEND_URL production

# Frontend
vercel env add VITE_API_URL production
vercel env add VITE_GOOGLE_CLIENT_ID production
```

---

## Post-Deployment Checklist

- [ ] All endpoints responding
- [ ] Authentication working
- [ ] Email sending working
- [ ] File uploads working
- [ ] Database connections stable
- [ ] CORS configured correctly
- [ ] SSL certificates valid
- [ ] Rate limiting active
- [ ] Error tracking configured
- [ ] Monitoring alerts set up
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] DNS propagated
- [ ] Performance tested
- [ ] Security tested

---

## Rollback Procedure

If deployment fails:

1. **Immediate Rollback**
```bash
vercel rollback
```

2. **Check Logs**
```bash
vercel logs
```

3. **Fix Issues**
- Review error logs
- Fix code issues
- Test locally
- Redeploy

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **Express Security**: https://expressjs.com/en/advanced/best-practice-security.html

---

## Emergency Contacts

- **DevOps Lead**: [Your Name]
- **Database Admin**: [DBA Name]
- **Security Team**: [Security Contact]
- **On-Call**: [On-Call Number]

---

## Success Criteria

✅ Application accessible at production URL
✅ All features working as expected
✅ No security vulnerabilities
✅ Performance meets requirements
✅ Monitoring and alerts active
✅ Backups configured
✅ Documentation complete

**Deployment Status**: Ready for Production 🚀
