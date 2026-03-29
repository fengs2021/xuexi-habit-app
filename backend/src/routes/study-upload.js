import Router from 'koa-router'
import fs from 'fs'
import path from 'path'
import { success, error } from '../utils/response.js'

const router = new Router()

// 简单的文件上传处理
router.post('/upload', async (ctx) => {
  try {
    const body = ctx.request.body
    
    if (!body.image) {
      ctx.body = error(400, '请提供图片数据')
      return
    }
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'study')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    let imageData = body.image
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        imageData = matches[2]
      }
    }
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const filename = 'study-' + uniqueSuffix + '.jpg'
    const filePath = path.join(uploadDir, filename)
    
    fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'))
    
    const savedPath = '/uploads/study/' + filename
    ctx.body = success({ path: savedPath, filename })
  } catch (err) {
    console.error('Upload error:', err)
    ctx.body = error(500, '上传失败')
  }
})

export default router
