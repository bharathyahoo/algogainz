# AlgoGainz - Security Guide & Audit Checklist

**Comprehensive security documentation and best practices**

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Security Features Implemented](#security-features-implemented)
3. [Security Audit Checklist](#security-audit-checklist)
4. [Common Vulnerabilities & Mitigations](#common-vulnerabilities--mitigations)
5. [Security Best Practices](#security-best-practices)
6. [Incident Response](#incident-response)

---

## Security Overview

AlgoGainz implements multiple layers of security to protect user data and prevent attacks:

- **🔒 Transport Security**: HTTPS/TLS encryption
- **🛡️ Application Security**: Helmet.js security headers
- **🚦 Rate Limiting**: Prevents brute force and DDoS attacks
- **🔑 Authentication**: JWT-based secure authentication
- **🗄️ Database Security**: Prisma ORM prevents SQL injection
- **🌐 CORS**: Whitelist-based cross-origin requests
- **📝 Input Validation**: Express-validator sanitizes inputs
- **📊 Audit Logging**: Tracks sensitive operations

---

## Security Features Implemented

### 1. HTTP Security Headers (Helmet.js)

**File**: `backend/src/config/security.ts`

```typescript
✅ Content-Security-Policy (CSP)
✅ Strict-Transport-Security (HSTS) - 1 year max-age
✅ X-Frame-Options: DENY (prevents clickjacking)
✅ X-Content-Type-Options: nosniff
✅ X-XSS-Protection: enabled
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ X-DNS-Prefetch-Control: off
```

**Verification**:
```bash
curl -I https://api.algogainz.com/health | grep -E "Strict-Transport|X-Frame|X-Content"
```

---

### 2. CORS Configuration

**Configured**: Origin whitelist, credentials allowed

```typescript
// Only specified origins allowed in production
ALLOWED_ORIGINS=https://algogainz.vercel.app,https://app.algogainz.com

// Development: localhost allowed
// Production: Strict whitelist enforced
```

**Test CORS**:
```bash
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://api.algogainz.com/api/auth/login
```

Expected: CORS error (origin not allowed)

---

### 3. Rate Limiting

**Configured Limits**:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 5 attempts | 15 minutes |
| Trading Orders | 10 orders | 1 second |
| Report Generation | 5 reports | 1 minute |

**Implementation**:
```typescript
// backend/src/config/security.ts
export const apiLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  // ...
});
```

**Test Rate Limiting**:
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl https://api.algogainz.com/health
done
```

Expected: 429 Too Many Requests after 100 requests

---

### 4. JWT Authentication

**Implementation**:
- Strong secret (32+ characters required)
- Token expiration: 7 days
- HTTP-only cookies (prevents XSS access)
- Secure flag enabled in production

**Token Structure**:
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "iat": 1700000000,
  "exp": 1700604800
}
```

**Security Measures**:
- ✅ Tokens expire
- ✅ No sensitive data in payload
- ✅ Secret stored in environment variable
- ✅ Tokens verified on every protected request

---

### 5. Input Validation & Sanitization

**Configured**: Express-validator

**Protected Fields**:
- Stock symbols: Alphanumeric only (`/^[A-Z0-9-]+$/`)
- User input: HTML/script tags removed
- SQL injection: Prevented by Prisma parameterized queries

**Example Validation**:
```typescript
// backend/src/config/security.ts
export const validateStockSymbol = (symbol: string): boolean => {
  const symbolRegex = /^[A-Z0-9-]+$/;
  return symbolRegex.test(symbol);
};
```

---

### 6. Database Security

**Prisma ORM Protections**:
- ✅ Automatic SQL injection prevention (parameterized queries)
- ✅ Type-safe database queries
- ✅ Connection pooling
- ✅ Encrypted connections (SSL/TLS)

**Performance Indices**:
```sql
-- Indexed fields for fast queries
- userId (all tables)
- stockSymbol + userId (composite)
- timestamp (for date filtering)
- alertEnabled (for exit strategies)
```

**Backup Strategy**:
- Daily automated backups (provider-managed)
- Point-in-time recovery
- Off-site storage

---

### 7. Error Handling

**Secure Error Responses**:

**Development**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid stock symbol",
    "details": { "stack": "..." }
  }
}
```

**Production**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid stock symbol"
  }
}
```

**No sensitive information leaked**:
- ❌ No stack traces
- ❌ No database query details
- ❌ No internal paths
- ❌ No environment variables

---

## Security Audit Checklist

### Pre-Production Audit

#### Application Security

- [ ] **Environment Variables**
  - [ ] All secrets in `.env` (not hardcoded)
  - [ ] `.env` in `.gitignore`
  - [ ] Strong JWT_SECRET (32+ characters)
  - [ ] No default/example secrets in production

- [ ] **Authentication**
  - [ ] JWT tokens expire
  - [ ] Password hashing (if applicable)
  - [ ] Secure session management
  - [ ] Logout clears tokens

- [ ] **Authorization**
  - [ ] User can only access their own data
  - [ ] Admin routes protected
  - [ ] API endpoints require authentication

- [ ] **Input Validation**
  - [ ] All user inputs validated
  - [ ] Stock symbols sanitized
  - [ ] Quantity/price limits enforced
  - [ ] XSS prevention enabled

- [ ] **HTTPS/TLS**
  - [ ] HTTPS enforced
  - [ ] SSL certificates valid
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header enabled

- [ ] **CORS**
  - [ ] Origin whitelist configured
  - [ ] No wildcard (`*`) in production
  - [ ] Credentials properly handled

- [ ] **Rate Limiting**
  - [ ] API rate limits active
  - [ ] Auth endpoints have strict limits
  - [ ] Trading endpoints rate-limited per Kite API

#### Database Security

- [ ] **Access Control**
  - [ ] Database user has minimum permissions
  - [ ] Production database not publicly accessible
  - [ ] SSL/TLS enabled for connections
  - [ ] Regular credential rotation

- [ ] **Backups**
  - [ ] Automated daily backups enabled
  - [ ] Backup retention policy set
  - [ ] Restore process tested
  - [ ] Encrypted backups

- [ ] **SQL Injection**
  - [ ] Prisma ORM used (prevents injection)
  - [ ] No raw SQL queries
  - [ ] Input sanitization in place

#### Infrastructure Security

- [ ] **Server Hardening**
  - [ ] Firewall configured
  - [ ] Unnecessary ports closed
  - [ ] OS patches up to date
  - [ ] Reverse proxy configured (if applicable)

- [ ] **Secrets Management**
  - [ ] No secrets in git history
  - [ ] Environment-specific secrets
  - [ ] Secret rotation policy
  - [ ] Access logs for secret access

- [ ] **Monitoring**
  - [ ] Error tracking configured (Sentry)
  - [ ] Audit logs enabled
  - [ ] Suspicious activity alerts
  - [ ] Regular log reviews

#### Code Security

- [ ] **Dependencies**
  - [ ] `npm audit` shows no critical vulnerabilities
  - [ ] Dependencies up to date
  - [ ] Unused packages removed
  - [ ] Lock files committed (`package-lock.json`)

- [ ] **Static Analysis**
  - [ ] ESLint configured
  - [ ] TypeScript strict mode enabled
  - [ ] No console.log in production code
  - [ ] Dead code removed

---

## Common Vulnerabilities & Mitigations

### 1. SQL Injection ✅ MITIGATED

**Risk**: Attacker injects malicious SQL queries

**Mitigation**:
- ✅ Prisma ORM with parameterized queries
- ✅ No raw SQL queries
- ✅ Input validation

**Example Attack Prevented**:
```sql
-- Malicious input
symbol = "'; DROP TABLE users; --"

-- Prisma automatically escapes this
prisma.watchlist.findMany({
  where: { stockSymbol: symbol } // Safe!
});
```

---

### 2. Cross-Site Scripting (XSS) ✅ MITIGATED

**Risk**: Attacker injects malicious scripts

**Mitigation**:
- ✅ Content Security Policy (CSP)
- ✅ Input sanitization
- ✅ React auto-escapes output
- ✅ X-XSS-Protection header

**Example Attack Prevented**:
```javascript
// Malicious input
companyName = "<script>alert('XSS')</script>"

// Sanitized automatically
sanitizeInput(companyName) // Returns: "scriptalert('XSS')/script"
```

---

### 3. Cross-Site Request Forgery (CSRF) ⚠️ PARTIAL

**Risk**: Unauthorized actions via authenticated user

**Current Status**:
- ✅ SameSite cookies
- ✅ CORS restrictions
- ⚠️ CSRF tokens not implemented (future enhancement)

**Recommended Enhancement**:
```typescript
// Add CSRF middleware
import csrf from 'csurf';
app.use(csrf({ cookie: true }));
```

---

### 4. Brute Force Attacks ✅ MITIGATED

**Risk**: Attacker tries many passwords

**Mitigation**:
- ✅ Rate limiting (5 attempts / 15 minutes)
- ✅ Account lockout after failed attempts
- ✅ Audit logging

---

### 5. DDoS Attacks ✅ MITIGATED

**Risk**: Server overwhelmed with requests

**Mitigation**:
- ✅ General API rate limiting (100 req/min)
- ✅ Request size limits (10KB)
- ✅ Cloudflare/Railway DDoS protection

---

### 6. Man-in-the-Middle (MITM) ✅ MITIGATED

**Risk**: Attacker intercepts communications

**Mitigation**:
- ✅ HTTPS/TLS encryption
- ✅ HSTS header (forces HTTPS)
- ✅ Certificate validation

---

### 7. Sensitive Data Exposure ✅ MITIGATED

**Risk**: Secrets leaked in responses

**Mitigation**:
- ✅ No secrets in client code
- ✅ Environment variables secured
- ✅ Error messages sanitized
- ✅ No stack traces in production

---

## Security Best Practices

### For Developers

1. **Never commit secrets**
   ```bash
   # Check before commit
   git diff | grep -E "(password|secret|key)"
   ```

2. **Keep dependencies updated**
   ```bash
   npm audit
   npm outdated
   npm update
   ```

3. **Use environment variables**
   ```typescript
   ❌ const API_KEY = "abc123";
   ✅ const API_KEY = process.env.KITE_API_KEY;
   ```

4. **Validate all inputs**
   ```typescript
   ❌ const symbol = req.body.symbol;
   ✅ const symbol = validateStockSymbol(req.body.symbol)
                    ? req.body.symbol
                    : throw new Error();
   ```

5. **Log security events**
   ```typescript
   auditLog(userId, 'ORDER_PLACED', 'TRADING', { symbol, quantity });
   ```

### For Users

1. **Use strong passwords** (when user auth implemented)
2. **Enable 2FA** (future enhancement)
3. **Review permissions** for Kite API
4. **Monitor account activity**
5. **Report suspicious activity**

---

## Incident Response

### If Security Breach Detected

#### Immediate Actions (0-1 hour)

1. **Contain**
   - [ ] Isolate affected systems
   - [ ] Disable compromised accounts
   - [ ] Block suspicious IPs

2. **Assess**
   - [ ] Determine scope of breach
   - [ ] Identify data accessed
   - [ ] Check audit logs

3. **Communicate**
   - [ ] Notify affected users
   - [ ] Alert hosting providers
   - [ ] Document timeline

#### Short-Term (1-24 hours)

4. **Remediate**
   - [ ] Patch vulnerability
   - [ ] Rotate all secrets
   - [ ] Force password resets (if user auth)
   - [ ] Deploy security fix

5. **Monitor**
   - [ ] Watch for further attacks
   - [ ] Review logs continuously
   - [ ] Set up additional alerts

#### Long-Term (1-7 days)

6. **Prevent**
   - [ ] Conduct security audit
   - [ ] Implement additional controls
   - [ ] Update documentation
   - [ ] Train team on lessons learned

7. **Report**
   - [ ] Post-mortem analysis
   - [ ] Regulatory compliance (if applicable)
   - [ ] Public disclosure (if required)

---

## Security Contacts

**Report Vulnerabilities**:
- Email: security@algogainz.com (example)
- GitHub Security Advisory
- Responsible disclosure: 90-day window

**Bug Bounty**: Not currently available

---

## Compliance

### OWASP Top 10 (2021)

| Risk | Status | Implementation |
|------|--------|----------------|
| A01: Broken Access Control | ✅ Mitigated | JWT auth, user-scoped queries |
| A02: Cryptographic Failures | ✅ Mitigated | HTTPS, bcrypt, env vars |
| A03: Injection | ✅ Mitigated | Prisma ORM, input validation |
| A04: Insecure Design | ✅ Mitigated | Security-first architecture |
| A05: Security Misconfiguration | ✅ Mitigated | Helmet, secure defaults |
| A06: Vulnerable Components | ✅ Mitigated | npm audit, updates |
| A07: ID & Auth Failures | ✅ Mitigated | JWT, rate limiting |
| A08: Software & Data Integrity | ⚠️ Partial | Lock files, no SRI yet |
| A09: Logging Failures | ✅ Mitigated | Audit logs, error tracking |
| A10: Server-Side Request Forgery | ✅ Mitigated | Input validation, allowlist |

---

## Security Testing Commands

### 1. Check for Hardcoded Secrets

```bash
git grep -E "(password|secret|key|token)\s*=\s*['\"]" -- '*.ts' '*.js'
```

### 2. Dependency Vulnerabilities

```bash
cd backend && npm audit --audit-level=high
cd frontend && npm audit --audit-level=high
```

### 3. HTTPS/TLS Check

```bash
openssl s_client -connect api.algogainz.com:443 -tls1_2
```

### 4. Security Headers Check

```bash
curl -I https://api.algogainz.com/health | grep -E "Strict|X-Frame|X-Content|CSP"
```

### 5. Rate Limit Test

```bash
ab -n 200 -c 10 https://api.algogainz.com/health
```

---

## Regular Security Tasks

### Daily
- [ ] Review error logs
- [ ] Check failed login attempts
- [ ] Monitor API usage patterns

### Weekly
- [ ] Run `npm audit`
- [ ] Review audit logs
- [ ] Check for suspicious transactions

### Monthly
- [ ] Dependency updates
- [ ] Security patch review
- [ ] Access control audit
- [ ] Backup restore test

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update policies
- [ ] Security training

---

**Last Updated**: November 19, 2025
**Security Version**: 1.0
**Next Audit Due**: February 19, 2026
