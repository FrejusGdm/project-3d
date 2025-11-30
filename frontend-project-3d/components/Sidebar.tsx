"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home, requiresAuth: false },
  { href: "/my-generations", label: "My Generations", icon: Layers, requiresAuth: true },
  { href: "/favorites", label: "Favorites", icon: Heart, requiresAuth: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { user } = useUser();

  return (
    <aside
      className={cn(
        "fixed left-0 top-[65px] bottom-0 border-r border-neutral-100 bg-white/50 backdrop-blur-sm z-40 hidden md:flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-56"
      )}
    >
      <nav className="p-4 space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const NavLink = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );

          if (item.requiresAuth) {
            return <SignedIn key={item.href}>{NavLink}</SignedIn>;
          }
          return NavLink;
        })}
      </nav>

      <div className="p-4 border-t border-neutral-100">
        <SignedIn>
          <div className={cn("flex items-center gap-3 mb-4", isCollapsed ? "justify-center" : "px-2")}>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            {!isCollapsed && user && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-neutral-900 truncate">
                  {user.fullName || user.username}
                </span>
                <span className="text-xs text-neutral-500 truncate">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            )}
          </div>
        </SignedIn>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center justify-center w-full p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors",
            !isCollapsed && "justify-start gap-3 px-4"
          )}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
