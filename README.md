# ShulePulse — School Management System

Track student progress across academics and co-curricular activities. Built for Kenyan schools supporting CBC (Competency Based Curriculum) and 8-4-4 curricula.

## Features

- **Dual Curriculum Support** — CBC competencies and 8-4-4 exam tracking in one platform
- **Academic Assessments** — Create and manage exams, CATs, assignments with automated grading
- **CBC Competency Tracking** — Record strand-based assessments with E/B/A/P ratings
- **Co-Curricular Tracking** — Log student participation in sports, music, drama, debate, and clubs
- **Attendance Management** — Mark and view daily attendance per class
- **Automated Reports** — Generate comprehensive report cards combining all three areas
- **Parent Portal** — Real-time visibility into student progress
- **Role-Based Access** — Admin, Teacher, and Parent dashboards

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth (email/password)
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom (Lucide icons)
- **Charts:** Recharts
- **Fonts:** Geist

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### 1. Clone & Install

```bash
git clone <repo-url>
cd freebuff
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in order:
   - `supabase/migrations/00001_schema.sql` — Full database schema
   - `supabase/migrations/00002_auto_create_profile.sql` — Auto-creates profiles on signup
3. (Optional) Run `supabase/seed.sql` to load demo data

### 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to a GitHub repository
2. Import to Vercel
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy

### Self-Hosting

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Callback
│   ├── (dashboard)/     # Admin, Teacher, Parent dashboards
│   │   ├── admin/       # School administration
│   │   ├── teacher/     # Teacher workspace
│   │   └── parent/      # Parent portal
│   ├── reports/         # Report card viewer
│   └── page.tsx         # Landing page
├── components/ui/       # Reusable UI components
└── lib/
    ├── supabase/        # Supabase client, server, middleware
    ├── types/           # TypeScript interfaces
    └── report-generator.ts  # Report card engine
```

## License

Private — All rights reserved.
# unsucckmarketing
