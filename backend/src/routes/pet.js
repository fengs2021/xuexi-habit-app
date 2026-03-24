import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'
import { subtractPoints, PointType } from '../services/points.js'

const router = new Router({ prefix: '/api/pet' })

// 宠物配置
const PETS = {
  rabbit: { emoji: '🐰', name: '小兔子', unlock: 0 },
  fox: { emoji: '🦊', name: '小狐狸', unlock: 50 },
  cat: { emoji: '🐱', name: '小猫', unlock: 100 },
  dog: { emoji: '🐶', name: '小狗', unlock: 150 },
  bear: { emoji: '🐻', name: '小熊', unlock: 250 },
  panda: { emoji: '🐼', name: '熊猫', unlock: 400 }
}

const ACTIONS = {
  feed: { emoji: '🍖', name: '喂食', cost: 5, hunger: 30, cleanliness: 0, mood: 5, intimacy: 3 },
  bath: { emoji: '🛁', name: '洗香香', cost: 8, hunger: 0, cleanliness: 25, mood: 10, intimacy: 4 },
  park: { emoji: '🌳', name: '去公园', cost: 10, hunger: -5, cleanliness: -10, mood: 35, intimacy: 5 },
  sleep: { emoji: '😴', name: '睡觉', cost: 3, hunger: -10, cleanliness: 0, mood: 20, intimacy: 2 }
}

// 获取宠物信息
router.get('/info/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    const result = await pool.query('SELECT * FROM user_pets WHERE user_id = $1', [userId])
    
    if (result.rows.length === 0) {
      // 创建默认宠物
      await pool.query(
        'INSERT INTO user_pets (user_id, pet_type, hunger, cleanliness, mood, intimacy, pet_level) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, 'rabbit', 100, 100, 100, 0, 1]
      )
      ctx.body = success({
        pet_type: 'rabbit',
        hunger: 100,
        cleanliness: 100,
        mood: 100,
        intimacy: 0,
        pet_level: 1
      })
      return
    }
    
    ctx.body = success(result.rows[0])
  } catch (err) {
    console.error('Get pet info error:', err)
    ctx.body = error(500, '获取宠物信息失败')
  }
})

// 照顾宠物
router.post('/care', async (ctx) => {
  const { userId, action } = ctx.request.body
  
  if (!action || !ACTIONS[action]) {
    ctx.body = error(400, '无效的操作')
    return
  }
  
  const act = ACTIONS[action]
  
  // 使用统一积分服务扣除星星
  const pointsResult = await subtractPoints(userId, act.cost, PointType.PET_CARE, {
    description: `照顾宠物-${act.name}`
  })
  
  if (!pointsResult.success) {
    ctx.body = error(3003, pointsResult.error || '余额不足')
    return
  }
  
  // 获取用户宠物
  const petResult = await pool.query('SELECT * FROM user_pets WHERE user_id = $1', [userId])
  if (petResult.rows.length === 0) {
    ctx.body = error(404, '宠物不存在')
    return
  }
  
  const pet = petResult.rows[0]
  
  // 更新宠物状态
  const newHunger = Math.max(0, Math.min(100, pet.hunger + act.hunger))
  const newCleanliness = Math.max(0, Math.min(100, pet.cleanliness + act.cleanliness))
  const newMood = Math.max(0, Math.min(100, pet.mood + act.mood))
  const newIntimacy = pet.intimacy + act.intimacy
  
  // 计算等级 (每50亲密升一级)
  const newLevel = Math.floor(newIntimacy / 50) + 1
  
  await pool.query(
    'UPDATE user_pets SET hunger = $1, cleanliness = $2, mood = $3, intimacy = $4, pet_level = $5, last_interaction = NOW(), updated_at = NOW() WHERE user_id = $6',
    [newHunger, newCleanliness, newMood, newIntimacy, newLevel, userId]
  )
  
  // 检查是否解锁新宠物
  const unlockedPets = Object.entries(PETS).filter(([_, p]) => newIntimacy >= p.unlock).map(([type, p]) => ({ type, ...p }))
  
  ctx.body = success({
    hunger: newHunger,
    cleanliness: newCleanliness,
    mood: newMood,
    intimacy: newIntimacy,
    petLevel: newLevel,
    actionCost: act.cost,
    actionName: act.name,
    unlockedPets: unlockedPets.map(p => p.type),
    currentBalance: pointsResult.balance
  })
})

// 更换宠物
router.put('/change', async (ctx) => {
  const { userId, petType } = ctx.request.body
  
  if (!petType || !PETS[petType]) {
    ctx.body = error(400, '无效的宠物类型')
    return
  }
  
  // 检查宠物是否已解锁
  const petResult = await pool.query('SELECT intimacy FROM user_pets WHERE user_id = $1', [userId])
  if (petResult.rows.length === 0) {
    ctx.body = error(404, '宠物不存在')
    return
  }
  
  const currentIntimacy = petResult.rows[0].intimacy || 0
  const requiredIntimacy = PETS[petType].unlock
  
  if (currentIntimacy < requiredIntimacy) {
    ctx.body = error(400, `亲密度不足，需要 ${requiredIntimacy} 才能解锁`)
    return
  }
  
  await pool.query(
    'UPDATE user_pets SET pet_type = $1, pet_mood = $2, updated_at = NOW() WHERE user_id = $3',
    [petType, 'neutral', userId]
  )
  
  ctx.body = success({
    petType,
    petName: PETS[petType].name,
    emoji: PETS[petType].emoji
  })
})

// 获取所有宠物及解锁状态
router.get('/all/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  try {
    const petResult = await pool.query('SELECT intimacy FROM user_pets WHERE user_id = $1', [userId])
    const currentIntimacy = petResult.rows[0]?.intimacy || 0
    
    const pets = Object.entries(PETS).map(([type, config]) => ({
      type,
      ...config,
      unlocked: currentIntimacy >= config.unlock
    }))
    
    ctx.body = success(pets)
  } catch (err) {
    console.error('Get all pets error:', err)
    ctx.body = error(500, '获取宠物列表失败')
  }
})

export default router
