# Employee Management System (EMS)

A comprehensive full-stack Employee Management System built with the MERN stack, featuring attendance tracking, worksheet management, leave requests, role-based access control, and gamification.

## 🚀 Features

### Core Functionality
- **Employee Dashboard** with real-time statistics
- **Attendance Management** with GPS tracking
  - Clock In/Out with location verification
  - Break management (multiple breaks per day)
  - Late arrival tracking and penalty system
- **Daily Work Sheets** with time slot management (9 AM - 7 PM)
  - Task creation and tracking
  - Productivity scoring
  - Time management tools
- **Leave Management System**
  - Multiple leave types (Sick, Casual, Annual, etc.)
  - Leave balance tracking
  - Approval workflow with recipients selection
- **Role-Based Access Control**
  - Admin, HR, Manager, Team Lead, Employee roles
  - Hierarchical permissions and data access
- **Document Management**
  - Cloudinary integration for file uploads
  - Personal document storage
  - Secure file access

### Advanced Features
- **Automated Email Notifications**
  - Daily morning reminders
  - Worksheet submission reminders
  - Leave request notifications
  - Node Cron scheduled tasks
- **Analytics & Reporting**
  - Attendance analytics
  - Productivity reports
  - Leave statistics
  - Performance insights
- **Gamification System**
  - Reward points for punctuality
  - Leaderboard system
  - Achievement tracking
- **Modern UI/UX**
  - Dark/Light mode toggle
  - Responsive design
  - Professional sidebar navigation
  - Real-time updates

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Node Cron** - Task scheduling
- **Cloudinary** - File storage
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **TailwindCSS** - Styling
- **Lucide React** - Icons
- **Context API** - State management

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Gmail account (for email services)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Ems_Formonex
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   The `.env` file is already configured with:
   ```env
   NODE_ENV=development
   PORT=8000
   MONGODB_URI=mongodb+srv://hackable3030:f9pZaA7rmlUkQ97N@cluster0.o6vez6l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   EMAIL_FROM=your_email@gmail.com
   FRONTEND_URL=http://localhost:5173
   CLOUDINARY_URL=cloudinary://564439426461569:yH7p_TOyWeEQjCfRaxwxxLc0FG0@dr7mlwdso
   CLOUDINARY_CLOUD_NAME=dr7mlwdso
   CLOUDINARY_API_KEY=564439426461569
   CLOUDINARY_API_SECRET=yH7p_TOyWeEQjCfRaxwxxLc0FG0
   ADMIN_EMAIL=admin@company.com
   ADMIN_PASSWORD=admin123
   ```

4. **Update email configuration**
   - Replace `EMAIL_USER` with your Gmail address
   - Replace `EMAIL_PASS` with your Gmail App Password
   - Generate App Password: Gmail Settings > Security > 2-Step Verification > App passwords

5. **Start the backend server**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:8000`

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```
   Application will run on `http://localhost:5173`

## 🔐 Default Admin Account

Use these credentials to access the system as Admin:
- **Email:** `admin@company.com`
- **Password:** `admin123`

## 📁 Project Structure

```
Ems_Formonex/
├── backend/
│   ├── controllers/          # Route controllers
│   │   ├── authController.js
│   │   ├── attendanceController.js
│   │   ├── userController.js
│   │   ├── worksheetController.js
│   │   └── leaveController.js
│   ├── models/              # MongoDB models
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── WorkSheet.js
│   │   ├── Leave.js
│   │   └── Log.js
│   ├── routes/              # API routes
│   ├── middleware/          # Custom middleware
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   └── server.js            # Entry point
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   │   ├── ui/          # UI components
    │   │   ├── Sidebar.jsx
    │   │   └── Navbar.jsx
    │   ├── pages/           # Page components
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── AttendancePage.jsx
    │   │   ├── WorkSheetPage.jsx
    │   │   ├── LeavesPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── context/         # React context
    │   └── App.jsx          # Main component
    └── package.json
```

## 🎯 Key Features Explained

### Attendance System
- **GPS Location Tracking**: Ensures employees clock in/out from designated locations
- **Break Management**: Track multiple breaks with different types (Coffee, Lunch, etc.)
- **Late Arrival Detection**: Automatic flagging of late arrivals with configurable grace period
- **Monthly Statistics**: Comprehensive attendance reports and analytics

### Worksheet Management
- **Time Slot Planning**: Pre-defined slots from 9 AM to 7 PM for better time management
- **Task Prioritization**: Four-level priority system (Low, Medium, High, Critical)
- **Status Tracking**: Real-time status updates (Pending, In Progress, Completed, Blocked)
- **Productivity Scoring**: Automated calculation based on task completion and priority weights

### Leave Management
- **Multiple Leave Types**: Sick, Casual, Annual, Maternity, Paternity, Emergency, Study, Bereavement
- **Smart Recipient Selection**: Choose from HR, Managers, or Team Leads
- **Document Attachments**: Support for medical certificates and other documents
- **Approval Workflow**: Streamlined approval process with email notifications

### Role-Based System
- **Admin**: Full system access, user management, analytics
- **HR**: Employee management, leave approvals, reporting
- **Manager**: Team oversight, leave approvals for direct reports
- **Team Lead**: Team member management and guidance
- **Employee**: Personal data management, attendance, worksheets, leave requests

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today` - Get today's attendance
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out
- `POST /api/attendance/break/start` - Start break
- `POST /api/attendance/break/end` - End break

### Worksheets
- `GET /api/worksheets` - Get worksheets
- `POST /api/worksheets` - Create worksheet
- `PUT /api/worksheets/:id` - Update worksheet
- `DELETE /api/worksheets/:id` - Delete worksheet

### Leaves
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave request
- `PUT /api/leaves/:id/approve` - Approve leave
- `PUT /api/leaves/:id/reject` - Reject leave

### Users
- `GET /api/users` - Get users (role-based)
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `POST /api/users/:id/documents` - Upload document

## 📧 Email Automation

The system includes automated email notifications:
- **Morning Reminders**: Daily 9 AM reminders to clock in
- **Worksheet Reminders**: End-of-day reminders to submit worksheets
- **Leave Notifications**: Instant notifications for leave requests and approvals

## 🏆 Gamification Features

- **Punctuality Points**: Earn points for on-time arrivals
- **Productivity Rewards**: Points for high worksheet completion rates
- **Leaderboards**: Monthly rankings based on different metrics
- **Achievement System**: Unlock achievements for consistent performance

## 🎨 UI/UX Features

- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Professional Sidebar**: Role-based navigation with collapsible design
- **Real-time Updates**: Live data updates without page refresh
- **Modern Icons**: Lucide React icons for consistent visual language

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Rate Limiting**: Prevent brute force attacks
- **CORS Protection**: Secure cross-origin resource sharing
- **Helmet Security**: Additional security headers
- **Role-based Authorization**: Granular permission system

## 📱 Mobile Compatibility

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Touch devices

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables on your hosting platform
2. Update MongoDB connection string
3. Configure email settings
4. Deploy using Git or Docker

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Configure environment variables
4. Set up custom domain (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@yourcompany.com
- Documentation: [Project Wiki](link-to-wiki)

## 🎉 Acknowledgments

- MongoDB Atlas for database hosting
- Cloudinary for file storage
- Gmail for email services
- All open-source contributors

---

**Built with ❤️ using the MERN Stack**

Login with existing accounts:

Login credentials for testing:

Admin: admin@company.com / admin123
HR: hr@company.com / hr123456
Manager: manager@company.com / manager123
Team Lead: teamlead@company.com / lead123456
Employee 1: employee1@company.com / emp123456
Employee 2: employee2@company.com / emp123456
Employee 3: employee3@company.com / emp123456