import { ComponentBarChartHorizontal } from "@/components/layouts/charts/comonent-bar-chart-horizontal";
import { ComponentBarChartVertical } from "@/components/layouts/charts/comonent-bar-chart-vertical";
import { ComponentMultiAreaChart } from "@/components/layouts/charts/component-multi-area-chart";
import { ComponentPieChart } from "@/components/layouts/charts/component-pie-chart";
import { ComponentSingleAreaChart } from "@/components/layouts/charts/component-single-area-chart";
import React from "react";

const ComponentsUnApprovedUser = () => {
  return (
    <>
      <div className="flex sm:flex-row gap-4 flex-col m-4">
        Your Account is under review by Admin. You will be notified once
        approved.
      </div>
    </>
  );
};

export default ComponentsUnApprovedUser;
