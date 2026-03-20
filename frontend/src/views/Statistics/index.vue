<template>
  <div class="statistics-page">
    <el-card>
      <template #header>
        <span>数据统计</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="12">
          <div ref="chartRef" style="width: 100%; height: 300px;"></div>
        </el-col>
        <el-col :span="12">
          <div class="stats-info">
            <h3>累计数据</h3>
            <div class="stat-item">
              <span class="label">完成任务数</span>
              <span class="value">{{ stats.totalTasks }} 次</span>
            </div>
            <div class="stat-item">
              <span class="label">获得星星</span>
              <span class="value">{{ stats.totalStars }} ⭐</span>
            </div>
            <div class="stat-item">
              <span class="label">兑换奖励数</span>
              <span class="value">{{ stats.totalExchanges }} 次</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref()
const stats = reactive({ totalTasks: 0, totalStars: 0, totalExchanges: 0 })

onMounted(() => {
  initChart()
})

function initChart() {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  const option = {
    title: { text: '本周任务完成情况', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [{
      data: [12, 15, 10, 18, 20, 15, 10],
      type: 'line',
      areaStyle: { color: '#409EFF' },
      lineStyle: { color: '#409EFF' }
    }]
  }
  chart.setOption(option)
}
</script>

<style scoped>
.stats-info h3 { margin-bottom: 20px; }
.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.stat-item .label { color: #909399; }
.stat-item .value { font-weight: bold; color: #409EFF; }
</style>
