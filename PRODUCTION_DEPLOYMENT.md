# Production Deployment Guide

This guide covers deploying the Manual J HVAC Load Calculator to production.

## Pre-Deployment Checklist

### Critical Requirements

- [ ] All TypeScript errors resolved (`pnpm type-check` passes)
- [ ] All tests passing (`pnpm test`, `pnpm test:e2e`, `pnpm test:a11y`)
- [ ] Security audit clean (`pnpm audit`, Trivy scan)
- [ ] Lighthouse CI scores >90 (performance, accessibility, best-practices, SEO)
- [ ] Production database configured with backups
- [ ] All environment variables set (see below)
- [ ] SSL/TLS certificate configured
- [ ] Monitoring and error tracking configured (Sentry)

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Required
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host:5432/manualj?sslmode=require"
BETTER_AUTH_SECRET="<generate-64-char-random-string>"
BETTER_AUTH_URL="https://yourdomain.com"

# Monitoring (Recommended)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
LOGROCKET_APP_ID="your-logrocket-app-id"

# Optional: OAuth
ENABLE_OAUTH=true
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Optional: External Services
OPENCAGE_API_KEY="your-opencage-api-key"
CLIMATE_SERVICE_URL="https://your-climate-service.com"

# Optional: Security
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
LOG_LEVEL="info"
```

### Generate Secure Secrets

```bash
# Generate BETTER_AUTH_SECRET (64 characters)
openssl rand -base64 48

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Deployment Options

### Option A: Vercel (Recommended for Quick Deploy)

1. **Install Vercel CLI**
   ```bash
   pnpm add -g vercel
   ```

2. **Configure Database**
   - Use Vercel Postgres or external provider (Neon, Supabase, DigitalOcean)
   - Enable Prisma Accelerate for connection pooling

3. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL production
   vercel env add BETTER_AUTH_SECRET production
   vercel env add BETTER_AUTH_URL production
   # Add other variables...
   ```

4. **Deploy**
   ```bash
   pnpm build
   vercel --prod
   ```

5. **Run Database Migrations**
   ```bash
   vercel env pull .env.production.local
   pnpm db:migrate
   pnpm db:seed  # Seed climate data
   ```

### Option B: Docker + Cloud Provider (AWS, GCP, Azure)

1. **Create Dockerfile**
   ```dockerfile
   FROM node:20-alpine AS builder

   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN npm install -g pnpm
   RUN pnpm install --frozen-lockfile

   COPY . .
   RUN pnpm build

   FROM node:20-alpine AS runner
   WORKDIR /app

   COPY --from=builder /app/.output ./output
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package.json ./

   ENV NODE_ENV=production
   EXPOSE 3000

   CMD ["node", "--import", "./.output/server/instrument.server.mjs", ".output/server/index.mjs"]
   ```

2. **Build and Push**
   ```bash
   docker build -t manualj-calculator:latest .
   docker tag manualj-calculator:latest registry.example.com/manualj-calculator:latest
   docker push registry.example.com/manualj-calculator:latest
   ```

3. **Deploy to Cloud Run / ECS / App Engine**
   Follow your cloud provider's container deployment guide

### Option C: Traditional VPS (DigitalOcean, Linode, AWS EC2)

1. **Server Setup**
   ```bash
   # Install Node.js 20 LTS
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install PostgreSQL 16
   sudo apt-get install -y postgresql-16
   ```

2. **Application Setup**
   ```bash
   cd /var/www/manualj
   git clone your-repo .
   pnpm install --frozen-lockfile
   pnpm build

   # Run migrations
   pnpm db:migrate
   pnpm db:seed
   ```

3. **Process Manager (PM2)**
   ```bash
   npm install -g pm2

   # ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'manualj-calculator',
       script: './.output/server/index.mjs',
       node_args: '--import ./.output/server/instrument.server.mjs',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   };

   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. **Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       location /api/health {
           proxy_pass http://localhost:3000/api/health;
           access_log off;
       }
   }
   ```

## Database Setup

### Managed PostgreSQL (Recommended)

**Option 1: Neon (Serverless)**
- Sign up at https://neon.tech
- Create database and get connection string
- Enable Prisma Accelerate for connection pooling

**Option 2: Vercel Postgres**
- Available in Vercel dashboard
- Automatic backups and scaling
- Integrated with Vercel deployments

**Option 3: AWS RDS**
- Choose PostgreSQL 16
- Enable automated backups (daily snapshots)
- Configure Multi-AZ for high availability
- Set up read replicas for scaling

### Run Migrations

```bash
# Development
pnpm db:migrate

# Production
DATABASE_URL="your-production-url" pnpm db:push
DATABASE_URL="your-production-url" pnpm db:seed
```

## Monitoring Setup

### Sentry Error Tracking

1. Create project at https://sentry.io
2. Copy DSN and add to environment variables
3. Errors automatically tracked via `instrument.server.mjs`

### Health Checks

Configure your load balancer / monitoring service to check:
- Endpoint: `https://yourdomain.com/api/health`
- Expected status: `200`
- Check frequency: Every 30 seconds
- Timeout: 5 seconds

### Uptime Monitoring

Use services like:
- Better Uptime (https://betteruptime.com)
- UptimeRobot (https://uptimerobot.com)
- Pingdom (https://www.pingdom.com)

Configure alerts to:
- Email/SMS on downtime
- Slack/Discord notifications
- Check from multiple regions

### LogRocket Session Replay (Optional)

1. Sign up at https://logrocket.com
2. Add `LOGROCKET_APP_ID` to environment variables
3. Session replays automatically captured

## Security Hardening

### SSL/TLS Certificate

**Let's Encrypt (Free)**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Cloudflare (Recommended)**
- Add site to Cloudflare
- Enable "Full (strict)" SSL/TLS encryption
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"

### Security Headers

Security headers are automatically applied via `src/lib/security-headers.ts`:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Permissions-Policy

### Rate Limiting

Rate limiting is configured in `src/lib/rate-limit.ts`:
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
- Standard routes: 1000 requests per hour

**For Multi-Instance Production**: Migrate to Redis-based rate limiting

### Database Security

- Use strong passwords (32+ characters)
- Enable SSL/TLS connections (`?sslmode=require`)
- Restrict database access by IP whitelist
- Use Prisma Accelerate for connection pooling
- Enable database audit logging

## Performance Optimization

### CDN Configuration

**Cloudflare (Recommended)**
- Enable Cloudflare for your domain
- Cache static assets automatically
- Enable Auto Minify (JS, CSS, HTML)
- Enable Brotli compression

### Caching Strategy

- Static assets: 1 year (`Cache-Control: public, max-age=31536000, immutable`)
- API responses: No cache by default
- Climate data: 24 hours with stale-while-revalidate

### Database Indexes

Already configured in `schema.prisma`:
- Calculation queries: `archived`, `createdAt`
- User queries: `email`, `userId`
- Project queries: `groupId`

## Post-Deployment

### Verify Deployment

```bash
# Health check
curl https://yourdomain.com/api/health

# Test authentication
curl -X POST https://yourdomain.com/api/auth/email/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Check security headers
curl -I https://yourdomain.com
```

### Monitor Logs

```bash
# PM2 logs
pm2 logs manualj-calculator

# Docker logs
docker logs -f container-id

# Vercel logs
vercel logs --follow
```

### Performance Testing

```bash
# Install k6
brew install k6  # or visit https://k6.io

# Run load test
k6 run tests/load/calculator.k6.js
```

## Rollback Procedure

### Vercel
```bash
vercel rollback
```

### Docker
```bash
# Rollback to previous image
docker pull registry.example.com/manualj-calculator:previous-tag
kubectl set image deployment/manualj-calculator app=registry.example.com/manualj-calculator:previous-tag
```

### PM2
```bash
git checkout previous-commit
pnpm install
pnpm build
pm2 restart manualj-calculator
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Prisma connection
pnpm exec prisma db execute --stdin <<< "SELECT 1"
```

### High Memory Usage

```bash
# Check Node.js memory
pm2 monit

# Increase memory limit if needed
node --max-old-space-size=4096 .output/server/index.mjs
```

### SSL Certificate Renewal

```bash
# Auto-renewal (certbot)
sudo certbot renew --dry-run
sudo systemctl restart nginx
```

## Maintenance

### Database Backups

**Automated (Recommended)**
- Enable daily snapshots in your database provider
- Retain backups for 30 days minimum
- Test restoration quarterly

**Manual Backup**
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Dependency Updates

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Test thoroughly
pnpm test
pnpm test:e2e
pnpm build
```

### Log Rotation

```bash
# PM2 auto-rotates logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 30
```

## Support

- GitHub Issues: https://github.com/your-org/manualj/issues
- Documentation: https://docs.yourdomain.com
- Email: support@yourdomain.com

## License

[Your License]
