/**
 * 北京时间（Asia/Shanghai）工具函数
 * 所有时间计算使用北京时间，避免浏览器本地时区差异
 */

// 获取当前北京时间
export function nowInBeijing() {
  return new Date().toLocaleString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false })
    .replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => new Date(`${y}-${m}-${d}T00:00:00+08:00`))
}

// 获取北京时间今天 0点的 Date 对象（用于周期计算）
export function getBeijingTodayStart() {
  const now = nowInBeijing()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}

// 获取北京时间本周周一 0点的 Date 对象
export function getBeijingWeekStart() {
  const todayStart = getBeijingTodayStart()
  const dayOfWeek = nowInBeijing().getDay() // 0=周日
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 周一 - 今天
  return new Date(todayStart.getTime() + diff * 24 * 60 * 60 * 1000)
}

// 判断两个日期是否是北京时间同一天
export function isSameBeijingDay(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const fmt1 = d1.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).split('T')[0]
  const fmt2 = d2.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).split('T')[0]
  return fmt1 === fmt2
}

// 格式化日期为 YYYY-MM-DD（北京时间）
export function formatBeijingDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  const parts = d.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' }).split('T')
  const [year, month, day] = parts[0].split('-')
  return format.replace('YYYY', year).replace('MM', month).replace('DD', day)
}

// 获取北京时间 HH:mm:ss 格式
export function formatBeijingTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('en-GB', { timeZone: 'Asia/Shanghai', hour12: false })
}

// 获取北京时区的 Intl.DateTimeFormat（用于 toLocaleString）
export const beijingFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' })

// 获取北京时区的显示用 Date
export function toBeijingDisplay(date) {
  if (!date) return new Date()
  return new Date(date)
}
