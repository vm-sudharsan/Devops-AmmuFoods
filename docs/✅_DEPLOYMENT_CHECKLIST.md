# ✅ Deployment Checklist - AmmuFoods

## Pre-Deployment (Critical)

### Security (MUST DO):
- [ ] Generate new JWT_SECRET (64 characters)
- [ ] Change MongoDB password
- [ ] Create new Gmail app password
- [ ] Rotate Cloudinary API keys
- [ ] Generate new Google OAuth credentials
- [ ] Verify .env is in .gitignore
- [ ] Remove .env from git history (if committed)

### Code Preparation:
- [ ] Install xss package: `npm install xss`
- [ ] Run `npm audit fix` in backend
- [ ] Run `npm audit fix` in frontend
- [ ] Build frontend: `npm run build`
- [ ] Test locally with production env
- [ ] Remove console.logs from production code

### Database:
- [ ] Create production MongoDB cluster
- [ ] Set up IP whitelist
- [ ] Enable encryption at rest
- [ ] Configure automated backups
- [ ] Create database indexes

---

## Deployment

### Backend Deployment:
- [ ] Choose platform (Vercel/Railway/Render)
- [ ] Deploy backend
- [ ] Add all environment variables:
  - [ ] NODE_ENV=production
  - [ ] MONGO_URI
  - [ ] JWT_SECRET
  - [ ] SMTP_EMAIL
  - [ ] SMTP_APP_PASSWORD
  - [ ] GOOGLE_CLIENT_ID
  - [ ] CLOUDINARY_CLOUD_NAME
  - [ ] CLOUDINARY_API_KEY
  - [ ] CLOUDINARY_API_SECRET
  - [ ] FRONTEND_URL
- [ ] Verify deployment successful
- [ ] Note backend URL

### Frontend Deployment:
- [ ] Choose platform (Vercel/Netlify)
- [ ] Deploy frontend
- [ ] Add environment variables:
  - [ ] VITE_API_URL (backend URL)
  - [ ] VITE_GOOGLE_CLIENT_ID
- [ ] Verify deployment successful
- [ ] Note frontend URL

### Domain Configuration:
- [ ] Configure custom domain (optional)
- [ ] Update CORS whitelist with production URL
- [ ] Update FRONTEND_URL in backend env
- [ ] Verify SSL certificate active
- [ ] Test HTTPS redirect

---

## Post-Deployment Testing

### Smoke Tests:
- [ ] Health endpoint: `curl https://api.yourdomain.com/health`
- [ ] Frontend loads: Visit https://yourdomain.com
- [ ] Login works
- [ ] Registration works
- [ ] Google OAuth works

### Feature Tests:
- [ ] User can register
- [ ] User can login
- [ ] User can place order
- [ ] User can request event
- [ ] User can apply for shop partnership
- [ ] Shop user can place daily orders
- [ ] Admin can approve shop requests
- [ ] Admin can manage orders
- [ ] Admin can manage events
- [ ] Admin can view dashboard
- [ ] Notifications work
- [ ] Email sending works
- [ ] File uploads work

### Security Tests:
- [ ] HTTPS enforced
- [ ] CORS working correctly
- [ ] Rate limiting active
- [ ] Authentication required for protected routes
- [ ] Authorization working (role-based access)
- [ ] XSS protection active
- [ ] SQL injection protection verified

### Performance Tests:
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images loading properly
- [ ] Mobile responsive
- [ ] No console errors

---

## Monitoring Setup

### Error Tracking:
- [ ] Set up Sentry (optional)
- [ ] Configure error alerts
- [ ] Test error reporting

### Uptime Monitoring:
- [ ] Set up UptimeRobot/Pingdom
- [ ] Configure downtime alerts
- [ ] Add status page

### Logging:
- [ ] Configure log aggregation
- [ ] Set up log rotation
- [ ] Configure log alerts

---

## Documentation

### Update Documentation:
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Document environment variables
- [ ] Create API documentation
- [ ] Document common issues

### Team Communication:
- [ ] Notify team of deployment
- [ ] Share production URLs
- [ ] Share admin credentials (securely)
- [ ] Schedule training session

---

## Backup & Recovery

### Backups:
- [ ] Verify database backups enabled
- [ ] Test backup restoration
- [ ] Document backup schedule
- [ ] Set up backup alerts

### Disaster Recovery:
- [ ] Document rollback procedure
- [ ] Test rollback process
- [ ] Create emergency contacts list
- [ ] Document escalation procedure

---

## Optimization (Optional)

### Performance:
- [ ] Enable compression
- [ ] Add caching headers
- [ ] Configure CDN
- [ ] Optimize images
- [ ] Minify assets

### SEO:
- [ ] Add meta tags
- [ ] Configure sitemap
- [ ] Add robots.txt
- [ ] Set up Google Analytics

---

## Final Verification

### Checklist:
- [ ] All features working
- [ ] No errors in console
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Team notified

---

## Success Criteria

✅ Application accessible at production URL  
✅ All features working as expected  
✅ No security vulnerabilities  
✅ Performance meets requirements  
✅ Monitoring and alerts active  
✅ Backups configured  
✅ Documentation complete  
✅ Team trained  

---

## Deployment Commands Quick Reference

### Generate Secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Backend Deploy (Vercel):
```bash
cd backend
vercel --prod
```

### Frontend Deploy (Vercel):
```bash
cd frontend
npm run build
vercel --prod
```

### Test Health:
```bash
curl https://api.yourdomain.com/health
```

---

## Emergency Rollback

If something goes wrong:

```bash
# Vercel rollback
vercel rollback

# Check logs
vercel logs

# Redeploy previous version
vercel --prod
```

---

## Support Contacts

- **Technical Lead**: [Your Name]
- **DevOps**: [DevOps Contact]
- **Database Admin**: [DBA Contact]
- **Security**: [Security Contact]

---

**Deployment Status**: ⏳ Pending  
**Last Updated**: February 19, 2026  
**Next Review**: After deployment  

---

## Notes

Add any deployment-specific notes here:
- 
- 
- 

---

**Ready to Deploy?** 🚀

Once all checkboxes are complete, you're ready for production!
