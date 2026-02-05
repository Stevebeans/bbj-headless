# BBJ Laptop Setup Guide

This guide is for setting up a new development machine to work on the BBJ projects.

## Overview

There are two main projects to set up:

1. **bbj-app** - Next.js 15 PWA (frontend)
2. **bbj** - WordPress installation (backend/API)

Both should be installed in `C:\xampp\htdocs\`

---

## Prerequisites (should already be installed)

- Git
- Node.js (LTS)
- XAMPP (Apache, MySQL, phpMyAdmin)
- VS Code with Settings Sync enabled

---

## Step 1: Clone bbj-app (Next.js)

```bash
cd C:\xampp\htdocs
git clone https://github.com/Stevebeans/bbj-headless.git bbj-app
cd bbj-app
npm install
```

Then create `.env.local` with these contents:

```env
# WordPress API (local)
WORDPRESS_API_URL=http://bbj.localhost/wp-json
NEXT_PUBLIC_WORDPRESS_API_URL=http://bbj.localhost/wp-json

# Public site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Revalidation secret (change this to a random string in production)
REVALIDATION_SECRET=dev-secret-change-me

# Google OAuth (add your client ID)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=930590011623-4v63er5v4qgf579s2v0m1f9bj88grpfq.apps.googleusercontent.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LfryEwsAAAAALRlp6Slqzw8EOCAkxzV1oT8f0z_

# Google Places API (for location autocomplete)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyC_shPNS0EYeHXEIKFKhZDLhzpgoUphjts

# Google Custom Search API (for player photo search)
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSyAHJkKH8QsES8HHd_YD9oOFcu7KBS0uUag
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=22f0926af85984d55
```

Test with `npm run dev` - should run on localhost:3000 (will show errors until WordPress is set up).

---

## Step 2: Clone bbj (WordPress)

```bash
cd C:\xampp\htdocs
git clone https://github.com/Stevebeans/bbj-2025.git bbj
```

This includes:
- WordPress core
- BBJ theme at `wp-content/themes/BBJ`
- Plugins at `wp-content/plugins/`:
  - `bbj-tools`
  - `bbj-v2`
  - `bigbrotherjunkies-data` (main plugin for new development)

### Create wp-config.php

WordPress needs a `wp-config.php` file. Create one with:

```php
<?php
define('DB_NAME', 'bbj_db');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

$table_prefix = 'wp_';

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

define('AUTH_KEY',         'put-unique-phrase-here');
define('SECURE_AUTH_KEY',  'put-unique-phrase-here');
define('LOGGED_IN_KEY',    'put-unique-phrase-here');
define('NONCE_KEY',        'put-unique-phrase-here');
define('AUTH_SALT',        'put-unique-phrase-here');
define('SECURE_AUTH_SALT', 'put-unique-phrase-here');
define('LOGGED_IN_SALT',   'put-unique-phrase-here');
define('NONCE_SALT',       'put-unique-phrase-here');

if ( !defined('ABSPATH') )
    define('ABSPATH', dirname(__FILE__) . '/');

require_once(ABSPATH . 'wp-settings.php');
```

Generate real salt keys at: https://api.wordpress.org/secret-key/1.1/salt/

---

## Step 3: Configure Windows Hosts File

Add this line to `C:\Windows\System32\drivers\etc\hosts` (requires admin):

```
127.0.0.1 bbj.localhost
```

---

## Step 4: Configure Apache Virtual Host

Edit `C:\xampp\apache\conf\extra\httpd-vhosts.conf` and add:

```apache
<VirtualHost *:80>
    DocumentRoot "C:/xampp/htdocs/bbj"
    ServerName bbj.localhost
    <Directory "C:/xampp/htdocs/bbj">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Also ensure this line is uncommented in `C:\xampp\apache\conf\httpd.conf`:
```
Include conf/extra/httpd-vhosts.conf
```

Restart Apache after these changes.

---

## Step 5: Database Setup

The local WordPress uses database `bbj_db`. Options:

### Option A: Fresh Install (easiest)
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Create new database called `bbj_db`
3. Visit http://bbj.localhost - WordPress will prompt for setup
4. Note: You won't have player/season data, but the site will work

### Option B: Import from PC
1. On PC: Export `bbj_db` from phpMyAdmin (Export → Quick → Go)
2. Transfer the .sql file to laptop
3. On laptop: Create `bbj_db` database, then Import the .sql file

### Option C: Use Live Database (for read-only testing)
Modify `.env.local` to point to live:
```env
WORDPRESS_API_URL=https://bigbrotherjunkies.com/wp-json
NEXT_PUBLIC_WORDPRESS_API_URL=https://bigbrotherjunkies.com/wp-json
```

---

## Step 6: Verify Everything Works

1. Start XAMPP (Apache + MySQL)
2. Visit http://bbj.localhost - should load WordPress
3. Run `npm run dev` in bbj-app folder
4. Visit http://localhost:3000 - should load Next.js site
5. Check that API calls work (posts load, spoiler bar shows)

---

## Folder Structure Reference

```
C:\xampp\htdocs\
├── bbj/                    # WordPress installation
│   ├── wp-content/
│   │   ├── themes/BBJ/     # Main theme
│   │   └── plugins/
│   │       ├── bbj-tools/
│   │       ├── bbj-v2/
│   │       └── bigbrotherjunkies-data/  # Active development plugin
│   └── wp-config.php
│
└── bbj-app/                # Next.js PWA
    ├── src/
    ├── .env.local
    └── package.json
```

---

## Notes

- The project uses JavaScript, NOT TypeScript
- Primary development on WordPress plugin happens in `bigbrotherjunkies-data`
- All times are Pacific (BB Time)
- See `bbj-app/CLAUDE.md` for full project documentation
