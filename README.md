## Airtable-like Next.js App

This is an Airtable-like data table application built with [Next.js](https://nextjs.org) and PostgreSQL (Neon).

### Prerequisites

- Docker Desktop must be running locally.
- Node.js and `pnpm` installed globally.
- Access to a Neon PostgreSQL database.

---

### Option 1: Run with Docker (recommended)

#### 0. Ensure Docker Desktop is running

Make sure Docker Desktop is started and running on your machine.

#### 1. Pull or clone the repository

```bash
git clone <your-repo-url>
cd airtable-like
git pull origin main  # if you already have the repo
```

#### 2. Create `.env` in the project root

Create a `.env` file in the root of the project with at least the following variables:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require&options=project%3D<neon-project-id>-pooler"
DIRECT_DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require&options=project%3D<neon-project-id>"
```

- **`DATABASE_URL`**: connection string to the Neon PostgreSQL DB **through the pooler** (usually contains `-pooler` in the host or extra options).
- **`DIRECT_DATABASE_URL`**: same database connection string **without the pooler** (for direct connections / migrations).

Adjust the exact URLs according to your Neon project settings.

#### 3. Open a terminal in the project root

From the root directory of the project (`airtable-like`):

```bash
cd /path/to/airtable-like
```

#### 4. Install dependencies

```bash
pnpm i
```

#### 5. Generate Prisma client

```bash
npx prisma generate
```

#### 6. Start the app with Docker Compose

```bash
docker compose up --build
```

This will start two services:

- **Development**:  
  - URL: `http://localhost:3001`  
  - Command: `pnpm dev` (`next dev -p 3001`)

- **Production-like**:  
  - URL: `http://localhost:3000`  
  - Command: `pnpm start` (`next start`)

Stop the services with `Ctrl + C` and, if needed, remove containers with:

```bash
docker compose down
```

---

### Option 2: Run locally without Docker

If you prefer to run the app without Docker, you can use the standard Next.js scripts.

#### 1. Install dependencies

```bash
pnpm i
```

#### 2. Generate Prisma client

```bash
npx prisma generate
```

#### 3. Ensure `.env` is configured

Use the same `.env` file as described in Option 1 (with `DATABASE_URL` and `DIRECT_DATABASE_URL` pointing to your Neon PostgreSQL database).

#### 4. Development mode

In `package.json` you should have:

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start"
  }
}
```

Start the dev server:

```bash
pnpm dev
```

Open `http://localhost:3001` in your browser.

#### 5. Production build locally

```bash
pnpm build
pnpm start
```

By default this will start on `http://localhost:3000` (or use `PORT` env to override).

