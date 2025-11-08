#!/usr/bin/env node

const http = require('http');

function checkServerHealth() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        console.log(`✅ Server Status: ${health.status}`);
        console.log(`📊 Memory: ${health.memory.heapUsed} (${health.memory.rss} RSS)`);
        console.log(`⏱️  Uptime: ${health.uptime} seconds`);
        console.log(`🕐 Time: ${health.timestamp}`);
        console.log('---');
      } catch (error) {
        console.error('❌ Failed to parse health response:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Server is down or unreachable:', error.message);
  });

  req.on('timeout', () => {
    console.error('❌ Server health check timed out');
    req.destroy();
  });

  req.end();
}

// Check every 30 seconds
console.log('🔍 Starting server health monitor...');
setInterval(checkServerHealth, 30000);
checkServerHealth(); // Initial check
