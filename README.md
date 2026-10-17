# PostPulse — Build-in-Public Content Engine (Git Events → Publishable Drafts)

> **Translate your daily code commits and releases into authentic, high-converting Reddit deep-dives, Indie Hackers updates, and clean changelog entries. Zero corporate fluff.**

---

## 🎯 The Core Problem

Indie developers and micro-SaaS founders know they need to "build in public" to acquire early users. Reddit organic (e.g. `r/SideProject`, `r/webdev`, `r/SaaS`) is validated as the #1 organic acquisition channel for micro-SaaS. 

However:
- *"I'm not a content creator and this is kicking my ass"* is the universal founder complaint.
- Staring at a blank editor after a 4-hour debugging session is exhausting.
- Generic AI tools (like raw ChatGPT) sound like corporate marketing spam (*"🚀 Super thrilled to announce our latest milestone! In today's fast-paced digital world..."*). Developers downvote that immediately.
- A post about a **database migration** must read completely differently from one about **UI polish** or a **billing webhook race condition**.

---

## 💡 What PostPulse Does

PostPulse ingests Git events (via GitHub Webhooks, direct GitHub API imports, or local simulation), filters out trivial chores (like bumping lockfiles or markdown typos), calculates a **Post-Worthiness Score (0-100)**, and translates the code event into **3 publishable draft formats**:

| Format | Target Platform | Content Anatomy |
| :--- | :--- | :--- |
| **1. Technical Lesson** | Reddit (`r/SideProject`, `r/webdev`), Dev.to, Hacker News | The bottleneck / symptom → The naive assumption → The fix (with real SQL/TypeScript diff snippets) → 3 practical developer takeaways → Community discussion ask. |
| **2. Build-in-Public Story** | Indie Hackers, LinkedIn, X/Twitter | The founder struggle / metric → Why you delayed it or what broke → What shipping it taught you → Open question to fellow founders. |
| **3. Product Changelog** | Release Notes, In-App Modals | 1-2 crisp lines translating raw code churn into user value (e.g. *"⚡ Sped up dashboard load times by 70%"* instead of *"refactor query index"*). |

The developer edits, reviews the pre-publish checklist, and copies directly to their clipboard with 1 click. **No social inbox, no scheduling, no bloat—only high-leverage "code event → readable text" translation.**

---

## 🚀 Quick Start

### 1. Requirements
- Node.js 18+ (tested on Node 24)
- npm 9+

### 2. Install & Start
```bash
# Clone or navigate to the directory
cd "d:\Program\Developer Monetization & Growth\Build-in-Public Content Engine"

# Install dependencies
npm install

# Start development server
npm run dev
# OR build and run production server
npm run build
npm run start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔬 Key Risks & The 10-Commit Validation Benchmark

> **The Quality Bar:** Generate drafts from 10 real commits by one developer and ask: *"How many would you publish with light edits?"*
> **Rule:** Fewer than 4 publishable means quality is insufficient.

PostPulse comes pre-seeded with a **10-Commit Developer Validation Benchmark Suite** covering diverse real-world situations:
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

## ⚙️ Architecture & Features

### 1. Intelligent Post-Worthiness Classifier (`src/lib/classifier.ts`)
- Analyzes commit messages, modified file paths, and churn volume.
- Automatically assigns categories: `database_migration`, `performance`, `bug_war_story`, `security_auth`, `ui_ux`, `new_feature`, `chore_internal`.
- Penalizes trivial churn (lockfiles, documentation typos) and boosts high-leverage architectural shifts.

### 2. Dual-Engine Generation (`src/lib/generator.ts`)
- **Built-in Calibrated Engine**: Works 100% offline out-of-the-box with zero API keys required, using strict developer post structures.
- **External LLM Integration**: Connect your own **OpenAI** (`gpt-4o`, `gpt-4o-mini`), **Anthropic** (`claude-3-5-sonnet`), or **Google Gemini** (`gemini-1.5-flash`) via the Settings UI or `.env.local`.

### 3. Real GitHub Webhook Ingestion (`src/app/api/webhooks/github/route.ts`)
- Supports GitHub `push` and `release` webhooks.
- Verifies `X-Hub-Signature-256` HMAC-SHA256 signature against your configured secret.
- Automatically creates drafts when incoming commits meet your configured worthiness threshold.

### 4. Direct Public Repo Importer (`src/app/api/github/import/route.ts`)
- Don't have a webhook set up yet? Enter any public repository (`owner/repo`) to fetch recent commits via the GitHub REST API and ingest them into the studio in seconds.

### 5. Interactive Draft Studio (`src/components/DraftStudio.tsx`)
- Tabbed interface for all 3 formats.
- Tone / Angle switcher: *Authentic & Raw*, *Bug War Story*, *Hard Lesson*, *Spicy / Contrarian*, *Founder Vulnerable*, *Crisp & Minimal*.
- Real-time Markdown split-screen editor & live preview.
- Developer Pre-Publish Checklist (stripping tokens, checking compilation, removing corporate fluff).
- Word count & estimated read time meters.

---

## 🔒 Environment Variables (`.env.example`)

```ini
PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# GitHub Integration
GITHUB_WEBHOOK_SECRET=dev_secret_content_engine_123
GITHUB_PERSONAL_ACCESS_TOKEN=

# Optional LLM Overrides (or configure in Settings UI)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
LLM_MODEL=gpt-4o-mini
```

---

## 💰 Monetization Model
- **Solo Indie Tier**: $19–29/month (unlimited personal repos, calibrated Reddit + Indie Hackers + Changelog generation).
- **Team / Studio Tier**: $49/month (multiple contributors, team repos, custom brand voice templates).
