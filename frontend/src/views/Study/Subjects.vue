<template>
  <div class="subjects-page">
    <van-nav-bar title="科目管理" left-text="返回" left-arrow @click-left="$router.back()" />

    <div class="subject-list">
      <van-cell-group inset>
        <van-cell
          v-for="s in subjects"
          :key="s.id"
          :title="s.icon + ' ' + s.name"
          :value="s.color"
          is-link
          @click="editSubject(s)"
        >
          <template #value>
            <van-tag :color="s.color">{{ s.name }}</van-tag>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <van-empty v-if="subjects.length === 0" description="暂无科目" />

    <van-button type="primary" block class="add-btn" @click="showAdd = true">
      + 添加科目
    </van-button>

    <!-- 添加/编辑弹窗 -->
    <van-dialog v-model:show="showAdd" title="科目" show-cancel-button close-on-click-overlay @confirm="saveSubject">
      <van-form>
        <van-cell-group inset>
          <van-field v-model="editing.name" label="科目名称" placeholder="如：数学" />
          <van-field v-model="editing.icon" label="图标" placeholder="emoji，如 📐">
            <template #button>
              <van-button size="small" type="primary" @click="showEmojiPicker = true">选择</van-button>
            </template>
          </van-field>
          <van-field v-model="editing.color" label="颜色" type="color" />
        </van-cell-group>
      </van-form>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/api/study'

const subjects = ref([])
const showAdd = ref(false)
const showEmojiPicker = ref(false)
const editing = ref({ id: '', name: '', icon: '📚', color: '#4A90D9' })

const defaultColors = ['#4A90D9', '#07c160', '#ff976a', '#7232dd', '#ee0a24', '#1989fa']

const loadSubjects = async () => {
  console.log('[DEBUG] loadSubjects called')
  try {
    console.log('[DEBUG] calling getSubjects API')
    const data = await getSubjects()
    console.log('[DEBUG] getSubjects response:', data)
    subjects.value = data || []
    console.log('[DEBUG] subjects.value:', subjects.value)
  } catch (e) {
    console.error('[DEBUG] loadSubjects error:', e)
    showToast('加载失败')
  }
}

const editSubject = (s) => {
  editing.value = { id: s.id, name: s.name, icon: s.icon, color: s.color }
  showAdd.value = true
}

const saveSubject = async () => {
  if (!editing.value.name.trim()) {
    showToast('请输入科目名称')
    return
  }
  try {
    if (editing.value.id) {
      await updateSubject(editing.value.id, editing.value)
    } else {
      await createSubject(editing.value)
    }
    showSuccessToast('保存成功')
    loadSubjects()
  } catch (e) {
    showToast(editing.value.id ? '更新失败' : '创建失败')
  }
}

onMounted(() => {
  loadSubjects()
})
</script>

<style scoped>
.subjects-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.subject-list {
  padding: 12px;
}

.add-btn {
  position: fixed;
  bottom: 60px;
  left: 16px;
  right: 16px;
}
</style>
