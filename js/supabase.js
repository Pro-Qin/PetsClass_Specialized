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
  // 头像（avatar/petImage）数据较大（base64），单独存储在 sync_meta.avatars 中
  // 避免 Supabase JSONB 单行超限（单个学生 data 字段不超过 ~1MB）
  async pushToCloud() {
    try {
      const sb = getSupabase();
      if (!sb) return { success: false, msg: 'SDK 未就绪' };

      const rawStudents = JSON.parse(JSON.stringify(Store.state.students));

      // ---- 将头像数据剥离，单独存入 sync_meta ----
      const avatarMap = {};   // { studentId: { avatar, petImage } }
      const studentsData = rawStudents.map(s => {
        const student = { ...s };
        // 提取并记录头像
        if (student.avatar || student.petImage) {
          avatarMap[s.id] = {};
          if (student.avatar)    { avatarMap[s.id].avatar    = student.avatar;    delete student.avatar;    }
          if (student.petImage)  { avatarMap[s.id].petImage  = student.petImage;  delete student.petImage;  }
        }
        return { id: student.id, data: student, updated_at: new Date().toISOString() };
      });

      // 1. 准备 tasks（id + data 列格式）
      const tasksData = JSON.parse(JSON.stringify(Store.state.tasks)).map(t => ({
        id: t.id,
        data: t,
        updated_at: new Date().toISOString(),
      }));

      // 2. 批量 upsert students（不含头像，避免行太大）
      if (studentsData.length > 0) {
        const { error: sErr } = await sb.from('students').upsert(studentsData, { onConflict: 'id' });
        if (sErr) throw new Error('学生数据上传失败: ' + sErr.message);
      }

      // 3. 批量 upsert tasks
      if (tasksData.length > 0) {
        const { error: tErr } = await sb.from('tasks').upsert(tasksData, { onConflict: 'id' });
        if (tErr) throw new Error('任务数据上传失败: ' + tErr.message);
      }

      // 4. 头像单独存入 sync_meta.avatars
      const avatarCount = Object.keys(avatarMap).length;
      if (avatarCount > 0) {
        const { error: aErr } = await sb.from('sync_meta').upsert(
          { key: 'avatars', value: JSON.stringify(avatarMap) },
          { onConflict: 'key' }
        );
        if (aErr) {
          // 头像上传失败不中断主流程，只记录警告
          console.warn('[CloudSync] 头像上传失败（数据可能过大）:', aErr.message);
        } else {
          console.log('[CloudSync] 头像已上传，含头像学生数:', avatarCount);
        }
      }

      // 5. 更新同步时间戳
      const now = new Date().toISOString();
      await sb.from('sync_meta').upsert({ key: 'last_sync', value: now }, { onConflict: 'key' });

      console.log('[CloudSync] 上传成功', { students: studentsData.length, tasks: tasksData.length, avatars: avatarCount });
      return {
        success: true,
        msg: `上传成功！学生 ${studentsData.length} 条，任务 ${tasksData.length} 条${avatarCount > 0 ? `，头像 ${avatarCount} 个` : ''}`,
      };
    } catch (e) {
      console.error('[CloudSync] 上传失败:', e);
      return { success: false, msg: e.message || '上传失败' };
    }
  },

  // 从云端拉取数据（覆盖本地）
  // 头像（avatar/petImage）单独存在 sync_meta.avatars，拉取后合并回 students
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
      let studentsData = (rawStudents || []).map(r => r.data);
      const tasksData = (rawTasks || []).map(r => r.data);

      // 4. 拉取并合并头像数据
      let avatarCount = 0;
      try {
        const { data: avatarMeta } = await sb
          .from('sync_meta')
          .select('value')
          .eq('key', 'avatars')
          .single();
        if (avatarMeta && avatarMeta.value) {
          const avatarMap = JSON.parse(avatarMeta.value);
          studentsData = studentsData.map(s => {
            const avatarData = avatarMap[s.id] || avatarMap[String(s.id)];
            if (avatarData) {
              avatarCount++;
              return { ...s, ...avatarData }; // 合并 avatar / petImage
            }
            return s;
          });
          console.log('[CloudSync] 已合并头像数据，含头像学生数:', avatarCount);
        }
      } catch (e) {
        // 头像拉取失败不中断主流程
        console.warn('[CloudSync] 头像数据拉取失败（忽略）:', e.message);
      }

      // 5. 写入本地 IndexedDB
      await dbStorage.storeStudents(studentsData);
      await dbStorage.storeTasks(tasksData);

      // 6. 更新 Store 内存状态
      Store.state.students.splice(0, Store.state.students.length, ...studentsData);
      Store.state.tasks.splice(0, Store.state.tasks.length, ...tasksData);
      Store.state.taskRev++;
      Store.state.studentRev++;

      // 7. 更新同步时间戳
      const now = new Date().toISOString();
      await sb.from('sync_meta').upsert({ key: 'last_sync', value: now }, { onConflict: 'key' });

      console.log('[CloudSync] 拉取成功', { students: studentsData.length, tasks: tasksData.length, avatars: avatarCount });
      return {
        success: true,
        msg: `拉取成功！学生 ${studentsData.length} 条，任务 ${tasksData.length} 条${avatarCount > 0 ? `，已恢复 ${avatarCount} 个头像` : ''}`,
      };
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

  // ---- 仅推送头像到云端（不影响其他数据）----
  async pushAvatarsOnly() {
    try {
      const sb = getSupabase();
      if (!sb) return { success: false, msg: 'SDK 未就绪' };

      const avatarMap = {};
      Store.state.students.forEach(s => {
        if (s.avatar || s.petImage) {
          avatarMap[s.id] = {};
          if (s.avatar)   avatarMap[s.id].avatar   = s.avatar;
          if (s.petImage) avatarMap[s.id].petImage  = s.petImage;
        }
      });

      const count = Object.keys(avatarMap).length;
      if (count === 0) return { success: true, msg: '当前没有学生有头像，无需上传', count: 0 };

      const { error } = await sb.from('sync_meta').upsert(
        { key: 'avatars', value: JSON.stringify(avatarMap) },
        { onConflict: 'key' }
      );
      if (error) throw new Error('头像上传失败: ' + error.message);

      console.log('[CloudSync] 头像专项上传成功，数量:', count);
      return { success: true, msg: `头像上传成功！已备份 ${count} 个学生头像`, count };
    } catch (e) {
      console.error('[CloudSync] 头像上传失败:', e);
      return { success: false, msg: e.message || '头像上传失败' };
    }
  },

  // ---- 仅从云端恢复头像（不影响其他数据）----
  async pullAvatarsOnly() {
    try {
      const sb = getSupabase();
      if (!sb) return { success: false, msg: 'SDK 未就绪' };

      const { data: avatarMeta, error } = await sb
        .from('sync_meta')
        .select('value')
        .eq('key', 'avatars')
        .single();

      if (error || !avatarMeta || !avatarMeta.value) {
        return { success: false, msg: '云端没有头像数据，请先在旧环境推送头像' };
      }

      const avatarMap = JSON.parse(avatarMeta.value);
      const keys = Object.keys(avatarMap);
      if (keys.length === 0) return { success: false, msg: '云端头像数据为空' };

      // 将头像合并回本地 students
      let restored = 0;
      Store.state.students.forEach(s => {
        const avatarData = avatarMap[s.id] || avatarMap[String(s.id)];
        if (avatarData) {
          if (avatarData.avatar)   s.avatar   = avatarData.avatar;
          if (avatarData.petImage) s.petImage  = avatarData.petImage;
          restored++;
        }
      });

      // 持久化到 IndexedDB
      await dbStorage.storeStudents(Store.state.students);
      Store.state.studentRev++;

      console.log('[CloudSync] 头像恢复成功，数量:', restored);
      return { success: true, msg: `头像恢复成功！已恢复 ${restored}/${keys.length} 个学生头像`, restored, total: keys.length };
    } catch (e) {
      console.error('[CloudSync] 头像恢复失败:', e);
      return { success: false, msg: e.message || '头像恢复失败' };
    }
  },

  // ---- 获取云端头像统计 ----
  async getAvatarStats() {
    try {
      const sb = getSupabase();
      if (!sb) return null;
      const { data, error } = await sb
        .from('sync_meta')
        .select('value')
        .eq('key', 'avatars')
        .single();
      if (error || !data || !data.value) return { count: 0 };
      const avatarMap = JSON.parse(data.value);
      return { count: Object.keys(avatarMap).length };
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
