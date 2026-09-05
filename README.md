# QuantifySec

Built for Smart India Hackathon 2026 (PS ID: SIH26105, Theme: Blockchain and Cybersecurity) by Team Cogitare.

## What it does

Security teams find vulnerabilities. Finance teams control budgets. The two rarely speak the same language, so fixes get delayed or the wrong things get funded.

QuantifySec closes that gap. It takes raw vulnerability and asset data, calculates how much money is actually at risk using the Open FAIR standard, and then solves for the exact combination of fixes that reduces the most risk within a given budget. CISOs and CFOs look at the same dashboard and see numbers that make sense to them.

Three things it does well:

* Converts vulnerability severity and asset value into an actual rupee figure, not just a severity label
* Uses integer linear programming to pick the set of fixes that gives the best risk reduction per rupee spent
* Weighs context properly: a medium bug on a critical database matters more than a high bug on something unimportant

## How the pipeline fits together

The project is split into 8 modules, each owned by a different team member.

1. **Synthetic Data Generation** - creates realistic fake vulnerability and asset data for demos
2. **Data Ingestion \& Parsing** - accepts OCSF-compliant JSON from any scanner, maps CVE/CVSS scores to asset values
3. **Monte Carlo Risk Engine** - runs 10,000 simulated attack scenarios in about 2 seconds to calculate Annualized Loss Expectancy (ALE = Single Loss Expectancy x Annual Rate of Occurrence), following the Open FAIR standard
4. **Knapsack Optimization Solver** - runs integer linear programming with PuLP against a budget constraint to pick the optimal set of fixes to fund
5. **Backend API \& Database** - Python API on top of Supabase Postgres, checks the JWTs issued by the auth layer before returning any role-restricted data
6. **Authentication \& RBAC Layer** - Supabase Auth sessions, Next.js middleware for role checks, and routing that keeps CISO and CFO dashboards separate
7. **Documentation \& Reporting** - audit trail and compliance mapping against the SEBI CSCRF framework
8. **Frontend Dashboard \& UI** - Next.js and Recharts, with loss-exceedance curves and a budget slider that updates the optimization live, split into a CISO view and a CFO view

Rough flow: synthetic or real scanner data goes through ingestion, the risk engine turns it into a dollar figure, the optimizer decides what to fund under the budget, and the dashboard shows the result to both roles through the auth layer.

## Stack

* **Math engine**: Python, NumPy, SciPy, PuLP (COIN-OR solver)
* **Backend**: Python, Gemini Flash API for turning technical jargon into plain language, Ollama as a local fallback
* **Frontend**: React, Next.js, Recharts
* **Data**: Supabase (Postgres + Auth), OCSF-compliant JSON for ingestion
* **Deployment**: Vercel for frontend, Railway for backend, both on free tier

## Auth and RBAC notes

Roles (`ciso`, `cfo`) live in Supabase `app\_metadata`, which only a service role can edit. They're not stored in `user\_metadata` since that's user-editable and would let someone grant themselves access.

Roles are also mirrored into a `profiles` table (user\_id, role, name) in Postgres so the backend can query role info directly instead of decoding JWTs on every request.

Routes are split as `/dashboard/ciso/\*` and `/dashboard/cfo/\*`, with `/unauthorized` for role mismatches and `/login` for auth. Middleware calls `supabase.auth.getUser()` instead of `getSession()` because it revalidates against the Supabase Auth server rather than trusting a cookie that could be stale.

The frontend middleware only protects page routes. The backend independently verifies the same JWTs on the Python side, since someone could hit the API directly and skip the middleware entirely.

As a stretch goal, Postgres Row Level Security policies would add another layer, so even if the API check were somehow bypassed, a CISO session still couldn't pull CFO-only rows and vice versa.

## Team

|Module|Main Lead|
|-|-|
|Synthetic Data Generation|Ram Kumar Sharma|
|Data Ingestion \& Parsing|Riyansh Dhar Mishra|
|Monte Carlo Risk Engine|Omaansh Kaushal |
|Knapsack Optimization Solver|Rohan Kumar Gupta|
|Backend API \& Database|Omaansh Kaushal, RIyansh Dhar Mishra |
|Authentication \& RBAC Layer|Nidhish Kumar|
|Documentation \& Reporting|Nancy Agarwal|
|Frontend Dashboard \& UI|Rohan Kumar Gupta |

## Running it locally

```bash
git clone https://github.com/<your-org>/quantifysec.git
cd quantifysec

cd frontend \&\& npm install \&\& npm run dev

cd backend \&\& pip install -r requirements.txt \&\& python main.py
```

User'll need these environment variables set (see `.env.example` in each folder):

* `NEXT\_PUBLIC\_SUPABASE\_URL`
* `NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY`
* `SUPABASE\_SERVICE\_ROLE\_KEY`
* `GEMINI\_API\_KEY`

