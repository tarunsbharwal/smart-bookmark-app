# Smart Bookmark App

This is a full-stack bookmarking app I built for the Abstrabit Fullstack Micro-Challenge. It lets you save your favorite links and syncs them instantly across different tabs and windows using Supabase Realtime.

## 🚀 Features
* **Google Login:** secure sign-in using Supabase Auth.
* **Live Sync:** if you add a bookmark in one tab, it pops up in the other one instantly without refreshing.
* **Private Data:** users can only see their own bookmarks (handled by Row Level Security).
* **Responsive:** looks good on mobile and desktop (built with Tailwind CSS).

## 🛠️ Tech Stack
* **Next.js 14** (App Router)
* **Supabase** (Postgres Database & Auth)
* **Tailwind CSS**
* **TypeScript**

## 🧠 Challenges I Faced

### 1. The "Empty Row" Bug
This was the hardest part. I got the realtime listener working, but when I added a bookmark in one tab, the other tab would create a new row that was completely empty (no title or URL).

**Solution:** I dug into the Supabase docs and realized Postgres doesn't send the full data for updates by default. I had to run a custom SQL command: `ALTER TABLE bookmarks REPLICA IDENTITY FULL;`. This forced the database to send the actual data payload to my frontend.

### 2. Realtime getting blocked by Security (RLS)
Even after fixing the empty rows, sometimes the sync wouldn't trigger at all.

**Solution:** I found out my Row Level Security (RLS) policies were too strict and were blocking the realtime subscription from "seeing" the changes. I had to tweak the policies to allow the realtime connection to read the data securely.

### 3. Folder Structure Issues
At the start, I had some trouble with imports (like `@/lib/supabase`) not working because my folder structure was a bit nested.

**Solution:** I reorganized the project to follow standard Next.js conventions and fixed the import paths.

## 🏃‍♂️ How to Run Locally

1.  Clone the repo:
    ```bash
    git clone [https://github.com/tarunsbharwal/smart-bookmark-app.git](https://github.com/tarunsbharwal/smart-bookmark-app.git)
    ```

2.  Install packages:
    ```bash
    npm install
    ```

3.  Add your Supabase keys in a `.env.local` file:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
    ```

4.  Run it:
    ```bash
    npm run dev
    ```