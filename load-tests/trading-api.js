/**
 * k6 Load Test: AlgoGainz Trading API
 *
 * Tests the performance of core API endpoints under load
 *
 * Run: k6 run load-tests/trading-api.js
 * Stress Test: k6 run --vus 500 --duration 2m load-tests/trading-api.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');
const requestCounter = new Counter('total_requests');

// Configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp-up to 20 users
    { duration: '1m', target: 100 },   // Spike to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be less than 1%
    errors: ['rate<0.05'],             // Custom error rate < 5%
  },
};

// Environment variables
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.KITE_API_KEY || 'test_api_key';

// Test data
const TEST_STOCKS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

export function setup() {
  // Setup phase - run once before tests
  console.log('🚀 Starting AlgoGainz Load Tests');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`👥 Max VUs: 100`);
  return { startTime: new Date() };
}

export default function (data) {
  // Health Check
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);

    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'response time < 200ms': (r) => r.timings.duration < 200,
      'has status field': (r) => JSON.parse(r.body).status === 'OK',
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(1);

  // API Info
  group('API Info', () => {
    const res = http.get(`${BASE_URL}/api`);

    const success = check(res, {
      'api info status is 200': (r) => r.status === 200,
      'response time < 300ms': (r) => r.timings.duration < 300,
      'has version field': (r) => JSON.parse(r.body).version !== undefined,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(1);

  // Watchlist Operations (Read-only for load testing)
  group('Watchlist Read', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test_token_${__VU}`, // Mock token per virtual user
    };

    const res = http.get(`${BASE_URL}/api/watchlist`, { headers });

    const success = check(res, {
      'watchlist status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(2);

  // Quote Fetch (simulated)
  group('Stock Quote Fetch', () => {
    const randomStock = TEST_STOCKS[Math.floor(Math.random() * TEST_STOCKS.length)];
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test_token_${__VU}`,
    };

    const res = http.get(`${BASE_URL}/api/stocks/quote?symbol=${randomStock}`, { headers });

    const success = check(res, {
      'quote fetch status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 600ms': (r) => r.timings.duration < 600,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(1);

  // Holdings Read
  group('Holdings Read', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test_token_${__VU}`,
    };

    const res = http.get(`${BASE_URL}/api/holdings`, { headers });

    const success = check(res, {
      'holdings status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(2);

  // Transactions Read
  group('Transactions Read', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test_token_${__VU}`,
    };

    const res = http.get(`${BASE_URL}/api/transactions?limit=50`, { headers });

    const success = check(res, {
      'transactions status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(1);

  // Dashboard Metrics
  group('Dashboard Metrics', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test_token_${__VU}`,
    };

    const res = http.get(`${BASE_URL}/api/dashboard/metrics`, { headers });

    const success = check(res, {
      'dashboard status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 800ms': (r) => r.timings.duration < 800,
    });

    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
    requestCounter.add(1);
  });

  sleep(3);
}

export function teardown(data) {
  // Teardown phase - run once after all tests
  const duration = (new Date() - data.startTime) / 1000;
  console.log(`\n✅ Load tests completed in ${duration.toFixed(2)}s`);
}
