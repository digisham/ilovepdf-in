# iLovePDF-in (React + Bootstrap + Supabase Auth)

A clean PDF tools dashboard inspired by iLovePDF with:

- Top bar with logo, navigation, and authentication area.
- Left sidebar listing all tools.
- Main dashboard cards for tool categories.
- Google login using Supabase Auth.
- User display in top-right (profile image, or first letter fallback).

> This project stores **only user login/profile data in Supabase Auth**. It does **not** store uploaded file data.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure Supabase

Create a `.env` file in project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

In your Supabase project:

1. Go to **Authentication → Providers → Google** and enable Google.
2. Add your Google OAuth credentials.
3. Set redirect URL to your local/dev URL (e.g. `http://localhost:5173`).

## 3) Run app

```bash
npm run dev
```

## 4) Production build

```bash
npm run build
npm run preview
```
