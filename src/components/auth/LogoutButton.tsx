"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  return (
    <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
      <LogOut size={18} /> 退出登录
    </Button>
  );
}
