# TCT PostPulse — Build-in-Public Content Engine (Next.js Full-Stack All-in-One)

> **Translate your daily code commits and releases into authentic, high-converting Reddit deep-dives, Indie Hackers updates, and clean changelog entries. Zero corporate fluff.**

---

## ⚡ Next.js Full-Stack All-in-One Architecture

TCT PostPulse is architected as an **all-in-one full-stack Next.js 16 application** with:
- **Next.js 16.4.3 App Router & Turbopack** (`src/app`): Lightning-fast builds with Turbopack, integrated React Server Components + Client Studio.
- **RESTful API Routes** (`src/app/api`): Event ingestion, draft generation, digest generation, headline ideation, webhook verification, and settings.
- **Prisma ORM with Dual-Database Strategy**:
  - **Local Development**: **SQLite** (`file:./dev.db`) for instant zero-config setup.
  - **Production**: **PostgreSQL using Neon Serverless** via `@prisma/adapter-neon` and `@neondatabase/serverless` (WebSocket-enabled, high-performance connection pooling).
  - **Automatic Provider Synchronization**: `scripts/prepare-db.mjs` inspects your `DATABASE_URL` (or arguments) and automatically sets `provider = "sqlite"` or `provider = "postgresql"` in `prisma/schema.prisma` before build or runtime.
- **Bun & Node.js Native Support**: Fully compatible with `bun` (v1.4+) and `node` (v18+).
- **Modern UI / Design**: Tailwind CSS, Radix/Base-UI primitives, dark/light theme, split-screen Markdown preview, interactive modals, and keyboard navigation.

---

## 🎯 The Core Problem

Indie developers and micro-SaaS founders know they need to "build in public" to acquire early users. Reddit organic (e.g. `r/SideProject`, `r/webdev`, `r/SaaS`) is validated as the #1 organic acquisition channel for micro-SaaS. 

However:
- *"I'm not a content creator and this is kicking my ass"* is the universal founder complaint.
- Staring at a blank editor after a 4-hour debugging session is exhausting.
- Generic AI tools (like raw ChatGPT) sound like corporate marketing spam (*"🚀 Super thrilled to announce our latest milestone! In today's fast-paced digital world..."*). Developers downvote that immediately.
- A post about a **database migration** must read completely differently from one about **UI polish** or a **billing webhook race condition**.

---

## 💡 What TCT PostPulse Does

TCT PostPulse ingests Git events (via GitHub Webhooks, direct GitHub API imports, or local simulation), filters out trivial chores (like bumping lockfiles or markdown typos), calculates a **Post-Worthiness Score (0-100)**, and translates code events into **tailored publishable formats**:

| Format | Target Platform | Content Anatomy |
| :--- | :--- | :--- |
| **1. Technical Lesson** | Reddit (`r/SideProject`, `r/webdev`), Dev.to, Hacker News | The bottleneck / symptom → The naive assumption → The fix (with real SQL/TypeScript diff snippets) → 3 practical developer takeaways → Community discussion ask. |
| **2. Build-in-Public Story** | Indie Hackers, LinkedIn, X/Twitter | The founder struggle / metric → Why you delayed it or what broke → What shipping it taught you → Open question to fellow founders. |
| **3. Product Changelog** | Release Notes, In-App Modals | 1-2 crisp lines translating raw code churn into user value (e.g. *"⚡ Sped up dashboard load times by 70%"* instead of *"refactor query index"*). |
| **4. Multi-Commit Weekly Digest** | Substack, Indie Hackers, Release Roundup | Weekly newsletter recap + customer sprint release notes + Reddit week-in-review synthesized from multiple selected commits. |
| **5. 𝕏 Tweet Thread Splitter** | X/Twitter | Automatic conversion of long-form posts into sequential 280-character numbered tweets (`1/N` to `N/N`) with live length validation. |

---

## 🌟 Interactive UI Features & Optimizations

1. **🚀 1-Click Multi-Platform Direct Publisher & Share Hub (`src/components/PublishModal.tsx`)**:
   - **Reddit Direct Submit**: 1-click launch to `reddit.com/r/{targetSub}/submit` with pre-filled title, body, and required flairs.
   - **𝕏 / Twitter Intent**: 1-click launch to tweet composer.
   - **LinkedIn & Hacker News Intent**: Direct share launchers.
   - **Download as Markdown (`.md`)**: Full file export with YAML frontmatter.
   - **Live Post Tracker**: Record the live post link and display an active "Live Post" badge directly on the commit card.

2. **✨ Viral Headline & Hook Lab (`src/components/ViralHeadlinesModal.tsx`)**:
   - Dynamically generates 5 battle-tested headline angles for every commit:
     - 💥 *The Outage / War Story*
     - 📊 *The Data / Latency Metric Win*
     - 🔥 *The Contrarian / Spicy Take*
     - 🤝 *Founder Vulnerability / Mistake*
     - 🛠️ *Practical Engineering Tutorial*
   - 1-click to apply directly into the post draft title.

3. **🧵 𝕏 Tweet Thread Splitter & Live Composer**:
   - Switch between Full Post and 𝕏 Thread Mode in Draft Studio.
   - Real-time 280-character indicators per tweet (`210/280 chars`) with warning cues.
   - Copy individual tweets or copy the entire sequential thread with 1 click.

4. **🛡️ Subreddit Matcher & Anti-Ban Community Guide**:
   - Dynamically recommends the top 3-4 subreddits based on commit category (e.g., `r/PostgreSQL`, `r/webdev`, `r/SideProject`).
   - Displays community guidelines, peak posting hours, and self-promotion rules.

5. **📦 Multi-Select Batch Operations Toolbar**:
   - Multi-select checkboxes on the event feed.
   - Floating action bar: Batch Generate 3 Drafts Each, Compile Weekly Digest, Export Markdown Bundle, or Dismiss Trivial Chores.

6. **⚡ Power-User Keyboard Shortcuts (`?` Key)**:
   - `J` / `K` (or `↓` / `↑`): Navigate commits.
   - `1` / `2` / `3`: Switch formats in Draft Studio.
   - `/`: Focus search input.
   - `Ctrl/Cmd + S`: Save draft.
   - `Ctrl/Cmd + C`: Copy post.
   - `Esc`: Close modals.

7. **🔔 Non-Blocking Animated Toast Notifications**:
   - Clean toast notifications for copy, save, batch generation, and digest creation.

---

## 🚀 Quick Start (Local Development with SQLite)

No external database installation or Docker containers required. SQLite is enabled by default:

```bash
# 1. Install dependencies (Bun or npm)
bun install
# or: npm install

# 2. Push schema to local SQLite database (prisma/dev.db)
bun run db:push
# or: npm run db:push

# 3. Seed the 10 benchmark commits & default settings
bun run db:seed
# or: npm run db:seed

# 4. Start the Next.js development server
bun run dev
# or: npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Production Deployment (Neon PostgreSQL)

TCT PostPulse comes with built-in **Neon Serverless PostgreSQL** integration using `@prisma/adapter-neon` and `@neondatabase/serverless`.

### Step 1: Create a Neon Project
1. Go to [neon.tech](https://neon.tech) and create a free project.
2. In the Neon Console Dashboard, copy your connection string (select **Pooled connection**).

### Step 2: Set Environment Variables
In your production environment (Vercel, Railway, Render, etc.) or `.env`:
```env
# Neon Pooled Connection String (for application runtime)
DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/[dbname]?sslmode=require"

# Neon Direct Connection String (optional, for CLI migrations)
DATABASE_URL_UNPOOLED="postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/[dbname]?sslmode=require"
```

### Step 3: Push Schema & Seed Neon
```bash
# Prepare and push schema directly to Neon PostgreSQL:
bun run db:neon
bun run db:push

# Seed the 10 benchmark commits and initial settings:
bun run db:seed
```

### Step 4: Build & Deploy
During `bun run build` or `npm run build`, TCT PostPulse's `scripts/prepare-db.mjs` automatically detects your `DATABASE_URL`, configures `schema.prisma` for PostgreSQL, and generates the Neon Prisma Client seamlessly!

---

## 🛠️ Database Utility Commands

| Command | Description |
| :--- | :--- |
| `bun run db:prepare` | Auto-detects `DATABASE_URL` and synchronizes `schema.prisma` provider (`sqlite` or `postgresql`). |
| `bun run db:sqlite` | Explicitly configures Prisma for local SQLite and runs `prisma generate`. |
| `bun run db:neon` / `db:postgres` | Explicitly configures Prisma for Neon PostgreSQL and runs `prisma generate`. |
| `bun run db:push` | Pushes the Prisma schema to the active database (SQLite or Neon). |
| `bun run db:seed` | Seeds benchmark commits, settings, and validation grades. |
| `bun run db:verify` | Checks row counts and database connection status. |
| `bun test` | Runs the full feature and live endpoint test suites. |

---

## 🔬 Key Risks & The 10-Commit Validation Benchmark

> **The Quality Bar:** Generate drafts from 10 real commits by one developer and ask: *"How many would you publish with light edits?"*
> **Rule:** Fewer than 4 publishable means quality is insufficient.

TCT PostPulse comes pre-seeded with a **10-Commit Developer Validation Benchmark Suite** covering diverse real-world situations:
1. `perf(db)`: Postgres table lock & composite partial index optimization.
2. `fix(billing)`: Stripe webhook race condition & atomic Redis idempotency lock.
3. `ui(editor)`: Killing 3-step modal wizard in favor of split-view editor.
4. `perf(export)`: Memory leak & direct CSV download streaming with TransformStream.
5. `fix(auth)`: Flash of unauthenticated state during JWT token rotation.
6. `feat(notifications)`: Multi-channel webhook dispatcher with exponential backoff.
7. `perf(cache)`: Edge stale-while-revalidate for public metadata endpoints.
8. `refactor(core)`: Decoupling git parser from vendor APIs to support GitLab/Gitea.
9. `chore(deps)`: Bump tailwindcss and update lockfile (scored low to test noise filter).
10. `docs`: Typo fix in install guide (scored low to test noise filter).

Navigate to the **Validation Benchmark** tab in the dashboard to review, grade (Ready As-Is, Light Edits, Heavy Edits, Trash), and view the live publishability percentage.

---

## 💰 Monetization Model
- **Solo Indie Tier**: $19–29/month (unlimited personal repos, calibrated Reddit + Indie Hackers + Changelog generation).
- **Team / Studio Tier**: $49/month (multiple contributors, team repos, custom brand voice templates).
