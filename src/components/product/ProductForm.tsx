"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ImageIcon, DollarSign, FileText, Type } from "lucide-react";

const inputCls =
  "w-full h-11 pl-9 pr-4 rounded-xl bg-white/60 outline-none text-sm placeholder:text-muted/60 focus:ring-2 focus:ring-brand/30 border border-line/60 transition-all duration-200 focus:border-brand/40";

export function ProductForm({
  id,
  initial,
}: {
  id?: string;
  initial?: {
    title: string;
    description: string | null;
    price: number;
    image_url: string | null;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "");
  const [image_url, setImage] = useState(initial?.image_url || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const payload = {
      title,
      description: description || null,
      price: Number(price),
      image_url: image_url || null,
    };
    const res = await fetch(id ? `/api/products/${id}` : "/api/products", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || "保存失败");
      setLoading(false);
      return;
    }
    const pid = id || data?.product?.id || data?.id;
    router.push(`/products/${pid}`);
    router.refresh();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submit}
      className="bg-white rounded-2xl border border-line/50 p-5 space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted flex items-center gap-1.5">
          <Type size={12} />
          商品标题
        </label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：北欧风布艺沙发"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted flex items-center gap-1.5">
          <FileText size={12} />
          商品描述
        </label>
        <textarea
          className={inputCls + " h-28 resize-none pt-2.5"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述一下这件虚拟好物的细节..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <DollarSign size={12} />
            价格（虚拟币）
          </label>
          <input
            className={inputCls}
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="100"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted flex items-center gap-1.5">
            <ImageIcon size={12} />
            图片链接（可选）
          </label>
          <input
            className={inputCls}
            value={image_url}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-danger text-xs font-medium text-center"
        >
          {error}
        </motion.p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "保存中..." : id ? "保存修改" : "发布商品"}
      </Button>
    </motion.form>
  );
}
