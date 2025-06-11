"use client";

import * as React from "react";
import { ReceiptText, Database, Frame, GalleryVerticalEnd, LucideTruck, Map, MessageCircle, PieChart, Store, Workflow, FileSpreadsheet, PrinterIcon, ShieldUser, ChevronRight, Home, Search, } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, } from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

  const navMain: NavItem[] = [
    {
      title: "Masters",
      url: "#",
      icon: Database,
      items: [
        { title: "Country Master", url: "/country-master" },
        { title: "State Master", url: "/state-master" },
        { title: "MFG Masters", url: "/mfg-masters" },
        { title: "MFG Location Master", url: "/mfg-location-master" },
        { title: "Plant Master", url: "/plant-master" },
        { title: "Brand Master", url: "/brand-master" },
        { title: "Machine Code Master", url: "/machine-code-master" },
        { title: "Shift Master", url: "/shift-master" },
        { title: "Product Master", url: "/product-master" },
        { title: "Magzine Master", url: "/magzine-master" },
        { title: "UOM Master", url: "/uom-master" },
        { title: "Customer Master", url: "/customer-master" },
        { title: "Transport Master", url: "/transport-master" },
        { title: "Reset masters", url: "/reset-type-master" },
      ],
    },
    {
      title: "Operations",
      url: "#",
      icon: Workflow,
      items: [
        { title: "L1Barcode Generation", url: "/barcode-generation" },
        { title: "2D Barcode Generation", url: "/2Dbarcode-generation" },
      ],
    },
    {
      title: "Reprint",
      url: "#",
      icon: PrinterIcon,
      items: [
        { title: "L1 Reprint", url: "/l1reprint" },
        { title: "L2 Reprint", url: "/l2reprint" },
      ],
    },
    {
      title: "Storge",
      url: "#",
      icon: Store,
      items: [
        { title: "Magzine Transfer", url: "/magzine-transfer" },
        { title: "RE2 File Generation", url: "/re2-file-generation" },
      ],
    },
    {
      title: "Dispatch",
      url: "#",
      icon: LucideTruck,
      items: [
        { title: "RE11 File Generation", url: "/re11-indent-generation" },
        { title: "Loading Sheet Generation", url: "/loading-sheets" },
        { title: "RE12 File Generation", url: "/re12-file-generation" },
      ],
    },
    {
      title: "Admin",
      url: "#",
      icon: ShieldUser,
      items: [
        { title: "Shift Management", url: "/shift-management" },
        { title: "L1 Box Deletion", url: "/l1boxdeletion" },
        {title: "Regenerate RE2",url: "/ReGenerateRE2FileGeneration"},
        { title: "Regenerate RE12", url: "/ReGenerateRE12FileGeneration" },
      ],  
    },
    {
      title: "Search",
      url: "#",
      icon: Search,
      items: [
        { title: "Trace Barcode Details", url: "/trace-barcode" },
      ],  
    },
    {
      title: "Form",
      url: "#",
      icon: ReceiptText,
      items: [
        {
          title: "Form RE2",
          url: "#",
          children: [
            { title: "Magzine Alloted", url: "/magallotManual" },
            { title: "Mag Alloted for Testing", url: "/l1boxdeletion" },
            { title: "Magzine Transfer", url: "/attendancetracking" },
            { title: "Form RE2 Report", url: "/formre2" },
          ],
        },
        { title: "Form RE3", url: "/formre3" },
        {
          title: "Form RE4",
          url: "#",
          children: [          
            { title: "Form RE4 Alottment", url: "/formre4allotment" },
            { title: "Form RE4 Report", url: "/formre4" },
          ],
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: FileSpreadsheet,
      items: [
        { title: "Production Report", url: "/production-report" },
        { title: "Storage Report", url: "/storage-report" },
        { title: "Dispatch Report", url: "/dispatch-report" },
        { title: "RE11 Status Report", url: "/re11-status-report" },
        { title: "RE2 Status Report", url: "/re2-status-report" },
        { title: "L1 Box Deletion Report", url: "/l1-box-deletion-report" },
        { title: "L1 Barcode Reprint Report", url: "/l1-barcode-reprint-report" },
        { title: "L2 Barcode Reprint Report", url: "/l2-barcode-reprint-report" },
        { title: "Production Material Transfer Report", url: "/production-material-transfer-report" },
      ],
    },
    {
      title: "Chat",
      url: "#",
      icon: MessageCircle,
      items: [{ title: "Chats", url: "/chat" }],
    },
  ];
 

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
            email: user?.user?.company_ID || "soft@atcgroup.co.in",
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