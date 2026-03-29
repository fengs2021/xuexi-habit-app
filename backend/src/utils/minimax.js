import dotenv from 'dotenv'
dotenv.config()

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || 'sk-cp-v8YFOz1n_dw-GiW0cq0AWoIkwOLDibbpIYwKkls4b2g-rZcfQTSNlg43uMKJot92jOLgofutfyM8x404Aia6FuoliZWiJ8xshzNM-xYUCTk7mLE1cjQ6Zp8'
const MINIMAX_API_BASE = process.env.MINIMAX_API_BASE || 'https://api.minimaxi.com'

/**
 * 调用 MiniMax Chat API（支持 Vision 图片输入）
 * @param {string} model - 模型名，如 'MiniMax-Text-01' 或 'abab6.5s-chat'
 * @param {Array} messages - 消息数组，每条消息可以是文本或图片
 * @param {object} options - 其他选项
 */
export async function chatCompletion(model, messages, options = {}) {
  const response = await fetch(`${MINIMAX_API_BASE}/v1/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      ...options
    })
  })
  
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`MiniMax API error: ${response.status} - ${err}`)
  }
  
  return response.json()
}

/**
 * 使用 Vision 模型分析图片（OCR）
 * @param {string} imageUrlOrBase64 - 图片 URL 或 base64 数据
 * @param {string} prompt - 提问/指令
 * @returns {string} 分析结果文本
 */
export async function visionAnalyze(imageUrlOrBase64, prompt) {
  // 构建图片消息
  const imageContent = imageUrlOrBase64.startsWith('data:') || imageUrlOrBase64.startsWith('http')
    ? { image_url: imageUrlOrBase64 }
    : { image_url: `data:image/jpeg;base64,${imageUrlOrBase64}` }
  
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image', ...imageContent }
      ]
    }
  ]
  
  try {
    const result = await chatCompletion('MiniMax-Text-01', messages, {
      max_tokens: 4096
    })
    
    if (result.code === 0 && result.choices && result.choices.length > 0) {
      return result.choices[0].messages[0].text
    }
    
    // 尝试其他模型
    const result2 = await chatCompletion('abab6.5s-chat', messages, {
      max_tokens: 4096
    })
    
    if (result2.code === 0 && result2.choices && result2.choices.length > 0) {
      return result2.choices[0].messages[0].text
    }
    
    throw new Error(result.message || 'Vision API 返回格式异常')
  } catch (e) {
    console.error('Vision analyze error:', e)
    throw e
  }
}

export default { chatCompletion, visionAnalyze }
