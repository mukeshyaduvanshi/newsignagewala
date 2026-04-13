import { Users, Store, ShoppingCart, Briefcase, CirclePercent, Shield, Settings, Share2 } from "lucide-react"
import { SidebarNavItem, SidebarConfig } from "@/types/sidebar.types"

// Admin Sidebar Configuration
export const adminSidebarConfig: SidebarConfig = {
  getNavigation: (baseUrl, teamAuthorities = [], storeAuthorities = []) => {
    // Filter and sort team authorities (only valid uniqueKey)
    const sortedTeamAuthorities = [...teamAuthorities]
      .filter(auth => auth.uniqueKey && auth.uniqueKey !== 'undefined')
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    
    // Filter and sort store authorities (only valid items)
    const sortedStoreAuthorities = [...storeAuthorities]
      .filter(authority => authority.selectedOptions && authority.selectedOptions.length > 0)
      .sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    
    // Generate store items from store authorities
    const storeItems = sortedStoreAuthorities.flatMap(authority => {
      const uniqueKeys = authority.uniqueKeys || authority.selectedOptions.map((option: string) => 
        option
          .trim()
          .split(/\s+/)
          .map((word: string, index: number) => {
            if (index === 0) {
              return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join('')
      );
      
      return authority.selectedOptions
        .map((option: string, index: number) => ({
          title: option,
          url: `${baseUrl}/stores/${uniqueKeys[index]}`,
        }))
        .filter((item: { title: string; url: string }) => item.url && !item.url.includes('undefined'));
    });

    return [
      {
        title: "User Management",
        icon: Shield,
        url: "#",
        items: [
          {
            title: "All Users",
            url: `${baseUrl}/users`,
          },
          {
            title: "Brands",
            url: `${baseUrl}/users/brands`,
          },
          {
            title: "Vendors",
            url: `${baseUrl}/users/vendors`,
          },
          {
            title: "Managers",
            url: `${baseUrl}/users/managers`,
          },
          {
            title: "Assign Managers",
            url: `${baseUrl}/users/assign-managers`,
          },
          {
            title: "MyShare",
            url: `${baseUrl}/myshare`,
          },
        ],
      },
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
        title: "Stores",
        icon: Store,
        url: "#",
        items: storeItems,
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
            title: "New Order",
            url: `${baseUrl}/orders/new`,
          },
          {
            title: "Pending Orders",
            url: `${baseUrl}/orders/pending`,
          },
          {
            title: "Completed Orders",
            url: `${baseUrl}/orders/completed`,
          },
          {
            title: "Cancelled Orders",
            url: `${baseUrl}/orders/cancelled`,
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
      {
        title: "Settings",
        icon: Settings,
        url: "#",
        items: [
          {
            title: "System Settings",
            url: `${baseUrl}/settings`,
          },
          {
            title: "Admin Profile",
            url: `${baseUrl}/profile`,
          },
        ],
      },
    ];
  },
};
