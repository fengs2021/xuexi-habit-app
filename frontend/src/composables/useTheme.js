import { ref, watch } from 'vue'

export const themes = [
  { id: 'pink', name: '🌸 粉色', primary: '#FF69B4', secondary: '#FFB6C1', gradient: 'linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 25%, #FF69B4 50%, #FF85A2 75%, #FFB6C1 100%)', shadow: 'rgba(255, 105, 180, 0.4)', bgColor: '#FFF5F7', textColor: '#C9A0A0' },
  { id: 'blue', name: '🌊 蓝色', primary: '#1989fa', secondary: '#87CEEB', gradient: 'linear-gradient(135deg, #87CEEB 0%, #ADD8E6 25%, #1989fa 50%, #5DADE2 75%, #87CEEB 100%)', shadow: 'rgba(25, 137, 250, 0.4)', bgColor: '#F0F8FF', textColor: '#6BA3D6' },
  { id: 'yellow', name: '🌻 向日葵黄', primary: '#FFD700', secondary: '#FFE082', gradient: 'linear-gradient(135deg, #FFE082 0%, #FFECB3 25%, #FFD700 50%, #FFC107 75%, #FFE082 100%)', shadow: 'rgba(255, 215, 0, 0.4)', bgColor: '#FFFDE7', textColor: '#C9A0A0' },
  { id: 'purple', name: '🦄 紫色', primary: '#9B59B6', secondary: '#DDA0DD', gradient: 'linear-gradient(135deg, #DDA0DD 0%, #E6E6FA 25%, #9B59B6 50%, #BA55D3 75%, #DDA0DD 100%)', shadow: 'rgba(155, 89, 182, 0.4)', bgColor: '#F5F0FF', textColor: '#9B89B6' },
  { id: 'green', name: '🌿 森林绿', primary: '#07c160', secondary: '#90EE90', gradient: 'linear-gradient(135deg, #90EE90 0%, #98FB98 25%, #07c160 50%, #2ECC71 75%, #90EE90 100%)', shadow: 'rgba(7, 193, 96, 0.4)', bgColor: '#F0FFF0', textColor: '#6BA3D6' },
  { id: 'orange', name: '🍊 橙色', primary: '#FF976A', secondary: '#FFB74D', gradient: 'linear-gradient(135deg, #FFB74D 0%, #FFCC80 25%, #FF976A 50%, #FF7F50 75%, #FFB74D 100%)', shadow: 'rgba(255, 151, 106, 0.4)', bgColor: '#FFF5F0', textColor: '#C9A0A0' }
]

const currentThemeId = ref(localStorage.getItem('theme') || 'pink')

export function applyTheme(themeId) {
  const theme = themes.find(t => t.id === themeId) || themes[0]
  currentThemeId.value = theme.id
  localStorage.setItem('theme', theme.id)
  
  const root = document.documentElement
  root.style.setProperty('--theme-primary', theme.primary)
  root.style.setProperty('--theme-secondary', theme.secondary)
  root.style.setProperty('--theme-gradient', theme.gradient)
  root.style.setProperty('--theme-shadow', theme.shadow)
  root.style.setProperty('--theme-bg', theme.bgColor)
  root.style.setProperty('--theme-text', theme.textColor)
  
  document.body.className = 'theme-' + theme.id
}

export function useTheme() {
  const currentTheme = ref(themes.find(t => t.id === currentThemeId.value) || themes[0])
  
  const initTheme = () => {
    applyTheme(currentThemeId.value)
  }
  
  watch(currentThemeId, (newTheme) => {
    applyTheme(newTheme)
  })
  
  return {
    themes,
    currentTheme,
    currentThemeId,
    applyTheme,
    initTheme
  }
}
