/**
 * k6 Load Test: Authentication Endpoints
 *
 * Tests authentication flow and rate limiting
 *
 * Run: k6 run load-tests/authentication.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const authErrorRate = new Rate('auth_errors');
const authLatency = new Trend('auth_latency');

// Configuration
export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Ramp-up to 5 users
    { duration: '30s', target: 10 },   // 10 concurrent auth attempts
    { duration: '10s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // Auth can be slower
    http_req_failed: ['rate<0.1'],     // Allow higher error rate (rate limiting)
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

export function setup() {
  console.log('🔐 Starting Authentication Load Tests');
  console.log(`📍 Target: ${BASE_URL}`);
  return { startTime: new Date() };
}

export default function () {
  // Test Login Redirect
  group('Login Redirect', () => {
    const res = http.get(`${BASE_URL}/api/auth/login`, {
      redirects: 0, // Don't follow redirects
    });

    const success = check(res, {
      'login redirects (302 or 200)': (r) => r.status === 302 || r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    authErrorRate.add(!success);
    authLatency.add(res.timings.duration);
  });

  sleep(2);

  // Test Auth Callback (simulated)
  group('Auth Callback', () => {
    const params = {
      request_token: `test_token_${__VU}_${Date.now()}`,
      status: 'success',
    };

    const res = http.get(`${BASE_URL}/api/auth/callback?request_token=${params.request_token}&status=${params.status}`);

    const success = check(res, {
      'callback responds': (r) => r.status >= 200 && r.status < 500,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    authErrorRate.add(!success);
    authLatency.add(res.timings.duration);
  });

  sleep(3);

  // Test Rate Limiting on Auth Endpoints
  group('Auth Rate Limiting', () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Attempt multiple rapid requests to trigger rate limiting
    for (let i = 0; i < 6; i++) {
      const res = http.post(
        `${BASE_URL}/api/auth/validate`,
        JSON.stringify({ token: 'test_token' }),
        { headers }
      );

      if (i < 5) {
        check(res, {
          'first 5 requests allowed': (r) => r.status !== 429,
        });
      } else {
        check(res, {
          '6th request rate limited': (r) => r.status === 429,
          'rate limit message present': (r) => {
            if (r.status === 429) {
              const body = JSON.parse(r.body);
              return body.error && body.error.code === 'AUTH_RATE_LIMIT_EXCEEDED';
            }
            return false;
          },
        });
      }

      sleep(0.1); // Small delay between requests
    }
  });

  sleep(5);

  // Test Logout
  group('Logout', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test_token_${__VU}`,
    };

    const res = http.post(`${BASE_URL}/api/auth/logout`, null, { headers });

    const success = check(res, {
      'logout responds': (r) => r.status >= 200 && r.status < 500,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });

    authErrorRate.add(!success);
    authLatency.add(res.timings.duration);
  });

  sleep(2);
}

export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log(`\n✅ Authentication load tests completed in ${duration.toFixed(2)}s`);
  console.log('📊 Rate limiting behavior should be visible in results');
}
