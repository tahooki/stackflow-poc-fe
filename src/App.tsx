import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import ChartActivity from "./activities/ChartActivity";
import HomeActivity from "./activities/HomeActivity";
import TableActivity from "./activities/TableActivity";
import { NFXStack, type StackRouteConfig } from "./lib/NFXStack";
import { initializeWaferDataset } from "./lib/waferDataset";

initializeWaferDataset();

const stackRoutes: StackRouteConfig[] = [
  {
    name: "home",
    activity: HomeActivity,
    route: "/",
    initial: true,
  },
  {
    name: "table",
    activity: TableActivity,
    route: "/table",
  },
  {
    name: "chart",
    activity: ChartActivity,
    route: "/chart",
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
