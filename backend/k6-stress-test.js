import http from 'k6/http';
import { check, sleep } from 'k6';

// This configuration sets up a stress test
// It ramps up to 100 users, holds them, spikes to 300, and ramps down.
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Normal load
    { duration: '30s', target: 200 },  // Spike to 200 users
    { duration: '1m', target: 200 },   // High load (stress)
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
    // Less than 1% of requests should fail
    http_req_failed: ['rate<0.01'], 
  },
};

const BASE_URL = 'http://localhost:3000'; // Make sure this matches your backend port

export default function () {
  // 1. Simulate User Login
  const loginPayload = JSON.stringify({
    email: 'admin@isbat.edu.ug', // Replace with a valid test user email
    password: 'password123',     // Replace with valid password
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);
  
  const loginSuccessful = check(loginRes, {
    'login succeeded': (r) => r.status === 200 || r.status === 201,
  });

  // If login fails, we shouldn't continue the rest of the flow for this iteration
  if (!loginSuccessful) {
    sleep(1);
    return;
  }

  // Extract the token (Assuming NestJS returns { accessToken: "..." } or { token: "..." })
  const token = loginRes.json('accessToken') || loginRes.json('token');

  // 2. Fetch Books List (Simulating user browsing library)
  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const booksRes = http.get(`${BASE_URL}/books`, authParams);
  
  check(booksRes, {
    'books fetched successfully': (r) => r.status === 200,
  });

  // Simulate think time
  sleep(1);
}
