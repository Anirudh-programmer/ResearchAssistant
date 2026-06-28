# Collaborative LLM Development & Debugging Logs

This document logs the design discussions, debugging sessions, and engineering handoffs between the Lead Developer (Anirudh) and the AI Coding Assistant (Antigravity) during the development of **Verdict**. It outlines how the developer guided the AI, identified runtime bugs, verified implementations, and cleaned up the codebase for production release.

---

## Session 1: Technical Stack Selection & Backend Architecture Setup
- **Developer Input**: Defined technical requirements for the take-home assignment. Instructed the assistant to use React (Vite/TypeScript) for the frontend and Express (Node.js/TypeScript) for the backend. Recommended using LangGraph.js for the stateful agent pipeline and Neon PostgreSQL as the database provider via Prisma ORM.
- **AI Actions**: Prepared the directory structure, mapped out database tables in `schema.prisma`, and configured the root package settings.

---

## Session 2: Database Setup & Prisma ORM Migration
- **Developer Input**: Configured Neon PostgreSQL connection parameters and directed the assistant to synchronize the database schema.
- **AI Actions**: Executed `npx prisma db push` to initialize tables. Worked around standard Windows PowerShell script execution constraints using `cmd /c` shell wrappers.

---

## Session 3: Express Backend Routing & Base Configuration
- **Developer Input**: Specified that router handlers must stay thin and remain strictly separated from business logic. Guided the configuration of the server entry point `main.ts`.
- **AI Actions**: Created thin routes (`/reports`, `/analyze`, `/favorite`, etc.) and integrated middleware for CORS handling, Zod validation, and error processing.

---

## Session 4: LangGraph.js Investment Agent Design
- **Developer Input**: Guided the design of a 4-node investment research pipeline. Directed that the graph state must update sequentially: `research profile -> collect news -> sentiment & risk -> LLM reasoning`.
- **AI Actions**: Programmed individual graph nodes, built the `StateGraph` object in `graph.ts`, and ensured proper data typing for the generated results.

---

## Session 5: LLM Model Swappability & Graceful Tool Fallbacks
- **Developer Input**: Instructed the assistant to abstract LLM model classes into a single helper (`getLLMProvider()`) so providers (Gemini, OpenAI, Claude) are swappable without changing graph nodes. Directed research tools to degrade gracefully (returning empty/unavailable schemas) if keys are missing.
- **AI Actions**: Developed LLM provider wrappers in `src/llm/` and standard `ToolResult` interface handlers in `src/tools/base.ts`.

---

## Session 6: Authentication Gating & clerk Redirect Gating
- **Developer Input**: Noticed that signed-in users navigating back to `/` were displayed the public landing page instead of being redirected directly to the dashboard. Directed a fix.
- **AI Actions**:
  - Implemented the `PublicOnlyRoute` wrapper around `/` in `App.tsx`.
  - Configured `forceRedirectUrl="/dashboard"` on Clerk components to override default redirection behavior.

---

## Session 7: Server-Sent Events (SSE) Streaming Route
- **Developer Input**: Instructed the implementation of a real-time streaming endpoint `/api/v1/analyze/stream` so users do not have to wait for the entire 15+ second LLM pipeline to finish before seeing progress.
- **AI Actions**: Set up Express SSE headers (`text/event-stream`) and iteratively flushed graph node chunk events (`step_complete` / `report`) back to the client.

---

## Session 8: SMTP Mailer Logic and Diagnostic Verification
- **Developer Input**: Pointed out that reports generated successfully but notification emails were not being received. Directed the assistant to write a validator script to isolate SMTP/nodemailer connection issues.
- **AI Actions**:
  - Wrote a database/SMTP diagnostic helper script to test Gmail SMTP credentials.
  - Traced the bug: the stream route bypassed standard email tasks. Integrated `sendReportEmail` directly into the stream completion handler in `stream.ts`.

---

## Session 9: Dark-Theme Responsive HTML Email Template
- **Developer Input**: Guided the assistant to upgrade plain-text fallback alerts to a responsive, premium HTML template matching Verdict's design system.
- **AI Actions**:
  - Created a table-based, mobile-friendly HTML template in `reportService.ts`.
  - Styled verdict badges (green for `INVEST`, red for `PASS`) and progress indicators for score metrics.

---

## Session 10: Outbound SMTP Egress Block on Render & Vercel Mailer Setup
- **Developer Input**: Discovered that Render's egress policy blocks standard SMTP ports (587, 465) on free instance web services. Instructed the assistant to move email-sending logic to a Vercel Serverless Function since Vercel permits outbound mail traffic.
- **AI Actions**:
  - Created a serverless API handler `frontend/api/send-email.ts` with token-based `MAILER_SECRET` header validation.
  - Configured negative lookahead rewrites in `vercel.json` to prevent Vercel from routing `/api/*` requests to the client-side SPA router.
  - Refactored backend `sendReportEmail` to send HTTPS POST payloads to the Vercel function if configured.

---

## Session 11: SSE Stream Parser Trailing Buffer Bug Fix
- **Developer Input**: Found that after analysis steps completed, the research page hung on the loader instead of showing the report details, and the sidebar list of recent reports did not update until a page refresh.
- **AI Actions**:
  - Traced the bug to how the SSE stream decoder split events on `\n\n`.
  - Discovered that if the last event (the `"report"` chunk) did not end with double newlines, it remained in the buffer and was never processed, causing the loader to hang and preventing sidebar query invalidations.
  - Refactored `streamAnalysis` in `reportService.ts` to flush and parse the remaining buffer when the stream completes.

---

## Session 12: SMTP Deprecation & Account Views Pruning
- **Developer Input**: To optimize application complexity and remove unnecessary third-party requirements before packaging, decided to remove the email notification feature. Additionally, requested the removal of the `/account` settings panel and navigation links from the UI.
- **AI Actions**:
  - Made backend `sendReportEmail` a no-op function and removed all SMTP and Vercel mailer keys from config schemas and env files.
  - Deleted `AccountPage.tsx`, removed its routing in `App.tsx`, and removed the settings entry and unused Settings icon import from `AppSidebar.tsx`.

---

## Session 13: Assignment Submission Packaging Automation
- **Developer Input**: Requested packaging the final workspace source code into a clean, lightweight zip archive for direct upload to the Google Form.
- **AI Actions**: Programmed a Node.js utility script `create_zip.js` that copied source files (explicitly ignoring heavy directories like `node_modules`, `.git`, `.gemini`, and build bundles) and built `submission.zip` in the workspace root.

---

## Session 14: Secret Scanning & Git Push Resolution
- **Developer Input**: The git push was rejected by GitHub Push Protection due to active API keys (e.g. Google Gemini key) captured in raw session logs. Directed their immediate redaction.
- **AI Actions**: Created a helper script `redact_secrets.js` using global regex matches to strip credentials from `LLM_CHAT_TRANSCRIPT.md` and replace them with safe placeholders. Amended the commit and pushed it successfully to GitHub.
