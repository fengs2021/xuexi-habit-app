<template>
  <div class="statistics-page">
    <van-cell-group inset title="近30日积分获取统计">
      <van-cell v-for="item in dailyStats" :key="item.date">
        <template #title>
          <div class="stat-item">
            <span class="date">{{ item.date }}</span>
            <van-progress :percentage="getPercentage(item.stars)" :color="getColor(item.stars)" :show-pivot="false" class="stat-progress" />
          </div>
        </template>
        <template #right-icon>
          <span class="stars">+{{ item.stars }} ★</span>
        </template>
      </van-cell>
      <van-empty v-if="dailyStats.length === 0 && !loading" description="暂无数据" />
      <van-loading v-if="loading" style="text-align: center; padding: 20px;" />
    </van-cell-group>

    <van-cell-group inset title="汇总" class="summary-group">
      <van-cell title="总获得积分" :value="totalStars + ' ★'" />
      <van-cell title="日均积分" :value="avgStars + ' ★'" />
      <van-cell title="最高单日" :value="maxStars + ' ★'" />
    </van-cell-group>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { getDailyStars } from '@/api/statistics'
import { showToast } from 'vant'

const userStore = useUserStore()
const dailyStats = ref([])
const loading = ref(true)

const totalStars = computed(() => dailyStats.value.reduce((sum, item) => sum + item.stars, 0))
const avgStars = computed(() => dailyStats.value.length === 0 ? 0 : Math.round(totalStars.value / dailyStats.value.length))
const maxStars = computed(() => dailyStats.value.length === 0 ? 0 : Math.max(...dailyStats.value.map(item => item.stars)))
const getPercentage = (stars) => maxStars.value === 0 ? 0 : Math.round((stars / (maxStars.value * 1.5)) * 100)
const getColor = (stars) => {
  if (stars >= avgStars.value * 1.5) return '#07c160'
  if (stars >= avgStars.value) return '#1989fa'
  if (stars >= avgStars.value * 0.5) return '#ff976a'
  return '#999'
}

const loadStats = async () => {
  // Wait for userStore to be ready
  let attempts = 0
  while (!userStore.userInfo?.id && attempts < 10) {
    await new Promise(resolve => setTimeout(resolve, 200))
    attempts++
  }
  
  if (!userStore.userInfo?.id) {
    showToast('未登录')
    loading.value = false
    return
  }
  
  try {
    const data = await getDailyStars(userStore.userInfo.id)
    dailyStats.value = data || []
  } catch (error) {
    console.error('loadStats error:', error)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>
<style scoped>
.statistics-page { padding-bottom: 20px; }
.stat-item { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.date { font-size: 13px; color: #666; }
.stat-progress { width: 100%; }
.stars { font-weight: bold; color: #ff976a; font-size: 14px; }
.summary-group { margin-top: 12px; }
</style>
