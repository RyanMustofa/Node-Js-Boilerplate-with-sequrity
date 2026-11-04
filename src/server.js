const app = require("./app");
const env = require("./config/env");
const logger = require("./utils/logger");

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
