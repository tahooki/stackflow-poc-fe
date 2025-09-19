import '@stackflow/plugin-basic-ui/index.css'
import './App.css'

import DetailActivity from './activities/DetailActivity'
import HomeActivity from './activities/HomeActivity'
import { NFXStack } from './lib/NFXStack'

const stackRoutes = [
  {
    name: 'home',
    activity: HomeActivity,
    route: '/',
    initial: true,
  },
  {
    name: 'detail',
    activity: DetailActivity,
    route: '/detail/:id',
  },
] as const

function App() {
  return (
    <div className="app">
      <NFXStack routes={stackRoutes} />
    </div>
  )
}

export default App
