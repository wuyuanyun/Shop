import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().int().positive("价格必须为正整数"),
  image_url: z.string().url("图片链接格式不正确").optional().nullable(),
});

export const orderSchema = z.object({
  product_id: z.string().uuid("商品 ID 不合法"),
});

export const favoriteSchema = z.object({
  product_id: z.string().uuid("商品 ID 不合法"),
});

export const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少 6 位"),
});

export const registerSchema = loginSchema.extend({
  username: z.string().min(2, "用户名至少 2 个字符").max(30),
});

export const orderStatusSchema = z.object({
  status: z.enum(["shipping", "delivered"]),
});

export type ProductInput = z.infer<typeof productSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
