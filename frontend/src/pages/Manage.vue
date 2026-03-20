<template>
  <div class="manage-page">
    <div class="page-header"><h2>⚙️ 管理</h2><div class="user-info"><span>{{ userStore.userInfo?.nickname }}</span><van-button size="small" @click="onLogout">退出</van-button></div></div>
    <div class="section"><div class="section-header"><h3>📋 任务管理</h3><van-button size="small" type="primary" @click="showTaskPopup = true">新增任务</van-button></div>
      <div v-for="task in tasks" :key="task.id" class="item-card"><div class="item-info"><span class="item-title">{{ task.title }}</span><span class="item-reward">⭐{{ task.starReward || task.star_reward }}</span></div><van-tag :type="rarityType[task.rarity] || 'default'">{{ task.rarity }}</van-tag></div>
      <van-empty v-if="tasks.length === 0" description="暂无任务" />
    </div>
    <div class="section"><div class="section-header"><h3>🎁 奖励管理</h3><van-button size="small" type="primary" @click="showRewardPopup = true">新增奖励</van-button></div>
      <div v-for="reward in rewards" :key="reward.id" class="item-card"><div class="item-info"><span class="item-title">{{ reward.title }}</span><span class="item-reward">⭐{{ reward.starCost || reward.star_cost }}</span></div><van-tag :type="rewardRarityType[reward.rarity] || 'default'">{{ rewardRarityMap[reward.rarity] }}</van-tag></div>
      <van-empty v-if="rewards.length === 0" description="暂无奖励" />
    </div>
    <van-popup v-model:show="showTaskPopup" position="bottom" round style="height: 60%"><div class="popup-content"><h3>新增任务</h3>
      <van-form @submit="onCreateTask"><van-cell-group inset><van-field v-model="taskForm.title" label="任务名称" placeholder="请输入任务名称" :rules="[{ required: true }]" /><van-field name="starReward" label="奖励星星"><template #input><van-stepper v-model="taskForm.starReward" min="1" max="10" /></template></van-field><van-field name="rarity" label="稀有度"><template #input><van-radio-group v-model="taskForm.rarity" direction="horizontal"><van-radio name="N">N</van-radio><van-radio name="R">R</van-radio><van-radio name="SR">SR</van-radio><van-radio name="SSR">SSR</van-radio></van-radio-group></template></van-field></van-cell-group><div class="popup-actions"><van-button round block type="primary" native-type="submit">创建</van-button></div></van-form></div></van-popup>
    <van-popup v-model:show="showRewardPopup" position="bottom" round style="height: 60%"><div class="popup-content"><h3>新增奖励</h3>
      <van-form @submit="onCreateReward"><van-cell-group inset><van-field v-model="rewardForm.title" label="奖励名称" placeholder="请输入奖励名称" :rules="[{ required: true }]" /><van-field name="starCost" label="所需星星"><template #input><van-stepper v-model="rewardForm.starCost" min="1" max="1000" /></template></van-field><van-field name="rarity" label="稀有度"><template #input><van-radio-group v-model="rewardForm.rarity" direction="horizontal"><van-radio name="normal">普通</van-radio><van-radio name="epic">史诗</van-radio><van-radio name="legend">传说</van-radio></van-radio-group></template></van-field></van-cell-group><div class="popup-actions"><van-button round block type="primary" native-type="submit">创建</van-button></div></van-form></div></van-popup>
    <van-tabbar v-model="tabbarActive" fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item name="home" icon="home-o" to="/home">主页</van-tabbar-item>
      <van-tabbar-item name="exchange" icon="gift-o" to="/exchange">兑换</van-tabbar-item>
      <van-tabbar-item name="manage" icon="setting-o" to="/manage">管理</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { useUserStore } from '../stores/user'
import { getTasks, createTask } from '../api/task'
import { getRewards, createReward } from '../api/reward'
const router = useRouter()
const userStore = useUserStore()
const tabbarActive = ref('manage')
const tasks = ref([]), rewards = ref([]), showTaskPopup = ref(false), showRewardPopup = ref(false)
const taskForm = reactive({ title: '', starReward: 2, rarity: 'N' })
const rewardForm = reactive({ title: '', starCost: 30, rarity: 'normal' })
const rarityType = { N: 'default', R: 'primary', SR: 'warning', SSR: 'danger' }
const rewardRarityMap = { normal: '普通', epic: '史诗', legend: '传说' }
const rewardRarityType = { normal: 'default', epic: 'primary', legend: 'warning' }
onMounted(async () => { await userStore.fetchUserInfo(); await loadData() })
async function loadData() { try { const [t, r] = await Promise.all([getTasks(), getRewards()]); tasks.value = t.data || []; rewards.value = r.data || [] } catch (e) { console.error(e) } }
async function onCreateTask() { if (!taskForm.title.trim()) { showToast('请输入任务名称'); return } try { await createTask(taskForm); showSuccessToast('创建成功'); showTaskPopup.value = false; taskForm.title = ''; taskForm.starReward = 2; taskForm.rarity = 'N'; await loadData() } catch (e) { showToast(e.message || '失败') } }
async function onCreateReward() { if (!rewardForm.title.trim()) { showToast('请输入奖励名称'); return } try { await createReward(rewardForm); showSuccessToast('创建成功'); showRewardPopup.value = false; rewardForm.title = ''; rewardForm.starCost = 30; rewardForm.rarity = 'normal'; await loadData() } catch (e) { showToast(e.message || '失败') } }
function onLogout() { userStore.logout(); router.replace('/login') }
</script>
<style scoped>
.manage-page { min-height: 100vh; background: #fff0f3; padding-bottom: 60px; }
.page-header { padding: 16px; background: #fff; display: flex; justify-content: space-between; align-items: center; }
.page-header h2 { font-size: 18px; color: #333; }
.user-info { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #666; }
.section { padding: 12px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-header h3 { font-size: 16px; color: #333; }
.item-card { background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.item-title { font-size: 14px; font-weight: 600; color: #333; }
.item-reward { font-size: 12px; color: #ffc107; margin-left: 8px; }
.item-info { display: flex; align-items: center; }
.popup-content { padding: 24px; }
.popup-content h3 { text-align: center; margin-bottom: 24px; font-size: 18px; color: #333; }
.popup-actions { margin-top: 24px; padding: 0 16px; }
</style>
