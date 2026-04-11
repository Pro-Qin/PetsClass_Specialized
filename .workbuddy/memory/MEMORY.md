# 长期记忆

## 本次更新（2026-04-11）

### 1. 删除学生端和教师端的任务系统
- `js/components/student.js`：删除 TaskPage 组件、导航项、快捷入口、模板引用
- `js/components/teacher.js`：删除 TeacherTasks 组件、任务管理导航项、任务分析 tab、数据分析概览中的任务统计卡片和图表、学生表现表中的任务列
- TeacherApp 轮询计时器简化为仅刷新学生数据，移除任务提交通知

### 2. 班级名默认改为"高一一班"
- `js/data.js` 和 `js/app.js`：所有 demo 数据中的班级名从"三年一班"改为"高一一班"
- `js/components/teacher.js`：新增 TeacherSettings "🏫 班级设置" tab，可编辑班级名称（存 localStorage，key: `className`）
- `js/components/admin.js`：AdminSettings 新增班级名称编辑卡片
- 教师端 TeacherSettings 增加 `props: ['user']`，通过 `user.class` 同步班级名到顶部导航

### 3. 学生选择器按拼音首字母分组
- `groupedPickerStudents` 改为使用 `_getNameInitials()` 获取拼音首字母进行分组（如"小明"→"X"组）
- 修复右侧排行榜面板的重复 style 属性 bug

## Supabase 云端同步接入（2026-04-10）

**项目**：课堂电子宠物系统
**Supabase 项目**：Pro-Qin's Project
**URL**：https://vkjhwawfsmbgkecinylz.supabase.co
**URL**：https://vkjhwawfsmbgkecinylz.supabase.co
**Publishable Key**：`sb_publishable_YJDC9xTY1CFTiwCDBhwJnA_eb_0W3PK`（新版格式，写入 js/supabase.js）

### 接入内容
- `js/supabase.js`：云端同步核心模块（CloudSync 对象）
  - `pushToCloud()`：上传本地数据到云端
  - `pullFromCloud()`：从云端拉取覆盖本地
  - `ping()`：检测连接状态
  - `getLastSyncTime()`：获取上次同步时间
  - `getCloudStats()`：获取云端数据统计
- `js/store.js`：新增 `Store.cloudPush()` / `Store.cloudPull()` 等封装
- `index.html`：引入 `@supabase/supabase-js@2` CDN
- `js/components/admin.js`：新增 `AdminCloud` 组件，菜单新增「☁️ 云端同步」
- `api/supabase-setup.sql`：数据库建表 SQL（需在 Supabase SQL Editor 执行）

### 数据库结构
- `students`：id(BIGINT PK) + data(JSONB) + updated_at
- `tasks`：id(BIGINT PK) + data(JSONB) + updated_at
- `sync_meta`：key(TEXT PK) + value(TEXT)

### 使用步骤
1. Supabase SQL Editor 执行 `api/supabase-setup.sql`
2. 管理员登录 → 「☁️ 云端同步」→ 检测连接
3. 「📤 上传」= 本地→云端；「📥 下载」= 云端→本地（会覆盖）
