# ⚡ Netlify Quick Setup - Copy & Paste

## 🎯 Step 1: Netlify Setup

1. Go to: https://app.netlify.com
2. "Add new site" → "Import an existing project"
3. "Deploy with GitHub"
4. Select: `ammufoods/AmmuFoods`

---

## 🎯 Step 2: Build Configuration

Verify these settings (auto-detected from netlify.toml):

```
Branch: main
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

---

## 🎯 Step 3: Environment Variables

Click "Show advanced" → Add these variables:

```
VITE_API_URL=https://ammufoods-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=332915966002-pv2ofhvolku4gmcp5fa9jbsirb6vf1c8.apps.googleusercontent.com
```

**Important**: Replace with your actual Render backend URL!

---

## 🎯 Step 4: Deploy

1. Click "Deploy site"
2. Wait 2-3 minutes
3. Your site is live! 🎉

---

## 🎯 Step 5: Update Backend CORS

Go to Render dashboard:
1. Select `ammufoods-backend`
2. Environment tab
3. Update `FRONTEND_URL` to your Netlify URL
4. Save (auto-redeploys)

---

## 🎯 Step 6: Update Google OAuth

Go to: https://console.cloud.google.com
1. Credentials → Edit OAuth Client
2. Add Authorized JavaScript origins:
   ```
   https://[your-site].netlify.app
   ```
3. Add Authorized redirect URIs:
   ```
   https://[your-site].netlify.app/login
   ```
4. Save

---

## 🎯 Step 7: Test Your App

Visit: `https://[your-site].netlify.app`

Test:
- ✅ Homepage loads
- ✅ Products display
- ✅ Login works
- ✅ Registration works
- ✅ No console errors

---

## ✅ Success Checklist

- [ ] Netlify shows "Published" (green)
- [ ] Frontend URL loads
- [ ] Backend FRONTEND_URL updated
- [ ] Google OAuth URIs updated
- [ ] Login/registration works
- [ ] API calls successful

---

## 📝 Your URLs

**Frontend**: `https://[your-site].netlify.app`  
**Backend**: `https://ammufoods-backend.onrender.com`  
**GitHub**: https://github.com/ammufoods/AmmuFoods

---

## 🚨 Quick Fixes

**Build failed?**
→ Check base directory is `frontend`

**API not working?**
→ Check VITE_API_URL environment variable

**CORS errors?**
→ Update FRONTEND_URL in Render backend

**OAuth not working?**
→ Add Netlify URL to Google Console

---

## 🎯 Optional: Custom Site Name

1. Site settings → General
2. "Change site name"
3. Enter: `ammufoods`
4. URL becomes: `https://ammufoods.netlify.app`

---

**Your AmmuFoods app is now LIVE!** 🎉🍬

Frontend + Backend both deployed and connected!
