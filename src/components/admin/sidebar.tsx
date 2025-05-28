import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from "@/components/ui/sidebar"
import { SignedIn, UserButton } from '@clerk/nextjs'
import Link from "next/link"

const data = {
    navMain: [
      {
        title: "",
        url: "#",
        items: [
          {
            title: "Courses",
            url: "/admin/courses",
          },
          {
            title: "Enrollments",
            url: "/admin/enrollments",
          },
          {
            title: "Users",
            url: "/admin/users",
          },
        ],
      },
    ],
  }

export function AppSidebar() {
    return (
      <Sidebar>
        <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Admin Panel</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
        <SidebarFooter>
            <SignedIn>
              <UserButton />
            </SignedIn>
        </SidebarFooter>
      </Sidebar>
    )
}
  