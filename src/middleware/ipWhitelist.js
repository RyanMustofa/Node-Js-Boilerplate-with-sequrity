const ipWhitelistRepository = require("../db/repositories/ipWhitelistRepository");
const { getClientIp } = require("./auth");

async function requireWhitelistedIp(req, res, next) {
  try {
    const clientIp = getClientIp(req);

    // Operational safety: behind nginx, Cloudflare, or other reverse proxies, req.ip may reflect the proxy,
    // not the original client. Use X-Forwarded-For when trusted proxies are configured with app.set('trust proxy', true)
    // or equivalent proxy handling. If a proxy is not trusted, do not trust X-Forwarded-For and fail secure.
    // In production, configure proxy trust explicitly and validate forwarded addresses from known network ranges.
    const entry =
      await ipWhitelistRepository.findActiveWhitelistEntry(clientIp);

    if (!entry) {
      return res.status(403).json({ error: "IP address is not whitelisted" });
    }

    req.clientIp = clientIp;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = requireWhitelistedIp;
