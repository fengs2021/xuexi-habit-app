<template>
  <div class="wrong-page">
    <van-nav-bar title="📝 错题本" />

    <!-- 筛选 -->
    <van-tabs v-model:active="filterMastered" @change="loadWrongQuestions">
      <van-tab title="全部" name="" />
      <van-tab title="未掌握" name="false" />
      <van-tab title="已掌握" name="true" />
    </van-tabs>

    <!-- 错题列表 -->
    <div class="wrong-list" v-if="wrongList.length > 0">
      <div
        v-for="w in wrongList"
        :key="w.id"
        class="wrong-card"
      >
        <div class="wrong-header">
          <span class="subject-tag">{{ w.subject_icon }} {{ w.subject_name }}</span>
          <van-tag :type="w.mastered ? 'success' : 'danger'">
            {{ w.mastered ? '✓ 已掌握' : '✗ 未掌握' }}
          </van-tag>
        </div>
        <div class="wrong-content">{{ w.content }}</div>
        <div class="wrong-meta">
          做错 {{ w.times_wrong }} 次 · 复习 {{ w.times_reviewed }} 次
        </div>
        <div class="wrong-actions">
          <van-button size="small" type="primary" plain @click="toggleMaster(w)">
            {{ w.mastered ? '取消掌握' : '标记掌握' }}
          </van-button>
        </div>
      </div>
    </div>

    <van-empty v-else description="太棒了！暂无错题 🎉" />

    <!-- 底部复习入口 -->
    <div class="review-bar" v-if="wrongList.length > 0">
      <van-button type="primary" block @click="$router.push('/study/practice?mode=wrong')">
        🔄 复习错题
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { getWrongQuestions, updateWrongQuestion, removeWrongQuestion } from '@/api/study'

const wrongList = ref([])
const filterMastered = ref('')

const loadWrongQuestions = async () => {
  try {
    const params = {}
    if (filterMastered.value !== '') {
      params.mastered = filterMastered.value
    }
    const res = await getWrongQuestions(params)
    wrongList.value = res.data || []
  } catch (e) {
    showToast('加载失败')
  }
}

const toggleMaster = async (w) => {
  try {
    await updateWrongQuestion(w.id, { mastered: !w.mastered })
    loadWrongQuestions()
  } catch (e) {
    showToast('操作失败')
  }
}

onMounted(() => {
  loadWrongQuestions()
})
</script>

<style scoped>
.wrong-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.wrong-list {
  padding: 12px;
}

.wrong-card {
  background: white;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.wrong-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.subject-tag {
  font-size: 13px;
  color: #666;
}

.wrong-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
}

.wrong-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.review-bar {
  position: fixed;
  bottom: 60px;
  left: 16px;
  right: 16px;
}
</style>
