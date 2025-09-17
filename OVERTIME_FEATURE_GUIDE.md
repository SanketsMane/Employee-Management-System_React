# Overtime Tracking Feature Guide

## Overview
The Employee Management System now includes comprehensive overtime tracking functionality that allows employees to log extra work hours and managers to approve, track, and manage overtime compensation.

## Features

### For Employees
- **Submit Overtime Requests**: Log overtime work with detailed descriptions
- **Track Hours**: Record exact start and end times for overtime work
- **Request Status**: Monitor approval status of overtime requests
- **Statistics Dashboard**: View personal overtime statistics and trends
- **History Tracking**: Access complete history of overtime submissions

### For Managers/Admins
- **Approval Workflow**: Review and approve/reject overtime requests
- **Compensation Management**: Set and calculate overtime compensation rates
- **Team Oversight**: Monitor team overtime patterns and costs
- **Reporting**: Generate overtime reports and analytics
- **Bulk Management**: Handle multiple overtime requests efficiently

## Technical Implementation

### Backend Components

#### 1. Database Model (`backend/models/Overtime.js`)
```javascript
- Employee reference and details
- Date and time tracking (start/end times)
- Work description and justification
- Approval workflow (Pending/Approved/Rejected)
- Manager comments and feedback
- Compensation calculation
- Urgency levels and categories
```

#### 2. API Controller (`backend/controllers/overtimeController.js`)
```javascript
- submitOvertime: Employee overtime submission
- getMyOvertimeRequests: Personal overtime history
- getAllOvertimeRequests: Admin/Manager oversight
- updateOvertimeStatus: Approval/rejection workflow
- getOvertimeStats: Analytics and reporting
- deleteOvertimeRequest: Request management
```

#### 3. API Routes (`backend/routes/overtimeRoutes.js`)
```
POST /api/overtime - Submit overtime request
GET /api/overtime/my-requests - Get personal requests
GET /api/overtime/all - Get all requests (Admin/Manager)
PUT /api/overtime/:id/status - Approve/reject request
GET /api/overtime/stats - Get overtime statistics
DELETE /api/overtime/:id - Delete request
```

### Frontend Components

#### 1. Employee Interface (`frontend/src/pages/OvertimePage.jsx`)
- **Overtime Submission Form**
  - Date and time pickers
  - Work description text area
  - Urgency level selection
  - Form validation and submission

- **Personal Dashboard**
  - Current month statistics
  - Total overtime hours tracking
  - Pending requests counter
  - Recent submissions list

- **Request History**
  - Filterable request list
  - Status indicators
  - Manager feedback display
  - Action buttons (edit/delete)

#### 2. Admin Interface (`frontend/src/pages/AdminOvertimePage.jsx`)
- **Request Management**
  - Pending requests queue
  - Bulk approval actions
  - Individual request review
  - Comment and feedback system

- **Analytics Dashboard**
  - Team overtime statistics
  - Cost analysis and reporting
  - Trend visualization
  - Performance metrics

- **Approval Workflow**
  - One-click approve/reject
  - Compensation rate setting
  - Manager comment system
  - Email notification triggers

## User Roles and Permissions

### Employee
- Submit overtime requests
- View personal overtime history
- Edit pending requests
- Delete own requests
- View overtime statistics

### Team Lead
- All Employee permissions
- Approve team member requests
- View team overtime reports
- Set compensation rates for team

### Manager
- All Team Lead permissions
- Cross-department oversight
- Advanced reporting access
- Budget and cost management

### HR
- All Manager permissions
- Policy enforcement
- Audit trail access
- Compensation oversight

### Admin
- Full system access
- Global overtime policies
- System configuration
- Complete audit capabilities

## API Testing

### Submit Overtime Request
```bash
curl -X POST http://localhost:8000/api/overtime \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "startTime": "18:00",
    "endTime": "21:00",
    "description": "Critical project deadline work",
    "urgencyLevel": "High"
  }'
```

### Get Personal Requests
```bash
curl -X GET http://localhost:8000/api/overtime/my-requests \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Approve Request (Manager/Admin)
```bash
curl -X PUT http://localhost:8000/api/overtime/REQUEST_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "managerComments": "Approved for critical project work",
    "compensation": 75.00
  }'
```

## Navigation Access

### Employee Access
- **Sidebar Menu**: "Overtime" section
- **Direct URL**: `http://localhost:5174/overtime`
- **Role Requirement**: Employee level or higher

### Admin Access
- **Sidebar Menu**: "Admin Overtime" section
- **Direct URL**: `http://localhost:5174/admin/overtime`
- **Role Requirement**: Manager level or higher

## Database Schema

```javascript
{
  employee: ObjectId (ref: User),
  date: Date,
  startTime: String,
  endTime: String,
  totalHours: Number,
  description: String,
  urgencyLevel: String (Low/Medium/High/Critical),
  category: String (Project/Maintenance/Support/Emergency),
  status: String (Pending/Approved/Rejected),
  submittedAt: Date,
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  managerComments: String,
  compensation: Number,
  hourlyRate: Number,
  isHoliday: Boolean,
  isWeekend: Boolean
}
```

## Security Features

- **JWT Authentication**: All endpoints require valid authentication
- **Role-Based Access**: Hierarchical permission system
- **Data Validation**: Comprehensive input validation
- **Audit Logging**: Complete action tracking
- **Error Handling**: Secure error messages

## Future Enhancements

1. **Email Notifications**: Automated status updates
2. **Mobile App Integration**: Mobile overtime submission
3. **Advanced Analytics**: ML-based overtime prediction
4. **Integration APIs**: Third-party payroll system integration
5. **Bulk Import/Export**: CSV/Excel data handling
6. **Custom Approval Workflows**: Configurable approval chains

## Troubleshooting

### Common Issues

1. **Routes Not Loading**: Ensure backend server includes overtime routes
2. **Permission Denied**: Check user role hierarchy
3. **Form Validation Errors**: Verify required field completion
4. **API Connection Issues**: Confirm backend server running on port 8000

### Debug Commands

```bash
# Check backend logs
cd backend && npm run dev

# Verify database connection
node scripts/validateBackend.js

# Test API endpoints
curl -X GET http://localhost:8000/api/overtime/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Support

For technical support or feature requests related to overtime tracking:
- **Developer**: Sanket Mane
- **Email**: contactsanket1@gmail.com
- **Documentation**: This guide and inline code comments
- **API Testing**: Use Postman collection or curl commands provided

---

**Note**: This overtime tracking system is fully integrated with the existing Employee Management System and follows the same authentication, authorization, and data management patterns established in the codebase.