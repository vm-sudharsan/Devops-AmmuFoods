# 🚀 Netlify Frontend Deployment Guide - AmmuFoods

## ✅ Prerequisites

- ✅ Backend deployed on Render: `https://ammufoods-backend.onrender.com`
- ✅ Code pushed to GitHub: `https://github.com/ammufoods/AmmuFoods`
- ✅ netlify.toml configuration file created

---

## 🎯 Step-by-Step Deployment

### Step 1: Sign Up / Login to Netlify

1. Go to: https://app.netlify.com
2. Sign up or login
3. Click "Add new site" → "Import an existing project"

---

### Step 2: Connect GitHub Repository

1. Click "Deploy with GitHub"
2. Authorize Netlify to access your GitHub (if first time)
3. Search for: `ammufoods/AmmuFoods`
4. Click on the repository

---

### Step 3: Configure Build Settings

Netlify should auto-detect settings from `netlify.toml`, but verify:

**Site Settings:**
- **Branch to deploy**: `main`
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/dist`

**Advanced Settings:**
- Click "Show advanced"
- Click "New variable" to add environment variables

---

### Step 4: Add Environment Variables

Add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `VITE_API_URL` | `https://ammufoods-backend.onrender.com` | Your Render backend URL |
| `VITE_GOOGLE_CLIENT_ID` | `332915966002-pv2ofhvolku4gmcp5fa9jbsirb6vf1c8.apps.googleusercontent.com` | Google OAuth Client ID |

**Important**: 
- Make sure `VITE_API_URL` does NOT have a trailing slash
- Use your actual Render backend URL

---

### Step 5: Deploy Site

1. Click "Deploy site"
2. Netlify will start building (takes 2-3 minutes)
3. Watch the deploy logs in real-time

**Expected build output:**
```
Installing dependencies
npm install
...
Building site
npm run build
vite v7.3.1 building for production...
✓ built in 15s
...
Site is live ✨
```

---

### Step 6: Get Your Frontend URL

After successful deployment:
1. Your site will be live at: `https://[random-name].netlify.app`
2. Example: `https://ammufoods-app.netlify.app`
3. Copy this URL

---

### Step 7: Configure Custom Domain (Optional)

If you have a custom domain:

1. Go to "Domain settings"
2. Click "Add custom domain"
3. Enter your domain: `ammufoods.com`
4. Follow DNS configuration instructions
5. Netlify provides free SSL certificate

---

### Step 8: Update Backend CORS Settings

Now update your Render backend to allow the new frontend URL:

1. Go to Render dashboard: https://dashboard.render.com
2. Select your backend service: `ammufoods-backend`
3. Go to "Environment" tab
4. Update `FRONTEND_URL` variable:
   - Old: `https://ammufoods.vercel.app`
   - New: `https://[your-netlify-url].netlify.app`
5. Click "Save Changes"
6. Backend will automatically redeploy

---

### Step 9: Update Google OAuth Redirect URIs

1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add to "Authorized JavaScript origins":
   ```
   https://[your-netlify-url].netlify.app
   ```
6. Add to "Authorized redirect URIs":
   ```
   https://[your-netlify-url].netlify.app/login
   ```
7. Save

---

## 🧪 Test Your Deployment

### 1. Test Homepage
Visit: `https://[your-netlify-url].netlify.app`
- Should load without errors
- Check browser console for errors

### 2. Test API Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to view products or login
4. Check if API calls go to your Render backend

### 3. Test Authentication
1. Try to register a new user
2. Try to login
3. Check if JWT token is stored

### 4. Test Full Flow
1. Register as user
2. Browse products
3. Place an order
4. Check notifications

---

## 🔧 Post-Deployment Configuration

### 1. Set Custom Site Name

1. Go to "Site settings" → "General"
2. Click "Change site name"
3. Enter: `ammufoods` (if available)
4. Your URL becomes: `https://ammufoods.netlify.app`

---

### 2. Enable Deploy Previews

Netlify automatically creates preview deployments for pull requests:
- Every PR gets a unique preview URL
- Test changes before merging to main

---

### 3. Set Up Continuous Deployment

Already configured! Every push to `main` branch will:
1. Trigger automatic build
2. Deploy new version
3. No downtime (atomic deploys)

---

## 📊 Environment Variables Summary

For Netlify (Site settings → Environment variables):

```
VITE_API_URL=https://ammufoods-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=332915966002-pv2ofhvolku4gmcp5fa9jbsirb6vf1c8.apps.googleusercontent.com
```

---

## 🚨 Troubleshooting

### Issue: "Build failed - command not found"
**Solution:**
- Check Base directory is `frontend`
- Check Build command is `npm run build`
- Check Publish directory is `frontend/dist`

### Issue: "Page not found on refresh"
**Solution:**
- Make sure `netlify.toml` is in the `frontend` folder
- Check redirects configuration in netlify.toml

### Issue: "API calls failing / CORS errors"
**Solution:**
- Check `VITE_API_URL` environment variable
- Make sure backend `FRONTEND_URL` is updated
- Check browser console for exact error

### Issue: "Environment variables not working"
**Solution:**
- Environment variables must start with `VITE_`
- Redeploy after adding variables
- Check they're set in Netlify dashboard

### Issue: "Google OAuth not working"
**Solution:**
- Update authorized origins in Google Console
- Add Netlify URL to redirect URIs
- Clear browser cache and try again

---

## 📝 Important Notes

### Netlify Features:
- ✅ **Free tier**: 100GB bandwidth/month
- ✅ **Automatic HTTPS**: Free SSL certificate
- ✅ **CDN**: Global content delivery
- ✅ **Instant rollbacks**: One-click rollback to previous version
- ✅ **Deploy previews**: Test before going live

### Build Time:
- First build: 2-3 minutes
- Subsequent builds: 1-2 minutes
- Cached dependencies speed up builds

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Backend is live on Render
- [ ] Backend URL is ready
- [ ] netlify.toml file created
- [ ] Code pushed to GitHub

During deployment:
- [ ] Connected GitHub repository
- [ ] Set base directory to `frontend`
- [ ] Added environment variables
- [ ] Deployed successfully

After deployment:
- [ ] Tested frontend URL
- [ ] Updated backend FRONTEND_URL
- [ ] Updated Google OAuth URIs
- [ ] Tested full application flow
- [ ] Set custom site name (optional)

---

## 🎯 Your Deployment URLs

**Frontend**: `https://[your-site].netlify.app`  
**Backend**: `https://ammufoods-backend.onrender.com`  
**GitHub**: https://github.com/ammufoods/AmmuFoods  
**MongoDB**: `ammufoods_production` database

---

## 🔄 Future Deployments

To deploy updates:

1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Netlify automatically builds and deploys
4. Check deploy status in Netlify dashboard

---

## 📊 Monitoring

### Netlify Analytics (Optional - Paid)
- Page views
- Unique visitors
- Top pages
- Bandwidth usage

### Free Monitoring:
- Deploy logs
- Build time
- Deploy status
- Error logs

---

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Netlify shows "Published" status (green)
- ✅ Frontend URL loads correctly
- ✅ No console errors in browser
- ✅ API calls reach backend successfully
- ✅ Login/registration works
- ✅ All pages load correctly
- ✅ Images load from Cloudinary

---

## 🚀 Performance Optimization

Already configured in `netlify.toml`:
- ✅ SPA redirects for React Router
- ✅ Security headers
- ✅ Asset caching (1 year)
- ✅ Gzip compression (automatic)

---

## 📞 Support

**Netlify Docs**: https://docs.netlify.com  
**Netlify Support**: https://answers.netlify.com  
**Status Page**: https://www.netlifystatus.com

---

**Ready to deploy!** 🚀

Follow the steps above and your AmmuFoods frontend will be live in minutes!
