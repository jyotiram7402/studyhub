import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown, Upload } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { SearchInput } from "@/components/layout/search-input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentProfile } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification, Category } from "@/lib/types";

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}

async function getNotifications(
  userId: string
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
  ]);

  return {
    notifications: (data ?? []) as AppNotification[],
    unreadCount: count ?? 0,
  };
}

export async function Navbar() {
  const [profile, categories] = await Promise.all([getCurrentProfile(), getCategories()]);
  const notificationData = profile ? await getNotifications(profile.id) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <MobileMenu categories={categories} isSignedIn={Boolean(profile)} />
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/browse">Browse</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Categories
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <Link href={`/browse?category=${category.id}`}>{category.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <Suspense
            fallback={<div className="hidden h-9 w-full max-w-sm rounded-md border bg-muted/40 sm:block" />}
          >
            <SearchInput className="hidden w-full max-w-sm sm:block" />
          </Suspense>
          <ThemeToggle />
          {profile ? (
            <>
              {notificationData && (
                <NotificationsMenu
                  notifications={notificationData.notifications}
                  unreadCount={notificationData.unreadCount}
                />
              )}
              <Button size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/upload">
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>
              </Button>
              <UserMenu profile={profile} />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
