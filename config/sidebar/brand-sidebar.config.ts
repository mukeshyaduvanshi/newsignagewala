import {
  Users,
  Store,
  ShoppingCart,
  Briefcase,
  CirclePercent,
  FileText,
} from "lucide-react";
import { SidebarNavItem, SidebarConfig } from "@/types/sidebar.types";

// Brand Sidebar Configuration
export const brandSidebarConfig: SidebarConfig = {
  getNavigation: (baseUrl, teamAuthorities = [], storeAuthorities = []) => {
    // Filter and sort team authorities (only valid uniqueKey)
    const sortedTeamAuthorities = [
      ...(Array.isArray(teamAuthorities) ? teamAuthorities : []),
    ]
      .filter((auth) => auth.uniqueKey && auth.uniqueKey !== "undefined")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    // Filter and sort store authorities (only valid items)
    const sortedStoreAuthorities = [
      ...(Array.isArray(storeAuthorities) ? storeAuthorities : []),
    ]
      .filter(
        (authority) =>
          authority.selectedOptions && authority.selectedOptions.length > 0,
      )
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    // Generate store items from store authorities
    const storeItems = sortedStoreAuthorities.flatMap((authority) => {
      const uniqueKeys =
        authority.uniqueKeys ||
        authority.selectedOptions.map((option: string) =>
          option
            .trim()
            .split(/\s+/)
            .map((word: string, index: number) => {
              if (index === 0) {
                return word.toLowerCase();
              }
              return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(""),
        );

      return authority.selectedOptions
        .map((option: string, index: number) => ({
          title: option,
          url: `${baseUrl}/stores/${uniqueKeys[index]}`,
        }))
        .filter(
          (item: { title: string; url: string }) =>
            item.url && !item.url.includes("undefined"),
        );
    });

    return [
      {
        title: "Teams",
        icon: Users,
        url: "#",
        items: sortedTeamAuthorities.map((auth) => ({
          title: auth.labelName,
          url: `${baseUrl}/teams/${auth.uniqueKey}`,
        })),
      },
      {
        title: "Stores",
        icon: Store,
        url: "#",
        items: [
          {
            title: "All Store",
            url: `${baseUrl}/stores`,
          },
          ...storeItems,
        ],
      },
      {
        title: "Sites",
        icon: Store,
        url: "#",
        items: [
          {
            title: "All Sites",
            url: `${baseUrl}/sites`,
          },
          // ...storeItems,
        ],
      },
      {
        title: "Racee",
        icon: CirclePercent,
        url: "#",
        items: [
          {
            title: "Racee",
            url: `${baseUrl}/racee`,
          },
        ],
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
            title: "Store Authority",
            url: `${baseUrl}/store-authority`,
          },
          {
            title: "Role Permission",
            url: `${baseUrl}/role-permissions`,
          },
          {
            title: "Purchase Authority",
            url: `${baseUrl}/purchase-authority`,
          },
        ],
      },
    ];
  },
};
