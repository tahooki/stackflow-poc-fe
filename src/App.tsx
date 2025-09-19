import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import DetailActivity from "./activities/DetailActivity";
import HomeActivity from "./activities/HomeActivity";
import { NFXStack, type StackRouteConfig } from "./lib/NFXStack";

const stackRoutes: StackRouteConfig[] = [
  {
    name: "home",
    activity: HomeActivity,
    route: "/",
    initial: true,
  },
  {
    name: "detail",
    activity: DetailActivity,
    route: {
      path: "/detail/:id",
    },
  },
];

function App() {
  return (
    <div className="app">
      <NFXStack routes={stackRoutes} />
    </div>
  );
}

export default App;
