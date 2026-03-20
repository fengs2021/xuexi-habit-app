<template>
  <div class="exchange-page">
    <div class="page-header"><h2>🎁 兑换管理</h2></div>
    <div class="user-header"><div class="avatar">{{ currentChild?.nickname?.[0] || '?' }}</div><div class="info"><div class="name">{{ currentChild?.nickname }}</div><div class="stars">⭐ {{ currentChild?.stars || 0 }} 星星</div></div></div>
    <div class="section" v-if="isParent"><h3>⏳ 待审批</h3>
      <div v-for="item in pendingList" :key="item.id" class="pending-card"><div class="pending-info"><div class="child-name">{{ item.childNickname || item.child_nickname }}</div><div class="reward-name">{{ item.rewardTitle || item.reward_title }}</div><div class="stars-cost">⭐ {{ item.starsSpent || item.stars_spent }}</div></div><div class="pending-actions"><van-button size="small" type="success" @click="onApprove(item)">批准</van-button><van-button size="small" type="danger" plain @click="onReject(item)">拒绝</van-button></div></div>
      <van-empty v-if="pendingList.length === 0" description="暂无待审批" />
    </div>
    <div class="section"><h3>🎁 可兑换奖励</h3>
      <div v-for="reward in rewards" :key="reward.id" class="reward-card"><div class="reward-info"><div class="reward-title">{{ reward.title }}</div><div class="reward-cost">⭐ {{ reward.starCost || reward.star_cost }}</div></div><van-tag :type="reward.rarity === 'legend' ? 'warning' : reward.rarity === 'epic' ? 'primary' : 'default'">{{ rewardRarityMap[reward.rarity] || reward.rarity }}</van-tag></div>
      <van-empty v-if="rewards.length === 0" description="暂无奖励" />
    </div>
    <van-tabbar v-model="tabbarActive" fixed placeholder safe-area-inset-bottom>
      <van-tabbar-item name="home" icon="home-o" to="/home">主页</van-tabbar-item>
      <van-tabbar-item name="exchange" icon="gift-o" to="/exchange">兑换</van-tabbar-item>
      <van-tabbar-item name="manage" icon="setting-o" to="/manage">管理</van-tabbar-item>
    </van-tabbar>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '../stores/user'
import { getRewards, getPendingExchanges, approveExchange } from '../api/reward'
const userStore = useUserStore()
const tabbarActive = ref('exchange'), pendingList = ref([]), rewards = ref([])
const currentChild = computed(() => userStore.currentChild)
const isParent = computed(() => userStore.isParent)
const rewardRarityMap = { normal: '普通', epic: '史诗', legend: '传说' }
onMounted(async () => { await userStore.fetchUserInfo(); await userStore.fetchFamily(); await loadData() })
async function loadData() { try { const [r, p] = await Promise.all([getRewards(), isParent.value ? getPendingExchanges() : Promise.resolve({ data: [] })]); rewards.value = r.data || []; pendingList.value = p.data || [] } catch (e) { console.error(e) } }
async function onApprove(item) { try { await approveExchange(item.id, { comment: '批准' }); showSuccessToast('已批准'); await loadData() } catch (e) { showFailToast(e.message || '失败') } }
async function onReject(item) { try { await approveExchange(item.id, { comment: '拒绝' }); showSuccessToast('已拒绝'); await loadData() } catch (e) { showFailToast(e.message || '失败') } }
</script>
<style scoped>
.exchange-page { min-height: 100vh; background: #fff0f3; padding-bottom: 60px; }
.page-header { padding: 16px; background: #fff; }
.page-header h2 { font-size: 18px; color: #333; }
.user-header { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; margin: 8px 0; }
.avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #ff6b9d 0%, #ff9a6c 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; font-weight: bold; }
.info .name { font-size: 16px; font-weight: 600; color: #333; }
.info .stars { font-size: 14px; color: #ffc107; }
.section { padding: 12px; }
.section h3 { font-size: 16px; color: #333; margin-bottom: 12px; }
.pending-card { background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
.child-name { font-size: 12px; color: #666; }
.reward-name { font-size: 16px; font-weight: 600; color: #333; margin: 4px 0; }
.stars-cost { font-size: 14px; color: #ffc107; }
.pending-actions { display: flex; gap: 8px; }
.reward-card { background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
.reward-title { font-size: 14px; font-weight: 600; color: #333; }
.reward-cost { font-size: 12px; color: #ffc107; margin-top: 4px; }
</style>
