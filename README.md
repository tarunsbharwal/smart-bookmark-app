Smart Bookmark App
A real-time, full-stack bookmarking application built for the Abstrabit Fullstack Micro-Challenge. This app allows users to securely save and manage their favorite links with instant updates across multiple tabs.

🚀 Features
Google Authentication: Secure login using Supabase Auth and Google OAuth.

Private Bookmarks: Each user can only see and manage their own links thanks to Supabase Row Level Security (RLS).

Real-time Synchronization: Bookmark lists update instantly without page refreshes using Supabase Realtime.

Optimistic UI: Added logic to update the local state immediately upon adding a bookmark for a faster user experience.

Responsive Design: Styled with Tailwind CSS for a clean, modern interface.

🛠️ Tech Stack
Framework: Next.js (App Router)

Database & Auth: Supabase

Styling: Tailwind CSS

Language: TypeScript

🧠 Challenges Faced & Solutions
Directory Structure Errors: Initially, I had nested project directories which caused import path errors (@/lib/supabase not found).

Solution: Reorganized the folder structure and updated relative import paths to ensure all modules were correctly resolved.

Real-time Data Fetching: Ensuring that bookmarks appeared instantly in other tabs required enabling specific database publications in the Supabase SQL editor.

Solution: Executed alter publication supabase_realtime add table bookmarks; and implemented a useEffect hook with a listener for INSERT and DELETE events.

Optimizing for UI Speed: Waiting for the database response made the "Add" action feel slow.

Solution: Implemented optimistic updates in the addBookmark function to reflect changes in the UI immediately while the backend process finished.