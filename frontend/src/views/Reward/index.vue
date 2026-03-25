<template>
  <div class="reward-page">
    
    <van-button v-if="userStore.isAdmin" type="primary" block class="add-btn" @click="showCreate = true">
      创建新奖励
    </van-button>

    <!-- 家长视图 -->
    <van-tabs v-if="userStore.isAdmin" v-model:active="activeTab">
      <van-tab title="奖励列表">
        <RewardCard
          v-for="reward in rewards"
          :key="reward.id"
          :reward="reward"
          :show-exchange="false"
          @setTarget="handleSetTarget"
          @clearTarget="handleClearTarget"
        />
        <van-empty v-if="rewards.length === 0" description="暂无奖励" />
      </van-tab>
      <van-tab title="兑换历史">
        <van-cell-group inset>
          <van-cell v-for="item in exchangeHistory" :key="item.id">
            <template #title>
              <div class="exchange-item">
                <span class="name">{{ item.user_nickname }}</span>
                <span class="action">兑换</span>
                <span class="target">{{ item.reward_title }}</span>
              </div>
            </template>
            <template #label>
              <van-tag :type="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'">
                {{ item.status === 'approved' ? '已批准' : item.status === 'rejected' ? '已拒绝' : '待审批' }}
              </van-tag>
              <span class="reward">-{{ item.stars_spent || item.star_cost }} ★</span>
              <span class="time">{{ formatDateTime(item.created_at) }}</span>
            </template>
          </van-cell>
          <van-empty v-if="exchangeHistory.length === 0" description="暂无兑换记录" />
        </van-cell-group>
      </van-tab>
    </van-tabs>

    <!-- 孩子视图 -->
    <div v-else>
      <!-- 贴纸抽奖专区 -->
      <div class="lottery-section">
        <div class="section-header">
          <span class="title">🎰 本周限定贴纸</span>
          <span class="time-range">{{ weeklyInfo.weekStart }} ~ {{ weeklyInfo.weekEnd }}</span>
        </div>
        
        <!-- 限定贴纸展示 -->
        <div class="limited-stickers" v-if="weeklyInfo.limitedStickers.length > 0">
          <div 
            v-for="sticker in weeklyInfo.limitedStickers" 
            :key="sticker.id" 
            class="limited-sticker-card"
            :class="'rarity-' + sticker.rarity"
          >
            <span class="emoji">{{ sticker.emoji }}</span>
            <span class="name">{{ sticker.name }}</span>
            <van-tag :type="getRarityTagType(sticker.rarity)" size="small">{{ sticker.rarity }}</van-tag>
          </div>
        </div>
        <van-empty v-else description="本周无限定贴纸" />
        
        <!-- 抽奖按钮和进度 -->
        <div class="lottery-controls">
          <div class="progress-info">
            <span class="draw-count">已抽 {{ lotteryProgress.drawCount }} / {{ lotteryProgress.guaranteeCount }} 次</span>
            <van-progress 
              :percentage="(lotteryProgress.drawCount / lotteryProgress.guaranteeCount) * 100" 
              :show-pivot="true"
              color="#7232dd"
            />
            <span class="tip" v-if="lotteryProgress.canGuaranteeExchange">
              🎉 已获得保底兑换资格！
            </span>
            <span class="tip" v-else-if="lotteryProgress.drawCount >= lotteryProgress.guaranteeCount">
              ⚠️ 本周期已使用保底
            </span>
            <span class="tip" v-else>
              再抽 {{ lotteryProgress.guaranteeCount - lotteryProgress.drawCount }} 次必得自选贴纸
            </span>
          </div>
          
          <van-button 
            type="primary" 
            size="large" 
            round
            class="draw-btn"
            @click="handleDraw"
            :loading="drawing"
            :disabled="lotteryProgress.drawCount >= lotteryProgress.guaranteeCount && lotteryProgress.guaranteeExchangeUsed"
          >
            🎲 消耗5★抽取贴纸
          </van-button>
          
          <van-button 
            v-if="lotteryProgress.canGuaranteeExchange" 
            type="warning" 
            size="small" 
            plain
            @click="showExchangeDialog = true"
          >
            🔄 使用保底兑换
          </van-button>
        </div>
      </div>
      
      <!-- 奖励列表 -->
      <RewardCard
        v-for="reward in rewards"
        :key="reward.id"
        :reward="reward"
        @exchange="handleExchange"
        @setTarget="handleSetTarget"
        @clearTarget="handleClearTarget"
      />
      <van-empty v-if="rewards.length === 0" description="暂无奖励" />
    </div>

    <!-- 创建奖励弹窗 -->
    <van-dialog v-model:show="showCreate" title="创建奖励" show-cancel-button @confirm="createReward">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="newReward.title" label="奖励名称" placeholder="例如：去游乐场" />
          <van-field v-model.number="newReward.starCost" label="所需星星" type="number" placeholder="输入所需星星" />
        </van-cell-group>
      </van-form>
    </van-dialog>
    
    <!-- 抽奖结果弹窗 -->
    <van-dialog v-model:show="showResultDialog" :title="resultDialogTitle" show-cancel-button @confirm="showResultDialog = false" :confirm-button-text="resultAwarded ? '太棒了！' : '继续努力'">
      <div class="result-content" v-if="drawResult">
        <div class="sticker-display" :class="'rarity-' + drawResult.sticker.rarity">
          <span class="emoji">{{ drawResult.sticker.emoji }}</span>
          <span class="name">{{ drawResult.sticker.name }}</span>
          <van-tag :type="getRarityTagType(drawResult.sticker.rarity)">{{ drawResult.sticker.rarity }}</van-tag>
        </div>
        <div class="result-info">
          <p v-if="resultAwarded" class="success">恭喜获得新贴纸！🌟</p>
          <p v-else class="duplicate">已有该贴纸，积分不予退还</p>
        </div>
      </div>
    </van-dialog>
    
    <!-- 保底兑换弹窗 -->
    <van-dialog v-model:show="showExchangeDialog" title="🎁 保底兑换 - 选择任意贴纸" confirm-button-text="确认兑换" @confirm="handleGuaranteeExchange">
      <div class="exchange-stickers">
        <div 
          v-for="sticker in exchangeOptions" 
          :key="sticker.id" 
          class="exchange-sticker"
          :class="'rarity-' + sticker.rarity + (selectedExchangeSticker === sticker.id ? ' selected' : '')"
          @click="selectedExchangeSticker = sticker.id"
        >
          <span class="emoji">{{ sticker.emoji }}</span>
          <span class="name">{{ sticker.name }}</span>
          <van-tag :type="getRarityTagType(sticker.rarity)" size="small">{{ sticker.rarity }}</van-tag>
        </div>
        <van-empty v-if="exchangeOptions.length === 0" description="本周奖池贴纸已全部获得" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getRewards, createReward as createRewardApi, createExchange, getStudentExchanges, 
         getWeeklyLimitedStickers, getLotteryProgress, drawSticker, guaranteeExchange, getExchangeOptions } from '@/api/reward'
import RewardCard from '@/components/RewardCard.vue'

import { showToast, showConfirmDialog } from 'vant'

const userStore = useUserStore()
const rewards = ref([])
const exchangeHistory = ref([])
const showCreate = ref(false)
const activeTab = ref(0)
const newReward = ref({ title: '', starCost: 30 })

// 抽奖相关
const weeklyInfo = ref({ limitedStickers: [], weekStart: '', weekEnd: '' })
const lotteryProgress = ref({ drawCount: 0, guaranteeCount: 20, canGuaranteeExchange: false, guaranteeExchangeUsed: false })
const drawing = ref(false)
const showResultDialog = ref(false)
const resultDialogTitle = ref('🎉 恭喜获得新贴纸！')
const drawResult = ref(null)
const resultAwarded = ref(false)
const showExchangeDialog = ref(false)
const exchangeOptions = ref([])
const selectedExchangeSticker = ref('')

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const formatDateTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return 
}

const getRarityTagType = (rarity) => {
  const map = { SSR: 'danger', SR: 'warning', R: 'primary', N: 'default' }
  return map[rarity] || 'default'
}

const loadRewards = async () => {
  try {
    const data = await getRewards()
    rewards.value = data || []
  } catch (error) {
    showToast('加载失败')
  }
}

const loadExchangeHistory = async () => {
  try {
    const data = await getStudentExchanges()
    exchangeHistory.value = data || []
  } catch (error) {
    showToast('加载失败')
  }
}

const loadWeeklyInfo = async () => {
  try {
    const res = await getWeeklyLimitedStickers()
    weeklyInfo.value = res
  } catch (error) {
    console.error('Load weekly info error:', error)
  }
}

const loadLotteryProgress = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const res = await getLotteryProgress(userStore.userInfo.id)
    lotteryProgress.value = res
  } catch (error) {
    console.error('Load lottery progress error:', error)
  }
}

const handleDraw = async () => {
  if (!userStore.userInfo?.id) {
    showToast('请先登录')
    return
  }
  
  const currentStars = userStore.userInfo?.stars || 0
  if (currentStars < 5) {
    showToast('积分不够，需要5积分')
    return
  }
  
  drawing.value = true
  try {
    const res = await drawSticker(userStore.userInfo.id)
    drawResult.value = res
    resultAwarded.value = res.awarded
    
    resultDialogTitle.value = res.awarded ? '🎉 恭喜获得新贴纸！' : '😅 很遗憾...'
    showResultDialog.value = true
    
    // 刷新进度和用户积分
    await loadLotteryProgress()
    await userStore.getUserInfoAction()
  } catch (error) {
    showToast(error.message || '抽奖失败')
  } finally {
    drawing.value = false
  }
}

const handleGuaranteeExchange = async () => {
  if (!selectedExchangeSticker.value) {
    showToast('请选择要兑换的贴纸')
    return
  }
  
  try {
    await guaranteeExchange(userStore.userInfo.id, selectedExchangeSticker.value)
    showToast('兑换成功！')
    showExchangeDialog.value = false
    selectedExchangeSticker.value = ''
    await loadLotteryProgress()
    await userStore.getUserInfoAction()
  } catch (error) {
    showToast(error.message || '兑换失败')
  }
}

const loadExchangeOptions = async () => {
  try {
    const res = await getExchangeOptions(userStore.userInfo.id)
    exchangeOptions.value = res || []
  } catch (error) {
    console.error('Load exchange options error:', error)
  }
}

const createReward = async () => {
  try {
    await createRewardApi(newReward.value)
    showToast('创建成功')
    showCreate.value = false
    newReward.value = { title: '', starCost: 30 }
    await loadRewards()
  } catch (error) {
    showToast('创建失败')
  }
}

const handleExchange = async (id) => {
  const reward = rewards.value.find(r => r.id === id)
  if (!reward) return
  
  const cost = reward.starCost || reward.star_cost
  const currentStars = userStore.userInfo?.stars || 0
  
  if (currentStars < cost) {
    showToast('分数不够，继续努力')
    return
  }
  
  try {
    await createExchange({ rewardId: id })
    showToast('已提交家长审批')
    await loadRewards()
  } catch (error) {
    showToast('兑换失败')
  }
}

const handleSetTarget = (reward) => {
  userStore.setTargetReward({ id: reward.id, name: reward.title, cost: reward.starCost || reward.star_cost || reward.stars })
  showToast()
}

const handleClearTarget = () => {
  userStore.clearTargetReward()
  showToast('已取消目标')
}

onMounted(() => {
  loadRewards()
  if (userStore.isAdmin) {
    loadExchangeHistory()
  } else {
    loadWeeklyInfo()
    loadLotteryProgress()
  }
})
</script>

<style scoped>
.reward-page {
  padding-bottom: 20px;
}
.add-btn {
  margin-bottom: 12px;
}

/* 抽奖专区 */
.lottery-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 16px;
  margin: 12px 16px;
  color: white;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header .title {
  font-size: 16px;
  font-weight: bold;
}

.section-header .time-range {
  font-size: 12px;
  opacity: 0.8;
}

.limited-stickers {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.limited-sticker-card {
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  min-width: 80px;
  color: #333;
}

.limited-sticker-card.rarity-SSR {
  border: 2px solid gold;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.limited-sticker-card.rarity-SR {
  border: 2px solid #9933ff;
}

.limited-sticker-card .emoji {
  font-size: 32px;
  display: block;
  margin-bottom: 4px;
}

.limited-sticker-card .name {
  font-size: 12px;
  display: block;
  margin-bottom: 4px;
}

.lottery-controls {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
}

.progress-info {
  margin-bottom: 12px;
}

.draw-count {
  font-size: 14px;
  display: block;
  margin-bottom: 6px;
}

.tip {
  font-size: 12px;
  display: block;
  margin-top: 6px;
  opacity: 0.9;
}

.draw-btn {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  border: none;
  margin-bottom: 8px;
}

/* 抽奖结果弹窗 */
.result-content {
  padding: 24px;
  text-align: center;
}

.sticker-display {
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.sticker-display.rarity-SSR {
  background: linear-gradient(135deg, #ffd700 0%, #ffec8b 100%);
}

.sticker-display.rarity-SR {
  background: linear-gradient(135deg, #9933ff 0%, #d9b3ff 100%);
}

.sticker-display .emoji {
  font-size: 64px;
  display: block;
  margin-bottom: 8px;
}

.sticker-display .name {
  font-size: 18px;
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.result-info .success {
  color: #7232dd;
  font-size: 16px;
}

.result-info .duplicate {
  color: #999;
  font-size: 14px;
}

/* 保底兑换弹窗 */
.exchange-stickers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.exchange-sticker {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  min-width: 70px;
  cursor: pointer;
  border: 2px solid transparent;
}

.exchange-sticker.selected {
  border-color: #7232dd;
  background: #ede7f6;
}

.exchange-sticker .emoji {
  font-size: 28px;
  display: block;
  margin-bottom: 4px;
}

.exchange-sticker .name {
  font-size: 11px;
  display: block;
  margin-bottom: 4px;
}

.exchange-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
.exchange-item .name {
  font-weight: bold;
}
.exchange-item .action {
  color: #666;
}
.exchange-item .target {
  color: #1989fa;
}
.exchange-item .reward {
  color: #ff976a;
  font-weight: bold;
  margin-left: 8px;
}
.exchange-item .time {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}
</style>
