"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { Profile } from "@/lib/types";

async function fetchProfile(): Promise<Profile | null> {
  try {
    const res = await fetch("/api/auth/profile");
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile as Profile;
  } catch {
    return null;
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UserChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  receiver_id: string;
  receiver_name: string;
  content: string;
  product_id: string | null;
  created_at: string;
}

interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  last_message: string;
  last_time: string;
  last_sender_id: string;
}

// ========== AI Assistant Panel ==========
function AIChatPanel({ profile }: { profile: Profile | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        `你好！我是小Shop，你的购物AI助手。\n我可以帮你：\n- 搜索商品（比如"帮我找本书"）\n- 查看余额\n- 下单购买\n- 浏览所有商品\n\n需要我帮你做些什么呢？`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply ?? data.error ?? "抱歉，没有收到有效回复。",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，网络出了点问题，请稍后重试。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: "查余额", text: "我的余额是多少？" },
    { label: "看商品", text: "有哪些在卖的商品？" },
    { label: "搜索", text: "帮我搜搜有什么好书" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot size={16} className="text-brand" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-brand text-white rounded-br-md"
                    : "bg-line text-ink rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && profile && (
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center ml-2 mt-1 shrink-0">
                  <span className="text-xs font-medium text-accent">
                    {profile.username?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => setInput(action.text)}
                disabled={loading}
                className="px-3 py-1.5 text-xs rounded-full border border-brand/25 text-brand bg-brand/5 hover:bg-brand/10 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center mr-2 shrink-0">
              <Bot size={16} className="text-brand" />
            </div>
            <div className="bg-line rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line/50 bg-white/80 glass px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉小Shop你想做什么..."
            disabled={loading}
            className="flex-1 h-10 px-4 rounded-full bg-mint/40 text-sm outline-none placeholder:text-muted/60 disabled:opacity-50 focus:bg-mint/60 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity cursor-pointer"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ========== User Chat Panel ==========
function UserChatPanel({ profile }: { profile: Profile | null }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<UserChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        const data = await res.json();
        setConversations(data.conversations ?? []);
      } catch {
        // ignore
      } finally {
        setConvLoading(false);
      }
    };
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeChat || !profile) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `/api/messages?receiver_id=${activeChat.partner_id}`
        );
        const data = await res.json();
        setChatMessages(data.messages ?? []);
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } catch {
        // ignore
      }
    };
    loadMessages();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/messages?receiver_id=${activeChat.partner_id}`
        );
        const data = await res.json();
        setChatMessages(data.messages ?? []);
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeChat, profile]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !activeChat || !profile) return;
    setInput("");
    setLoading(true);

    const tempId = Date.now().toString();
    setChatMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: profile.id,
        sender_name: profile.username,
        sender_avatar: null,
        receiver_id: activeChat.partner_id,
        receiver_name: activeChat.partner_name,
        content: text,
        product_id: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: activeChat.partner_id,
          content: text,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data.message : m))
        );
        setConversations((prev) =>
          prev.map((c) =>
            c.partner_id === activeChat.partner_id
              ? {
                  ...c,
                  last_message: text,
                  last_time: new Date().toISOString(),
                  last_sender_id: profile.id,
                }
              : c
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMsgTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Conversation list
  if (!activeChat) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-line/50">
          <h2 className="text-sm font-bold text-ink">聊天列表</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted/60" />
            </div>
          ) : conversations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted"
            >
              <div className="w-14 h-14 rounded-2xl bg-mint/50 grid place-items-center mb-3">
                <MessageCircle size={24} className="text-brand/40" />
              </div>
              <p className="text-sm font-medium">暂无聊天记录</p>
              <p className="text-xs mt-1">在商品详情页联系卖家开始对话</p>
            </motion.div>
          ) : (
            conversations.map((conv) => (
              <motion.button
                key={conv.partner_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveChat(conv)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mint/30 transition-colors border-b border-line/50 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-accent">
                    {conv.partner_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-ink truncate">
                      {conv.partner_name}
                    </span>
                    <span className="text-[10px] text-muted shrink-0 ml-2">
                      {formatMsgTime(conv.last_time)}
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">
                    {conv.last_sender_id === profile?.id ? "我：" : ""}
                    {conv.last_message}
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Chat detail
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line/50 bg-white">
        <button
          onClick={() => setActiveChat(null)}
          className="p-1.5 -ml-1 rounded-xl hover:bg-mint/50 transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} className="text-ink" />
        </button>
        <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
          <span className="text-xs font-semibold text-accent">
            {activeChat.partner_name?.charAt(0)?.toUpperCase() ?? "?"}
          </span>
        </div>
        <span className="text-sm font-semibold text-ink">
          {activeChat.partner_name}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {chatMessages.length === 0 ? (
          <p className="text-center text-muted text-sm py-16">
            暂无消息，发送第一条消息开始对话吧
          </p>
        ) : (
          <AnimatePresence>
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender_id === profile?.id ? "justify-end" : "justify-start"}`}
              >
                {msg.sender_id !== profile?.id && (
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <span className="text-[10px] font-semibold text-accent">
                      {msg.sender_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
                <div className="max-w-[75%]">
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-sm ${
                      msg.sender_id === profile?.id
                        ? "bg-brand text-white rounded-br-md"
                        : "bg-line text-ink rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p
                    className={`text-[10px] text-muted mt-0.5 ${
                      msg.sender_id === profile?.id
                        ? "text-right mr-1"
                        : "text-left ml-1"
                    }`}
                  >
                    {formatMsgTime(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line/50 bg-white/80 glass px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 h-10 px-4 rounded-full bg-mint/40 text-sm outline-none placeholder:text-muted/60 focus:bg-mint/60 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ========== Main Chat Page ==========
export default function ChatPage() {
  const [tab, setTab] = useState<"ai" | "chat">("ai");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  return (
    <div className="flex flex-col min-h-full -m-4 sm:-mx-4">
      {/* Tabs */}
      <div className="flex bg-white/80 border-b border-line/50 p-1 gap-1 mx-4 mt-2 mb-0 rounded-2xl">
        {[
          { value: "ai" as const, label: "AI 助手", icon: Sparkles },
          { value: "chat" as const, label: "用户聊天", icon: MessageCircle },
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl cursor-pointer transition-colors duration-200 ${
              tab === value ? "text-brand" : "text-muted hover:text-ink/70"
            }`}
          >
            {tab === value && (
              <motion.div
                layoutId="chat-tab"
                className="absolute inset-0 rounded-xl bg-mint/80"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon size={16} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "ai" ? (
          <AIChatPanel profile={profile} />
        ) : (
          <UserChatPanel profile={profile} />
        )}
      </div>
    </div>
  );
}
