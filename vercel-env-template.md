# Vercel Environment Variables Template

Copy these environment variables to your Vercel project settings.

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable below
4. Select environments: **Production**, **Preview**, **Development**

---

## Required Environment Variables

### Server Configuration
```
NODE_ENV=production
```

### Database Configuration

**Option 1: Individual Database Settings**
```
DB_HOST=your-database-host.com
DB_PORT=3306
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=vms
```

**Option 2: Connection String (Recommended)**
```
MYSQL_URI=mysql://user:password@host:port/database
```
OR
```
DATABASE_URL=mysql://user:password@host:port/database
```

### Security
```
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
SESSION_SECRET=your_session_secret_minimum_32_characters_long
```

**Generate secrets:**
```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate Session Secret  
openssl rand -base64 32
```

### Application Mode
```
DEMO_MODE=false
DEMO_DATABASE=mysql
```

### CORS (Optional - Vercel handles automatically)
```
ALLOWED_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

---

## Database Provider Examples

### PlanetScale
```
MYSQL_URI=mysql://username:password@aws.connect.psdb.cloud/database?sslaccept=strict
```

### Railway
```
MYSQL_URI=mysql://user:password@containers-us-west-xxx.railway.app:3306/railway
```

### Supabase (PostgreSQL)
```
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Custom MySQL Server
```
MYSQL_URI=mysql://user:password@your-server.com:3306/vms
```

---

## Quick Setup Script

For PlanetScale or other MySQL providers, you can also set individual variables:

```
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database-name
```

---

## Important Notes

1. **Never commit `.env` files** - Always use Vercel's environment variables
2. **Use connection strings** - Easier to manage and more secure
3. **Generate strong secrets** - Use `openssl rand -base64 32` for JWT_SECRET
4. **Test in Preview** - Add variables to Preview environment for testing
5. **Keep backups** - Document your environment variables securely

---

## Verification

After adding variables, verify they're set:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check all variables are listed
3. Redeploy your project
4. Check logs to verify variables are loaded

---

## Troubleshooting

### Variables not loading?
- Ensure variables are added to correct environment (Production/Preview/Development)
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Database connection fails?
- Verify connection string format
- Check database allows connections from Vercel IPs
- Test connection string locally first

### Build fails?
- Check all required variables are set
- Verify no typos in variable names
- Check Vercel build logs for specific errors

