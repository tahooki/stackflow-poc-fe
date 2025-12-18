import DetailActivity from "../activities/DetailActivity";
import HomeActivity from "../activities/HomeActivity";
import ModalLabActivity from "../activities/ModalLabActivity";
import OrdersActivity from "../activities/OrdersActivity";
import SnapshotActivity from "../activities/SnapshotActivity";

export type StackName = "home" | "orders" | "snapshot";

export const stackRoutes = [
  {
    name: "home",
    activity: HomeActivity,
  },
  {
    name: "detail",
    activity: DetailActivity,
  },
  {
    name: "orders",
    activity: OrdersActivity,
  },
  {
    name: "snapshot",
    activity: SnapshotActivity,
  },
  {
    name: "modal",
    activity: ModalLabActivity,
  },
] as const;

export type ActivityRegistry = {
  [K in (typeof stackRoutes)[number]["name"]]: Extract<
    (typeof stackRoutes)[number],
    { name: K }
  >["activity"];
};

export type ActivityName = Extract<keyof ActivityRegistry, string>;

const initStack: StackName = "home";

const stackList = {
  home: {
    label: "Home",
    initialActivity: "home",
  },
  orders: {
    label: "Orders",
    initialActivity: "orders",
  },
  snapshot: {
    label: "Snapshot",
    initialActivity: "snapshot",
  },
} as const satisfies Record<StackName, { label: string; initialActivity: ActivityName }>;

export const stackManagerConfig = {
  initStack,
  stackList,
  routes: stackRoutes,
} as const;
