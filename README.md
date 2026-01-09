# 🎯 Event Participation Tracker MVP

A comprehensive full-stack application for tracking student participation in educational events with QR code-based attendance system.

## ✨ Features

### 👨‍🎓 **For Students**
- ✅ Register with roll number and division details
- 📅 Browse available events with detailed information
- 📱 QR code scanning for quick event check-in
- 📊 Personal dashboard showing attendance history
- 🔔 Real-time attendance confirmation

### 👩‍🏫 **For Faculty**
- 👀 Monitor all events and student participation
- 🔍 Filter students by division and department
- 📈 View real-time attendance data with caching
- 📄 Export attendance reports as CSV
- 🎯 Track specific student groups efficiently

### 🎪 **For Event Organizers**
- 🎨 Create and manage events with rich details
- 📱 Generate unique QR codes for each event
- 👥 View attendee lists in real-time
- 📊 Track attendance statistics
- ⚡ Instant attendance updates via Redis caching

### 🔧 **For Administrators**
- 🏛️ System-wide oversight of all events and users
- 👤 User management across all roles
- 📋 Comprehensive event management
- 🛠️ System configuration and monitoring

## 🏗️ Tech Stack

### Backend
- **Node.js + Express + TypeScript** - Robust API server
- **PostgreSQL** - Primary data storage with ACID compliance
- **Redis** - High-performance caching for real-time queries
- **JWT Authentication** - Secure role-based access control
- **QR Code Generation** - Cryptographically signed QR codes
- **Zod** - Runtime type validation
- **Rate Limiting** - DDoS protection and abuse prevention

### Frontend
- **Next.js 15 + TypeScript** - Modern React framework with SSR
- **TailwindCSS** - Utility-first responsive design
- **React Hook Form + Zod** - Type-safe form validation
- **Headless UI** - Accessible component primitives
- **Axios** - HTTP client with interceptors
- **Lucide React** - Beautiful SVG icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis (optional - falls back to mock for development)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd event-tracker-mvp
```

2. **Backend Setup**
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

4. **Database Setup**
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE event_tracker_mvp;"

# The schema will be automatically created on first run
```

### Development Mode

#### Option 1: Use the PowerShell Script (Windows)
```powershell
# Run from project root
.\start-dev.ps1
```

#### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

### Default Admin Account
- **Email**: admin@eventtracker.com
- **Password**: admin123

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login    - User login
GET  /api/auth/profile  - Get current user profile
```

### Event Management
```
GET    /api/events           - List all events (role-filtered)
POST   /api/events           - Create new event (organizers only)
GET    /api/events/:id       - Get event details
GET    /api/events/:id/qrcode - Get event QR code (organizers)
POST   /api/events/:id/checkin - Student check-in via QR
GET    /api/events/:id/students - Get attendees (faculty/admin)
```

### Rate Limits
- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per 15 minutes
- **QR Check-in**: 10 attempts per minute
- **General API**: 100 requests per 15 minutes

## 🏛️ Database Schema

### Users Table
- `id` - Primary key
- `name` - Full name
- `email` - Unique email address
- `roll_no` - Student roll number (optional)
- `division` - Student division (optional)
- `department` - Department/Faculty
- `role` - STUDENT | FACULTY | ORGANIZER | ADMIN
- `password_hash` - Bcrypt hashed password

### Events Table
- `id` - Primary key
- `name` - Event title
- `description` - Event details (optional)
- `department` - Organizing department
- `date` - Event date and time
- `organizer_id` - Foreign key to users
- `qr_code` - Generated QR code data

### Event Attendance Table
- `id` - Primary key
- `event_id` - Foreign key to events
- `user_id` - Foreign key to users
- `timestamp` - Check-in time
- Unique constraint on (event_id, user_id)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/event_tracker_mvp

# Redis (optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# QR Code Security
QR_SECRET=your_qr_secret_key_change_in_production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🛡️ Security Features

- **JWT Authentication** with HTTP-only cookie support
- **Password Hashing** using bcrypt (12 rounds)
- **Role-based Authorization** with middleware protection  
- **Rate Limiting** on all sensitive endpoints
- **Input Validation** with Zod schemas
- **QR Code Signing** to prevent tampering
- **SQL Injection Protection** via parameterized queries
- **XSS Protection** through React's built-in escaping

## 📱 User Interface

### Design System
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode Ready** - TailwindCSS utilities
- **Accessible Components** - WCAG compliant
- **Loading States** - Skeleton loaders and spinners
- **Error Handling** - User-friendly error messages
- **Form Validation** - Real-time validation feedback

### Key Pages
- **Authentication** - Login/Register with role selection
- **Dashboard** - Role-specific overview and quick actions
- **Events** - Event listing with filtering and search
- **QR Scanner** - Camera-based QR code scanning
- **Event Creation** - Rich form for organizers
- **Attendance Management** - Real-time attendee tracking

## 🚀 Production Deployment

### Backend Deployment
1. Build the TypeScript code: `npm run build`
2. Set production environment variables
3. Run database migrations
4. Start with: `npm start`
5. Use PM2 or similar for process management
6. Configure reverse proxy (nginx/Apache)
7. Set up SSL certificates

### Frontend Deployment
1. Build the Next.js app: `npm run build`
2. Configure production API URL
3. Deploy to Vercel/Netlify/custom server
4. Configure CDN for static assets
5. Set up monitoring and analytics

### Production Checklist
- [ ] Change all default secrets and passwords
- [ ] Enable PostgreSQL SSL in production
- [ ] Configure Redis for production with persistence
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure CORS for production domains
- [ ] Enable rate limiting on load balancer
- [ ] Set up health checks and alerts

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

### Frontend Testing
```bash
cd frontend  
npm test                   # Jest + React Testing Library
npm run test:e2e          # Playwright E2E tests
npm run test:a11y         # Accessibility tests
```

## 📊 Performance Optimizations

- **Redis Caching** - 60-second TTL for student queries
- **Database Indexing** - Optimized queries for large datasets
- **Connection Pooling** - Efficient database connections
- **Image Optimization** - Next.js automatic optimization
- **Bundle Splitting** - Code splitting for faster loads
- **Lazy Loading** - Components and routes
- **Service Worker** - Offline functionality (PWA ready)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- **ESLint** + **Prettier** for consistent formatting
- **TypeScript** strict mode enabled
- **Conventional Commits** for clear history
- **Husky** pre-commit hooks for quality checks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL connection
- Verify environment variables
- Check if port 5000 is available

**Frontend connection refused:**
- Ensure backend is running on port 5000
- Check NEXT_PUBLIC_API_URL configuration
- Verify CORS settings

**QR scanning not working:**
- Enable camera permissions
- Use HTTPS in production
- Fallback to manual entry available

**Database errors:**
- Run schema initialization
- Check database permissions
- Verify connection string

### Getting Help
- 📧 Create an issue for bugs
- 💬 Discussions for questions
- 📖 Check the wiki for guides
- 🚀 See examples in the `/examples` folder

---

**Built with ❤️ for educational institutions to streamline event participation tracking**