import type { ReactNode } from "react";

import "../assets/globalLayout.css";

export const GlobalLayout = ({ children }: { children: ReactNode }) => {
  return <div className="global-layout">{children}</div>;
};

