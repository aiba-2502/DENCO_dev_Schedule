"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart, Phone, History, Settings, Users, Printer, Bell, PhoneCall, Menu, User, LogOut, ChevronDown, BotMessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { name: 'ダッシュボード', href: '/', icon: BarChart },
  { name: 'AIナレッジ検索', href: '/knowledge', icon: BotMessageSquare },
  { name: '通話モニター', href: '/calls/monitor', icon: Phone },
  { name: '通話履歴', href: '/calls/history', icon: History },
  { name: 'FAX履歴', href: '/fax', icon: Printer },
  { name: 'AI架電', href: '/calls/ai', icon: PhoneCall },
  { name: '顧客管理', href: '/users', icon: Users },
  { name: 'スタッフ管理', href: '/staff', icon: Users },
  { name: '通知設定', href: '/notifications', icon: Bell },
  { name: '設定', href: '/settings', icon: Settings },
];

export default function SideNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const userName = user?.full_name || 'ゲスト';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={cn(
      "border-r bg-card flex flex-col h-screen transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "p-4 flex items-center",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Voice AI System"
              width={150}
              height={32}
              className="object-contain"
            />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center py-3 px-4 rounded-md hover:bg-accent transition-colors",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                collapsed ? "justify-center" : ""
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t space-y-3">
        {!collapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2 justify-start">
                <User className="h-4 w-4" />
                <span className="flex-1 text-left">{userName}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="w-full">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}