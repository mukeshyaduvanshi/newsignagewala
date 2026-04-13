"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A single bar chart for total visitors"

const chartData = [
  { month: "January", visitors: 266 },
  { month: "February", visitors: 505 },
  { month: "March", visitors: 357 },
  { month: "April", visitors: 263 },
  { month: "May", visitors: 339 },
  { month: "June", visitors: 354 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ComponentBarChartVertical() {
  return (
    <Card className="flex flex-col sm:w-[33%] w-full">
      <CardHeader>
        <CardTitle>Daily Sales</CardTitle>
        <CardDescription>Monday - Sunday</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            barCategoryGap="15%"
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="visitors"
              fill="var(--color-chart-1)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
