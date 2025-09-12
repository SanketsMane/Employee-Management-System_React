const mongoose = require('mongoose');
const SystemConfig = require('./models/SystemConfig');
require('dotenv').config();

async function initializeSystemConfig() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Use the static method to initialize default configs
    await SystemConfig.initializeDefaultConfig();
    console.log('🎉 Default SystemConfig initialized successfully!');

    // Verify creation by checking each config type
    const departments = await SystemConfig.getConfigByType('departments');
    const roles = await SystemConfig.getConfigByType('roles');
    
    console.log('Departments:', departments.map(d => d.name));
    console.log('Roles:', roles.map(r => r.name));

  } catch (error) {
    console.error('❌ Error initializing SystemConfig:', error);
  } finally {
    mongoose.connection.close();
  }
}

initializeSystemConfig();
