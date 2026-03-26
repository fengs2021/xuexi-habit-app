import Router from '@koa/router';
import pool from '../config/database.js';
import { success, error } from '../utils/response.js';

const router = new Router({ prefix: '/api/avatars' });

// 获取所有头像列表
router.get('/', async (ctx) => {
  try {
    const result = await pool.query(
      'SELECT id, name, filename, category, is_active FROM avatars WHERE is_active = true ORDER BY category, name'
    );
    
    // 使用相对路径，让浏览器自动使用当前页面的域名
    const avatars = result.rows.map(row => ({
      ...row,
      url: `/avatars/${row.filename}`
    }));
    
    ctx.body = success(avatars);
  } catch (err) {
    console.error('Get avatars error:', err);
    ctx.body = error(500, '获取头像列表失败');
  }
});

export default router;
