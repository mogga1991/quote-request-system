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
    <div className="flex flex-col">
      <header className="flex h-14 lg:h-[52px] items-center gap-4 border-b px-3 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="min-[1024px]:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>
                <Link prefetch={true} href="/" className="flex items-center font-semibold">
                  GovBid AI
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-3 mt-6">
              <SheetClose asChild>
                <Link prefetch={true} href="/dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <HomeIcon className="mr-2 h-4 w-4" />
                    Opportunities
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link prefetch={true} href="/dashboard/quote-requests">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Quote Requests
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link prefetch={true} href="/dashboard/suppliers">
                  <Button variant="outline" className="w-full justify-start">
                    <Building className="mr-2 h-4 w-4" />
                    Suppliers
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link prefetch={true} href="/dashboard/search">
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    Advanced Search
                  </Button>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link prefetch={true} href="/dashboard/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
              </SheetClose>
              <Separator className="my-3" />
              <SheetClose asChild>
                <Link prefetch={true} href="/dashboard/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
        
        {/* Logo for mobile */}
        <div className="flex items-center lg:hidden">
          <Link prefetch={true} href="/" className="flex items-center font-semibold text-lg">
            GovBid AI
          </Link>
        </div>
        
        <div className="flex justify-center items-center gap-2 ml-auto">
          <UserProfile mini={true} />
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
