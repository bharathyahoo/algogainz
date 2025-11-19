/**
 * k6 Stress Test: AlgoGainz API
 *
 * Aggressive stress testing to find breaking points
 *
 * Run: k6 run load-tests/stress-test.js
 *
 * WARNING: This test is aggressive and may cause temporary service disruption.
 * Only run in staging/test environments, never in production!
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Stress Test Configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp-up to 50 users
    { duration: '2m', target: 100 },   // Increase to 100 users
    { duration: '2m', target: 200 },   // Spike to 200 users
    { duration: '3m', target: 300 },   // Push to 300 users (STRESS)
    { duration: '2m', target: 400 },   // Maximum stress: 400 users
    { duration: '3m', target: 100 },   // Recover to 100 users
    { duration: '1m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    // Allow higher failure rates during stress testing
    http_req_duration: ['p(99)<2000'], // 99% under 2 seconds
    http_req_failed: ['rate<0.3'],     // Allow up to 30% errors
    errors: ['rate<0.4'],              // Custom error rate < 40%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';

export function setup() {
  console.log('⚠️  STRESS TEST MODE');
  console.log('🔥 Starting aggressive load testing');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('⏱️  Duration: ~14 minutes');
  console.log('\n🚨 WARNING: This may impact service availability!\n');
  return { startTime: new Date() };
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer stress_test_token_${__VU}`,
  };

  // Rapid-fire requests (no sleep between some calls)

  // Health check
  let res = http.get(`${BASE_URL}/health`);
  check(res, { 'health check': (r) => r.status === 200 });
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);

  // API info
  res = http.get(`${BASE_URL}/api`);
  errorRate.add(res.status !== 200);
  responseTime.add(res.timings.duration);

  // Watchlist
  res = http.get(`${BASE_URL}/api/watchlist`, { headers });
  errorRate.add(res.status !== 200 && res.status !== 401);
  responseTime.add(res.timings.duration);

  // Holdings
  res = http.get(`${BASE_URL}/api/holdings`, { headers });
  errorRate.add(res.status !== 200 && res.status !== 401);
  responseTime.add(res.timings.duration);

  // Transactions
  res = http.get(`${BASE_URL}/api/transactions`, { headers });
  errorRate.add(res.status !== 200 && res.status !== 401);
  responseTime.add(res.timings.duration);

  sleep(0.5); // Minimal sleep

  // Dashboard metrics (complex query)
  res = http.get(`${BASE_URL}/api/dashboard/metrics`, { headers });
  errorRate.add(res.status !== 200 && res.status !== 401);
  responseTime.add(res.timings.duration);

  // Random sleep between 0.5-2 seconds
  sleep(Math.random() * 1.5 + 0.5);

  // Burst of POST requests
  for (let i = 0; i < 3; i++) {
    res = http.post(
      `${BASE_URL}/api/watchlist`,
      JSON.stringify({
        stockSymbol: `STRESS${__VU}${i}`,
        companyName: `Stress Test Stock ${i}`,
        category: 'Test',
      }),
      { headers }
    );
    errorRate.add(res.status >= 500); // Only count 5xx as errors
    responseTime.add(res.timings.duration);

    sleep(0.1);
  }

  sleep(1);
}

export function teardown(data) {
  const duration = (new Date() - data.startTime) / 1000;
  console.log(`\n✅ Stress test completed in ${duration.toFixed(2)}s`);
  console.log('📊 Check metrics to identify breaking points');
  console.log('💡 Review error rates and response times at different load levels');
}

export function handleSummary(data) {
  // Custom summary output
  const { metrics } = data;

  console.log('\n📈 STRESS TEST SUMMARY');
  console.log('='.repeat(50));

  if (metrics.http_req_duration) {
    console.log(`Response Time (avg): ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
    console.log(`Response Time (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`Response Time (p99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
    console.log(`Response Time (max): ${metrics.http_req_duration.values.max.toFixed(2)}ms`);
  }

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(`Request Failure Rate: ${failRate}%`);
  }

  if (metrics.http_reqs) {
    console.log(`Total Requests: ${metrics.http_reqs.values.count}`);
  }

  console.log('='.repeat(50));

  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
