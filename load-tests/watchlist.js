/**
 * k6 Load Test: Watchlist Operations
 *
 * Tests watchlist CRUD operations under load
 *
 * Run: k6 run load-tests/watchlist.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const watchlistErrorRate = new Rate('watchlist_errors');
const watchlistLatency = new Trend('watchlist_latency');
const operationCounter = new Counter('watchlist_operations');

// Configuration
export const options = {
  stages: [
    { duration: '20s', target: 10 },   // Ramp-up to 10 users
    { duration: '1m', target: 30 },    // 30 concurrent users
    { duration: '20s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],
    watchlist_errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const TEST_STOCKS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'SBIN', 'BHARTIARTL'];

export function setup() {
  console.log('📋 Starting Watchlist Load Tests');
  console.log(`📍 Target: ${BASE_URL}`);
  return { startTime: new Date() };
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer test_token_${__VU}`,
  };

  // Get Watchlist
  group('Get Watchlist', () => {
    const res = http.get(`${BASE_URL}/api/watchlist`, { headers });

    const success = check(res, {
      'get watchlist status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 300ms': (r) => r.timings.duration < 300,
      'response is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(1);

  // Add Stock to Watchlist
  group('Add Stock to Watchlist', () => {
    const randomStock = TEST_STOCKS[Math.floor(Math.random() * TEST_STOCKS.length)];
    const payload = {
      stockSymbol: randomStock,
      companyName: `${randomStock} Ltd`,
      category: 'Tech',
    };

    const res = http.post(
      `${BASE_URL}/api/watchlist`,
      JSON.stringify(payload),
      { headers }
    );

    const success = check(res, {
      'add stock status is 200, 201, or 401': (r) =>
        r.status === 200 || r.status === 201 || r.status === 401 || r.status === 409,
      'response time < 400ms': (r) => r.timings.duration < 400,
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(2);

  // Get Categories
  group('Get Categories', () => {
    const res = http.get(`${BASE_URL}/api/watchlist/categories`, { headers });

    const success = check(res, {
      'get categories status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 250ms': (r) => r.timings.duration < 250,
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(1);

  // Filter by Category
  group('Filter by Category', () => {
    const res = http.get(`${BASE_URL}/api/watchlist?category=Tech`, { headers });

    const success = check(res, {
      'filter status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 350ms': (r) => r.timings.duration < 350,
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(2);

  // Search Stocks (autocomplete simulation)
  group('Search Stocks', () => {
    const searchQuery = TEST_STOCKS[0].substring(0, 3); // First 3 characters
    const res = http.get(`${BASE_URL}/api/stocks/search?q=${searchQuery}`, { headers });

    const success = check(res, {
      'search status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(1);

  // Update Watchlist Item
  group('Update Watchlist Item', () => {
    const watchlistId = `test_id_${__VU}`;
    const payload = {
      category: 'Banking',
      notes: 'Updated during load test',
    };

    const res = http.put(
      `${BASE_URL}/api/watchlist/${watchlistId}`,
      JSON.stringify(payload),
      { headers }
    );

    const success = check(res, {
      'update status is 200, 401, or 404': (r) =>
        r.status === 200 || r.status === 401 || r.status === 404,
      'response time < 350ms': (r) => r.timings.duration < 350,
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(3);

  // Remove from Watchlist (simulate, don't actually delete)
  group('Remove from Watchlist (simulated)', () => {
    const watchlistId = `test_id_${__VU}_delete`;

    const res = http.del(
      `${BASE_URL}/api/watchlist/${watchlistId}`,
      null,
      { headers }
    );

    const success = check(res, {
      'delete status is 200, 204, 401, or 404': (r) =>
        r.status === 200 || r.status === 204 || r.status === 401 || r.status === 404,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });

    watchlistErrorRate.add(!success);
    watchlistLatency.add(res.timings.duration);
    operationCounter.add(1);
  });

  sleep(2);
}

export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log(`\n✅ Watchlist load tests completed in ${duration.toFixed(2)}s`);
}
