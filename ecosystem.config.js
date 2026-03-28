module.exports = [
  {
    name: 'xuexi-backend',
    cwd: '/opt/xuexi/backend',
    script: 'src/app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://postgres:xuexi123456@localhost:5432/xuexi',
      JWT_SECRET: 'xuexi-habit-app-secret-2024',
      PORT: '8080'
    }
  },
  {
    name: 'xuexi-frontend',
    cwd: '/opt/xuexi/frontend',
    script: './node_modules/.bin/vite',
    args: 'preview --port 3000 --host 0.0.0.0',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }
];
