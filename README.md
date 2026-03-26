# Wroob 🚀
### *Where students get their first real shot — and companies find talent worth betting on.*

Wroob is an AI-native internship platform built for the next generation of professionals. We cut through the noise of generic job boards and replace the "spray-and-pray" application cycle with something smarter: **skills-based matching** that connects the right student with the right opportunity, every time.

---

## What is Wroob?

Think of Wroob as the matchmaker between ambition and opportunity. Students build rich profiles — skills, coursework, culture fit — and our platform surfaces internships that actually make sense for them. Employers stop drowning in irrelevant applications and start seeing candidates who genuinely fit.

It's not a job board. It's a **bright match engine**.

---

## ✨ Features

**For Students**
- 🎯 Skills-based internship discovery with match scoring
- 📋 One-click applications with cover letter + resume
- 🧪 Skill tests to prove what you know (not just what you claim)
- 🏕️ Campus community, groups, and peer discovery
- 📬 Real-time notifications on every application update

**For Employers**
- 📝 Post internships with required skills and smart candidate filtering
- 📊 Applicant review dashboard with per-candidate match scores
- 🏢 Company onboarding that builds trust with verified profiles
- ✅ Shortlist, interview, accept — all in one place

**Platform-Wide**
- 🔐 Role-based auth (Student / Employer / Admin)
- 🛡️ Admin panel for moderation, analytics, and oversight
- 🌙 Dark mode support
- 📱 Fully responsive

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend & Auth | Lovable Cloud (Supabase) |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone <YOUR_GIT_URL>
cd wroob

# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# → Fill in your Lovable Cloud credentials

# Run it locally
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign up as a Student or Employer to explore the full flow.

---

## 🗂️ Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── onboarding/   # Multi-step onboarding flows
│   ├── internship/   # Internship forms & cards
│   ├── reputation/   # Reputation score system
│   └── admin/        # Admin dashboard components
├── pages/            # Route-level page components
└── App.tsx           # Root router & layout
```

---

## 🌱 Roadmap

- [ ] AI-powered cover letter suggestions
- [ ] Recruiter direct messaging
- [ ] Resume parsing and auto-fill
- [ ] Internship outcome tracking (did they get hired full-time?)
- [ ] University partnerships & verified student IDs

---

## 🤝 Contributing

We're early and moving fast. If you spot a bug, have a wild idea, or want to help build the future of early-career hiring — open an issue or shoot us a PR. All skill levels welcome.

---

## 📄 License

MIT — go build something great.

---

*Made with ☕ and the belief that your first internship shouldn't be the hardest thing you ever do.*
