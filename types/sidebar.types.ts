// Sidebar configuration types
export interface SidebarNavItem {
  title: string
  icon?: any
  url: string
  items: {
    title: string
    url: string
  }[]
}

export interface SidebarConfig {
  getNavigation: (
    baseUrl: string, 
    teamAuthorities?: any[], 
    storeAuthorities?: any[], 
    workAuthorities?: any[]
  ) => SidebarNavItem[]
}
