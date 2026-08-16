"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full h-11 px-4 rounded-xl bg-white/60 outline-none text-sm placeholder:text-muted/60 focus:ring-2 focus:ring-brand/30 border border-line/60 transition-all duration-200 focus:border-brand/40";

type Mode = "login" | "register";

export function AuthForm({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** 登录成功后跳回被拦截的目标页（由中间件携带 redirect 参数），默认回首页 */
  const getRedirect = (): string => {
    if (typeof window === "undefined") return "/";
    const target = new URLSearchParams(window.location.search).get("redirect");
    if (target && target.startsWith("/") && !target.startsWith("//")) return target;
    return "/";
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    // 切换模式时清空密码，避免误提交到另一个接口
    setPassword("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email, password, remember }
        : { email, password, username, remember };
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({
        error: "parse_error",
        message: "服务器返回异常，请稍后重试",
      }));
      if (!res.ok) {
        setError(data.message || "操作失败");
        setLoading(false);
        return;
      }
      router.push(mode === "login" ? getRedirect() : "/");
      // 跳转后刷新服务端组件，更新登录态
      setTimeout(() => router.refresh(), 100);
    } catch {
      setError("网络异常，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto"
    >
      <div className="bg-white rounded-3xl border border-line/50 shadow-card p-6 space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-mint/60 mx-auto grid place-items-center mb-3">
            <Leaf size={28} className="text-brand" />
          </div>
          <h1 className="text-xl font-bold text-ink">
            {mode === "login" ? "欢迎回来" : "创建账号"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {mode === "login" ? "登录以继续交易" : "注册即获 100 虚拟币"}
          </p>
        </div>

        {/* 登录 / 注册 Tab */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-mint/50">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition-all duration-200",
                mode === m
                  ? "bg-white text-brand shadow-sm"
                  : "text-muted hover:text-ink"
              )}
            >
              {m === "login" ? "登录" : "注册"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted">用户名</label>
              <input
                className={inputCls}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="给自己起个名字"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">邮箱</label>
            <input
              className={inputCls}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">密码</label>
            <input
              className={inputCls}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "请输入密码" : "至少 8 位"}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded accent-brand"
            />
            <span className="text-xs text-muted">
              记住我（{mode === "login" ? "7 天内免登录" : "注册后保持登录"}）
            </span>
          </label>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-danger text-xs font-medium"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading
              ? "处理中..."
              : mode === "login"
                ? "登录"
                : "注册"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
