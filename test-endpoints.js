// Simple test script to verify password reset endpoints
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testEndpoints() {
  console.log('🧪 Testing Password Reset Endpoints...\n');

  // Test 1: Check if API is accessible
  try {
    const testResponse = await axios.get(`${API_BASE_URL}/users/test`);
    console.log('✅ Test endpoint:', testResponse.data);
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
    return;
  }

  // Test 2: Test forgot password with valid email format
  try {
    const forgotResponse = await axios.post(`${API_BASE_URL}/users/forgot-password`, {
      email: 'test@example.com'
    });
    console.log('✅ Forgot password endpoint:', forgotResponse.data);
  } catch (error) {
    console.log('❌ Forgot password endpoint failed:', error.response?.data || error.message);
  }

  // Test 3: Test forgot password with invalid email
  try {
    const invalidResponse = await axios.post(`${API_BASE_URL}/users/forgot-password`, {
      email: 'invalid-email'
    });
    console.log('⚠️ Invalid email should not succeed:', invalidResponse.data);
  } catch (error) {
    console.log('✅ Invalid email properly rejected:', error.response?.data?.message || error.message);
  }

  console.log('\n🎯 Test completed!');
}

testEndpoints().catch(console.error);
