# AlgoGainz Load Testing with k6

**Performance and stress testing for AlgoGainz API**

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Available Tests](#available-tests)
4. [Running Tests](#running-tests)
5. [Interpreting Results](#interpreting-results)
6. [Test Scenarios](#test-scenarios)
7. [Best Practices](#best-practices)

---

## Overview

This directory contains k6 load tests for the AlgoGainz API. k6 is an open-source load testing tool that makes performance testing easy and productive for developers.

**What we test**:
- API endpoint performance under load
- Rate limiting behavior
- Authentication flow scalability
- Database query performance
- System breaking points (stress testing)

---

## Installation

### macOS

```bash
brew install k6
```

### Linux (Debian/Ubuntu)

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Linux (Fedora/CentOS)

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### Windows (via Chocolatey)

```powershell
choco install k6
```

### Using Docker

```bash
docker pull grafana/k6:latest
```

### Verify Installation

```bash
k6 version
```

---

## Available Tests

### 1. `trading-api.js` - General API Load Test

**Purpose**: Tests overall API performance with realistic user behavior

**Duration**: ~4 minutes

**Max Users**: 100 concurrent users

**Endpoints Tested**:
- Health check
- API info
- Watchlist read
- Stock quote fetch
- Holdings read
- Transactions read
- Dashboard metrics

**Use Case**: Regular performance testing, CI/CD pipeline

---

### 2. `authentication.js` - Auth Flow Load Test

**Purpose**: Tests authentication endpoints and rate limiting

**Duration**: ~50 seconds

**Max Users**: 10 concurrent users

**Endpoints Tested**:
- Login redirect
- Auth callback
- Rate limiting (5 attempts/15 minutes)
- Logout

**Use Case**: Verify auth rate limiting works correctly

---

### 3. `watchlist.js` - Watchlist CRUD Load Test

**Purpose**: Tests watchlist operations under concurrent load

**Duration**: ~1 minute 40 seconds

**Max Users**: 30 concurrent users

**Endpoints Tested**:
- Get watchlist
- Add stock
- Get categories
- Filter by category
- Search stocks
- Update watchlist item
- Remove from watchlist

**Use Case**: Feature-specific load testing

---

### 4. `stress-test.js` - Aggressive Stress Test ⚠️

**Purpose**: Find breaking points and maximum capacity

**Duration**: ~14 minutes

**Max Users**: 400 concurrent users (aggressive)

**Warning**: ⚠️ **Only run in test/staging environments!**

**Use Case**: Capacity planning, identifying bottlenecks

---

## Running Tests

### Basic Usage

```bash
# Run a specific test
k6 run load-tests/trading-api.js

# Run with custom API URL
k6 run --env API_BASE_URL=https://api.algogainz.com load-tests/trading-api.js

# Run authentication test
k6 run load-tests/authentication.js

# Run watchlist test
k6 run load-tests/watchlist.js
```

### Custom Test Parameters

```bash
# Override VUs (Virtual Users) and duration
k6 run --vus 50 --duration 2m load-tests/trading-api.js

# Stress test with specific load
k6 run --vus 500 --duration 5m load-tests/stress-test.js

# Run with iterations instead of duration
k6 run --vus 10 --iterations 1000 load-tests/trading-api.js
```

### Environment Variables

```bash
# Set API base URL
export API_BASE_URL=http://localhost:3000
k6 run load-tests/trading-api.js

# Or inline
API_BASE_URL=https://api.algogainz.com k6 run load-tests/trading-api.js

# Set Kite API key (if needed for authenticated tests)
k6 run --env KITE_API_KEY=your_api_key load-tests/trading-api.js
```

### Output Formats

```bash
# JSON output
k6 run --out json=results.json load-tests/trading-api.js

# CSV output
k6 run --out csv=results.csv load-tests/trading-api.js

# Multiple outputs
k6 run --out json=results.json --out csv=results.csv load-tests/trading-api.js

# Cloud output (k6 Cloud)
k6 run --out cloud load-tests/trading-api.js
```

### Docker Usage

```bash
# Run test in Docker
docker run --rm -i grafana/k6 run - < load-tests/trading-api.js

# With environment variables
docker run --rm -i \
  -e API_BASE_URL=http://host.docker.internal:3000 \
  grafana/k6 run - < load-tests/trading-api.js

# With volume mount
docker run --rm -v $(pwd)/load-tests:/tests grafana/k6 run /tests/trading-api.js
```

---

## Interpreting Results

### Sample Output

```
execution: local
   script: load-tests/trading-api.js
   output: -

scenarios: (100.00%) 1 scenario, 100 max VUs, 4m30s max duration
  default: Up to 100 looping VUs for 4m0s over 4 stages

running (4m00.1s), 000/100 VUs, 2456 complete and 0 interrupted iterations

✓ health check status is 200
✓ response time < 200ms
✓ api info status is 200
✓ watchlist status is 200 or 401

checks.........................: 98.45% ✓ 9824    ✗ 154
data_received..................: 3.2 MB 13 kB/s
data_sent......................: 856 kB 3.6 kB/s
http_req_duration..............: avg=125.43ms min=42.12ms med=98.67ms max=1.2s p(95)=345.22ms
http_req_failed................: 1.55%  ✓ 154     ✗ 9670
http_reqs......................: 9824   41 requests/s
iteration_duration.............: avg=9.8s min=8.2s med=9.5s max=15.3s
iterations.....................: 2456   10.2/s
vus............................: 100    min=0     max=100
```

### Key Metrics

#### ✅ Checks
- **Percentage**: Should be > 95%
- **Failures**: Investigate if > 5%

#### ⏱️ http_req_duration
- **avg**: Average response time
- **p(95)**: 95th percentile (95% of requests faster than this)
- **p(99)**: 99th percentile
- **max**: Slowest request

**Targets**:
- `avg < 300ms` - Good
- `p(95) < 500ms` - Acceptable
- `p(99) < 1000ms` - Maximum acceptable

#### 🔴 http_req_failed
- **Rate**: Percentage of failed requests
- **Target**: < 1% in normal conditions

#### 📊 http_reqs
- **Total**: Number of requests
- **Rate**: Requests per second (throughput)

#### 👥 VUs (Virtual Users)
- **min/max**: Range of concurrent users during test

---

## Test Scenarios

### Scenario 1: Baseline Performance (Daily)

**Purpose**: Ensure API performance hasn't degraded

```bash
# Run quick baseline test
k6 run --vus 20 --duration 1m load-tests/trading-api.js
```

**Success Criteria**:
- ✅ 0% error rate
- ✅ p(95) response time < 500ms
- ✅ All checks passing

---

### Scenario 2: Peak Load Simulation (Weekly)

**Purpose**: Simulate peak market hours

```bash
# Morning peak: 9:15 AM - 100 concurrent users
k6 run --vus 100 --duration 5m load-tests/trading-api.js
```

**Success Criteria**:
- ✅ < 1% error rate
- ✅ p(95) response time < 800ms
- ✅ System remains responsive

---

### Scenario 3: Rate Limiting Verification

**Purpose**: Ensure rate limits protect the API

```bash
k6 run load-tests/authentication.js
```

**Success Criteria**:
- ✅ 6th authentication request returns 429 (rate limited)
- ✅ Rate limit message is correct
- ✅ System doesn't crash under rapid requests

---

### Scenario 4: Stress Test (Pre-Production Only)

**Purpose**: Find system limits and breaking points

```bash
k6 run load-tests/stress-test.js
```

**Success Criteria**:
- ✅ Identify max capacity (VUs before 5% error rate)
- ✅ System recovers when load decreases
- ✅ No database corruption
- ✅ Error messages are appropriate

---

## Best Practices

### 1. Test in Staging First

```bash
# Always test in staging before production
API_BASE_URL=https://staging.algogainz.com k6 run load-tests/trading-api.js
```

### 2. Gradual Load Increase

Don't jump from 0 to 1000 users instantly. Use stages:

```javascript
stages: [
  { duration: '1m', target: 50 },   // Ramp-up
  { duration: '3m', target: 100 },  // Sustained load
  { duration: '1m', target: 0 },    // Ramp-down
]
```

### 3. Monitor Server Resources

While running tests, monitor:
- CPU usage
- Memory usage
- Database connections
- Network bandwidth
- Disk I/O

```bash
# Example: Monitor with htop, top, or your cloud provider's dashboard
htop
```

### 4. Run Tests Regularly

```bash
# Add to CI/CD pipeline
npm run test:load

# Or weekly cron job
0 2 * * 1 k6 run /path/to/load-tests/trading-api.js
```

### 5. Set Realistic Thresholds

```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],   // 500ms for 95% of requests
  http_req_failed: ['rate<0.01'],     // 1% error rate max
}
```

### 6. Use Proper Test Data

- Use test users, not real user data
- Mock external API calls when appropriate
- Clean up test data after tests

### 7. Document Results

```bash
# Save results with timestamp
k6 run --out json=results-$(date +%Y%m%d-%H%M%S).json load-tests/trading-api.js

# Or use k6 Cloud for automatic dashboards
k6 login cloud
k6 run --out cloud load-tests/trading-api.js
```

---

## Troubleshooting

### Problem: High Error Rate

**Symptoms**: `http_req_failed > 5%`

**Solutions**:
- Check if backend server is running
- Verify API_BASE_URL is correct
- Check database connection
- Review server logs for errors
- Reduce VUs if server is overwhelmed

---

### Problem: Slow Response Times

**Symptoms**: `p(95) > 1000ms`

**Solutions**:
- Identify slow endpoints (group by endpoint)
- Check database query performance
- Add database indices
- Enable caching
- Optimize API code

---

### Problem: Rate Limiting Errors

**Symptoms**: Many 429 responses

**Expected Behavior**: Rate limiting is working correctly!

**Solutions**:
- Reduce request rate in test script
- Adjust rate limit thresholds if necessary
- Implement retry logic with backoff

---

### Problem: Memory Leaks

**Symptoms**: Memory usage increases during test and doesn't recover

**Solutions**:
- Check for unclosed database connections
- Review event listeners (WebSocket)
- Use memory profiling tools
- Check for circular references

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Load Tests
        env:
          API_BASE_URL: ${{ secrets.STAGING_API_URL }}
        run: k6 run load-tests/trading-api.js

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

---

## Performance Targets

### Response Time Targets

| Endpoint | Target (p95) | Max (p99) |
|----------|-------------|-----------|
| Health Check | < 100ms | < 200ms |
| API Info | < 150ms | < 300ms |
| Watchlist Read | < 300ms | < 500ms |
| Holdings Read | < 300ms | < 500ms |
| Transactions Read | < 400ms | < 800ms |
| Dashboard Metrics | < 600ms | < 1000ms |
| Order Placement | < 800ms | < 1500ms |
| Report Generation | < 2000ms | < 5000ms |

### Throughput Targets

- **Min**: 50 requests/second
- **Target**: 100 requests/second
- **Peak**: 200+ requests/second

### Capacity Targets

- **Normal Load**: 50 concurrent users
- **Peak Load**: 100 concurrent users
- **Maximum**: 200+ concurrent users before degradation

---

## Additional Resources

- **k6 Documentation**: https://k6.io/docs/
- **k6 Cloud**: https://app.k6.io/
- **k6 Examples**: https://k6.io/docs/examples/
- **Performance Testing Best Practices**: https://k6.io/docs/testing-guides/

---

## Support

For questions or issues with load testing:

1. Check k6 documentation
2. Review test scripts for configuration
3. Monitor server resources during tests
4. Consult AlgoGainz technical documentation

---

**Last Updated**: November 19, 2025
**k6 Version**: Latest (v0.47+)
