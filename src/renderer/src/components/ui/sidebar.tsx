import React from 'react';

import { cn } from "@renderer/lib/utils"

import { ScrollArea } from './ScrollArea';

interface SidebarProps {
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <aside className={cn("flex flex-col w-64 h-screen bg-gray-800 text-white shadow-lg fixed")}>
      <div className="flex items-center justify-center h-16 shadow-md bg-gray-900">
        <h1 className="text-xl font-bold">App Name</h1>
      </div>
      <ScrollArea className="flex-1">
        {children}
      </ScrollArea>
    </aside>
  );
};