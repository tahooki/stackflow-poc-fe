import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import DetailActivity from "./activities/DetailActivity";
import HomeActivity from "./activities/HomeActivity";
import OrdersActivity from "./activities/OrdersActivity";
import SnapshotActivity from "./activities/SnapshotActivity";
import { NFXStack } from "./lib/NFXStack";
import type { StackRouteConfig } from "./lib/nfxStackCore";

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
  {
    name: "orders",
    activity: OrdersActivity,
    route: {
      path: "/orders",
    },
  },
  {
    name: "snapshot",
    activity: SnapshotActivity,
    route: {
      path: "/snapshot",
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
