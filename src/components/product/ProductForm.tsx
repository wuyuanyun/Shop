"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  ImageIcon,
  DollarSign,
  FileText,
  Type,
  UploadCloud,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";

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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "上传失败");
      setImage(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
          商品图片（可选）
        </label>

        {/* 本地文件上传区域 */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && fileRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !uploading)
              fileRef.current?.click();
          }}
          className="rounded-xl border border-dashed border-line bg-white/40 cursor-pointer hover:border-brand/50 hover:bg-white/60 transition-all duration-200"
        >
          {image_url ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image_url}
                alt="商品图片预览"
                className="w-full h-40 object-cover rounded-xl"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
              {!uploading && (
                <>
                  <button
                    type="button"
                    aria-label="移除图片"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage("");
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                    className="absolute bottom-2 right-2 px-2.5 h-7 rounded-full bg-black/50 text-white text-xs flex items-center gap-1 hover:bg-black/70 transition-colors"
                  >
                    <RefreshCw size={11} />
                    更换
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-muted/70">
              {uploading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span className="text-xs">正在上传...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={20} />
                  <span className="text-xs">点击选择本地图片上传</span>
                  <span className="text-[10px] text-muted/40">
                    JPG / PNG / WebP / GIF，最大 5MB
                  </span>
                </>
              )}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file);
            }}
          />
        </div>

        {/* 手动外链备选 */}
        <input
          className={inputCls}
          value={image_url}
          onChange={(e) => setImage(e.target.value)}
          placeholder="或手动粘贴图片链接 https://..."
        />
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

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={loading || uploading}
      >
        {loading ? "保存中..." : id ? "保存修改" : "发布商品"}
      </Button>
    </motion.form>
  );
}
