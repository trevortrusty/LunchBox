# Lunchbox — Server Deployment Guide

Complete reference for deploying `lunchbox` to a fresh Ubuntu server (tested on Linode Ubuntu 24.04 Noble).

Live URL: `lunchbox.trevortrusty.com`
App directory: `/var/www/lunchbox`
App port: `3001`

---

## Prerequisites

- A domain A record for `lunchbox.trevortrusty.com` pointing to the server IP (set at your registrar, must propagate before SSL step)
- SSH access to the server

---

## 1. Node.js (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

Verify: `node -v` should show v20.x.x

---

## 2. PostgreSQL

```bash
sudo apt update && sudo apt install -y postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create the database and user:

```bash
sudo -u postgres psql
```

```sql
CREATE USER lunchbox WITH PASSWORD 'your_secure_password';
CREATE DATABASE lunchbox OWNER lunchbox;
\q
```

---

## 3. Clone the Repository

```bash
cd /var/www
sudo git clone git@github.com:trevortrusty/LunchBox.git lunchbox
sudo chown -R $USER:$USER /var/www/lunchbox
cd /var/www/lunchbox
git checkout dev
```

---

## 4. Environment Variables

Create `/var/www/lunchbox/.env.local`:

```bash
nano /var/www/lunchbox/.env.local
```

Contents:

```
DATABASE_URL="postgresql://lunchbox:your_secure_password@localhost:5432/lunchbox"
SESSION_SECRET="generate-a-long-random-string-here"
NODE_ENV="production"
```

Generate a strong `SESSION_SECRET`:

```bash
openssl rand -base64 48
```

> Do not set `NEXT_PUBLIC_APP_ENV` in production — omitting it hides the dev badge.

---

## 5. Install Dependencies and Build

```bash
cd /var/www/lunchbox
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

To seed initial data (test credentials only — skip on a real production deploy):

```bash
node prisma/seed.js
```

---

## 6. PM2 Process Manager

Install PM2 globally:

```bash
sudo npm install -g pm2
```

Start the app on port 3001:

```bash
cd /var/www/lunchbox
PORT=3001 pm2 start npm --name "lunchbox-app" -- start
```

Persist across reboots:

```bash
pm2 save
pm2 startup
# Run the command it outputs (starts with sudo env PATH=...)
```

Useful PM2 commands:

```bash
pm2 list                     # show all processes
pm2 logs lunchbox-app        # tail logs
pm2 restart lunchbox-app     # restart
pm2 stop lunchbox-app        # stop
```

---

## 7. Nginx

Create `/etc/nginx/sites-available/lunchbox.trevortrusty.com`:

```bash
sudo nano /etc/nginx/sites-available/lunchbox.trevortrusty.com
```

Contents:

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name lunchbox.trevortrusty.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/lunchbox.trevortrusty.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. SSL (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d lunchbox.trevortrusty.com
```

Certbot automatically updates the Nginx config for HTTPS and sets up auto-renewal.

---

## Redeployment (After Code Changes)

Pull the latest code, rebuild, and restart:

```bash
cd /var/www/lunchbox
git pull origin dev
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart lunchbox-app
```

---

## Database Management

Connect to the database:

```bash
sudo -u postgres psql -d lunchbox
```

Common queries:

```sql
-- List all tables
\dt

-- View all shifts
SELECT * FROM "Shift";

-- View all associates
SELECT * FROM "Associate";

-- Exit
\q
```

Reset the database (destructive — wipes all data):

```bash
cd /var/www/lunchbox
npx prisma migrate reset --force
node prisma/seed.js   # re-seed if needed
pm2 restart lunchbox-app
```

---

## Troubleshooting

**App won't connect to the database (`ECONNREFUSED`)**
- Check PostgreSQL is running: `systemctl is-active postgresql`
- Verify `DATABASE_URL` in `.env.local` matches the user/password/db name you created
- Restart after any env change: `pm2 restart lunchbox-app`

**Build fails with `useSearchParams` Suspense error**
- Already fixed in the codebase via `export const dynamic = "force-dynamic"` on the shifts and tasks pages

**Nginx 502 Bad Gateway**
- The app may not be running: `pm2 list`
- Check logs: `pm2 logs lunchbox-app`
- Confirm it's on port 3001: `ss -tlnp | grep 3001`

**SSL certificate renewal**
- Certbot auto-renews via a systemd timer. To test manually: `sudo certbot renew --dry-run`
