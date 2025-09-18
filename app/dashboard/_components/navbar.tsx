"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import UserProfile from "@/components/user-profile";
import {
  Building,
  HomeIcon,
  Search,
  Settings,
  Menu,
  FileText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardTopNav({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Header */}
      <header className="flex h-16 items-center justify-between bg-white dark:bg-gray-900 border-b px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="lg" className="p-3">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm p-0">
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 pb-4">
                <SheetTitle className="text-xl font-bold">
                  <Link prefetch={true} href="/" className="flex items-center">
                    GovBid AI
                  </Link>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 px-4 pb-6">
                <div className="space-y-2">
                  <SheetClose asChild>
                    <Link prefetch={true} href="/dashboard" className="block">
                      <div className="flex items-center p-4 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                        <HomeIcon className="mr-3 h-5 w-5" />
                        Opportunities
                      </div>
                    </Link>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Link prefetch={true} href="/dashboard/quote-requests" className="block">
                      <div className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <FileText className="mr-3 h-5 w-5 text-gray-500" />
                        Quote Requests
                      </div>
                    </Link>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Link prefetch={true} href="/dashboard/suppliers" className="block">
                      <div className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Building className="mr-3 h-5 w-5 text-gray-500" />
                        Suppliers
                      </div>
                    </Link>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Link prefetch={true} href="/dashboard/search" className="block">
                      <div className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Search className="mr-3 h-5 w-5 text-gray-500" />
                        Search
                      </div>
                    </Link>
                  </SheetClose>
                  
                  <SheetClose asChild>
                    <Link prefetch={true} href="/dashboard/analytics" className="block">
                      <div className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <TrendingUp className="mr-3 h-5 w-5 text-gray-500" />
                        Analytics
                      </div>
                    </Link>
                  </SheetClose>
                </div>
                
                <div className="mt-8 pt-6 border-t space-y-2">
                  <SheetClose asChild>
                    <Link prefetch={true} href="/dashboard/settings" className="block">
                      <div className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Settings className="mr-3 h-5 w-5 text-gray-500" />
                        Settings
                      </div>
                    </Link>
                  </SheetClose>
                </div>
              </div>
              
              <div className="p-4 border-t">
                <UserProfile mini={false} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center font-bold text-lg">
          GovBid AI
        </div>
        
        <UserProfile mini={true} />
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex h-[52px] items-center gap-4 border-b px-6">
        <div className="flex items-center">
          <Link prefetch={true} href="/" className="flex items-center font-semibold text-lg">
            GovBid AI
          </Link>
        </div>
        <div className="flex justify-center items-center gap-2 ml-auto">
          <UserProfile mini={true} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
