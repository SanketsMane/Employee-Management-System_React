const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema(
  {
    configType: {
      type: String,
      required: true,
      enum: ['departments', 'roles', 'positions', 'skills', 'benefits'],
      index: true
    },
    items: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        default: ''
      },
      isActive: {
        type: Boolean,
        default: true
      },
      color: {
        type: String,
        default: '#3B82F6' // Default blue color
      },
      order: {
        type: Number,
        default: 0
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique config type per company
SystemConfigSchema.index({ configType: 1, companyId: 1 }, { unique: true });

// Methods
SystemConfigSchema.methods.addItem = function(itemData, userId) {
  const newItem = {
    ...itemData,
    createdBy: userId,
    order: this.items.length
  };
  this.items.push(newItem);
  this.lastModifiedBy = userId;
  return this.save();
};

SystemConfigSchema.methods.updateItem = function(itemId, updateData, userId) {
  const item = this.items.id(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  Object.assign(item, updateData);
  this.lastModifiedBy = userId;
  return this.save();
};

SystemConfigSchema.methods.removeItem = function(itemId, userId) {
  this.items.pull(itemId);
  this.lastModifiedBy = userId;
  return this.save();
};

SystemConfigSchema.methods.getActiveItems = function() {
  return this.items
    .filter(item => item.isActive)
    .sort((a, b) => a.order - b.order)
    .map(item => ({
      _id: item._id,
      name: item.name,
      description: item.description,
      color: item.color,
      order: item.order
    }));
};

// Static methods
SystemConfigSchema.statics.getConfigByType = async function(configType, companyId = null) {
  const config = await this.findOne({ configType, companyId });
  return config ? config.getActiveItems() : [];
};

SystemConfigSchema.statics.initializeDefaultConfig = async function(companyId = null) {
  const defaultConfigs = [
    {
      configType: 'departments',
      items: [
        { name: 'Engineering', description: 'Software development and technical roles', color: '#3B82F6' },
        { name: 'Human Resources', description: 'HR and people management', color: '#10B981' },
        { name: 'Sales', description: 'Sales and business development', color: '#F59E0B' },
        { name: 'Marketing', description: 'Marketing and promotions', color: '#EF4444' },
        { name: 'Finance', description: 'Accounting and financial operations', color: '#8B5CF6' },
        { name: 'Operations', description: 'Business operations and logistics', color: '#06B6D4' },
        { name: 'Support', description: 'Customer support and service', color: '#84CC16' },
        { name: 'Administration', description: 'Administrative and office management', color: '#6B7280' }
      ]
    },
    {
      configType: 'roles',
      items: [
        { name: 'Admin', description: 'System administrator with full access', color: '#DC2626' },
        { name: 'HR', description: 'Human resources personnel', color: '#059669' },
        { name: 'Manager', description: 'Department or team manager', color: '#7C3AED' },
        { name: 'Team Lead', description: 'Team leader and coordinator', color: '#0891B2' },
        { name: 'Senior Developer', description: 'Senior software developer', color: '#1D4ED8' },
        { name: 'Developer', description: 'Software developer', color: '#2563EB' },
        { name: 'Junior Developer', description: 'Junior software developer', color: '#3B82F6' },
        { name: 'Designer', description: 'UI/UX designer', color: '#F59E0B' },
        { name: 'Sales Executive', description: 'Sales representative', color: '#EA580C' },
        { name: 'Marketing Specialist', description: 'Marketing specialist', color: '#DC2626' },
        { name: 'Support Specialist', description: 'Customer support specialist', color: '#65A30D' },
        { name: 'Analyst', description: 'Business or data analyst', color: '#7C2D12' },
        { name: 'Intern', description: 'Intern or trainee', color: '#6B7280' }
      ]
    }
  ];

  for (const configData of defaultConfigs) {
    const existingConfig = await this.findOne({ 
      configType: configData.configType, 
      companyId 
    });
    
    if (!existingConfig) {
      await this.create({
        ...configData,
        companyId
      });
    }
  }
};

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
