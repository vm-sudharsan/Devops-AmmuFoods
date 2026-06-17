# AmmuFoods - Production-Ready Food Business Platform

A comprehensive B2B/B2C e-commerce platform for home-based food manufacturing with daily supply chain management, event catering, and shop partnership system.

## 🎯 Business Model

- **End Users**: Order party/event catering
- **Shop Owners**: Apply for partnership → Place daily bulk orders (tomorrow only)
- **Admins**: Approve shops, manage inventory, track manufacturing

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT + Google OAuth
- **Email**: Nodemailer (Gmail SMTP)
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Image Storage**: Cloudinary (ready)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📋 Features

### For End Users
- ✅ Browse products
- ✅ Submit party/event catering requests
- ✅ View order history
- ✅ Google OAuth login
- ✅ User profile management

### For Shop Owners
- ✅ Submit shop partnership request (with comprehensive details)
- ✅ Place daily bulk orders (tomorrow only - enforced)
- ✅ View order history with status tracking
- ✅ Receive email notifications on order status changes
- ✅ Submit event requests

### For Admins
- ✅ Review and approve/reject shop requests
- ✅ Manage product catalog
- ✅ View all orders with filtering
- ✅ Update order status (PLACED → APPROVED → PACKED → DELIVERED)
- ✅ View manufacturing requirements for tomorrow
- ✅ View sales analytics
- ✅ Manage notifications
- ✅ System health monitoring
- ✅ Complete audit trail of all actions

## 🔐 Security Features

- ✅ JWT authentication with 7-day expiry
- ✅ Google OAuth integration
- ✅ Password hashing with bcrypt (salt: 10)
- ✅ HttpOnly cookies
- ✅ Helmet middleware for security headers
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS configured for production
- ✅ Input validation with express-validator
- ✅ Audit logging for compliance
- ✅ IP address and user agent tracking

## 📊 Database Schema

### Models (7)
1. **User** - Authentication and role management
2. **Product** - Product catalog
3. **Order** - Shop orders with status tracking
4. **ShopRequest** - Partnership applications
5. **EventRequest** - Catering requests
6. **Notification** - In-app notifications
7. **AuditLog** - Complete audit trail (NEW)

### Indexes (15+)
- Optimized for fast queries
- Compound indexes for common patterns
- Text search on products
- See models for details

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Gmail account with App Password
- Google Cloud Console project (for OAuth)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ammufoods
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/health

## 📝 Environment Variables

See `backend/.env.example` for complete list. Key variables:

```env
# Database
MONGO_URI=mongodb://localhost:27017/ammufoods

# Authentication
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_client_id

# Email
SMTP_EMAIL=your_email@gmail.com
SMTP_APP_PASSWORD=your_gmail_app_password
ADMIN_EMAIL=admin@ammufoods.com

# Frontend (for CORS)
FRONTEND_URL=https://ammufoods.vercel.app
```

## 🌐 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

### Quick Deploy
- **Backend**: Render (recommended)
- **Frontend**: Vercel (recommended)
- **Database**: MongoDB Atlas
- **Images**: Cloudinary

## 📚 Documentation

- [PRODUCTION_ANALYSIS.md](PRODUCTION_ANALYSIS.md) - Comprehensive analysis and improvement plan
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What was implemented and why

## 🔄 User Roles

### Role Hierarchy
```
USER → SHOP → ADMIN → DEVELOPER_ADMIN
```

### Role Upgrade Flow
1. User signs up (role: USER)
2. User submits shop partnership request
3. Admin reviews and approves
4. User role automatically upgraded to SHOP
5. User can now place daily orders

**Note**: Same email = same account. No new account needed.

## 📊 API Endpoints

### Authentication
- `POST /auth/signup` - Register
- `POST /auth/login` - Login
- `POST /auth/google-login` - OAuth
- `GET /auth/me` - Get profile
- `POST /auth/logout` - Logout

### Products
- `GET /products` - List products (public)
- `POST /products` - Create product (admin)
- `PUT /products/:id` - Update product (admin)
- `DELETE /products/:id` - Disable product (admin)

### Shop Requests
- `POST /users/shop-request` - Submit request
- `GET /users/shop-request` - Check status
- `GET /admin/shop-requests` - List all (admin)
- `POST /admin/shop-requests/:id/approve` - Approve (admin)
- `POST /admin/shop-requests/:id/reject` - Reject (admin)

### Orders
- `POST /shop/orders` - Place order (shop)
- `GET /shop/orders` - View my orders (shop)
- `GET /admin/orders` - View all orders (admin)
- `PATCH /admin/orders/:id/status` - Update status (admin)

### Events
- `POST /events` - Submit event request
- `GET /events/my-events` - View my events
- `GET /events` - View all events (admin)
- `PATCH /events/:id/status` - Update status (admin)

### Analytics
- `GET /analytics?range=DAILY|WEEKLY|MONTHLY|YEARLY` - Sales analytics (admin)

### System
- `GET /health` - Health check
- `GET /admin/system/health` - Detailed health (developer admin)

## 🎨 Frontend Pages

### Public
- Landing page
- Login/Signup
- Product showcase

### User
- Home dashboard
- Event order form
- Profile
- Shop request form

### Shop Owner
- Shop dashboard
- Daily order placement
- Order history

### Admin
- Admin dashboard
- Shop requests management
- Inventory management
- Orders & manufacturing
- Analytics
- Notifications

## 🔧 Development

### Backend Structure
```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Database schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── middlewares/    # Express middlewares
│   ├── utils/          # Helper functions
│   └── config/         # Configuration
├── server.js           # Entry point
└── .env                # Environment variables
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── assets/         # Images, fonts
│   └── main.jsx        # Entry point
├── public/             # Static files
└── vite.config.js      # Vite configuration
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] User signup/login
- [ ] Google OAuth
- [ ] Shop request submission
- [ ] Shop request approval
- [ ] Role upgrade verification
- [ ] Product CRUD
- [ ] Shop order placement
- [ ] Tomorrow-only validation
- [ ] Order status updates
- [ ] Event request submission
- [ ] Admin dashboard
- [ ] Manufacturing report
- [ ] Analytics
- [ ] Notifications
- [ ] Email delivery

## 📈 Performance

### Optimizations
- ✅ Database indexes on all models (15+)
- ✅ Compound indexes for common queries
- ✅ Text search indexes
- ✅ Lean queries where appropriate
- ✅ Pagination support
- ✅ Query filtering

### Expected Performance
- API response time: < 500ms
- Database queries: < 100ms (with indexes)
- Page load time: < 2s

## 🐛 Troubleshooting

### Common Issues

**Backend not starting**
- Check MongoDB connection
- Verify all environment variables
- Check port 5000 is available

**CORS errors**
- Verify FRONTEND_URL in .env
- Check CORS configuration in app.js

**Email not sending**
- Use Gmail App Password (not regular password)
- Enable 2-factor authentication first
- Check SMTP_EMAIL and SMTP_APP_PASSWORD

**Google OAuth not working**
- Verify authorized origins in Google Console
- Check GOOGLE_CLIENT_ID matches

## 📊 Monitoring

### Health Checks
- Backend: `/health`
- Database: Included in `/admin/system/health`

### Logs
- Backend: Console logs
- Audit trail: AuditLog collection
- Email delivery: Check Gmail sent folder

## 🔒 Security Best Practices

1. **Never commit .env files**
2. **Use strong JWT_SECRET** (32+ characters)
3. **Enable HTTPS in production**
4. **Keep dependencies updated**
5. **Review audit logs regularly**
6. **Monitor failed login attempts**
7. **Backup database regularly**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software for Ammu Foods.

## 👥 Team

- **Product Owner**: Ammu Foods
- **Development**: [Your Team]
- **Deployment**: Render + Vercel

## 📞 Support

For issues or questions:
1. Check documentation (DEPLOYMENT_GUIDE.md, PRODUCTION_ANALYSIS.md)
2. Review audit logs
3. Check health endpoint
4. Contact development team

---

## 🎯 Project Status

**Current Phase**: Phase 1 Complete ✅
**Production Ready**: Backend ✅ | Frontend ⚠️ (needs Phase 2)
**Last Updated**: February 8, 2026

### Phase 1 (Complete) ✅
- [x] Critical bug fixes
- [x] Database optimization
- [x] Audit logging
- [x] Enhanced notifications
- [x] Production CORS
- [x] Comprehensive documentation

### Phase 2 (Next)
- [ ] Cloudinary integration
- [ ] Complete admin UI
- [ ] Frontend validation
- [ ] Loading states
- [ ] Pagination UI

### Phase 3 (Future)
- [ ] Password reset
- [ ] Profile editing
- [ ] Product search
- [ ] Export functionality
- [ ] Advanced analytics

---

**Built with ❤️ for Ammu Foods**

*A real production system for daily business operations.*