"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = require("./app");
const { checkConnection, closePool } = require("./config/database");

const PORT = process.env.PORT || 3000;

async function start() {
  await checkConnection();
  const server = app.listen(PORT, () => {
    console.log(`[Server] http://localhost:${PORT} 에서 실행 중`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((err) => {
  console.error("[Server] 시작 실패:", err);
  process.exit(1);
});
