import "@stackflow/plugin-basic-ui/index.css";
import "./App.css";

import DetailActivity from "./activities/DetailActivity";
import FeedActivity from "./activities/FeedActivity";
import HomeActivity from "./activities/HomeActivity";
import ProfileActivity from "./activities/ProfileActivity";
import SettingsActivity from "./activities/SettingsActivity";
import { NFXStack, type StackRouteConfig } from "./lib/NFXStack";

const stackRoutes: StackRouteConfig[] = [
  {
    name: "Home",
    activity: HomeActivity,
    route: "/",
    initial: true,
  },
  {
    name: "Detail",
    activity: DetailActivity,
    route: {
      path: "/detail/:id",
    },
  },
  {
    name: "Profile",
    activity: ProfileActivity,
    route: "/profile",
  },
  {
    name: "Settings",
    activity: SettingsActivity,
    route: "/settings",
  },
  {
    name: "Feed",
    activity: FeedActivity,
    route: "/feed",
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
