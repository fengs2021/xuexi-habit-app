module.exports = {
  apps: [
    {
      name: 'xuexi-test-backend',
      script: 'backend/src/index.js',
      cwd: '/opt/xuexi-test',
      instances: 1,
      env: {
        NODE_ENV: 'testing',
        PORT: 8081,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/xuexi_test',
        JWT_SECRET: 'xuexi-test-secret-2024',
        ALLOWED_ORIGIN: 'http://localhost:3001'
      },
      error_file: '/tmp/xuexi-test-backend-error.log',
      out_file: '/tmp/xuexi-test-backend-out.log',
      time: true
    },
    {
      name: 'xuexi-test-frontend',
      script: 'npm',
      args: 'run dev -- --port 3001',
      cwd: '/opt/xuexi-test/frontend',
      instances: 1,
      env: {
        NODE_ENV: 'testing'
      },
      error_file: '/tmp/xuexi-test-frontend-error.log',
      out_file: '/tmp/xuexi-test-frontend-out.log',
      time: true
    }
  ]
}
