import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  ChartArea,
  Command,
  Database,
  Frame,
  GalleryVerticalEnd,
  LucideTruck,
  Map,
  MessageCircle,
  MessageCircleDashed,
  PieChart,
  Settings2,
  SquareTerminal,
  Store,
  Workflow,
  FileSpreadsheet,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuthToken } from '@/hooks/authStore';
import { title } from "process";




export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {

  const { token, isExpired } = useAuthToken.getState();

  const user = token.data;

  const data = {
    user: {
      name: user?.user?.username || "Admin",
      email: user?.user?.company_ID || "soft@atcgroup.co.in",
      avatar: user?.user?.avatar || "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "AARKAY TRACK & TRACE",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
    ],
    navMain: [
      {
        title: "Masters",
        url: "#",
        icon: Database,
        isActive: false,
        items: [
          {
            title: "Country Master",
            url: "/country-master",
          },
          {
            title: "State Master",
            url: "/state-master",
          },
          {
            title: "MFG Masters",
            url: "/mfg-masters",
          },
          {
            title: "MFG Location Master",
            url: "/mfg-location-master",
          },
          {
            title: "Plant Master",
            url: "/plant-master",
          },
          {
            title: "Machine Code Master",
            url: "/machine-code-master",
          },
          {
            title: "UOM Master",
            url: "/uom-master",
          },
          {
            title: "Product Master",
            url: "/product-master",
          },
          {
            title: "Shift Master",
            url: "/shift-master",
          },
          {
            title: "Customer Master",
            url: "/customer-master",
          },
          {
            title:"Brand Master",
            url: "/brand-master",
          },
          {
            title:"Transpoter Master",
            url: "/transporter-master",
          },
          {
            title: "Reset masters",
            url: "/reset-type-master", // Remove the 's'
          },
          {
            title: "Magzine Master",
            url: "/magzine-master",
          },

        ],
      },
      {
        title: "Operations",
        url: "#",
        icon: Workflow,
        items: [
          {
            title: "L1Barcode Generation",
            url: "/barcode-generation",
          },
          {
            title: "2D Barcode Generation",
            url: "/2Dbarcode-generation",
          },
        ],
      },
      {
        title: "Storge",
        url: "#",
        icon: Store,
        items: [
          {
            title: "Magzine Transfer",
            url: "/magzine-transfer",
          },
          {
            title: "RE2 File Generation",
            url: "/re2-file-generation",

          },

        ],
      },
      {
        title: "Dispatch",
        url: "#",
        icon: LucideTruck,
        items: [
          {
            title: "RE11 File Generation",
            url: "/re11-indent-generation",
          },
          {
            title: "Loading Sheet Generation",
            url: "/loading-sheets",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
      {
        title: "Reports",
        url: "#",
        icon: FileSpreadsheet,
        items: [
          {
            title: "L1Barcode Generation",
            url: "/barcode-generation",
          },
          {
            title: "2D Barcode Generation",
            url: "/2Dbarcode-generation",
          },
        ],
      },
      {
        title: "Chat",
        url: "#",
        icon: MessageCircle,
        items: [
          {
            title: "Chats",
            url: "/chat",
          },
        ],
      }
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
