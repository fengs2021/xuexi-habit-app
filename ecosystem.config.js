{
  "apps": [
    {
      "name": "xuexi-backend",
      "script": "src/app.js",
      "cwd": "/opt/xuexi-app/backend",
      "interpreter": "node",
      "env": {
        "NODE_ENV": "production"
      },
      "env_file": "/opt/xuexi-app/.env",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "500M",
      "exp_backoff_restart_delay": 100,
      "max_restarts": 10,
      "min_uptime": "10s",
      "listen_timeout": 8000,
      "kill_timeout": 5000,
      "wait_ready": true,
      "shutdown_with_message": true,
      "error_file": "/var/log/xuexi-backend-error.log",
      "out_file": "/var/log/xuexi-backend-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "merge_logs": true,
      "pmx": true
    }
  ]
}
