# Temple Coupon Lottery — Admin/Staff Dashboard

A Next.js (App Router, TypeScript, Tailwind, shadcn/ui) frontend for the temple
coupon-lottery membership tracker. Customers pay ₹500/month for 6 months via
coupons; agents recruit customers. This is a pure frontend client — it talks
to a separately deployed Node/Express backend over a REST API using JWT
Bearer auth. There is no backend or API route code in this repo.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and set the backend URL:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set `NEXT_PUBLIC_API_URL` to your backend's URL
   (e.g. `http://localhost:5000` while developing against a local backend, or
   your Render backend URL).

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Visit http://localhost:3000 — you'll be redirected to `/login`.

## Auth model

The JWT returned by `POST /api/auth/login` is stored in `localStorage` under
the key `token` and attached to every API request as an `Authorization:
Bearer <token>` header (see `lib/api.ts`). `lib/auth.tsx` exposes an
`AuthProvider`/`useAuth()` React context that hydrates the current user via
`GET /api/auth/me` on load, and clears the session on a 401 response.

### Note on `middleware.ts`

This project intentionally has no `middleware.ts` (or a no-op one). Because
the JWT lives in `localStorage`, it is not readable from Next.js middleware
(which runs on the edge/server and only sees cookies). Real route protection
is therefore done client-side in `app/(dashboard)/layout.tsx`, which redirects
unauthenticated users to `/login`. The trade-off is that a logged-out user
briefly reaches the dashboard shell (or its loading skeleton) before being
redirected, rather than being blocked at the network edge. If stronger
server-side gating is ever needed, switch to an httpOnly cookie-based session
issued by the backend and add real middleware.

## Deployment (Vercel)

1. Push this repository to GitHub.
2. In Vercel, "Import Project" and select the repo.
3. Framework preset: Next.js (auto-detected).
4. Set the environment variable `NEXT_PUBLIC_API_URL` to your deployed Render
   backend URL (e.g. `https://your-backend.onrender.com`).
5. Deploy.

**A note on the Vercel plan.** The free "Hobby" tier works technically fine
at this scale — nothing here hits a hard technical limit. However, Hobby's
Terms of Service are scoped to personal/non-commercial use, and this app
collects real money on behalf of the temple. It's worth considering upgrading
to a Pro plan (~$20/month) for a project handling real payments, even though
nothing in this codebase requires it.

## Project structure

```
app/
  layout.tsx                 # Root layout — wraps app in AuthProvider + Toaster
  page.tsx                   # Redirects to /login
  login/page.tsx              # Phone + password login form
  (dashboard)/
    layout.tsx                 # Client-side auth guard + Sidebar/MobileNav shell
    dashboard/page.tsx          # Admin-only stat cards
    agents/                     # Agents list, create, edit
    customers/                  # Customers list (paginated, searchable), create, edit
    settings/page.tsx           # Admin-only user management
lib/
  api.ts                      # apiFetch() wrapper + typed API helper functions
  auth.tsx                    # AuthProvider / useAuth()
  nav.ts                       # Role-filtered nav item definitions
components/
  Sidebar.tsx, MobileNav.tsx   # Desktop nav / mobile Sheet drawer nav
  DataTable.tsx                # Generic table shell
  PaymentStatusGrid.tsx        # 6-month payment status chips
  AgentForm.tsx, CustomerForm.tsx
  ui/                          # shadcn/ui components
```

## Responsive design

- The sidebar becomes a `Sheet` drawer below `md`, opened from a hamburger
  button in a sticky top bar.
- Tables are wrapped in `overflow-x-auto`; the customers table switches to a
  stacked card layout below `sm` (`hidden sm:block` / `sm:hidden` pairs).
- Forms are single-column on mobile and switch to two columns on `sm+`.
- Dashboard stat cards use a responsive grid (`grid-cols-1 sm:grid-cols-2
  lg:grid-cols-4`).

## Build

```bash
npm run build
```
