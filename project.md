Act as an expert backend engineer and security-focused Node.js architect. Your task is to generate a complete, production-ready Node.js Express API boilerplate following strict Clean Architecture patterns and enterprise-grade security hardening.

### 1. Tech Stack & Core Dependencies
- Runtime: Node.js (Latest LTS), Express.js
- Database & Query Builder: MySQL, Knex.js (`db/knex.js` with connection pooling and SSL/environment configuration)
- Queue Management: Redis (using BullMQ)
- Security & Validation: `helmet`, `cors`, `express-rate-limit`, crypto (for HMAC verification and credential encryption/decryption), XSS sanitization middleware.

---

### 2. Strict HTTP Request Middleware Pipeline Order
Implement middleware in `app.js` or `server.js` in this **exact sequence**:
1. Security Headers: `helmet()`
2. CORS: `cors()` configuration
3. Body Parser: `express.json({ limit: '2mb' })`
4. XSS Sanitization: Custom or library middleware sanitizing `req.body` and `req.query`
5. General Rate Limiter: IP-based rate limiting (`express-rate-limit`)
6. IP Whitelist Check: Middleware validating client IP against a shared database table (`ip_whitelist`) with operational safety notes (handling reverse proxies / `trust proxy`).
7. Authentication Middleware: 
   - `apiTokenAuth`: Standard API key + HMAC signature verification.
   - `apiTokenAuthPayout`: High-security payout-specific API key + HMAC auth middleware.
   - JWT validation middleware for user sessions where applicable.

---

### 3. Architecture & Layering Structure
Implement a strict layered architecture with clear separation of concerns:
- `routes/`: Express routers defining endpoints and attaching respective middleware.
- `services/`: Business logic, transaction management, and orchestration. Redis queue job producers/consumers should be integrated here.
- `mappers/`: Data transformation layer converting database rows / DTOs into clean domain response objects.
- `db/repositories/`: Data access layer using Knex SQL queries (fully parameterized to prevent SQL injection).
- `db/knex.js`: MySQL connection pool configuration.

---

### 4. Mandatory Security Requirements & Hardening
Your implementation must explicitly address:
- **SQL Injection Defense**: Strict usage of Knex query builder parameter binding (`.where({ id })` or `.where('id', '=', id)`), avoiding raw string concatenation.
- **XSS Defense-in-Depth**: Sanitizing inputs at the boundary and proper output handling.
- **Rate Limiting & Body Size Cap**: Enforced limits (2MB body cap, IP rate limiting) to prevent DoS and memory exhaustion.
- **Operational Safety Notes for IP Whitelist**: Include comments and handling logic for `X-Forwarded-For` / `req.ip` behind load balancers/reverse proxies (e.g., Nginx, Cloudflare), and fail-secure behavior.
- **Known Audit Findings Addressed**: Prevent timing attacks on HMAC/API key comparisons (`crypto.timingSafeEqual`), implement proper error handling without leaking stack traces in production, and secure JWT secret management.
- **Credential Encryption**: Provide a reusable utility using Node.js `crypto` (e.g., `aes-256-gcm` with authenticated encryption) to securely encrypt and decrypt sensitive user credentials (like API secrets, tokens, or personal identifiers) before storing them in the database.

---

### 5. Deliverables Expected
Please provide:
1. **Directory Structure Overview**
2. **Package.json** with required dependencies (`knex`, `mysql2`, `bullmq`, `ioredis`, `helmet`, `cors`, `express-rate-limit`, etc.)
3. **Core Setup Files**: `db/knex.js`, app entry point (`server.js` / `app.js`) with the exact middleware pipeline.
4. **Sample Implementation**: A complete vertical slice demonstrating a route, service, mapper, and repository layer (e.g., a transaction or payout feature) including Redis queue job integration and credential encryption.
5. **Security Checklist & Comments** explaining the cryptographic functions and IP whitelist safeguards.