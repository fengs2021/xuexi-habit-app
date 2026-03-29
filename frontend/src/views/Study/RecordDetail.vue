<template>
  <div class="record-detail-page">
    <van-nav-bar title="学习记录详情" left-text="返回" left-arrow @click-left="$router.back()" />

    <van-loading v-if="loading" class="loading" />
    
    <div v-else-if="record" class="content">
      <!-- 基本信息 -->
      <van-cell-group inset>
        <van-cell title="科目" :value="record.subject_name || record.subjectId" />
        <van-cell title="日期" :value="record.record_date" />
        <van-cell title="状态">
          <van-tag :type="record.status === 'approved' ? 'success' : record.status === 'pending' ? 'warning' : 'default'">
            {{ statusText }}
          </van-tag>
        </van-cell>
        <van-cell v-if="record.user_nickname" title="学生" :value="record.user_nickname" />
      </van-cell-group>

      <!-- 备注 -->
      <div v-if="record.notes" class="notes-section">
        <div class="section-title">备注</div>
        <van-cell-group inset>
          <van-cell :label="record.notes" />
        </van-cell-group>
      </div>

      <!-- 照片 -->
      <div v-if="photos.length > 0" class="photos-section">
        <div class="section-title">试卷照片</div>
        <div class="photos-grid">
          <van-image
            v-for="(photo, idx) in photos"
            :key="idx"
            :src="photo"
            fit="cover"
            radius="8px"
            @click="previewImage(idx)"
          />
        </div>
      </div>

      <!-- 关联题目 -->
      <div v-if="questions.length > 0" class="questions-section">
        <div class="section-title">识别题目 ({{ questions.length }}道)</div>
        <van-cell-group inset>
          <van-cell
            v-for="q in questions"
            :key="q.id"
            :title="`${q.question_no}. ${q.content}`"
            :label="q.correct_answer ? '答案: ' + q.correct_answer : ''"
            size="small"
          />
        </van-cell-group>
      </div>

      <!-- 审核信息 -->
      <van-cell-group v-if="record.status !== 'pending'" inset class="approval-section">
        <van-cell title="审核结果">
          <van-tag :type="record.status === 'approved' ? 'success' : 'danger'">
            {{ record.status === 'approved' ? '已通过' : '已拒绝' }}
          </van-tag>
        </van-cell>
        <van-cell v-if="record.review_note" title="审核备注" :value="record.review_note" />
      </van-cell-group>

      <!-- 操作按钮 -->
      <div v-if="record.status === 'pending' && userStore.isAdmin" class="action-buttons">
        <van-button type="success" block @click="approve">✅ 通过</van-button>
        <van-button type="danger" plain block @click="reject">❌ 拒绝</van-button>
      </div>
    </div>

    <van-empty v-else description="记录不存在" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast, ImagePreview } from 'vant'
import { getRecord, updateRecord } from '@/api/study'
import { useUserStore } from '@/store/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const record = ref(null)
const questions = ref([])

const statusText = computed(() => {
  switch (record.value?.status) {
    case 'pending': return '待审核'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return '未知'
  }
})

const photos = computed(() => {
  if (!record.value?.photos) return []
  return record.value.photos.split(',').filter(p => p.trim())
})

const loadRecord = async () => {
  try {
    loading.value = true
    const id = route.params.id
    const data = await getRecord(id)
    record.value = data
    
    // 如果有题目ID，加载题目详情
    if (data.question_ids) {
      // 可以在这里加载题目详情
    }
  } catch (e) {
    showToast('加载失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

const previewImage = (index) => {
  ImagePreview({
    images: photos.value,
    startPosition: index
  })
}

const approve = async () => {
  try {
    await updateRecord(record.value.id, { status: 'approved' })
    showSuccessToast('已通过')
    record.value.status = 'approved'
  } catch (e) {
    showFailToast('操作失败')
  }
}

const reject = async () => {
  try {
    await updateRecord(record.value.id, { status: 'rejected' })
    showSuccessToast('已拒绝')
    record.value.status = 'rejected'
  } catch (e) {
    showFailToast('操作失败')
  }
}

onMounted(() => {
  loadRecord()
})
</script>

<style scoped>
.record-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.content {
  padding: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #666;
  margin: 12px 0 8px 8px;
}

.notes-section {
  margin-top: 12px;
}

.photos-section {
  margin-top: 12px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 8px;
}

.questions-section {
  margin-top: 12px;
}

.approval-section {
  margin-top: 12px;
}

.action-buttons {
  margin-top: 20px;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
