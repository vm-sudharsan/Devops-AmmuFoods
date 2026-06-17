# 🍬 AmmuFoods - Manufacturing & Distribution Management System

A comprehensive web application for managing a traditional Indian sweets manufacturing business, including order management, shop partnerships, event catering, and real-time inventory tracking.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [License](#license)

## ✨ Features

### For Customers (USER Role)
- 🔐 Secure authentication (Email/Password & Google OAuth)
- 🛍️ Browse and order traditional Indian sweets
- 🎉 Request custom event catering
- 🏪 Apply for shop partnership
- 🔔 Real-time notifications
- 👤 Profile management with order history

### For Shop Partners (SHOP Role)
- 📦 Place daily product orders
- 📊 View order history and status
- 🔔 Receive order status notifications
- 📧 Email notifications for order updates

### For Administrators (ADMIN Role)
- 📊 **Manufacturing Dashboard** - Real-time production overview
  - Pending shop approvals
  - Orders to pack
  - Low stock alerts
  - Manufacturing requirements calculator
  - Inventory overview
- 🏪 **Shop Management** - Approve/manage partner shops
- 📦 **Order & Packing System** - Complete order workflow
- 🎉 **Event Management** - Handle custom event requests
- 📦 **Inventory Management** - Track stock levels
- 📈 **Analytics** - Business insights and reports
- 🔔 **Notifications** - Manage system notifications
- 📧 **Email System** - Automated email notifications

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **Authentication**: JWT + Google OAuth

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer (Gmail SMTP)
- **File Upload**: Cloudinary
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator

## 📁 Project Structure

```
AmmuFoods/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, OAuth, Cloudinary config
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Auth, validation, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── app.js           # Express app configuration
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── server.js            # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── assets/          # Images, logos
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   │   ├── admin/       # Admin pages
│   │   │   └── ...          # User pages
│   │   ├── utils/           # Helper functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── .env.example         # Environment variables template
│   ├── package.json
│   └── vite.config.js       # Vite configuration
│
└── docs/                    # Documentation
    ├── SECURITY_AUDIT_REPORT.md
    ├── PRODUCTION_DEPLOYMENT_GUIDE.md
    ├── DEPLOYMENT_CHECKLIST.md
    └── PRE_DEPLOYMENT_SUMMARY.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account
- Gmail account (for SMTP)
- Cloudinary account (for image uploads)
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ammufoods.git
cd ammufoods
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Backend (.env):
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

Frontend (.env):
```bash
cd frontend
cp .env.example .env
# Edit .env with your actual values
```

5. **Start development servers**

Backend:
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

Frontend:
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

## 🔐 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_here

# Email
SMTP_EMAIL=your_email@gmail.com
SMTP_APP_PASSWORD=your_app_password

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 📦 Deployment

### Quick Deployment (Vercel)

**Backend:**
```bash
cd backend
vercel --prod
# Add environment variables in Vercel dashboard
```

**Frontend:**
```bash
cd frontend
npm run build
vercel --prod
# Add environment variables in Vercel dashboard
```

For detailed deployment instructions, see [PRODUCTION_DEPLOYMENT_GUIDE.md](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)

## 📚 Documentation

- **[Security Audit Report](docs/SECURITY_AUDIT_REPORT.md)** - Complete security analysis
- **[Deployment Guide](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
- **[Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[Pre-Deployment Summary](docs/PRE_DEPLOYMENT_SUMMARY.md)** - Executive summary

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt (10 salt rounds)
- Role-based access control (USER, SHOP, ADMIN)
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet.js security headers
- Input validation and sanitization
- XSS protection
- MongoDB injection prevention

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/google` - Google OAuth login
- `POST /auth/logout` - Logout user

### Products
- `GET /products` - Get all products
- `POST /products` - Create product (Admin)
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Orders
- `POST /shop/orders` - Place order (Shop)
- `GET /shop/orders` - Get shop orders
- `GET /admin/orders` - Get all orders (Admin)
- `PUT /admin/orders/:id/status` - Update order status (Admin)

### Events
- `POST /events` - Request event (User)
- `GET /events/my-events` - Get user events
- `GET /admin/events` - Get all events (Admin)
- `PUT /admin/events/:id/status` - Update event status (Admin)

For complete API documentation, see the [API Documentation](docs/API_DOCUMENTATION.md)

## 👥 User Roles

### USER
- Browse products
- Place orders
- Request events
- Apply for shop partnership

### SHOP
- All USER permissions
- Place daily orders
- View order history

### ADMIN
- All permissions
- Manage products
- Manage orders
- Manage events
- Manage shop requests
- View analytics
- Manage inventory

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**AmmuFoods Team**
- Email: ammufoods2018@gmail.com
- Location: Coimbatore, Tamil Nadu, India

## 🙏 Acknowledgments

- Traditional Indian sweets recipes and heritage
- Open source community
- All contributors and testers

## 📞 Support

For support, email ammufoods2018@gmail.com or create an issue in the repository.

---

**Built with ❤️ for traditional Indian sweets manufacturing**
