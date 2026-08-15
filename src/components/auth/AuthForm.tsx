"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Leaf } from "lucide-react";

const inputCls =
  "w-full h-11 px-4 rounded-xl bg-white/60 outline-none text-sm placeholder:text-muted/60 focus:ring-2 focus:ring-brand/30 border border-line/60 transition-all duration-200 focus:border-brand/40";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const endpoint =
      mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login" ? { email, password } : { email, password, username };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: "parse_error", message: "服务器返回异常，请稍后重试" }));
    if (!res.ok) {
      setError(data.message || "操作失败");
      setLoading(false);
      return;
    }
    router.push("/");
    // refresh after navigation for server component revalidation
    setTimeout(() => router.refresh(), 100);
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
            {mode === "login"
              ? "登录以继续交易"
              : "注册即获 100 虚拟币"}
          </p>
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
            />
          </div>

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

        <p className="text-center text-xs text-muted">
          {mode === "login" ? (
            <>
              还没有账号？{" "}
              <Link href="/register" className="text-brand font-medium">
                去注册
              </Link>
            </>
          ) : (
            <>
              已有账号？{" "}
              <Link href="/login" className="text-brand font-medium">
                去登录
              </Link>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
