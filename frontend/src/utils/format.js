export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  const d = new Date(date)
  // 使用北京时间格式化
  const beijingStr = d.toLocaleString('en-CA', { timeZone: 'Asia/Shanghai' })
  const [year, month, day] = beijingStr.split('T')[0].split('-')
  return format.replace('YYYY', year).replace('MM', month).replace('DD', day)
}
