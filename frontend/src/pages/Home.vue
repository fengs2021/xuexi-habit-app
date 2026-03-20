<template>
  <div class="home-page">
    <div class="user-header">
      <div class="user-info">
        <div class="avatar">{{ currentChild?.nickname?.[0] || '?' }}</div>
        <div class="info"><div class="name">{{ currentChild?.nickname || '加载中' }}</div><div class="stars">⭐ {{ currentChild?.stars || 0 }}</div></div>
      </div>
      <van-tag type="primary" size="large">Lv.{{ currentChild?.level || 1 }}</van-tag>
    </div>
    <van-tabs v-model:active="activeTab" sticky offset-top="50">
      <van-tab title="🎯 任务" name="task">
        <div class="task-list">
          <div v-for="task in tasks" :key="task.id" class="task-card" :class="'rarity-' + task.rarity">
            <div class="task-top"><span class="stars">⭐{{ task.starReward || task.star_reward }}</span><span class="rarity-tag">{{ rarityMap[task.rarity] || task.rarity }}</span></div>
            <div class="task-title">{{ task.title }}</div>
            <div class="task-actions"><van-button size="small" type="success" @click="onComplete(task)">完成</van-button><van-button size="small" @click="onSkip(task)">跳过</van-button></div>
          </div>
          <van-empty v-if="tasks.length === 0" description="暂无任务" />
        </div>
      </van-tab>
      <van-tab title="🎁 奖励" name="reward">
        <div class="reward-list">
          <div v-for="reward in rewards" :key="reward.id" class="reward-card" :class="'rarity-' + reward.rarity">
            <div class="reward-top"><span class="cost">⭐{{ reward.starCost || reward.star_cost }}</span><span class="rarity-tag">{{ rewardRarityMap[reward.rarity] || reward.rarity }}</span></div>
            <div class="reward-title">{{ reward.title }}</div>
            <van-button size="small" type="primary" :disabled="(currentChild?.stars || 0) < (reward.starCost || reward.star_cost)" @click="onExchange(reward)">兑换</van-button>
          </div>
          <van-empty v-if="rewards.length === 0" description="暂无奖励" />
        </div>
      </van-tab>
    </van-tabs>
    <van-tabbar v-model="tabbarActive" fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item name="home" icon="home-o" to="/home">主页</van-tabbar-item>
      <van-tabbar-item name="exchange" icon="gift-o" to="/exchange">兑换</van-tabbar-item>
      <van-tabbar-item name="manage" icon="setting-o" to="/manage">管理</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useUserStore } from '../stores/user'
import { getTasks, completeTask, skipTask } from '../api/task'
import { getRewards, createExchange } from '../api/reward'
const userStore = useUserStore()
const activeTab = ref('task'), tabbarActive = ref('home'), tasks = ref([]), rewards = ref([])
const currentChild = computed(() => userStore.currentChild)
const rarityMap = { N: 'N', R: 'R', SR: 'SR', SSR: 'SSR' }
const rewardRarityMap = { normal: '普通', epic: '史诗', legend: '传说' }
onMounted(async () => { await userStore.fetchUserInfo(); await userStore.fetchFamily(); await loadData() })
async function loadData() { try { const [t, r] = await Promise.all([getTasks(), getRewards()]); tasks.value = t.data || []; rewards.value = r.data || [] } catch (e) { console.error(e) } }
async function onComplete(task) { try { const res = await completeTask(task.id); showSuccessToast('获得 ' + res.data.starsEarned + ' 星星'); await loadData(); await userStore.fetchFamily() } catch (e) { showToast(e.message || '失败') } }
async function onSkip(task) { try { await skipTask(task.id); showToast('已跳过'); tasks.value = tasks.value.filter(t => t.id !== task.id) } catch (e) { showToast(e.message || '失败') } }
async function onExchange(reward) { try { await createExchange({ rewardId: reward.id }); showSuccessToast('兑换成功！等待审批'); await loadData() } catch (e) { showToast(e.message || '失败') } }
</script>
<style scoped>
.home-page { min-height: 100vh; background: #fff0f3; padding-bottom: 60px; }
.user-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: #fff; margin-bottom: 8px; }
.user-info { display: flex; align-items: center; gap: 12px; }
.avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; font-weight: bold; }
.info .name { font-size: 16px; font-weight: 600; color: #333; }
.info .stars { font-size: 14px; color: #ffc107; }
.task-list, .reward-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px; }
.task-card, .reward-card { background: #fff; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.task-top, .reward-top { display: flex; justify-content: space-between; align-items: center; }
.stars, .cost { font-size: 14px; font-weight: bold; color: #ffc107; }
.rarity-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.rarity-N .rarity-tag, .rarity-normal .rarity-tag { background: #e5e7eb; color: #666; }
.rarity-R .rarity-tag { background: #3b82f6; color: #fff; }
.rarity-SR .rarity-tag, .rarity-epic .rarity-tag { background: #a855f7; color: #fff; }
.rarity-SSR .rarity-tag, .rarity-legend .rarity-tag { background: #f59e0b; color: #fff; }
.task-title, .reward-title { font-size: 14px; font-weight: 600; color: #333; }
.task-actions { display: flex; gap: 8px; }
</style>
