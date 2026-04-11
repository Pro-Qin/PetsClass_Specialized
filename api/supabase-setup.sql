-- =============================================
-- 课堂电子宠物系统 · Supabase 数据库初始化脚本
-- =============================================
-- 使用方式：
--   1. 登录 Supabase Dashboard：https://supabase.com/dashboard
--   2. 进入项目 → SQL Editor
--   3. 新建查询，粘贴本脚本，执行
-- =============================================

-- ---------- students 表 ----------
CREATE TABLE IF NOT EXISTS public.students (
  id        BIGINT  PRIMARY KEY,
  data      JSONB   NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- tasks 表 ----------
CREATE TABLE IF NOT EXISTS public.tasks (
  id        BIGINT  PRIMARY KEY,
  data      JSONB   NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- sync_meta 表（记录同步状态）----------
CREATE TABLE IF NOT EXISTS public.sync_meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ---------- 启用 RLS（行级安全）----------
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_meta ENABLE ROW LEVEL SECURITY;

-- ---------- 公开访问策略（本地使用，不验证用户）----------
DROP POLICY IF EXISTS "allow_all_students" ON public.students;
CREATE POLICY "allow_all_students" ON public.students
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_tasks" ON public.tasks;
CREATE POLICY "allow_all_tasks" ON public.tasks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_sync_meta" ON public.sync_meta;
CREATE POLICY "allow_all_sync_meta" ON public.sync_meta
  FOR ALL USING (true) WITH CHECK (true);

-- ---------- 初始同步时间戳 ----------
INSERT INTO public.sync_meta (key, value)
VALUES ('last_sync', NOW()::TEXT)
ON CONFLICT (key) DO NOTHING;

-- ---------- 建表完成提示 ----------
-- 脚本执行完毕后，在 Supabase Dashboard → Table Editor 中可以看到：
--   - students (学生数据)
--   - tasks    (任务数据)
--   - sync_meta (同步元数据)
--
-- 然后回到网页端，进入管理员 → ☁️ 云端同步，点击「🔄 重新检测」验证连接。
