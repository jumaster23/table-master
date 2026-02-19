# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

Para ejecutar frontend + API al mismo tiempo, usa:

```sh
npm run dev:full
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Local full-stack run (frontend + API)

1. Install dependencies in both projects:

```sh
npm i
cd api && npm i
```

2. Configure environment variables:

- Root `.env`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3000
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

- `api/.env`:

```env
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<tu-service-role-key>
PORT=3000
```

3. Start API and frontend in separate terminals:

```sh
cd api && npm start
```

```sh
npm run dev
```

API docs (Swagger UI): http://localhost:3000/docs

## Production checklist

1. Backend env (`api/.env`) must use service role key:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_SERVICE_KEY=<tu-service-role-key>
CORS_ORIGINS=https://tu-frontend.com
ALLOW_ANON_KEY_IN_DEV=false
```

2. Frontend env (`.env`) for production build:

```env
VITE_API_BASE_URL=https://tu-api.com/api
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

3. Verify backend readiness before exposing traffic:

```sh
curl https://tu-api.com/api/ready
```

4. Start backend with:

```sh
cd api && npm run start:prod
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
