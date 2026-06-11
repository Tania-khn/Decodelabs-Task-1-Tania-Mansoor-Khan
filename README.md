# Decodelabs-Task-1-Tania-Mansoor-Khan
A Python-based security tool that analyzes password strength and provides real-time feedback to help users create stronger and more secure passwords.
# 🔐 Password Strength Checker
Cybersecurity by Tania — Project 1
**📖 Description**
A modern, interactive Password Strength Checker web application built with Next.js 16, TypeScript, and Tailwind CSS. This tool analyzes passwords in real-time, evaluating their strength based on length, character variety, entropy, and vulnerability to common password databases. It provides instant visual feedback with security scores, estimated crack times, and actionable suggestions to improve password security.

#  ✨ Features:
Landing Page:
* Animated Logo — Cybersecurity shield with gradient styling
* "Secure Your Digital Future with Tania" — Bold gradient title
* "Stay Safe And Secure" — Subtitle
* Fingerprint Scanner — Interactive biometric simulation with scan animation and verification
* Get Started Button — Smooth transition to the main app.

# 🔍 Password Analysis
Real-time Strength Detection — Classifies passwords as Weak, Medium, Strong, or Very Strong
Password Length Check — Scores for 8+, 12+, and 16+ character passwords
Character Type Detection — Checks uppercase (A-Z), lowercase (a-z), numbers (0-9), and special symbols (!@#$)
Entropy Calculation — Measures information entropy in bits
Crack Time Estimation — Estimates brute-force attack duration based on 10 billion guesses/second
Common Password Detection — Flags 70+ commonly leaked passwords (e.g., "123456", "password", "qwerty")
Sequential Pattern Detection — Penalizes patterns like "abc", "123", "xyz"
Repeated Character Detection — Penalizes repeated characters like "aaa", "111"

# 📊 Visual Feedback
Strength Badge — Color-coded badge (Red/Amber/Emerald) with animated transitions
Security Score — 0-100 progress bar with smooth animation
Criteria Checklist — Visual checkmarks showing which requirements are met
Character Type Grid — A-Z, a-z, 0-9, !@#$ indicators
Suggestions — Actionable tips to improve password strength

# 🛠️ Tools:
Password Generator — One-click secure password generation (16-20 characters, all types included)
Show/Hide Toggle — Eye icon to toggle password visibility
Copy to Clipboard — One-click copy button
Check History — Saves last 5 analyzed passwords with timestamps
Security Logic Analyzer — Clickable button that focuses input and triggers analysis animation

# 📚 Security Best Practices:
6 educational security tips displayed in a card grid
Topics: Length, Character Mix, Common Passwords, Uniqueness, Leak Checking, Password Managers

# | Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16 | React Framework with App Router |
| TypeScript | 5 | Type-safe JavaScript |
| Tailwind CSS | 4 | Utility-first styling |
| shadcn/ui | Latest | UI component library |
| Framer Motion | 12 | Animations and transitions |
| Lucide React | Latest | Icon library |
| React | 19 | UI library |
## 🚀 How to Run:
### Prerequisites:
- **Node.js** v18 or higher — [Download](https://nodejs.org)
- **VS Code** — [Download](https://code.visualstudio.com)

### Installation Steps:
1. **Extract the ZIP file** to your desired folder
2. **Open in VS Code**
   ```
   File → Open Folder → Select the extracted folder
   ```
3. **Open Terminal** in VS Code
   ```
   Press Ctrl + ` (backtick)
   ```
4. **Install Dependencies**
   ```bash
   npm install
   ```
5. **Start Development Server**
   ```bash
   npm run dev
   ```
6. **Open in Browser**
   ```
   http://localhost:3000
   ```
### Build for Production
```bash
npm run build
npm start
```
## 📁 Project Structure

password-strength-checker/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main page (Landing + Checker)
│   │   ├── layout.tsx        # Root layout with metadata
│   │   ├── globals.css       # Global styles and CSS variables
│   │   └── api/
│   │       └── route.ts      # API route
│   ├── components/
│   │   └── ui/               # shadcn/ui components (50+)
│   ├── hooks/                # Custom React hooks
│   └── lib/
│       ├── utils.ts          # Utility functions
│       └── db.ts             # Database client
├── public/
│   ├── cyber-logo.png        # App logo
│   └── logo.svg              # Fallback logo
├── prisma/
│   └── schema.prisma         # Database schema
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.ts            # Next.js configuration
├── postcss.config.mjs        # PostCSS configuration
├── eslint.config.mjs         # ESLint configuration
└── components.json           # shadcn/ui configuration
```
## 🎯 How It Works:
### Password Scoring System (0-100)

| Category | Criteria | Points |
|----------|----------|--------|
| Length | 8+ characters | 10 |
| Length | 12+ characters | 10 |
| Length | 16+ characters | 10 |
| Variety | Lowercase (a-z) | 10 |
| Variety | Uppercase (A-Z) | 10 |
| Variety | Numbers (0-9) | 10 |
| Variety | Symbols (!@#$) | 10 |
| Mix | 3+ character types | 10 |
| Mix | All 4 character types | 10 |
| Bonus | 20+ characters | 10 |

### Strength Classification:
| Score | Strength | Color |
|-------|----------|-------|
| 0-25 | Weak | 🔴 Red |
| 26-50 | Medium | 🟡 Amber |
| 51-75 | Strong | 🟢 Emerald |
| 76-100 | Very Strong | 🟢 Dark Emerald |

### Penalties:
- **Common/Leaked Password**: Score capped at 15
- **Under 6 characters**: Score capped at 25
- **Sequential characters** (abc, 123): -10 points
- **Repeated characters** (aaa, 111): -10 points

# 📜 License:
**This project was developed as part of my Cybersecurity Internship at Decodelabs.**
