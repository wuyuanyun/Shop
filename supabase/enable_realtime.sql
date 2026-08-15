-- ============================================================
-- 启用 Supabase Realtime 实时推送（在 Supabase SQL Editor 中执行）
-- ============================================================

-- 1. 将 messages 表加入 supabase_realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 2. 设置 REPLICA IDENTITY 为 FULL，确保订阅时能收到完整行数据
ALTER TABLE messages REPLICA IDENTITY FULL;
