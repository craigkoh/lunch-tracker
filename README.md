# 🍕 Lunch Veto Tracker

A simple app for Craig, Seth, and Chris to track lunch rotations with veto power.

## Features
- **Turn Tracker**: Automatically rotates who picks each week
- **Veto System**: Each person can veto 2 places, last one standing wins
- **Restaurant Library**: Keep track of all the places you like
- **History**: See where you've been
- **Password Protected**: Shared password for access

## Setup Instructions

### Step 1: Create Supabase Account
1. Go to https://supabase.com and create a free account
2. Click "New Project"
3. Enter details:
   - Name: `lunch-tracker`
   - Generate a strong password (save it!)
   - Wait for project to create (~1 minute)

### Step 2: Set Up Database
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy everything from `supabase-setup.sql` and paste it
4. Click **Run** (▶️ button)
5. You should see "Success. No rows returned"

### Step 3: Get API Keys
1. In Supabase, click **Project Settings** (gear icon, bottom left)
2. Go to **API** section
3. Copy **Project URL** (starts with `https://...`)
4. Copy **anon public** key

### Step 4: Update app.js
1. Open `app.js` in a text editor
2. Replace these lines at the top:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```
With your actual values:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
```

3. Optional: Change the shared password:
```javascript
const SHARED_PASSWORD = 'your-password-here';
```

### Step 5: Deploy to Vercel (Free)

**Option A: Deploy with GitHub (Recommended)**
1. Create a GitHub repository
2. Upload these files:
   - `index.html`
   - `styles.css`
   - `app.js`
3. Go to https://vercel.com
4. Click "Add New..." → "Project"
5. Import your GitHub repository
6. Click **Deploy**

**Option B: Deploy from Command Line**
```bash
cd lunch-tracker
npm i -g vercel
vercel --prod
```

### Step 6: Share with Friends
1. You'll get a URL like: `https://lunch-tracker.vercel.app`
2. Text the URL + shared password to Seth and Chris
3. They can open it on their phones and log in!

## How to Use

### Login
- Enter your name (Craig, Seth, or Chris)
- Enter the shared password

### Starting a Round
1. The current picker sees "It's your turn to pick 3 places!"
2. Add 3 restaurants (from library or type new ones)
3. Click "Start Veto Phase"

### Veto Round
1. The other two people each tap ONE restaurant to veto
2. Once both have vetoed, the picker clicks "Complete Veto"
3. The winner is displayed!

### Restaurant Library
- Add new restaurants anytime
- Everyone can add places to the shared list

## Files
- `index.html` - Main page structure
- `styles.css` - Styling (mobile-friendly!)
- `app.js` - All the logic and Supabase integration
- `supabase-setup.sql` - Database setup script

## Troubleshooting

**"Setup Required" message?**
→ You need to update app.js with your Supabase URL and key.

**Can't log in?**
→ Check that the shared password matches what's in app.js.

**Changes not showing?**
→ The app has real-time updates built-in. Refresh the page.

**Want to change the password?**
→ Edit `app.js` and change `SHARED_PASSWORD`, then redeploy.

---

Built with ❤️ (and a little AI magic 🐕)
