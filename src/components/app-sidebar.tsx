import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Database,
  Frame,
  GalleryVerticalEnd,
  LucideTruck,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Store,
  Workflow,
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
          {
           title: "Magzine Transfer",
            url: "/magzine-transfer", 
          },
        ],
      },
      {
        title: "Storge",
        url: "#",
        icon: Store,
        items: [
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
            title: "General",
            url: "#",
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
        title: "Chat",
        url: "#",
        icon: Command,
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
