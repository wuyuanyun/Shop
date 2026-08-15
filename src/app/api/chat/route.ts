import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAllProducts, getProductById } from "@/lib/db/products";
import { getProfile, updateBalance } from "@/lib/db/profiles";
import { createOrder } from "@/lib/db/orders";

const DASHSCOPE_URL =
  "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen-plus";

const SYSTEM_PROMPT = `你是 ShopFree 虚拟购物平台的 AI 助手，名叫"小Shop"。
你可以帮助用户完成以下操作：
1. 搜索商品（按关键词搜索）
2. 查看用户的账户余额
3. 下单购买指定商品
4. 查看商品详情
5. 列出所有在售商品

平台特点：
- 这是一个虚拟商品交易平台，所有商品均为虚拟物品
- 用户使用平台内余额交易，新用户初始余额为 100
- 下单后自动发货，卖家可以更新物流信息
- 商品价格以整数形式表示（单位：虚拟币）

下单规则（非常重要）：
- 当用户明确说"买""下单""帮我买""我要这个"等购买意图时，直接调用 createOrder 工具下单
- 不需要二次确认，直接执行即可
- 如果用户只说了一个商品名但没有指定ID，先搜索找到对应商品，然后直接下单
- 下单成功后简洁告知用户花了多少钱、剩多少钱
- 如果下单失败，告诉用户具体原因（余额不足、商品已售罄等）

回复风格：
- 友好、热情、简洁，像朋友一样聊天
- 主动引导用户说出需求
- 展示商品时使用清晰格式，包含价格和状态`;

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "searchProducts",
      description: "搜索在售商品，返回匹配的商品列表",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "搜索关键词" },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "checkBalance",
      description: "查询当前登录用户的账户余额",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createOrder",
      description: "为用户下订单购买商品。当用户有明确的购买意图时直接调用此函数，无需先让用户确认。",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "要购买的商品ID" },
          product_title: {
            type: "string",
            description: "商品标题，用于向用户展示购买结果",
          },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getProductDetail",
      description: "查看指定商品的详细信息",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "商品ID" },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listAllProducts",
      description: "列出当前所有在售商品",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "返回的商品数量上限，默认10" },
        },
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<any> {
  switch (name) {
    case "searchProducts": {
      const products = await getAllProducts(args.keyword);
      const onSale = products.filter((p) => p.status === "on_sale").slice(0, 10);
      return {
        count: onSale.length,
        products: onSale.map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          description: p.description?.slice(0, 80) ?? "",
          status: p.status,
          created_at: p.created_at,
        })),
      };
    }

    case "checkBalance": {
      const profile = await getProfile(userId);
      if (!profile) return { error: "查询余额失败" };
      return { username: profile.username, balance: profile.balance };
    }

    case "createOrder": {
      const { product_id } = args;
      console.log("[Chat] createOrder called", { product_id, userId });

      const product = await getProductById(product_id);
      if (!product) {
        console.log("[Chat] createOrder: product not found", product_id);
        return { error: "商品不存在或已下架" };
      }
      if (product.status !== "on_sale") {
        console.log("[Chat] createOrder: product not on sale", product.status);
        return { error: "该商品已售罄" };
      }
      if (product.seller_id === userId) {
        return { error: "不能购买自己的商品哦" };
      }

      const profile = await getProfile(userId);
      if (!profile || profile.balance < product.price) {
        return {
          error: `余额不足！商品「${product.title}」价格 ${product.price}，当前余额 ${profile?.balance ?? 0}`,
        };
      }

      console.log("[Chat] calling createOrder with", { product_id, userId, price: product.price });
      const result = await createOrder(product_id, userId);
      console.log("[Chat] createOrder result:", result);

      if ("error" in result) {
        return { error: `下单失败：${result.error}` };
      }

      const newBalance = profile.balance - product.price;
      return {
        success: true,
        order_id: result.order_id,
        product_title: product.title,
        amount: product.price,
        new_balance: newBalance,
        message: `已成功购买「${product.title}」，花费 ${product.price} 虚拟币，剩余余额 ${newBalance}`,
      };
    }

    case "getProductDetail": {
      const product = await getProductById(args.product_id);
      if (!product) return { error: "商品不存在" };
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        status: product.status,
        description: product.description,
        seller_id: product.seller_id,
        created_at: product.created_at,
      };
    }

    case "listAllProducts": {
      const limit = Math.min(args?.limit ?? 10, 20);
      const products = (await getAllProducts())
        .filter((p) => p.status === "on_sale")
        .slice(0, limit);
      return {
        count: products.length,
        products: products.map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          description: p.description?.slice(0, 60) ?? "",
          created_at: p.created_at,
        })),
      };
    }

    default:
      return { error: `未知工具：${name}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { reply: "请先登录后再使用 AI 助手。", error: "请先登录" },
        { status: 401 }
      );
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: "AI 服务未配置，请联系管理员设置 DASHSCOPE_API_KEY。", error: "AI 服务未配置" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const userMessages: { role: string; content: string }[] =
      body.messages ?? [];
    if (!userMessages.length) {
      return NextResponse.json(
        { reply: "消息不能为空，请输入你的问题。", error: "消息不能为空" },
        { status: 400 }
      );
    }

    const conversationMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages,
    ];

    let maxIterations = 3;
    let finalReply = "";

    while (maxIterations > 0) {
      maxIterations--;

      const response = await fetch(DASHSCOPE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: conversationMessages,
          tools: TOOLS,
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        console.error("DashScope API error:", await response.text());
        return NextResponse.json(
          { reply: "抱歉，AI 服务暂时不可用，请稍后再试。" },
          { status: 200 }
        );
      }

      const result = await response.json();
      const assistantMsg = result.choices?.[0]?.message;

      if (!assistantMsg) {
        return NextResponse.json(
          { reply: "抱歉，未能获取 AI 回复。" },
          { status: 200 }
        );
      }

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        conversationMessages.push(assistantMsg);

        for (const tc of assistantMsg.tool_calls) {
          let args: Record<string, any> = {};
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }

          const toolResult = await executeTool(
            tc.function.name,
            args,
            user.id
          );

          conversationMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(toolResult),
          });
        }
        continue;
      }

      finalReply = assistantMsg.content ?? "";
      break;
    }

    if (!finalReply) {
      finalReply = "抱歉，处理过程稍微复杂，请换个方式告诉我你的需求，我再帮你处理～";
    }

    return NextResponse.json({ reply: finalReply });
  } catch (err) {
    console.error("Chat API error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { reply: "抱歉，出现了一些问题，请稍后再试。" },
      { status: 200 }
    );
  }
}
