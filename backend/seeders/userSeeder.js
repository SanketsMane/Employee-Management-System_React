const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();

const testUsers = [
  {
    firstName: 'Sanket',
    lastName: 'Mane',
    email: 'contactsanket1@gmail.com',
    password: 'Sanket@3030',
    role: 'Admin',
    department: 'IT',
    position: 'System Administrator',
    phone: '+1234567890',
    salary: 100000,
    isActive: true
  },
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'Admin',
    department: 'IT',
    position: 'System Administrator',
    phone: '+1234567890',
    salary: 100000,
    isActive: true
  },
  {
    firstName: 'HR',
    lastName: 'Manager',
    email: 'hr@company.com',
    password: 'hr123456',
    role: 'HR',
    department: 'Human Resources',
    position: 'HR Manager',
    phone: '+1234567891',
    salary: 80000,
    isActive: true
  },
  {
    firstName: 'John',
    lastName: 'Manager',
    email: 'manager@company.com',
    password: 'manager123',
    role: 'Manager',
    department: 'Engineering',
    position: 'Engineering Manager',
    phone: '+1234567892',
    salary: 90000,
    isActive: true
  },
  {
    firstName: 'Jane',
    lastName: 'Lead',
    email: 'teamlead@company.com',
    password: 'lead123456',
    role: 'Team Lead',
    department: 'Engineering',
    position: 'Senior Developer',
    phone: '+1234567893',
    salary: 75000,
    isActive: true
  },
  {
    firstName: 'Bob',
    lastName: 'Employee',
    email: 'employee1@company.com',
    password: 'emp123456',
    role: 'Employee',
    department: 'Engineering',
    position: 'Software Developer',
    phone: '+1234567894',
    salary: 65000,
    isActive: true
  },
  {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'employee2@company.com',
    password: 'emp123456',
    role: 'Employee',
    department: 'Marketing',
    position: 'Marketing Specialist',
    phone: '+1234567895',
    salary: 55000,
    isActive: true
  },
  {
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'employee3@company.com',
    password: 'emp123456',
    role: 'Employee',
    department: 'Sales',
    position: 'Sales Representative',
    phone: '+1234567896',
    salary: 50000,
    isActive: true
  }
];

const seedUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Create test users
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User with email ${userData.email} already exists, skipping...`);
        continue;
      }

      // Create user (password will be hashed by pre-save middleware)
      const user = await User.create(userData);
      console.log(`✅ Created ${user.role}: ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.employeeId}`);
    }

    console.log('\n🎉 Test users seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('HR: hr@company.com / hr123456');
    console.log('Manager: manager@company.com / manager123');
    console.log('Team Lead: teamlead@company.com / lead123456');
    console.log('Employee 1: employee1@company.com / emp123456');
    console.log('Employee 2: employee2@company.com / emp123456');
    console.log('Employee 3: employee3@company.com / emp123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

const deleteUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    console.log('All users deleted successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting users:', error);
    process.exit(1);
  }
};

// Run the appropriate function based on command line argument
const command = process.argv[2];

if (command === 'delete') {
  deleteUsers();
} else {
  seedUsers();
}
