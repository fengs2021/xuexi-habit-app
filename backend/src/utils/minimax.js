import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

const SKILL_PATH = '/root/.openclaw/workspace/skills/minimax-understand-image/scripts/understand_image.py'

/**
 * 使用 MiniMax Vision skill 分析图片
 * @param {string} imagePathOrUrl - 图片路径或 URL
 * @param {string} prompt - 提问/指令
 * @returns {string} 分析结果文本
 */
export async function visionAnalyze(imagePathOrUrl, prompt) {
  try {
    // 保存图片到临时文件（如果是 base64）
    let imagePath = imagePathOrUrl
    
    if (imagePathOrUrl.startsWith('data:')) {
      // 是 base64 数据，保存到临时文件
      const matches = imagePathOrUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (matches) {
        const ext = matches[1].includes('png') ? 'png' : 'jpg'
        const tmpFile = path.join(os.tmpdir(), `ocr_${Date.now()}.${ext}`)
        fs.writeFileSync(tmpFile, Buffer.from(matches[2], 'base64'))
        imagePath = tmpFile
      }
    } else if (imagePathOrUrl.startsWith('http')) {
      // 是 URL，下载到临时文件
      const tmpFile = path.join(os.tmpdir(), `ocr_${Date.now()}.jpg`)
      const response = await fetch(imagePathOrUrl)
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(tmpFile, Buffer.from(buffer))
      imagePath = tmpFile
    }
    
    // 构建 prompt
    const ocrPrompt = `请分析这张试卷图片，识别出所有题目并返回JSON格式。

要求：
1. 返回JSON数组，每项包含：question_no(题号), question_type(类型：choice填空/truefalse判断/choice选择题/application应用题), content(题目内容), options(如果是选择题，包含A/B/C/D选项数组), ai_answer(AI推理的答案)
2. 只返回有效的题目，忽略页眉页脚
3. 答案尽量准确

返回格式：
{
  "questions": [
    {
      "question_no": 1,
      "question_type": "fill",
      "content": "题目内容",
      "options": [],
      "ai_answer": "答案"
    }
  ]
}

请直接返回JSON，不要有其他文字。`

    // 调用 skill 脚本
    const cmd = `python3 "${SKILL_PATH}" "${imagePath}" "${ocrPrompt.replace(/"/g, '\\"')}"`
    
    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024
    })
    
    // 清理临时文件
    if (imagePath !== imagePathOrUrl && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
    
    if (stderr) {
      console.error('Vision stderr:', stderr)
    }
    
    // 解析 JSON 输出
    const output = stdout.trim()
    
    // 提取 JSON
    const jsonMatch = output.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    throw new Error('无法解析识别结果')
    
  } catch (e) {
    console.error('Vision analyze error:', e)
    throw new Error('OCR识别失败: ' + e.message)
  }
}

export default { visionAnalyze }
