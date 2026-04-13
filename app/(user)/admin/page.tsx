"use client";

import * as React from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { PageLoader, DashboardSkeleton } from "@/components/ui/page-loader";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card as Cards,
  CardContent as CardContents,
  CardDescription as CardDescriptions,
  CardHeader as CardHeaders,
  CardTitle as CardTitles,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shield,
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  // Table,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { stats: adminStats, isLoading: isLoadingStats } = useAdminStats();
  const chartData = [
    { date: "2024-04-01", desktop: 222, mobile: 150 },
    { date: "2024-04-02", desktop: 97, mobile: 180 },
    { date: "2024-04-03", desktop: 167, mobile: 120 },
    { date: "2024-04-04", desktop: 242, mobile: 260 },
    { date: "2024-04-05", desktop: 373, mobile: 290 },
    { date: "2024-04-06", desktop: 301, mobile: 340 },
    { date: "2024-04-07", desktop: 245, mobile: 180 },
    { date: "2024-04-08", desktop: 409, mobile: 320 },
    { date: "2024-04-09", desktop: 59, mobile: 110 },
    { date: "2024-04-10", desktop: 261, mobile: 190 },
    { date: "2024-04-11", desktop: 327, mobile: 350 },
    { date: "2024-04-12", desktop: 292, mobile: 210 },
    { date: "2024-04-13", desktop: 342, mobile: 380 },
    { date: "2024-04-14", desktop: 137, mobile: 220 },
    { date: "2024-04-15", desktop: 120, mobile: 170 },
    { date: "2024-04-16", desktop: 138, mobile: 190 },
    { date: "2024-04-17", desktop: 446, mobile: 360 },
    { date: "2024-04-18", desktop: 364, mobile: 410 },
    { date: "2024-04-19", desktop: 243, mobile: 180 },
    { date: "2024-04-20", desktop: 89, mobile: 150 },
    { date: "2024-04-21", desktop: 137, mobile: 200 },
    { date: "2024-04-22", desktop: 224, mobile: 170 },
    { date: "2024-04-23", desktop: 138, mobile: 230 },
    { date: "2024-04-24", desktop: 387, mobile: 290 },
    { date: "2024-04-25", desktop: 215, mobile: 250 },
    { date: "2024-04-26", desktop: 75, mobile: 130 },
    { date: "2024-04-27", desktop: 383, mobile: 420 },
    { date: "2024-04-28", desktop: 122, mobile: 180 },
    { date: "2024-04-29", desktop: 315, mobile: 240 },
    { date: "2024-04-30", desktop: 454, mobile: 380 },
    { date: "2024-05-01", desktop: 165, mobile: 220 },
    { date: "2024-05-02", desktop: 293, mobile: 310 },
    { date: "2024-05-03", desktop: 247, mobile: 190 },
    { date: "2024-05-04", desktop: 385, mobile: 420 },
    { date: "2024-05-05", desktop: 481, mobile: 390 },
    { date: "2024-05-06", desktop: 498, mobile: 520 },
    { date: "2024-05-07", desktop: 388, mobile: 300 },
    { date: "2024-05-08", desktop: 149, mobile: 210 },
    { date: "2024-05-09", desktop: 227, mobile: 180 },
    { date: "2024-05-10", desktop: 293, mobile: 330 },
    { date: "2024-05-11", desktop: 335, mobile: 270 },
    { date: "2024-05-12", desktop: 197, mobile: 240 },
    { date: "2024-05-13", desktop: 197, mobile: 160 },
    { date: "2024-05-14", desktop: 448, mobile: 490 },
    { date: "2024-05-15", desktop: 473, mobile: 380 },
    { date: "2024-05-16", desktop: 338, mobile: 400 },
    { date: "2024-05-17", desktop: 499, mobile: 420 },
    { date: "2024-05-18", desktop: 315, mobile: 350 },
    { date: "2024-05-19", desktop: 235, mobile: 180 },
    { date: "2024-05-20", desktop: 177, mobile: 230 },
    { date: "2024-05-21", desktop: 82, mobile: 140 },
    { date: "2024-05-22", desktop: 81, mobile: 120 },
    { date: "2024-05-23", desktop: 252, mobile: 290 },
    { date: "2024-05-24", desktop: 294, mobile: 220 },
    { date: "2024-05-25", desktop: 201, mobile: 250 },
    { date: "2024-05-26", desktop: 213, mobile: 170 },
    { date: "2024-05-27", desktop: 420, mobile: 460 },
    { date: "2024-05-28", desktop: 233, mobile: 190 },
    { date: "2024-05-29", desktop: 78, mobile: 130 },
    { date: "2024-05-30", desktop: 340, mobile: 280 },
    { date: "2024-05-31", desktop: 178, mobile: 230 },
    { date: "2024-06-01", desktop: 178, mobile: 200 },
    { date: "2024-06-02", desktop: 470, mobile: 410 },
    { date: "2024-06-03", desktop: 103, mobile: 160 },
    { date: "2024-06-04", desktop: 439, mobile: 380 },
    { date: "2024-06-05", desktop: 88, mobile: 140 },
    { date: "2024-06-06", desktop: 294, mobile: 250 },
    { date: "2024-06-07", desktop: 323, mobile: 370 },
    { date: "2024-06-08", desktop: 385, mobile: 320 },
    { date: "2024-06-09", desktop: 438, mobile: 480 },
    { date: "2024-06-10", desktop: 155, mobile: 200 },
    { date: "2024-06-11", desktop: 92, mobile: 150 },
    { date: "2024-06-12", desktop: 492, mobile: 420 },
    { date: "2024-06-13", desktop: 81, mobile: 130 },
    { date: "2024-06-14", desktop: 426, mobile: 380 },
    { date: "2024-06-15", desktop: 307, mobile: 350 },
    { date: "2024-06-16", desktop: 371, mobile: 310 },
    { date: "2024-06-17", desktop: 475, mobile: 520 },
    { date: "2024-06-18", desktop: 107, mobile: 170 },
    { date: "2024-06-19", desktop: 341, mobile: 290 },
    { date: "2024-06-20", desktop: 408, mobile: 450 },
    { date: "2024-06-21", desktop: 169, mobile: 210 },
    { date: "2024-06-22", desktop: 317, mobile: 270 },
    { date: "2024-06-23", desktop: 480, mobile: 530 },
    { date: "2024-06-24", desktop: 132, mobile: 180 },
    { date: "2024-06-25", desktop: 141, mobile: 190 },
    { date: "2024-06-26", desktop: 434, mobile: 380 },
    { date: "2024-06-27", desktop: 448, mobile: 490 },
    { date: "2024-06-28", desktop: 149, mobile: 200 },
    { date: "2024-06-29", desktop: 103, mobile: 160 },
    { date: "2024-06-30", desktop: 446, mobile: 400 },
  ];
  const chartConfig = {
    views: {
      label: "Page Views",
    },
    desktop: {
      label: "Desktop",
      color: "var(--chart-2)",
    },
    mobile: {
      label: "Mobile",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop");
  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    []
  );

  // Show loader during auth loading
  if (isLoading) {
    return <PageLoader message="Authenticating..." />;
  }

  if (!user) {
    return <PageLoader message="Redirecting to login..." />;
  }

  // Show skeleton during data fetching
  if (isLoadingStats) {
    return <DashboardSkeleton />;
  }

  const stats = [
    {
      title: "Total Users",
      value: adminStats.allUsersCount.toString(),
      description: "All registered users",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      title: "Active Brands",
      value: adminStats.brandCount.toString(),
      description: "Currently active brands",
      icon: Store,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Active Vendors",
      value: adminStats.vendorCount.toString(),
      description: "Currently active vendors",
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      title: "Active Managers",
      value: adminStats.managerCount.toString(),
      description: "Currently active managers",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Active Stores",
      value: adminStats.storeCount.toString(),
      description: "Currently active stores",
      icon: Store,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Active Sites",
      value: adminStats.siteCount.toString(),
      description: "Currently active stores",
      icon: Store,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Active Racees",
      value: adminStats.raceeCount.toString(),
      description: "Currently active racees",
      icon: Store,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
  ];

  const orders = [
    {
      orderNumber: "108",
      orderValue: "28790",
      brand: "Croma",
      vendor: "Rajat Advertising",
    },
    {
      orderNumber: "109",
      orderValue: "22790",
      brand: "Samsung",
      vendor: "Signagewala",
    },
    {
      orderNumber: "110",
      orderValue: "68790",
      brand: "LG",
      vendor: "Display Solutions",
    },
    {
      orderNumber: "111",
      orderValue: "128790",
      brand: "Panasonic",
      vendor: "VisualTech",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-700">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || "Administrator"}! Here's your system
            overview.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Last 4 Orders Placed</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Last 4 Orders Placed by Brands.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order No</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderNumber}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.brand}</TableCell>
                    <TableCell>{order.vendor}</TableCell>
                    <TableCell className="text-right">
                      {order.orderValue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">
                    {orders.reduce(
                      (sum, order) => sum + parseInt(order.orderValue),
                      0
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Some key system metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Number of Elements Listed</span>
                <span className="text-sm font-medium text-green-600">55</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average size of Image</span>
                <span className="text-sm font-medium text-green-600">84kb</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total No of Images</span>
                <span className="text-sm font-medium text-green-600">
                  12890
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Visitors Every Day</span>
                <span className="text-sm font-medium text-green-600">27</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Cards className="py-0">
        <CardHeaders className="flex flex-col items-stretch border-b p-0! sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
            <CardTitles>Visitors - Interactive</CardTitles>
            <CardDescriptions>
              Showing total visitors for the last 3 months
            </CardDescriptions>
          </div>
          <div className="flex">
            {["desktop", "mobile"].map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-muted-foreground text-xs">
                    {chartConfig[chart].label}
                  </span>
                  <span className="text-lg leading-none font-bold sm:text-3xl">
                    {total[key as keyof typeof total].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeaders>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Cards>

      {/* Admin Info Card */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-linear-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Administrator Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user?.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium capitalize">
                {user?.userType || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
