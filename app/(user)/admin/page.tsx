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
import { Shield, Users, Store, ShoppingCart, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { stats: adminStats, isLoading: isLoadingStats } = useAdminStats();

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
                      0,
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
            <CardTitles>Users Overview</CardTitles>
            <CardDescriptions>Total registered users by type</CardDescriptions>
          </div>
        </CardHeaders>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={{
              count: { label: "Count", color: "var(--chart-2)" },
            }}
            className="aspect-auto h-[250px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={[
                { label: "Brands", count: adminStats.brandCount },
                { label: "Vendors", count: adminStats.vendorCount },
                { label: "Managers", count: adminStats.managerCount },
                { label: "Stores", count: adminStats.storeCount },
                { label: "Sites", count: adminStats.siteCount },
                { label: "Racees", count: adminStats.raceeCount },
              ]}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent className="w-[150px]" nameKey="count" />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
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
