"use client";

import * as React from "react";
import { ReceiptText, Database, Frame, GalleryVerticalEnd, LucideTruck, Map, MessageCircle, PieChart, Store, Workflow, FileSpreadsheet, PrinterIcon, ShieldUser, ChevronRight, Home, Search, } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, } from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import menutems from "@/mock/NavItem";
import { TeamSwitcher } from "@/components/team-switcher";
import { NavUser } from "@/components/nav-user";
import { useAuthToken } from "@/hooks/authStore";
// Define your type (adjust as needed)
type NavItem = {
  title: string;
  url: string;
  icon?: any;
  isActive?: boolean;
  items?: NavItem[];
  children?: NavItem[];
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { token } = useAuthToken.getState();
  const user = token.data;
  const navMain: NavItem[] = menutems;
 

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          teams={[
            {
              name: "AARKAY TRACK & TRACE",
              logo: GalleryVerticalEnd,
              plan: "Enterprise",
            },
          ]}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={"Dashboard"}>
                <Home />
                <a href="/dashboard">
                  <span>Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            <RecursiveMenu items={navMain} />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.user?.username || "Admin",
            role: user?.user?.role.roleName || "soft@atcgroup.co.in",
            avatar: user?.user?.avatar || "https://github.com/shadcn.png",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// ---------------- Recursive Menu Component ----------------

export function RecursiveMenu({ items }: { items: NavItem[] }) {
  return items.map((item) => {
    const nestedItems = item.items || item.children || [];
    const hasNested = nestedItems.length > 0;

    if (hasNested) {
      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={item.isActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon className="mr-2" />}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <SidebarMenuSub>
                <RecursiveMenu items={nestedItems} />
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Leaf item (no children)
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild tooltip={item.title}>
          <a href={item.url}>
            {item.icon && <item.icon className="mr-2" />}
            <span>{item.title}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  });
}