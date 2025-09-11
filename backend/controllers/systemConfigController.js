const SystemConfig = require('../models/SystemConfig');
const User = require('../models/User');

// @desc    Get system configuration by type
// @route   GET /api/system/config/:type
// @access  Private (Admin, HR, Manager, Team Lead)
exports.getSystemConfig = async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`🔧 Getting system config for type: ${type}`);
    
    if (!['departments', 'roles', 'positions', 'skills', 'benefits'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration type'
      });
    }

    const config = await SystemConfig.findOne({ 
      configType: type, 
      companyId: null // Global config for now
    }).populate('lastModifiedBy', 'firstName lastName email');

    if (!config) {
      // Initialize default config if it doesn't exist
      await SystemConfig.initializeDefaultConfig();
      const newConfig = await SystemConfig.findOne({ 
        configType: type, 
        companyId: null 
      }).populate('lastModifiedBy', 'firstName lastName email');
      
      return res.status(200).json({
        success: true,
        message: 'Configuration initialized and retrieved',
        data: {
          configType: type,
          items: newConfig ? newConfig.getActiveItems() : [],
          lastModified: newConfig?.updatedAt,
          lastModifiedBy: newConfig?.lastModifiedBy
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Configuration retrieved successfully',
      data: {
        configType: type,
        items: config.getActiveItems(),
        lastModified: config.updatedAt,
        lastModifiedBy: config.lastModifiedBy
      }
    });
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system configuration',
      error: error.message
    });
  }
};

// @desc    Get all system configurations
// @route   GET /api/system/config
// @access  Private (Admin, HR, Manager, Team Lead)
exports.getAllSystemConfigs = async (req, res) => {
  try {
    
    const configs = await SystemConfig.find({ 
      companyId: null 
    }).populate('lastModifiedBy', 'firstName lastName email');

    if (configs.length === 0) {
      // Initialize default configs
      await SystemConfig.initializeDefaultConfig();
      const newConfigs = await SystemConfig.find({ 
        companyId: null 
      }).populate('lastModifiedBy', 'firstName lastName email');
      
      const result = {};
      newConfigs.forEach(config => {
        result[config.configType] = config.getActiveItems();
      });
      
      return res.status(200).json({
        success: true,
        message: 'Configurations initialized and retrieved',
        data: result
      });
    }

    const result = {};
    configs.forEach(config => {
      result[config.configType] = config.getActiveItems();
    });

    res.status(200).json({
      success: true,
      message: 'All configurations retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get all system configs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system configurations',
      error: error.message
    });
  }
};

// @desc    Add item to system configuration
// @route   POST /api/system/config/:type
// @access  Private (Admin only)
exports.addConfigItem = async (req, res) => {
  try {
    const { type } = req.params;
    const { name, description, color } = req.body;
    
    console.log(`🔧 Adding item to ${type} config:`, { name, description, color });
    console.log('👤 User:', req.user ? `${req.user.firstName} ${req.user.lastName}` : 'No user');

    if (!['departments', 'roles', 'positions', 'skills', 'benefits'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration type'
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required'
      });
    }

    let config = await SystemConfig.findOne({ 
      configType: type, 
      companyId: null 
    });

    if (!config) {
      // Initialize default config first
      await SystemConfig.initializeDefaultConfig();
      config = await SystemConfig.findOne({ 
        configType: type, 
        companyId: null 
      });
    }

    // Check if item already exists
    const existingItem = config.items.find(item => 
      item.name.toLowerCase() === name.trim().toLowerCase() && item.isActive
    );

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: `${name} already exists in ${type}`
      });
    }

    // Add the new item
    await config.addItem({
      name: name.trim(),
      description: description || '',
      color: color || '#3B82F6',
      isActive: true
    }, req.user._id);

    res.status(201).json({
      success: true,
      message: `Item added to ${type} successfully`,
      data: {
        configType: type,
        items: config.getActiveItems()
      }
    });
  } catch (error) {
    console.error('Add config item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding configuration item',
      error: error.message
    });
  }
};

// @desc    Update item in system configuration
// @route   PUT /api/system/config/:type/:itemId
// @access  Private (Admin only)
exports.updateConfigItem = async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const { name, description, color, isActive } = req.body;
    
    console.log(`🔧 Updating ${type} config item:`, itemId, req.body);

    if (!['departments', 'roles', 'positions', 'skills', 'benefits'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration type'
      });
    }

    const config = await SystemConfig.findOne({ 
      configType: type, 
      companyId: null 
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Check if new name conflicts with existing items
    if (name) {
      const existingItem = config.items.find(item => 
        item.name.toLowerCase() === name.trim().toLowerCase() && 
        item.isActive && 
        item._id.toString() !== itemId
      );

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: `${name} already exists in ${type}`
        });
      }
    }

    await config.updateItem(itemId, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(isActive !== undefined && { isActive })
    }, req.user._id);

    res.status(200).json({
      success: true,
      message: `${type} item updated successfully`,
      data: {
        configType: type,
        items: config.getActiveItems()
      }
    });
  } catch (error) {
    console.error('Update config item error:', error);
    
    if (error.message === 'Item not found') {
      return res.status(404).json({
        success: false,
        message: 'Configuration item not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating configuration item',
      error: error.message
    });
  }
};

// @desc    Delete item from system configuration
// @route   DELETE /api/system/config/:type/:itemId
// @access  Private (Admin only)
exports.deleteConfigItem = async (req, res) => {
  try {
    const { type, itemId } = req.params;
    
    console.log(`🔧 Deleting ${type} config item:`, itemId);

    if (!['departments', 'roles', 'positions', 'skills', 'benefits'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration type'
      });
    }

    const config = await SystemConfig.findOne({ 
      configType: type, 
      companyId: null 
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    const item = config.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Configuration item not found'
      });
    }

    // Check if item is being used by any users
    const usageCount = await User.countDocuments({
      [type === 'departments' ? 'department' : 'role']: item.name,
      isActive: true
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${item.name}. It is currently assigned to ${usageCount} user(s). Please reassign these users first.`,
        usageCount
      });
    }

    await config.removeItem(itemId, req.user._id);

    res.status(200).json({
      success: true,
      message: `${type} item deleted successfully`,
      data: {
        configType: type,
        items: config.getActiveItems()
      }
    });
  } catch (error) {
    console.error('Delete config item error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting configuration item',
      error: error.message
    });
  }
};

// @desc    Reorder items in system configuration
// @route   PUT /api/system/config/:type/reorder
// @access  Private (Admin only)
exports.reorderConfigItems = async (req, res) => {
  try {
    const { type } = req.params;
    const { itemIds } = req.body; // Array of item IDs in new order
    
    console.log(`🔧 Reordering ${type} config items:`, itemIds);

    if (!['departments', 'roles', 'positions', 'skills', 'benefits'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration type'
      });
    }

    if (!Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        message: 'itemIds must be an array'
      });
    }

    const config = await SystemConfig.findOne({ 
      configType: type, 
      companyId: null 
    });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    // Update order for each item
    itemIds.forEach((itemId, index) => {
      const item = config.items.id(itemId);
      if (item) {
        item.order = index;
      }
    });

    config.lastModifiedBy = req.user._id;
    await config.save();

    res.status(200).json({
      success: true,
      message: `${type} items reordered successfully`,
      data: {
        configType: type,
        items: config.getActiveItems()
      }
    });
  } catch (error) {
    console.error('Reorder config items error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering configuration items',
      error: error.message
    });
  }
};

module.exports = {
  getSystemConfig: exports.getSystemConfig,
  getAllSystemConfigs: exports.getAllSystemConfigs,
  addConfigItem: exports.addConfigItem,
  updateConfigItem: exports.updateConfigItem,
  deleteConfigItem: exports.deleteConfigItem,
  reorderConfigItems: exports.reorderConfigItems
};
