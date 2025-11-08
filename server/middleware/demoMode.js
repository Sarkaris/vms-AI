const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Demo mode middleware - blocks modifications in demo mode
const demoModeMiddleware = (req, res, next) => {
  // Allow login and auth-related endpoints even in demo mode
  if (req.path.includes('/auth/login') || req.path.includes('/auth/register')) {
    return next();
  }
  
  if (DEMO_MODE && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return res.status(403).json({
      success: false,
      message: 'Demo mode: Modifications are disabled. This is a read-only demonstration.',
      demo: true,
      suggestion: 'You can view all data and navigate through the application, but cannot add, edit, or delete records.'
    });
  }
  next();
};

// Demo data middleware - adds demo information to responses
const demoDataMiddleware = (req, res, next) => {
  if (DEMO_MODE) {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to add demo info
    res.json = function(data) {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data._demo = {
          mode: true,
          message: 'This is a demo environment',
          readonly: true
        };
      }
      return originalJson.call(this, data);
    };
  }
  next();
};

// Demo banner endpoint
const getDemoStatus = (req, res) => {
  res.json({
    demoMode: DEMO_MODE,
    message: DEMO_MODE ? 'Running in demo mode - read-only access' : 'Running in full mode',
    features: {
      canView: true,
      canAdd: !DEMO_MODE,
      canEdit: !DEMO_MODE,
      canDelete: !DEMO_MODE
    }
  });
};

module.exports = {
  demoModeMiddleware,
  demoDataMiddleware,
  getDemoStatus,
  DEMO_MODE
};