// ===== Supabase 云端同步模块 =====
// 配置信息（用户提供的 Supabase 项目）
const SUPABASE_URL = 'https://vkjhwawfsmbgkecinylz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_YJDC9xTY1CFTiwCDBhwJnA_eb_0W3PK';


// Supabase 客户端单例
let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient) {
    // 动态加载 Supabase SDK（如果还没加载）
    if (typeof window.supabase !== 'undefined') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      console.warn('[Supabase] SDK 未加载，请在 index.html 中引入 supabase.js CDN');
      return null;
    }
  }
  return supabaseClient;
}


// ===== 云端同步核心方法 =====

const CloudSync = {

  // 检测连接状态
  async ping() {
    try {
      const sb = getSupabase();
      if (!sb) return { ok: false, msg: 'SDK 未就绪' };
      const { data, error } = await sb.from('students').select('id').limit(1);
      if (error) throw error;
      return { ok: true, msg: '连接正常' };
    } catch (e) {
      return { ok: false, msg: e.message || '连接失败' };
    }
  },

  // 上传全部数据到云端（覆盖式）
  async pushToCloud() {
    try {
      const sb = getSupabase();
      if (!sb) return { success: false, msg: 'SDK 未就绪' };

      // 1. 准备 students（id + data 列格式）
      const studentsData = JSON.parse(JSON.stringify(Store.state.students)).map(s => ({
        id: s.id,
        data: s,
        updated_at: new Date().toISOString(),
      }));

      // 2. 准备 tasks（id + data 列格式）
      const tasksData = JSON.parse(JSON.stringify(Store.state.tasks)).map(t => ({
        id: t.id,
        data: t,
        updated_at: new Date().toISOString(),
      }));

      // 3. 批量 upsert students
      if (studentsData.length > 0) {
        const { error: sErr } = await sb.from('students').upsert(studentsData, { onConflict: 'id' });
        if (sErr) throw new Error('学生数据上传失败: ' + sErr.message);
      }

      // 4. 批量 upsert tasks
      if (tasksData.length > 0) {
        const { error: tErr } = await sb.from('tasks').upsert(tasksData, { onConflict: 'id' });
        if (tErr) throw new Error('任务数据上传失败: ' + tErr.message);
      }

      // 5. 更新同步时间戳
      const now = new Date().toISOString();
      await sb.from('sync_meta').upsert({ key: 'last_sync', value: now }, { onConflict: 'key' });

      console.log('[CloudSync] 上传成功', { students: studentsData.length, tasks: tasksData.length });
      return { success: true, msg: `上传成功！学生 ${studentsData.length} 条，任务 ${tasksData.length} 条` };
    } catch (e) {
      console.error('[CloudSync] 上传失败:', e);
      return { success: false, msg: e.message || '上传失败' };
    }
  },

  // 从云端拉取数据（覆盖本地）
  async pullFromCloud() {
    try {
      const sb = getSupabase();
      if (!sb) return { success: false, msg: 'SDK 未就绪' };

      // 1. 拉取 students
      const { data: rawStudents, error: sErr } = await sb
        .from('students')
        .select('data')
        .order('id', { ascending: true });

      if (sErr) throw new Error('拉取学生数据失败: ' + sErr.message);

      // 2. 拉取 tasks
      const { data: rawTasks, error: tErr } = await sb
        .from('tasks')
        .select('data')
        .order('id', { ascending: true });

      if (tErr) throw new Error('拉取任务数据失败: ' + tErr.message);

      // 3. 从 data 字段中提取完整对象
      const studentsData = (rawStudents || []).map(r => r.data);
      const tasksData = (rawTasks || []).map(r => r.data);

      // 4. 写入本地 IndexedDB
      await dbStorage.storeStudents(studentsData);
      await dbStorage.storeTasks(tasksData);

      // 5. 更新 Store 内存状态
      Store.state.students.splice(0, Store.state.students.length, ...studentsData);
      Store.state.tasks.splice(0, Store.state.tasks.length, ...tasksData);
      Store.state.taskRev++;
      Store.state.studentRev++;

      // 6. 更新同步时间戳
      const now = new Date().toISOString();
      await sb.from('sync_meta').upsert({ key: 'last_sync', value: now }, { onConflict: 'key' });

      console.log('[CloudSync] 拉取成功', { students: studentsData.length, tasks: tasksData.length });
      return { success: true, msg: `拉取成功！学生 ${studentsData.length} 条，任务 ${tasksData.length} 条` };
    } catch (e) {
      console.error('[CloudSync] 拉取失败:', e);
      return { success: false, msg: e.message || '拉取失败' };
    }
  },

  // 获取上次同步时间
  async getLastSyncTime() {
    try {
      const sb = getSupabase();
      if (!sb) return null;
      const { data, error } = await sb
        .from('sync_meta')
        .select('value')
        .eq('key', 'last_sync')
        .single();
      if (error || !data) return null;
      return data.value;
    } catch (e) {
      return null;
    }
  },

  // 获取云端数据统计
  async getCloudStats() {
    try {
      const sb = getSupabase();
      if (!sb) return null;
      const [sCount, tCount] = await Promise.all([
        sb.from('students').select('id', { count: 'exact', head: true }),
        sb.from('tasks').select('id', { count: 'exact', head: true }),
      ]);
      return {
        students: sCount.count || 0,
        tasks: tCount.count || 0,
      };
    } catch (e) {
      return null;
    }
  },

  // ---- 推送操作记录到云端（覆盖式，最多存1000条）----
  async pushAuditLog(auditLog) {
    try {
      const sb = getSupabase();
      if (!sb) return { success: false, msg: 'SDK 未就绪' };
      const payload = JSON.stringify((auditLog || []).slice(0, 1000));
      const { error } = await sb.from('sync_meta').upsert(
        { key: 'audit_log', value: payload },
        { onConflict: 'key' }
      );
      if (error) throw error;
      console.log('[CloudSync] 操作记录已推送到云端，条数:', (auditLog || []).length);
      return { success: true };
    } catch (e) {
      console.warn('[CloudSync] 推送操作记录失败:', e.message);
      return { success: false, msg: e.message };
    }
  },

  // ---- 从云端拉取操作记录 ----
  async pullAuditLog() {
    try {
      const sb = getSupabase();
      if (!sb) return null;
      const { data, error } = await sb
        .from('sync_meta')
        .select('value')
        .eq('key', 'audit_log')
        .single();
      if (error || !data) return null;
      const logs = JSON.parse(data.value);
      console.log('[CloudSync] 从云端拉取操作记录，条数:', logs.length);
      return Array.isArray(logs) ? logs : null;
    } catch (e) {
      console.warn('[CloudSync] 拉取操作记录失败:', e.message);
      return null;
    }
  },

  // ---- 清空云端操作记录 ----
  async clearCloudAuditLog() {
    try {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from('sync_meta').upsert(
        { key: 'audit_log', value: '[]' },
        { onConflict: 'key' }
      );
    } catch (e) {
      console.warn('[CloudSync] 清空云端操作记录失败:', e.message);
    }
  },
};
