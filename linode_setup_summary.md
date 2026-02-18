# Linode Server Setup Summary for lunchbox.trevortrusty.com

This document outlines the steps taken to deploy the `lunchbox` Next.js application to a Linode server, configure Nginx for `lunchbox.trevortrusty.com`, secure it with Certbot SSL, and troubleshoot initial deployment issues.

## 1. Initial Setup and Context

- **Linode Server:** Ubuntu (details assumed based on `apt` commands).
- **Existing Website:** `trevortrusty.com` (React app) already running on the same Linode server, serving via Nginx on port 80 and secured with SSL.
- **New Application:** `lunchbox` (Next.js application).
- **Goal:** Deploy `lunchbox` to `lunchbox.trevortrusty.com`.

## 2. DNS Configuration

**(Action performed by user outside the CLI)**
- An `A` record was added to the domain registrar for `lunchbox.trevortrusty.com`, pointing to the Linode server's IP address. This was verified to have propagated before proceeding with SSL.

## 3. Server Preparation and Application Deployment

All following steps were executed via SSH on the Linode server.

### 3.1. Project Cloning

- The `lunchbox` Git repository was cloned into `/var/www/lunchbox`.
  ```bash
  cd /var/www
  sudo git clone YOUR_REPO_URL lunchbox
  ```
  *(Assumed `git` was installed or user installed it.)*

### 3.2. Node.js and Dependencies

- Node.js was installed using `nvm` (Node Version Manager) to ensure a specific LTS version (v20) was used.
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  source ~/.bashrc # or ~/.zshrc
  nvm install 20
  nvm use 20
  nvm alias default 20
  ```
- Project dependencies were installed:
  ```bash
  cd /var/www/lunchbox
  npm install
  ```

### 3.3. Prisma Client Generation

- The Prisma client was generated to resolve a `Cannot find module '.prisma/client/default'` error during the build process.
  ```bash
  cd /var/www/lunchbox
  npx prisma generate
  ```

### 3.4. Next.js Application Build

- The Next.js application was built for production.
  ```bash
  cd /var/www/lunchbox
  npm run build
  ```
- **Troubleshooting:** An error regarding `useSearchParams()` requiring a `Suspense` boundary on the `/shifts` page was encountered and resolved by wrapping the `ShiftsContent` component in `app/(dashboard)/shifts/page.tsx` with `<Suspense fallback={<div>Loading shifts...</div>}>`.

### 3.5. Environment Variables

- **Crucially**, a `.env.production` file was created in `/var/www/lunchbox/` to store the production `DATABASE_URL` (and any other necessary production environment variables). This file was manually populated by the user with the correct database credentials for the Linode environment.
  ```bash
  sudo nano /var/www/lunchbox/.env.production
  ```
  Example content:
  ```
  DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/your_db_name"
  ```
  *(Note: The database itself was assumed to be set up/accessible, or was set up by the user outside this interaction as part of populating the `DATABASE_URL`.)*

### 3.6. Process Management with PM2

- PM2 was installed globally to manage the Next.js application process:
  ```bash
  sudo npm install -g pm2
  ```
- The `lunchbox` application was started using PM2 on a specific port (`3001`) to avoid conflict with the existing `trevortrusty.com` app (which was assumed to be using port 3000).
  ```bash
  cd /var/www/lunchbox
  PORT=3001 pm2 start npm --name "lunchbox-app" -- start
  ```
- The PM2 process list was saved to ensure persistence across reboots, and PM2 startup script was configured.
  ```bash
  pm2 save
  pm2 startup
  ```

### 3.7. Prisma Migrations Deployment

- Prisma database migrations were deployed to ensure the production database schema was up-to-date with the application's models.
  ```bash
  cd /var/www/lunchbox
  npx prisma migrate deploy
  ```

## 4. Nginx Configuration for lunchbox.trevortrusty.com

- A new Nginx server block was created for `lunchbox.trevortrusty.com` at `/etc/nginx/sites-available/lunchbox.trevortrusty.com`.
  ```nginx
  server {
      listen 80;
      listen [::]:80;

      server_name lunchbox.trevortrusty.com;

      location / {
          proxy_pass http://localhost:3001; # Proxying to port 3001
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
      }
  }
  ```
- A symbolic link was created to enable the site:
  ```bash
  sudo ln -s /etc/nginx/sites-available/lunchbox.trevortrusty.com /etc/nginx/sites-enabled/
  ```
- Nginx configuration was tested for syntax and reloaded:
  ```bash
  sudo nginx -t
  ```
  ```bash
  sudo systemctl reload nginx
  ```

## 5. SSL with Certbot

- Certbot was used to obtain and install an SSL certificate for `lunchbox.trevortrusty.com`. It automatically configured Nginx for HTTPS and redirects.
  ```bash
  sudo certbot --nginx -d lunchbox.trevortrusty.com
  ```
  *(User confirmed successful completion).*
- Automatic renewal was implicitly set up by Certbot.

## 6. Post-Deployment Troubleshooting (Database Connection)

- Upon attempting to log in, an "Internal Server Error" was encountered.
- PM2 logs revealed `ECONNREFUSED` with `PrismaClientKnownRequestError`, indicating the `lunchbox` application could not connect to its database.
- The root cause was identified as a missing or incorrect `DATABASE_URL` in the production environment.
- The fix involved:
    1.  Ensuring the production database (e.g., PostgreSQL) was running and accessible.
    2.  Creating and populating `/var/www/lunchbox/.env.production` with the correct production `DATABASE_URL`.
    3.  Restarting the PM2 process for `lunchbox-app` to load the new environment variables.
    4.  Running `npx prisma migrate deploy` to ensure the database schema was provisioned.

This comprehensive set of steps successfully deployed and secured `lunchbox.trevortrusty.com`, resolving key configuration and connectivity challenges.
