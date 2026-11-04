const path = require("path");
const db = require("./knex");
const logger = require("../utils/logger");

async function migrate() {
  try {
    const [batch, migrations] = await db.migrate.latest({
      directory: path.join(__dirname, "migrations"),
    });

    logger.info("Database migrations completed", {
      batch,
      migrations,
    });
  } catch (error) {
    logger.error("Database migration failed", { error: error.message });
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

migrate();
