<template>
  <div class="empty-state">
    <van-icon name="info-o" size="48" color="#ccc" />
    <p>{{ description || '暂无数据' }}</p>
  </div>
</template>

<script setup>
defineProps({
  description: String
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
}
.empty-state .van-icon {
  margin-bottom: 12px;
}
</style>
