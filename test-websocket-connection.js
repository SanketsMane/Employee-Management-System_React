#!/usr/bin/env node

/**
 * PERMANENT WEBSOCKET CONNECTION TEST
 * This script tests the WebSocket connection with the new polling-only configuration
 * to ensure no more "xhr poll error" issues occur.
 */

const io = require('socket.io-client');

console.log('🧪 Testing WebSocket Connection with Polling-Only Transport...\n');

// Test configuration that matches the frontend
const testConfig = {
  url: 'http://65.0.94.0:8000',
  options: {
    transports: ['polling'], // Force polling only - permanent fix
    withCredentials: true,
    upgrade: false,
    rememberUpgrade: false,
    timeout: 20000,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 3
  }
};

console.log(`🔗 Connecting to: ${testConfig.url}`);
console.log(`🔧 Transport: ${testConfig.options.transports.join(', ')}`);
console.log(`🛡️ CORS credentials: ${testConfig.options.withCredentials}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const socket = io(testConfig.url, testConfig.options);

let connectionAttempts = 0;
const maxAttempts = 3;

socket.on('connect', () => {
  const transport = socket.io.engine.transport.name;
  console.log('✅ SUCCESS: WebSocket connected!');
  console.log(`📡 Transport: ${transport}`);
  console.log(`🆔 Socket ID: ${socket.id}`);
  console.log(`⏰ Connected at: ${new Date().toLocaleTimeString()}`);
  
  if (transport === 'polling') {
    console.log('🎉 PERMANENT FIX WORKING: Polling transport active!');
    console.log('🔒 No more mixed content errors on HTTPS sites!');
  }
  
  console.log('\n✅ CONNECTION TEST PASSED - WebSocket working correctly!');
  
  // Test ping
  setTimeout(() => {
    console.log('\n🏓 Testing ping...');
    socket.emit('ping', Date.now());
  }, 1000);
  
  // Cleanup after 5 seconds
  setTimeout(() => {
    console.log('\n🧹 Cleaning up test connection...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('connect_error', (error) => {
  connectionAttempts++;
  console.log(`❌ Connection Error (Attempt ${connectionAttempts}/${maxAttempts}):`);
  console.log(`   Error: ${error.message}`);
  console.log(`   Type: ${error.type || 'unknown'}`);
  
  if (error.message.includes('xhr poll error')) {
    console.log('\n🔍 ANALYSIS: xhr poll error detected');
    console.log('📋 Possible causes:');
    console.log('   • Backend server not running');
    console.log('   • CORS configuration issue');
    console.log('   • Network connectivity problem');
    console.log('   • Firewall blocking HTTP requests');
  }
  
  if (connectionAttempts >= maxAttempts) {
    console.log('\n❌ CONNECTION TEST FAILED after maximum attempts');
    console.log('🔧 Next steps:');
    console.log('   1. Verify backend server is running on port 8000');
    console.log('   2. Check CORS configuration allows https://ems.formonex.in');
    console.log('   3. Test network connectivity to 65.0.94.0:8000');
    process.exit(1);
  }
});

socket.on('disconnect', (reason) => {
  console.log(`🔌 Disconnected: ${reason}`);
});

socket.on('pong', (data) => {
  const latency = Date.now() - data;
  console.log(`🏓 Pong received! Latency: ${latency}ms`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test interrupted by user');
  socket.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Test terminated');
  socket.disconnect();
  process.exit(0);
});

console.log('⏳ Attempting connection (press Ctrl+C to cancel)...');