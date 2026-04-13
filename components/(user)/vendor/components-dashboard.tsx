import { ComponentBarChartHorizontal } from '@/components/layouts/charts/comonent-bar-chart-horizontal'
import { ComponentBarChartVertical } from '@/components/layouts/charts/comonent-bar-chart-vertical'
import { ComponentMultiAreaChart } from '@/components/layouts/charts/component-multi-area-chart'
import { ComponentPieChart } from '@/components/layouts/charts/component-pie-chart'
import { ComponentSingleAreaChart } from '@/components/layouts/charts/component-single-area-chart'
import React from 'react'

const ComponentsDashboard = () => {
  return (
    <>
    <div className='flex sm:flex-row gap-4 flex-col m-4'>
        <ComponentMultiAreaChart />
        <ComponentPieChart />
    </div>
    <div className='flex sm:flex-row gap-4 flex-col m-4'>
        <ComponentBarChartVertical />
        <ComponentBarChartHorizontal />
        <ComponentSingleAreaChart />
    </div>
    </>
  )
}

export default ComponentsDashboard