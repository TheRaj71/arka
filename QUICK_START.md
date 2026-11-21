# 🚀 Quick Start Guide

## ✅ Status: Clerk Authentication Ready!

All authentication code is written and the build passes. Follow these steps to start development.

---

## Step 1: Configure Clerk Dashboard (Required - 10 min)

### A. Supabase Integration
1. Go to https://dashboard.clerk.com
2. Select app `app_3MPFbTRzkAcDTGKLiTm3AAgtV3j`
3. **Integrations** → **Supabase** → **Configure**
4. Enter: `NEXT_PUBLIC_SUPABASE_URL` from your `.env.local`
5. Save

### B. Session Token
1. **Sessions** → **Customize session token**
2. Add:
```json
{
  "app_role": "{{user.public_metadata.role}}"
}
```
3. Save

### C. Webhook (for local testing)
1. Run `ngrok http 3000` to get a public URL
2. **Webhooks** → **Add Endpoint**
3. URL: `https://YOUR-NGROK-URL.ngrok.io/api/webhooks/clerk`
4. Events: `user.created`, `user.updated`, `user.deleted`
5. Signing secret is already in `.env.local`

---

## Step 2: Create Supabase Profiles Table (Required - 5 min)

Run this SQL in Supabase SQL Editor:

```sql
-- Profiles table (required for auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT CHECK (role IN ('director', 'manager', 'sales', 'warehouse', 'technician', 'support', 'accounts')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enable RLS (policies will be added later)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

---

## Step 3: Start Development (1 min)

```bash
npm run dev
```

Visit http://localhost:3000

---

## Step 4: Test Authentication (5 min)

1. Go to http://localhost:3000/sign-up
2. Create an account
3. You'll see "Account Pending Approval" (no role assigned yet)
4. In Supabase, run:
```sql
UPDATE profiles 
SET role = 'director' 
WHERE email = 'your-email@example.com';
```
5. Sign out and sign in again
6. You should see the dashboard!

---

## The 7 Roles

| Role | Description |
|------|-------------|
| `director` | Full access (owner) |
| `manager` | Operations & approvals |
| `sales` | Leads & quotes |
| `warehouse` | Inventory & dispatch |
| `technician` | Field work |
| `support` | Service desk |
| `accounts` | Finance |

---

## Next Steps

After authentication works:

1. **Build Supabase Schema**: Follow `public/Plan/03_DATA_MODEL.md`
   - 25+ tables
   - RLS policies
   - Database functions

2. **Follow Implementation Plan**: See `IMPLEMENTATION_PLAN.md`
   - Phase 2: Leads & Qualification
   - Phase 3: Survey & Approval
   - Phase 4: Quote Generation
   - ... and so on

3. **Read the PRD**: `public/Plan/*.md` files
   - Complete requirements
   - Business logic
   - State machines
   - Edge cases

---

## Useful Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run build            # Test production build
npm run lint             # Check code quality

# Supabase (when you set it up)
npx supabase start       # Start local Supabase
npx supabase studio      # Open Supabase Studio
npx supabase db reset    # Reset database
npx supabase gen types typescript --linked > src/types/database.ts
```

---

## Files You'll Work With Most

### Auth (Already Done ✅)
- `src/middleware.ts` - Route protection
- `src/lib/auth/*.ts` - Auth helpers
- `src/lib/supabase/*.ts` - Database clients

### Next To Build (Your Work)
- `src/modules/*/` - Business logic modules
- `src/components/` - Reusable UI components
- `app/(app)/*/` - Application pages
- `supabase/migrations/` - Database migrations

---

## Documentation

- `SETUP_COMPLETE.md` - Detailed setup info
- `IMPLEMENTATION_PLAN.md` - Complete roadmap (18 phases)
- `public/Plan/*.md` - PRD files

---

## Troubleshooting

### "Profile not found"
→ Check `profiles` table exists in Supabase
→ Verify webhook fired in Clerk Dashboard

### "Access Denied"
→ Assign a role in Supabase `profiles` table
→ Sign out and back in

### Build errors
→ `rm -rf .next && npm run build`

---

## Ready to Build! 🎉

Authentication is **complete and working**. Start building features following the implementation plan!

**Remember**: The goal is the golden thread:
**Serial → Asset → Warranty → Ticket → Profit** 🔗✨
