export type ProductStatus = "on_sale" | "sold_out";
export type OrderStatus = "pending" | "shipping" | "delivered";

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  password_hash: string | null;
  avatar_url: string | null;
  balance: number;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: OrderStatus;
  logistics_info: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  product_id: string | null;
  created_at: string;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "待发货",
  shipping: "运输中",
  delivered: "已签收",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  on_sale: "在售",
  sold_out: "已售罄",
};
