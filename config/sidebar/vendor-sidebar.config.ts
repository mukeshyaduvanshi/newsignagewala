import { Users, Store, ShoppingCart, Briefcase, CirclePercent, FileText } from "lucide-react"
import { SidebarNavItem, SidebarConfig } from "@/types/sidebar.types"

// Vendor Sidebar Configuration
export const vendorSidebarConfig: SidebarConfig = {
  getNavigation: (baseUrl, teamAuthorities = [], storeAuthorities = []) => {
    // Filter and sort team authorities (only valid uniqueKey)
    const sortedTeamAuthorities = [...teamAuthorities]
      .filter(auth => auth.uniqueKey && auth.uniqueKey !== 'undefined')
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return [
      {
        title: "Teams",
        icon: Users,
        url: "#",
        items: sortedTeamAuthorities.map(auth => ({
          title: auth.labelName,
          url: `${baseUrl}/teams/${auth.uniqueKey}`,
        })),
      },
      {
        title: "Rates",
        icon: CirclePercent,
        url: "#",
        items: [
          {
            title: "Rate",
            url: `${baseUrl}/rates`,
          },
        ],
      },
      {
        title: "Orders",
        icon: ShoppingCart,
        url: "#",
        items: [
          {
            title: "Order",
            url: `${baseUrl}/orders`,
          },
          // {
          //   title: "Pending Orders",
          //   url: `${baseUrl}/orders/pending`,
          // },
          // {
          //   title: "Completed Orders",
          //   url: `${baseUrl}/orders/completed`,
          // },
          // {
          //   title: "Cancelled Orders",
          //   url: `${baseUrl}/orders/cancelled`,
          // }
        ],
      },
      {
              title: "Tenders",
              icon: FileText,
              url: "#",
              items: [
                {
                  title: "All Tenders",
                  url: `${baseUrl}/tenders`,
                },
              ],
            },
      {
        title: "Authority",
        icon: Briefcase,
        url: "#",
        items: [
          {
            title: "User Roles",
            url: `${baseUrl}/user-roles`,
          },
          {
            title: "Role Permission",
            url: `${baseUrl}/role-permissions`,
          },
        ],
      },
    ];
  }
};
