import Router from '@koa/router'
import pool from '../config/database.js'
import { success, error } from '../utils/response.js'

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
  
  const result = await pool.query('SELECT * FROM user_pets WHERE user_id = $1', [userId])
  
  if (result.rows.length === 0) {
    // 创建默认宠物
    const newPet = {
      pet_type: 'rabbit',
      hunger: 100,
      cleanliness: 100,
      mood: 100,
      intimacy: 0,
      pet_level: 1
    }
    await pool.query(
      'INSERT INTO user_pets (user_id, pet_type, hunger, cleanliness, mood, intimacy, pet_level) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, newPet.pet_type, newPet.hunger, newPet.cleanliness, newPet.mood, newPet.intimacy, newPet.pet_level]
    )
    ctx.body = success(newPet)
    return
  }
  
  ctx.body = success(result.rows[0])
})

// 照顾宠物
router.post('/care', async (ctx) => {
  const { userId, action } = ctx.request.body
  
  if (!action || !ACTIONS[action]) {
    ctx.body = error(400, '无效的操作')
    return
  }
  
  const act = ACTIONS[action]
  
  // 获取用户宠物
  const petResult = await pool.query('SELECT * FROM user_pets WHERE user_id = $1', [userId])
  if (petResult.rows.length === 0) {
    ctx.body = error(404, '宠物不存在')
    return
  }
  
  const pet = petResult.rows[0]
  
  // 检查星星是否足够
  const userResult = await pool.query('SELECT stars FROM users WHERE id = $1', [userId])
  if (userResult.rows[0].stars < act.cost) {
    ctx.body = error(400, '星星不足')
    return
  }
  
  // 扣除星星
  await pool.query('UPDATE users SET stars = stars - $1 WHERE id = $2', [act.cost, userId])
  
  // 更新宠物状态
  const newHunger = Math.max(0, Math.min(100, pet.hunger + act.hunger))
  const newCleanliness = Math.max(0, Math.min(100, pet.cleanliness + act.cleanliness))
  const newMood = Math.max(0, Math.min(100, pet.mood + act.mood))
  const newIntimacy = pet.intimacy + act.intimacy
  
  // 计算等级 (每50亲密升一级)
  const newLevel = Math.floor(newIntimacy / 50) + 1
  
  await pool.query(
    'UPDATE user_pets SET hunger = $1, cleanliness = $2, mood = $3, intimacy = $4, pet_level = $5, updated_at = NOW() WHERE user_id = $6',
    [newHunger, newCleanliness, newMood, newIntimacy, newLevel, userId]
  )
  
  // 检查是否解锁新宠物
  const unlockedPets = Object.entries(PETS).filter(([_, p]) => newIntimacy >= p.unlock).map(([type, _]) => type)
  
  ctx.body = success({
    hunger: newHunger,
    cleanliness: newCleanliness,
    mood: newMood,
    intimacy: newIntimacy,
    petLevel: newLevel,
    actionCost: act.cost,
    actionName: act.name,
    unlockedPets
  })
})

// 更换宠物
router.put('/change', async (ctx) => {
  const { userId, petType } = ctx.request.body
  
  if (!PETS[petType]) {
    ctx.body = error(400, '无效的宠物类型')
    return
  }
  
  // 获取当前宠物的亲密值
  const petResult = await pool.query('SELECT intimacy FROM user_pets WHERE user_id = $1', [userId])
  if (petResult.rows.length === 0) {
    ctx.body = error(404, '宠物不存在')
    return
  }
  
  const intimacy = petResult.rows[0].intimacy
  
  // 检查是否已解锁
  if (intimacy < PETS[petType].unlock) {
    ctx.body = error(400, `需要 ${PETS[petType].unlock} 亲密才能解锁`)
    return
  }
  
  await pool.query('UPDATE user_pets SET pet_type = $1, updated_at = NOW() WHERE user_id = $2', [petType, userId])
  
  ctx.body = success({ petType, pet: PETS[petType] })
})

// 获取所有宠物及解锁状态
router.get('/all/:userId', async (ctx) => {
  const { userId } = ctx.params
  
  const petResult = await pool.query('SELECT intimacy FROM user_pets WHERE user_id = $1', [userId])
  const intimacy = petResult.rows[0]?.intimacy || 0
  
  const petsWithStatus = Object.entries(PETS).map(([type, config]) => ({
    type,
    ...config,
    unlocked: intimacy >= config.unlock
  }))
  
  ctx.body = success(petsWithStatus)
})

export default router
