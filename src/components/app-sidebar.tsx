import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
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
        icon: SquareTerminal,
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
            title:"UOM Master",
            url: "/uom-master", 
          },
          {
            title: "Product Master",
            url: "/product-master",
          },
          {
            title: "Magzine Master",
            url: "/magzine-master",
          },
          {
            title: "Settings",
            url: "#",
          },
        ],
      },
      {
        title: "Operations",
        url: "#",
        icon: Bot,
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
          {
            title: "Explorer",
            url: "#",
          },
          {
            title: "Quantum",
            url: "#",
          },
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: "Introduction",
            url: "#",
          },
          {
            title: "Get Started",
            url: "#",
          },
          {
            title: "Tutorials",
            url: "#",
          },
          {
            title: "Changelog",
            url: "#",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
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
