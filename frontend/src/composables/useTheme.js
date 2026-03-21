import { ref, watch } from 'vue'

// Theme definitions
export const themes = [
  { id: 'pink', name: '🌸 粉色', primary: '#FF69B4', secondary: '#FFB6C1' },
  { id: 'blue', name: '🌊 蓝色', primary: '#1989fa', secondary: '#87CEEB' },
  { id: 'yellow', name: '🌻 向日葵黄', primary: '#FFD700', secondary: '#FFE082' },
  { id: 'purple', name: '🦄 紫色', primary: '#9B59B6', secondary: '#DDA0DD' },
  { id: 'green', name: '🌿 森林绿', primary: '#07c160', secondary: '#90EE90' },
  { id: 'orange', name: '🍊 橙色', primary: '#FF976A', secondary: '#FFB74D' }
]

const currentTheme = ref(localStorage.getItem('theme') || 'pink')

export function useTheme() {
  const applyTheme = (themeId) => {
    const theme = themes.find(t => t.id === themeId) || themes[0]
    currentTheme.value = theme.id
    localStorage.setItem('theme', theme.id)
    
    // Apply CSS variables to root
    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.primary)
    root.style.setProperty('--theme-secondary', theme.secondary)
    
    // Add theme class to body
    document.body.className = `theme-${theme.id}`
  }
  
  const initTheme = () => {
    applyTheme(currentTheme.value)
  }
  
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })
  
  return {
    themes,
    currentTheme,
    applyTheme,
    initTheme
  }
}
