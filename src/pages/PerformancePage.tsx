import { useEffect } from "react";
import ChartActivity from "../activities/ChartActivity";
import HomeActivity from "../activities/HomeActivity";
import ImageStackActivity from "../activities/ImageStackActivity";
import MemoryStressActivity from "../activities/MemoryStressActivity";
import TextContentActivity from "../activities/TextContentActivity";
import TableActivity from "../activities/TableActivity";
import { NFXStack, type StackRouteConfig } from "../lib/NFXStack";
import { initializeWaferDataset } from "../lib/waferDataset";

const stackRoutes: StackRouteConfig[] = [
  {
    name: "home",
    activity: HomeActivity,
    route: "/performance",
    initial: true,
  },
  {
    name: "table",
    activity: TableActivity,
    route: "/performance/table",
  },
  {
    name: "chart",
    activity: ChartActivity,
    route: "/performance/chart",
  },
  {
    name: "image-stack",
    activity: ImageStackActivity,
    route: "/performance/images",
  },
  {
    name: "memory",
    activity: MemoryStressActivity,
    route: "/performance/memory",
  },
  {
    name: "text",
    activity: TextContentActivity,
    route: "/performance/text",
  },
];

export const PerformancePage = () => {
  useEffect(() => {
    initializeWaferDataset();
  }, []);

  return (
    <>
      <NFXStack routes={stackRoutes} />
    </>
  );
};
