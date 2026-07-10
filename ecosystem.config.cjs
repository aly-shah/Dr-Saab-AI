// pm2 config for BOTH services (website + bot).
//   pm2 start ecosystem.config.cjs
const path = require("path");
// Dedicated, unlikely-to-conflict ports (override via env if needed).
const WEB_PORT = process.env.WEB_PORT || 3210;
const WEB_API_PORT = process.env.WEB_API_PORT || 8321;

module.exports = {
  apps: [
    {
      name: "drsaab-web",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules/next/dist/bin/next"),
      args: `start -p ${WEB_PORT}`,
      interpreter: "node",
      autorestart: true,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production",
        PORT: String(WEB_PORT),
        // /api/bot proxies to the bot's web API on the same host
        BOT_API_URL: `http://localhost:${WEB_API_PORT}/web/message`,
        // admin dashboard reads the same DB the bot uses
        DATABASE_URL: process.env.DATABASE_URL || "",
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "drsaab-admin",
      },
    },
    {
      name: "drsaab-bot",
      cwd: path.join(__dirname, "bot"),
      script: "src/index.js",
      interpreter: "node",
      autorestart: true,
      max_restarts: 15,
      max_memory_restart: "300M",
      // WEB_API_PORT must match the port in drsaab-web's BOT_API_URL above,
      // otherwise /api/bot proxies to a port the bot isn't listening on and
      // the web chat returns "bot_unreachable".
      env: { NODE_ENV: "production", WEB_API_PORT: String(WEB_API_PORT) },
    },
  ],
};
