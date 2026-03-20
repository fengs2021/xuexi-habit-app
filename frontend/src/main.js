import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import {
  Icon,
  NavBar,
  Tabbar,
  TabbarItem,
  Form,
  Field,
  CellGroup,
  Cell,
  Button,
  Dialog,
  Toast,
  Tag,
  Grid,
  GridItem,
  List,
  Progress,
  Empty
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(Icon)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Form)
app.use(Field)
app.use(CellGroup)
app.use(Cell)
app.use(Button)
app.use(Dialog)
app.use(Toast)
app.use(Tag)
app.use(Grid)
app.use(GridItem)
app.use(List)
app.use(Progress)
app.use(Empty)

app.mount('#app')
