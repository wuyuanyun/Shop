import { queryOne, queryAll, execute, uuid, now } from "./sqlite";

export async function sendMessage(data: {
  sender_id: string;
  receiver_id: string;
  content: string;
  product_id?: string | null;
}): Promise<{
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  receiver_id: string;
  receiver_name: string;
  content: string;
  product_id: string | null;
  created_at: string;
}> {
  const id = uuid();
  const time = now();

  await execute(
    `INSERT INTO messages (id, sender_id, receiver_id, content, product_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.sender_id, data.receiver_id, data.content, data.product_id ?? null, time]
  );

  // 获取发送者和接收者信息
  const s = await queryOne<{ username: string; avatar_url: string | null }>(
    "SELECT username, avatar_url FROM profiles WHERE id = ?",
    [data.sender_id]
  );

  const r = await queryOne<{ username: string }>(
    "SELECT username FROM profiles WHERE id = ?",
    [data.receiver_id]
  );

  return {
    id,
    sender_id: data.sender_id,
    sender_name: s?.username ?? "未知",
    sender_avatar: s?.avatar_url ?? null,
    receiver_id: data.receiver_id,
    receiver_name: r?.username ?? "未知",
    content: data.content,
    product_id: data.product_id ?? null,
    created_at: time,
  };
}

export async function getConversation(
  userId: string,
  partnerId: string
): Promise<
  {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string | null;
    receiver_id: string;
    receiver_name: string;
    content: string;
    product_id: string | null;
    created_at: string;
  }[]
> {
  return queryAll<{
    id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string | null;
    receiver_id: string;
    receiver_name: string;
    content: string;
    product_id: string | null;
    created_at: string;
  }>(
    `SELECT m.*,
       s.username as sender_name, s.avatar_url as sender_avatar,
       r.username as receiver_name
     FROM messages m
     JOIN profiles s ON m.sender_id = s.id
     JOIN profiles r ON m.receiver_id = r.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at ASC`,
    [userId, partnerId, partnerId, userId]
  );
}

export async function getConversations(
  userId: string
): Promise<
  {
    partner_id: string;
    partner_name: string;
    partner_avatar: string | null;
    last_message: string;
    last_time: string;
    last_sender_id: string;
  }[]
> {
  // 获取所有与我相关的对话伙伴
  const partners = await queryAll<{
    partner_id: string;
    partner_name: string;
    partner_avatar: string | null;
  }>(
    `SELECT DISTINCT
       CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
       CASE WHEN m.sender_id = ? THEN r.username ELSE s.username END as partner_name,
       CASE WHEN m.sender_id = ? THEN r.avatar_url ELSE s.avatar_url END as partner_avatar
     FROM messages m
     JOIN profiles s ON m.sender_id = s.id
     JOIN profiles r ON m.receiver_id = r.id
     WHERE m.sender_id = ? OR m.receiver_id = ?`,
    [userId, userId, userId, userId, userId]
  );

  // 获取每个对话伙伴的最后一条消息
  const conversations: {
    partner_id: string;
    partner_name: string;
    partner_avatar: string | null;
    last_message: string;
    last_time: string;
    last_sender_id: string;
  }[] = [];

  for (const p of partners) {
    const last = await queryOne<{
      content: string;
      created_at: string;
      sender_id: string;
    }>(
      `SELECT content, created_at, sender_id FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at DESC LIMIT 1`,
      [userId, p.partner_id, p.partner_id, userId]
    );

    if (last) {
      conversations.push({
        partner_id: p.partner_id,
        partner_name: p.partner_name,
        partner_avatar: p.partner_avatar,
        last_message: last.content,
        last_time: last.created_at,
        last_sender_id: last.sender_id,
      });
    }
  }

  return conversations;
}
