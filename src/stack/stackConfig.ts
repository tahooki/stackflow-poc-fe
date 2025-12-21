import DetailActivity from "../activities/DetailActivity";
import HomeActivity from "../activities/HomeActivity";
import ModalLabActivity from "../activities/ModalLabActivity";
import OrdersActivity from "../activities/OrdersActivity";
import SnapshotActivity from "../activities/SnapshotActivity";

const activityRoutes = [
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

export type ActivityName = (typeof activityRoutes)[number]["name"];

export type ActivityRegistry = {
  [K in ActivityName]: Extract<
    (typeof activityRoutes)[number],
    { name: K }
  >["activity"];
};

export type StackRouteConfig = (typeof activityRoutes)[number];

export type StackName = "home" | "orders" | "snapshot";

export type StackConfigEntry = {
  name: StackName;
  label: string;
  initialActivity: ActivityName;
  activities: ReadonlyArray<StackRouteConfig>;
};

const initStack: StackName = "home";

// Normal (working) config. Commented out to reproduce the error case below.
const stackList = [
  {
    name: "home",
    label: "Home",
    initialActivity: "home",
    activities: activityRoutes,
  },
  {
    name: "orders",
    label: "Orders",
    initialActivity: "orders",
    activities: activityRoutes,
  },
  {
    name: "snapshot",
    label: "Snapshot",
    initialActivity: "snapshot",
    activities: activityRoutes,
  },
] as const satisfies ReadonlyArray<StackConfigEntry>;

// Error case: initialActivity is not registered in activities for "orders" stack.
// const stackList = [
//   {
//     name: "home",
//     label: "Home",
//     initialActivity: "home",
//     activities: activityRoutes,
//   },
//   {
//     name: "orders",
//     label: "Orders",
//     initialActivity: "orders",
//     activities: activityRoutes.filter((route) => route.name !== "orders"),
//   },
//   {
//     name: "snapshot",
//     label: "Snapshot",
//     initialActivity: "snapshot",
//     activities: activityRoutes,
//   },
// ] as const satisfies ReadonlyArray<StackConfigEntry>;

export const stackManagerConfig = {
  initStack,
  stackList,
} as const;
