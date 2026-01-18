import React, { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  showStatus?: boolean;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ 
  children, 
  title, 
  showStatus = true,
  className,
  noPadding = false
}: PageContainerProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title={title} showStatus={showStatus} />
      <main className={cn(
        "max-w-lg mx-auto",
        !noPadding && "px-4 py-4",
        className
      )}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
