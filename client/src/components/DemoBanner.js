import React from 'react';
import { Info } from 'lucide-react';

const DemoBanner = () => {
  const [demoMode, setDemoMode] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    // Check demo status
    fetch('/api/demo-status')
      .then(res => res.json())
      .then(data => {
        setDemoMode(data.demoMode);
      })
      .catch(err => console.log('Demo status check failed:', err));
  }, []);

  if (!demoMode) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Demo Mode Active - Read Only Access
            </p>
            <p className="text-xs text-yellow-600">
              You can view all features but cannot add, edit, or delete data
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-yellow-700 hover:text-yellow-800 text-sm font-medium"
        >
          {showDetails ? 'Hide Details' : 'Learn More'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-3 p-3 bg-yellow-100 rounded-md">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">Demo Features:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Browse visitor records and analytics</li>
            <li>• View emergency management system</li>
            <li>• Explore admin dashboard</li>
            <li>• Test QR code scanning (simulated)</li>
            <li>• Experience real-time updates</li>
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            For full functionality, contact the administrator to access the production environment.
          </p>
        </div>
      )}
    </div>
  );
};

export default DemoBanner;