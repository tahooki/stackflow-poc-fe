import { useEffect } from "react";
import ChartActivity from "../activities/ChartActivity";
import HomeActivity from "../activities/HomeActivity";
import MemoryStressActivity from "../activities/MemoryStressActivity";
import TextContentActivity from "../activities/TextContentActivity";
import TableActivity from "../activities/TableActivity";
import { NFXStack, type StackRouteConfig } from "../lib/NFXStack";
import { PerfHUD } from "../lib/dx-kit";
import { initializeWaferDataset } from "../lib/waferDataset";

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
  {
    name: "memory",
    activity: MemoryStressActivity,
    route: "/memory",
  },
  {
    name: "text",
    activity: TextContentActivity,
    route: "/text",
  },
];

export const PerformancePage = () => {
  useEffect(() => {
    initializeWaferDataset();
  }, []);

  return (
    <>
      <PerfHUD position="top-right" />
      <NFXStack routes={stackRoutes} />
    </>
  );
};
