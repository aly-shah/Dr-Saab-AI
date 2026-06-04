// pm2 process config:  pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "drsaab-bot",
      script: "src/index.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
