<template>
  <div class="add-record-page">
    <van-nav-bar title="添加学习记录" left-text="返回" left-arrow @click-left="$router.back()" />

    <div class="form-content">
      <!-- 科目选择 -->
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="formData.subjectName"
            label="科目"
            placeholder="请选择科目"
            readonly
            @click="showSubjectPicker = true"
            :rules="[{ required: true, message: '请选择科目' }]"
          />
          <van-field
            v-model="formData.recordDate"
            label="日期"
            type="date"
            placeholder="选择日期"
            @click="showDatePicker = true"
          />
          <van-field
            v-model="formData.notes"
            label="备注"
            type="textarea"
            placeholder="添加备注（可选）"
            rows="2"
            autosize
          />
        </van-cell-group>

        <!-- 照片上传 -->
        <div class="photo-section">
          <div class="section-title">📷 试卷照片</div>
          <van-uploader
            v-model="formData.photos"
            :max-count="9"
            :after-read="afterRead"
            multiple
            capture="camera"
          >
            <div class="upload-btn">
              <van-icon name="plus" size="32" />
              <span>点击拍照</span>
            </div>
          </van-uploader>
        </div>

        <!-- OCR 按钮 -->
        <div class="ocr-section" v-if="formData.photos.length > 0">
          <van-button type="warning" block :loading="ocrLoading" @click="doOcr">
            🔮 AI 一键识别题目
          </van-button>
          <div class="ocr-tip">上传试卷照片，AI自动识别题目并生成答案</div>
        </div>

        <!-- 识别结果 -->
        <div class="result-section" v-if="ocrResult.length > 0">
          <div class="section-title">✨ 识别结果 ({{ ocrResult.length }} 题)</div>
          <div
            v-for="(q, idx) in ocrResult"
            :key="idx"
            class="question-item"
          >
            <div class="q-header">
              <span class="q-no">第{{ q.question_no }}题</span>
              <van-tag type="primary">{{ getTypeName(q.question_type) }}</van-tag>
            </div>
            <div class="q-content">{{ q.content }}</div>
            <div class="q-answer" v-if="q.ai_answer">
              🤖 AI答案: {{ q.ai_answer }}
            </div>
            <div class="q-correct">
              <span>✓ 正确答案:</span>
              <input v-model="q.correct_answer" placeholder="请输入正确答案" class="answer-input" />
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="submit-section" v-if="formData.photos.length > 0">
          <van-button
            v-if="ocrResult.length > 0"
            type="primary"
            block
            :loading="submitLoading"
            @click="submitWithQuestions"
          >
            保存题目到题库 ({{ ocrResult.length }}题)
          </van-button>
          <van-button v-else type="primary" block :loading="submitLoading" @click="onSubmit">
            仅保存记录（稍后添加题目）
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 科目选择器 -->
    <van-popup v-model:show="showSubjectPicker" position="bottom">
      <van-picker
        :columns="subjectColumns"
        @confirm="onSubjectConfirm"
        @cancel="showSubjectPicker = false"
      />
    </van-popup>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="currentDate"
        :min-date="minDate"
        :max-date="new Date()"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getSubjects, createRecord, createRecordWithPhotos, ocrIdentify, batchCreateQuestions } from '@/api/study'

const router = useRouter()

const formData = ref({
  subjectId: '',
  subjectName: '',
  recordDate: new Date().toISOString().split('T')[0],
  notes: '',
  photos: []
})

const subjects = ref([])
const showSubjectPicker = ref(false)
const showDatePicker = ref(false)
const currentDate = ref(['2026', '03', '29'])
const minDate = new Date(2020, 0, 1)
const ocrLoading = ref(false)
const submitLoading = ref(false)
const ocrResult = ref([])

const subjectColumns = computed(() =>
  subjects.value.map(s => ({ text: s.icon + ' ' + s.name, value: s.id }))
)

const loadSubjects = async () => {
  try {
    const res = await getSubjects()
    subjects.value = res.data || []
  } catch (e) {
    console.error('加载科目失败:', e)
  }
}

const onSubjectConfirm = ({ selectedOptions }) => {
  formData.value.subjectId = selectedOptions[0].value
  formData.value.subjectName = selectedOptions[0].text
  showSubjectPicker.value = false
}

const onDateConfirm = ({ selectedValues }) => {
  formData.value.recordDate = selectedValues.join('-')
  showDatePicker.value = false
}

const afterRead = (file) => {
  // 文件读取完成后的回调
  console.log('文件已选择:', file.file.name)
}

const getTypeName = (type) => {
  const map = {
    choice: '选择题',
    truefalse: '判断题',
    fill: '填空题',
    blank: '简答题',
    application: '应用题'
  }
  return map[type] || '题目'
}

const doOcr = async () => {
  if (!formData.value.subjectId) {
    showToast('请先选择科目')
    return
  }
  if (formData.value.photos.length === 0) {
    showToast('请先上传试卷照片')
    return
  }

  ocrLoading.value = true
  try {
    const photoPaths = formData.value.photos.map(p => p.url || p.content)
    const res = await ocrIdentify({
      subject_id: formData.value.subjectId,
      photos: photoPaths
    })
    if (res.data && res.data.questions) {
      ocrResult.value = res.data.questions
      showSuccessToast('识别完成！请核对答案并校正')
    } else {
      showToast(res.data?.message || 'OCR功能待实现')
    }
  } catch (e) {
    showToast('识别失败，请重试')
    console.error('OCR失败:', e)
  } finally {
    ocrLoading.value = false
  }
}

const onSubmit = async () => {
  if (!formData.value.subjectId) {
    showToast('请选择科目')
    return
  }

  submitLoading.value = true
  try {
    const photoUrls = formData.value.photos
      .filter(p => p.url)
      .map(p => p.url)

    await createRecord({
      subject_id: formData.value.subjectId,
      record_date: formData.value.recordDate,
      notes: formData.value.notes,
      photos: photoUrls
    })

    showSuccessToast('保存成功')
    router.push('/study')
  } catch (e) {
    showToast('保存失败')
    console.error('保存失败:', e)
  } finally {
    submitLoading.value = false
  }
}

const submitWithQuestions = async () => {
  if (ocrResult.value.length === 0) {
    showToast('请先识别题目')
    return
  }

  submitLoading.value = true
  try {
    // 先创建记录
    const photoUrls = formData.value.photos
      .filter(p => p.url)
      .map(p => p.url)

    const recordRes = await createRecord({
      subject_id: formData.value.subjectId,
      record_date: formData.value.recordDate,
      notes: formData.value.notes,
      photos: photoUrls
    })

    const recordId = recordRes.data?.id

    // 批量创建题目
    await batchCreateQuestions({
      record_id: recordId,
      questions: ocrResult.value.map(q => ({
        subject_id: formData.value.subjectId,
        question_no: q.question_no,
        question_type: q.question_type,
        content: q.content,
        options: q.options,
        ai_answer: q.ai_answer,
        correct_answer: q.correct_answer
      }))
    })

    showSuccessToast('保存成功！' + ocrResult.value.length + '道题目已入库')
    router.push('/study')
  } catch (e) {
    showToast('保存失败')
    console.error('保存失败:', e)
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadSubjects()
  // 初始化日期
  const now = new Date()
  currentDate.value = [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ]
})
</script>

<style scoped>
.add-record-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.form-content {
  padding: 16px;
}

.photo-section,
.ocr-section,
.result-section {
  margin-top: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.upload-btn {
  width: 80px;
  height: 80px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.ocr-tip {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}

.question-item {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
}

.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.q-no {
  font-weight: bold;
  color: #333;
}

.q-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

.q-answer {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.q-correct {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #07c160;
}

.answer-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
}

.submit-section {
  margin-top: 20px;
}
</style>
