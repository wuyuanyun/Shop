import { getCurrentProfile } from "@/lib/auth";
import { TopSearchBar } from "./TopSearchBar";
import { BottomNav } from "./BottomNav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#fafaf9]">
      <TopSearchBar profile={profile} />
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 pt-20 pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
