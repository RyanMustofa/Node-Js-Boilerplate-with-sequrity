const db = require("../knex");

async function findActiveWhitelistEntry(ipAddress) {
  return db("ip_whitelist")
    .select("id", "ip_address", "is_active", "created_at")
    .where({ ip_address: ipAddress, is_active: true })
    .first();
}

module.exports = {
  findActiveWhitelistEntry,
};
