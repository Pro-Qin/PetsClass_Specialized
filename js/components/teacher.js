// ===== 教师端 完整组件 =====

// ---------- 教师主页（概览） ----------
const TeacherDashboard = {
  name: 'TeacherDashboard',
  props: ['teacher'],
  data() {
    return {
      pointsStudent: null, // 当前查看积分记录的学生
    };
  },
  computed: {
    students() { void Store.state.studentRev; return Store.state.students; },
    totalStudents() { return this.students.length; },
    topStudent() {
      return [...this.students].sort((a,b) => (b.points||0) - (a.points||0))[0] || null;
    },
    classStats() {
      const total = this.students.length;
      const withPet = this.students.filter(s => s.petType).length;
      const avgPoints = total > 0
        ? Math.round(this.students.reduce((sum, s) => sum + (s.points||0), 0) / total)
        : 0;
      return { total, withPet, avgPoints };
    },
    pointsHistory() {
      if (!this.pointsStudent) return [];
      const s = Store.state.students.find(st => st.id === this.pointsStudent.id);
      if (!s) return [];
      if (s.pointsLog && s.pointsLog.length) return [...s.pointsLog].reverse();
      return [];
    },
  },
  methods: {
    getStudentPetEmoji,
    openPointsDetail(student) {
      this.pointsStudent = student;
    },
  },
  template: `
    <div class="animate-pageIn">
      <div class="teacher-header">
        <div class="teacher-page-title">📊 班级总览</div>
        <div style="font-size:13px;color:var(--text-light);">{{ teacher.class }} · {{ teacher.name }}</div>
      </div>

      <!-- 统计卡片 -->
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-icon-box" style="background:#FFF0F8;">👨‍🎓</div>
          <div>
            <div class="stat-label">学生总数</div>
            <div class="stat-value">{{ totalStudents }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-box" style="background:#EDE7F6;">⭐</div>
          <div>
            <div class="stat-label">平均积分</div>
            <div class="stat-value">{{ classStats.avgPoints }}</div>
          </div>
        </div>
      </div>

      <div class="dashboard-panels">
        <!-- 积分排行（主面板） -->
        <div class="card" style="padding:20px;">
          <div style="font-weight:800;font-size:16px;margin-bottom:14px;">🏆 积分排行
            <span style="font-size:12px;color:var(--text-light);font-weight:400;margin-left:6px;">点击查看积分记录</span>
          </div>
          <div style="overflow-y:auto;max-height:300px;scrollbar-width:thin;scrollbar-color:var(--primary) #F0E8FF;">
            <div v-for="(s, i) in [...students].sort((a,b)=>(b.points||0)-(a.points||0))" :key="s.id"
                 @click="openPointsDetail(s)"
                 style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;border-radius:8px;transition:background 0.15s;"
                 onmouseover="this.style.background='#F8F0FF'" onmouseout="this.style.background='transparent'">
              <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0;"
                   :style="i===0?'background:#FFD700;color:white':i===1?'background:#C0C0C0;color:white':i===2?'background:#CD7F32;color:white':'background:#F5F5F5;color:#888'">
                {{ i+1 }}
              </div>
              <span style="font-size:22px;flex-shrink:0;">{{ getStudentPetEmoji(s) }}</span>
              <div style="flex:1;font-weight:700;font-size:14px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ s.name }}</div>
              <div style="font-weight:800;color:var(--warning);flex-shrink:0;">⭐{{ s.points||0 }}</div>
              <span style="font-size:12px;color:var(--primary);opacity:0.6;flex-shrink:0;">›</span>
            </div>
          </div>
        </div>

        <!-- 班级宠物概览 -->
        <div class="card" style="padding:20px;">
          <div style="font-weight:800;font-size:16px;margin-bottom:14px;">🐾 宠物概览</div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#FFF0F8;border-radius:10px;">
              <span style="font-size:13px;color:var(--text-mid);">已领养宠物</span>
              <span style="font-size:18px;font-weight:800;color:#FF6B9D;">{{ classStats.withPet }} / {{ classStats.total }}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#EDE7F6;border-radius:10px;">
              <span style="font-size:13px;color:var(--text-mid);">平均积分</span>
              <span style="font-size:18px;font-weight:800;color:#7C4DFF;">{{ classStats.avgPoints }}</span>
            </div>
            <div v-if="topStudent" style="display:flex;align-items:center;gap:10px;padding:10px;background:linear-gradient(135deg,#FFF8E1,#FFF3CD);border-radius:10px;">
              <span style="font-size:28px;">{{ getStudentPetEmoji(topStudent) }}</span>
              <div>
                <div style="font-size:12px;color:var(--text-light);">🏆 积分冠军</div>
                <div style="font-size:14px;font-weight:800;color:#E65100;">{{ topStudent.name }} · ⭐{{ topStudent.points }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 积分记录弹窗 -->
      <div v-if="pointsStudent" class="modal-overlay" @click.self="pointsStudent=null">
        <div class="modal-box" style="max-width:420px;max-height:80vh;display:flex;flex-direction:column;">
          <!-- 头部 -->
          <div style="background:linear-gradient(135deg,#FF9800,#FFB74D);border-radius:16px 16px 0 0;margin:-20px -20px 0;padding:20px;color:white;flex-shrink:0;">
            <div style="font-size:32px;margin-bottom:4px;">{{ getStudentPetEmoji(pointsStudent) }}</div>
            <div style="font-size:18px;font-weight:800;">{{ pointsStudent.name }} 的积分记录</div>
            <div style="font-size:13px;opacity:0.9;margin-top:4px;">当前积分：⭐ {{ pointsStudent.points || 0 }}</div>
          </div>

          <!-- 记录列表 -->
          <div style="overflow-y:auto;flex:1;padding-top:16px;margin-top:4px;">
            <div v-if="pointsHistory.length===0"
                 style="text-align:center;color:var(--text-light);font-size:14px;padding:30px 0;">
              暂无积分记录
            </div>
            <div v-for="(log, idx) in pointsHistory" :key="idx"
                 style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F5F0FF;">
              <div style="width:36px;height:36px;border-radius:50%;background:#F8F0FF;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
                {{ log.icon }}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ log.label }}</div>
                <div style="font-size:11px;color:var(--text-light);">{{ log.time }}</div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:15px;font-weight:800;" :style="{color: log.delta>0 ? '#4CAF50' : '#F44336'}">
                  {{ log.delta > 0 ? '+' : '' }}{{ log.delta }}
                </div>
                <div v-if="log.total !== '-'" style="font-size:11px;color:var(--text-light);">共{{ log.total }}分</div>
              </div>
            </div>
          </div>

          <!-- 底部关闭 -->
          <div style="padding-top:14px;flex-shrink:0;">
            <button class="btn btn-ghost" style="width:100%;" @click="pointsStudent=null">关闭</button>
          </div>
        </div>
      </div>
    </div>
  `
};

// ---------- 学生管理 ----------
const TeacherStudents = {
  name: 'TeacherStudents',
  emits: ['toast'],
  data() {
    return {
      _rev: 0,                  // 版本计数器，增删改后强制 computed 重算
      searchText: '',
      showAddModal: false,
      showGrantModal: false,
      showDeductModal: false,   // 扣分弹窗
      grantStudent: null,
      grantPoints: 20,
      grantReason: '',
      deductStudent: null,      // 扣分对象
      deductPoints: 10,         // 默认扣10分
      deductReason: '',
      newStudent: { name:'', username:'', class:'' },
      showConfirmDelete: false,
      deleteStudentId: null,
    };
  },
  computed: {
    students() {
      void this._rev;  // 依赖追踪，_rev 变化时强制重算
      const q = this.searchText.toLowerCase();
      return Store.state.students.filter(s =>
        s.name.includes(q) || s.username.toLowerCase().includes(q) || (s.class||'').includes(q)
      ).sort((a, b) => {
        // 按姓氏（姓名首字）拼音排序
        return a.name.charCodeAt(0) - b.name.charCodeAt(0);
      }).map(s => ({
        ...s,
        petEmoji: getStudentPetEmoji(s),
        levelInfo: getLevelInfo(s.petExp||0),
      }));
    },
  },
  methods: {
    async addStudent() {
      const { name, username, class: cls } = this.newStudent;
      if (!name || !username) {
        this.$emit('toast', '请填写姓名和账号', 'warning'); return;
      }
      const result = await Store.addStudent({ name, username, class: cls });
      if (result.success) {
        this.$emit('toast', `✅ 学生 ${name} 添加成功`, 'success');
        this.showAddModal = false;
        this.newStudent = { name:'', username:'', class:'高一一班' };
        this._rev++;
      } else {
        this.$emit('toast', result.msg, 'error');
      }
    },
    openGrant(student) {
      this.grantStudent = student;
      this.grantPoints = 20;
      this.grantReason = '';
      this.showGrantModal = true;
    },
    async doGrant() {
      if (!this.grantPoints || this.grantPoints <= 0) {
        this.$emit('toast', '请输入有效积分数', 'warning'); return;
      }
      const result = await Store.grantPoints(this.grantStudent.id, Number(this.grantPoints), this.grantReason || `老师奖励了 ${this.grantPoints} 积分`);
      if (result.success) {
        this.$emit('toast', `✅ 已给 ${this.grantStudent.name} 发放 ${this.grantPoints} 积分`, 'success');
        this.showGrantModal = false;
        this._rev++;
      } else {
        this.$emit('toast', result.msg || '发放积分失败', 'error');
      }
    },
    openDeduct(student) {
      this.deductStudent = student;
      this.deductPoints = 10;
      this.deductReason = '';
      this.showDeductModal = true;
    },
    async doDeduct() {
      if (!this.deductPoints || this.deductPoints <= 0) {
        this.$emit('toast', '请输入有效扣分数', 'warning'); return;
      }
      const result = await Store.deductPoints(
        this.deductStudent.id,
        Number(this.deductPoints),
        this.deductReason || `课堂违规扣除 ${this.deductPoints} 积分`
      );
      if (result.success) {
        this.$emit('toast', `⚠️ 已扣除 ${this.deductStudent.name} ${result.deducted} 积分`, 'warning');
        this.showDeductModal = false;
        this._rev++;
      } else {
        this.$emit('toast', result.msg, 'error');
      }
    },
    confirmDelete(id) {
      this.deleteStudentId = id;
      this.showConfirmDelete = true;
    },
    async doDelete() {
      const result = await Store.deleteStudent(this.deleteStudentId);
      if (result.success) {
        this.$emit('toast', '已删除该学生', 'success');
      } else {
        this.$emit('toast', '删除失败', 'error');
      }
      this.showConfirmDelete = false;
      this._rev++;
    },
    exportCSV() {
      const headers = ['姓名','账号','班级','积分','宠物','等级','加入日期'];
      const rows = Store.state.students.map(s => [
        s.name, s.username, s.class||'', s.points||0,
        s.petName||'-', getLevelInfo(s.petExp||0).name, s.joinDate||'-'
      ]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '班级学生名单.csv';
      a.click();
      this.$emit('toast', '📥 导出成功！', 'success');
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    async handleFileImport(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        const names = content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (names.length === 0) {
          this.$emit('toast', '文件内容为空', 'warning');
          return;
        }

        try {
          for (const name of names) {
            // 自动生成账号（使用姓名的拼音或首字母）
            const username = name.toLowerCase().replace(/\s+/g, '');
            // 生成随机ID
            const id = Date.now() + Math.floor(Math.random() * 1000);
            // 自动为每个学生创建默认宠物"小火龙"
            const petName = `${name}的宠物`;
            
            // 添加学生
            const result = await Store.addStudent({
              name,
              username,
              class: '高一一班'
            });

            // 为学生创建默认宠物
            if (result.success && result.student) {
              await Store.adoptPet(result.student.id, 'dragon', petName);
            }
          }
          this.$emit('toast', `✅ 成功导入 ${names.length} 名学生`, 'success');
          this._rev++;
        } catch (error) {
          this.$emit('toast', '导入失败：' + error.message, 'error');
        }
      };
      reader.onerror = () => {
        this.$emit('toast', '文件读取失败', 'error');
      };
      reader.readAsText(file, 'utf-8');
      // 重置文件输入，以便可以重复选择同一个文件
      event.target.value = '';
    },
  },
  template: `
    <div class="animate-pageIn">
      <div class="teacher-header">
        <div class="teacher-page-title">👨‍🎓 学生管理</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" @click="exportCSV">📥 导出</button>
          <button class="btn btn-ghost btn-sm" @click="triggerFileInput">📤 批量导入</button>
          <input type="file" ref="fileInput" style="display:none" accept=".txt" @change="handleFileImport" />
          <button class="btn btn-primary btn-sm" @click="showAddModal=true">➕ 添加</button>
        </div>
      </div>

      <!-- 搜索 -->
      <div style="position:relative;margin-bottom:16px;">
        <input class="input-field" v-model="searchText" placeholder="🔍 搜索姓名/账号/班级..." style="padding-left:40px;" />
        <span style="position:absolute;left:14px;top:12px;font-size:16px;">🔍</span>
      </div>

      <!-- 学生卡片列表（响应式多栏网格） -->
      <div class="teacher-student-grid">
        <div v-for="s in students" :key="s.id" class="card" style="padding:14px 16px;">
          <!-- 头像+姓名+积分 -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
            <span style="font-size:36px;flex-shrink:0;">{{ s.petEmoji }}</span>
            <div style="flex:1;min-width:0;">
              <div style="font-size:15px;font-weight:800;">{{ s.name }}</div>
              <div style="font-size:12px;color:var(--text-light);">{{ s.class }} · {{ s.username }}</div>
              <div style="font-size:11px;color:var(--text-light);">加入 {{ s.joinDate }}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="color:var(--warning);font-weight:800;font-size:16px;">⭐{{ s.points||0 }}</div>
              <span v-if="s.petType" class="badge badge-success" style="font-size:11px;">Lv.{{ s.levelInfo.level }} {{ s.levelInfo.name }}</span>
              <span v-else class="badge badge-warning" style="font-size:11px;">未领宠物</span>
            </div>
          </div>
          <!-- 宠物名 + 操作按钮 -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <div style="font-size:12px;color:var(--text-mid);">🐾 {{ s.petName || '未领取宠物' }}</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button class="btn btn-warning btn-sm" @click="openGrant(s)">⭐</button>
              <button class="btn btn-sm" style="background:#FF9800;color:white;border:none;" @click="openDeduct(s)">⬇️</button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete(s.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加学生弹窗 -->
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal=false">
        <div class="modal-box">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:16px;">➕ 添加学生</h3>
          <div class="input-group">
            <label>姓名</label>
            <input class="input-field" v-model="newStudent.name" placeholder="学生真实姓名" />
          </div>
          <div class="input-group">
            <label>账号</label>
            <input class="input-field" v-model="newStudent.username" placeholder="登录账号" />
          </div>
          <div class="input-group">
            <label>班级</label>
            <input class="input-field" v-model="newStudent.class" placeholder="例如：三年二班" />
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-ghost" style="flex:1" @click="showAddModal=false">取消</button>
            <button class="btn btn-primary" style="flex:2" @click="addStudent">✅ 添加</button>
          </div>
        </div>
      </div>

      <!-- 发分弹窗 -->
      <div v-if="showGrantModal && grantStudent" class="modal-overlay" @click.self="showGrantModal=false">
        <div class="modal-box">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:6px;">⭐ 发放积分</h3>
          <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">给 {{ grantStudent.name }} 发放积分奖励</p>
          <div class="input-group">
            <label>积分数量</label>
            <input class="input-field" type="number" v-model="grantPoints" min="1" max="500" />
          </div>
          <div class="input-group">
            <label>发放理由（可选）</label>
            <input class="input-field" v-model="grantReason" placeholder="例如：课堂表现优秀" />
          </div>
          <!-- 快捷积分 -->
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
            <button v-for="pts in [10,20,30,50,100]" :key="pts" class="btn btn-ghost btn-sm" @click="grantPoints=pts">+{{ pts }}</button>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-ghost" style="flex:1" @click="showGrantModal=false">取消</button>
            <button class="btn btn-success" style="flex:2" @click="doGrant">✅ 发放 {{ grantPoints }} 积分</button>
          </div>
        </div>
      </div>

      <!-- 扣分弹窗 -->
      <div v-if="showDeductModal && deductStudent" class="modal-overlay" @click.self="showDeductModal=false">
        <div class="modal-box">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:6px;color:#FF9800;">⬇️ 扣除积分</h3>
          <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">
            对 <strong>{{ deductStudent.name }}</strong> 扣除积分（当前：⭐{{ deductStudent.points||0 }}）
          </p>
          <div class="input-group">
            <label>扣除数量</label>
            <input class="input-field" type="number" v-model="deductPoints" min="1" :max="deductStudent.points||0" />
          </div>
          <div class="input-group">
            <label>扣分原因（将通知学生）</label>
            <input class="input-field" v-model="deductReason" placeholder="例如：课堂违纪、作业未完成" />
          </div>
          <!-- 快捷扣分 -->
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
            <button v-for="pts in [5,10,20,30,50]" :key="pts" class="btn btn-ghost btn-sm" @click="deductPoints=pts"
                    style="color:#FF9800;border-color:#FF9800;">-{{ pts }}</button>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-ghost" style="flex:1" @click="showDeductModal=false">取消</button>
            <button class="btn btn-danger" style="flex:2;background:#FF9800;border-color:#FF9800;" @click="doDeduct">
              ⬇️ 确认扣除 {{ deductPoints }} 积分
            </button>
          </div>
        </div>
      </div>

      <!-- 删除确认 -->
      <div v-if="showConfirmDelete" class="modal-overlay" @click.self="showConfirmDelete=false">
        <div class="modal-box" style="text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
          <h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">确认删除？</h3>
          <p style="color:var(--text-light);font-size:14px;margin-bottom:20px;">删除后无法恢复，该学生的所有数据将被清除。</p>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-ghost" style="flex:1" @click="showConfirmDelete=false">取消</button>
            <button class="btn btn-danger" style="flex:1" @click="doDelete">确认删除</button>
          </div>
        </div>
      </div>
    </div>
  `
};

// ---------- 排行榜（教师视角） ----------
const TeacherRank = {
  name: 'TeacherRank',
  computed: {
    rankList() {
      return [...Store.state.students]
        .sort((a, b) => (b.points||0) - (a.points||0))
        .map((s, i) => ({
          ...s,
          rank: i + 1,
          petEmoji: getStudentPetEmoji(s),
          levelInfo: getLevelInfo(s.petExp||0),
          mood: getStudentMood(s.petStatus),
        }));
    }
  },
  template: `
    <div class="animate-pageIn">
      <div class="teacher-page-title" style="margin-bottom:20px;">🏆 班级排行榜</div>
      <div class="teacher-rank-grid">
        <div v-for="s in rankList" :key="s.id" class="card" style="padding:14px 16px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <!-- 排名徽章 -->
            <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;"
                 :style="s.rank===1?'background:#FFD700;color:white':s.rank===2?'background:#C0C0C0;color:white':s.rank===3?'background:#CD7F32;color:white':'background:#F5F5F5;color:#666'">
              {{ s.rank <= 3 ? ['👑','🥈','🥉'][s.rank-1] : s.rank }}
            </div>
            <!-- 宠物头像 -->
            <span style="font-size:34px;flex-shrink:0;">{{ s.petEmoji }}</span>
            <!-- 信息区 -->
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:15px;font-weight:800;">{{ s.name }}</span>
                <span style="font-size:12px;color:var(--text-light);">{{ s.class }}</span>
                <span class="badge badge-success" style="font-size:11px;">Lv.{{ s.levelInfo.level }} {{ s.levelInfo.name }}</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap;">
                <span style="font-size:12px;" :style="{color: s.petStatus?.health>=70?'#4CAF50':s.petStatus?.health>=40?'#FF9800':'#F44336'}">❤️ {{ s.petStatus?.health||0 }}</span>
                <span style="font-size:12px;color:#FF9800;">🍗 {{ s.petStatus?.hungry||0 }}</span>
                <span style="font-size:12px;">{{ s.mood.emoji }}</span>
                <span style="font-size:11px;color:var(--text-light);">{{ s.petExp||0 }} exp</span>
              </div>
            </div>
            <!-- 积分 -->
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:18px;font-weight:800;color:var(--warning);">⭐{{ s.points||0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

// ---------- 数据分析模块 ----------
const TeacherAnalytics = {
  name: 'TeacherAnalytics',
  emits: ['toast'],
  data() {
    return {
      activeTab: 'overview', // overview / students / subjects
      selectedStudent: null,
      dateRange: 'week', // week / month / semester
      showExportModal: false,
      exportFormat: 'csv', // csv / excel
      charts: {},
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts();
    });
  },
  watch: {
    activeTab() {
      this.$nextTick(() => {
        this.initCharts();
      });
    },
  },
  methods: {
    initCharts() {
      this.destroyCharts();
      if (this.activeTab === 'overview') {
        this.initOverviewCharts();
      } else if (this.activeTab === 'students') {
        this.initStudentCharts();
      } else if (this.activeTab === 'subjects') {
        this.initSubjectCharts();
      }
    },
    destroyCharts() {
      Object.values(this.charts).forEach(chart => {
        if (chart) chart.destroy();
      });
      this.charts = {};
    },
    initOverviewCharts() {
      // 积分分布图表
      const pointsCtx = document.getElementById('pointsChart');
      if (pointsCtx) {
        const topStudents = this.studentPerformanceData.slice(0, 5);
        this.charts.points = new Chart(pointsCtx, {
          type: 'bar',
          data: {
            labels: topStudents.map(s => s.name),
            datasets: [{
              label: '积分',
              data: topStudents.map(s => s.points),
              backgroundColor: '#F59E0B',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    },
    initStudentCharts() {
      const studentCtx = document.getElementById('studentPerformanceChart');
      if (studentCtx) {
        const topStudents = this.studentPerformanceData.slice(0, 5);
        this.charts.studentPerformance = new Chart(studentCtx, {
          type: 'radar',
          data: {
            labels: topStudents.map(s => s.name),
            datasets: [{
              label: '积分',
              data: topStudents.map(s => s.points),
              backgroundColor: 'rgba(124, 58, 237, 0.2)',
              borderColor: '#7C3AED',
              pointBackgroundColor: '#7C3AED'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    },
    initSubjectCharts() {
      const subjectCtx = document.getElementById('subjectDistributionChart');
      if (subjectCtx) {
        this.charts.subjectDistribution = new Chart(subjectCtx, {
          type: 'pie',
          data: {
            labels: this.subjectDistributionData.map(s => s.subject),
            datasets: [{
              data: this.subjectDistributionData.map(s => s.count),
              backgroundColor: [
                '#7C3AED', '#F59E0B', '#10B981', '#3B82F6',
                '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    },
    exportData() {
      if (this.exportFormat === 'csv') {
        this.exportCSV();
      } else {
        this.exportExcel();
      }
      this.showExportModal = false;
      this.$emit('toast', '📥 数据导出成功！', 'success');
    },
    exportCSV() {
      // 导出CSV格式数据
      const headers = ['姓名', '班级', '积分', '宠物等级'];
      const rows = this.studentPerformanceData.map(student => [
        student.name,
        student.class,
        student.points,
        student.petLevel,
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '学生学习数据.csv';
      a.click();
    },
    exportExcel() {
      // 简化实现，实际项目中可以使用更专业的库
      this.exportCSV();
    },
    viewStudentDetail(student) {
      this.selectedStudent = student;
    },
    getLevelInfo,
  },
  computed: {
    students() {
      return Store.state.students;
    },
    tasks() {
      return Store.state.tasks;
    },
    // 概览数据
    overviewData() {
      const totalStudents = this.students.length;
      const totalPoints = this.students.reduce((sum, student) => sum + (student.points || 0), 0);
      const avgPoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;
      
      return {
        totalStudents,
        totalPoints,
        avgPoints,
      };
    },
    // 学生表现数据
    studentPerformanceData() {
      return this.students.map(student => {
        const levelInfo = getLevelInfo(student.petExp || 0);
        return {
          id: student.id,
          name: student.name,
          class: student.class,
          points: student.points || 0,
          petLevel: levelInfo.level,
        };
      }).sort((a, b) => b.points - a.points);
    },
    // 学科分布数据
    subjectDistributionData() {
      const subjectStats = {};
      
      this.tasks.forEach(task => {
        if (!subjectStats[task.subject]) {
          subjectStats[task.subject] = {
            count: 0,
            totalPoints: 0,
            completedSubmissions: 0,
            totalSubmissions: 0,
          };
        }
        
        subjectStats[task.subject].count++;
        subjectStats[task.subject].totalPoints += task.points;
        
        task.submissions.forEach(sub => {
          subjectStats[task.subject].totalSubmissions++;
          if (sub.status === 'completed') {
            subjectStats[task.subject].completedSubmissions++;
          }
        });
      });
      
      return Object.entries(subjectStats).map(([subject, stats]) => ({
        subject,
        ...stats,
        completionRate: stats.totalSubmissions > 0 ? Math.round((stats.completedSubmissions / stats.totalSubmissions) * 100) : 0,
      }));
    },
  },
  template: `
    <div class="animate-pageIn">
      <div class="teacher-header">
        <div class="teacher-page-title">📈 学生学习数据分析</div>
        <button class="btn btn-primary btn-sm" @click="showExportModal=true">📥 导出数据</button>
      </div>

      <!-- 标签页 -->
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <button class="btn btn-sm" :class="activeTab==='overview'?'btn-primary':'btn-ghost'" @click="activeTab='overview'">📊 概览</button>
        <button class="btn btn-sm" :class="activeTab==='students'?'btn-primary':'btn-ghost'" @click="activeTab='students'">👨‍🎓 学生表现</button>
        <button class="btn btn-sm" :class="activeTab==='subjects'?'btn-primary':'btn-ghost'" @click="activeTab='subjects'">📚 学科分布</button>
      </div>

      <!-- 概览页面 -->
      <div v-if="activeTab === 'overview'">
        <!-- 统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-icon-box" style="background:#FFF0F8;">👨‍🎓</div>
            <div>
              <div class="stat-label">学生总数</div>
              <div class="stat-value">{{ overviewData.totalStudents }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-box" style="background:#EDE7F6;">⭐</div>
            <div>
              <div class="stat-label">平均积分</div>
              <div class="stat-value">{{ overviewData.avgPoints }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-box" style="background:#FFFDE7;">💰</div>
            <div>
              <div class="stat-label">班级总积分</div>
              <div class="stat-value">{{ overviewData.totalPoints }}</div>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div style="display:flex;gap:20px;flex-wrap:wrap;">
          <!-- 积分分布图表 -->
          <div class="card" style="padding:20px;flex:1;min-width:300px;">
            <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;">💰 积分分布</h3>
            <div style="height:250px;">
              <canvas id="pointsChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- 学生表现页面 -->
      <div v-if="activeTab === 'students'">
        <div class="card" style="padding:20px;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;">👨‍🎓 学生学习表现</h3>
          <div style="height:300px;">
            <canvas id="studentPerformanceChart"></canvas>
          </div>
        </div>
        <div class="card" style="padding:20px;">
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="border-bottom:2px solid var(--border);">
                  <th style="padding:12px;text-align:left;">学生</th>
                  <th style="padding:12px;text-align:center;">班级</th>
                  <th style="padding:12px;text-align:center;">积分</th>
                  <th style="padding:12px;text-align:center;">宠物等级</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in studentPerformanceData" :key="student.id" style="border-bottom:1px solid var(--border);cursor:pointer;" @click="viewStudentDetail(student)">
                  <td style="padding:12px;">{{ student.name }}</td>
                  <td style="padding:12px;text-align:center;">{{ student.class }}</td>
                  <td style="padding:12px;text-align:center;">{{ student.points }}</td>
                  <td style="padding:12px;text-align:center;">Lv.{{ student.petLevel }}</td>
                </tr>
              </tbody>
                      </div>
                      <span style="font-weight:700;">{{ student.completionRate }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 学科分布页面 -->
      <div v-if="activeTab === 'subjects'">
        <div class="card" style="padding:20px;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;">📚 学科任务分布</h3>
          <div style="height:300px;">
            <canvas id="subjectDistributionChart"></canvas>
          </div>
        </div>
        <div class="card" style="padding:20px;">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div v-for="item in subjectDistributionData" :key="item.subject" style="display:flex;align-items:center;gap:16px;">
              <div style="width:100px;font-weight:700;">{{ item.subject }}</div>
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-bottom:4px;">
                  <span>任务数: {{ item.count }}</span>
                  <span>总积分: {{ item.totalPoints }}</span>
                </div>
                <div class="progress-bar" style="height:12px;">
                  <div class="progress-fill" style="background:var(--primary);" :style="{width: item.completionRate + '%'}"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light);margin-top:4px;">
                  <span>完成: {{ item.completedSubmissions }}/{{ item.totalSubmissions }}</span>
                  <span>完成率: {{ item.completionRate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出数据弹窗 -->
      <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal=false">
        <div class="modal-box">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:16px;">📥 导出数据</h3>
          <div class="input-group">
            <label>导出格式</label>
            <select class="input-field" v-model="exportFormat">
              <option value="csv">CSV格式</option>
              <option value="excel">Excel格式</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;margin-top:20px;">
            <button class="btn btn-ghost" style="flex:1" @click="showExportModal=false">取消</button>
            <button class="btn btn-primary" style="flex:2" @click="exportData">确认导出</button>
          </div>
        </div>
      </div>

      <!-- 学生详情弹窗 -->
      <div v-if="selectedStudent" class="modal-overlay" @click.self="selectedStudent=null">
        <div class="modal-box" style="max-width:400px;">
          <h3 style="font-size:18px;font-weight:800;margin-bottom:16px;">{{ selectedStudent.name }} 的详细数据</h3>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-light);">班级:</span>
              <span>{{ selectedStudent.class }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-light);">积分:</span>
              <span style="font-weight:700;color:var(--warning);">⭐{{ selectedStudent.points || 0 }}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-light);">宠物等级:</span>
              <span>{{ getLevelInfo(selectedStudent.petExp || 0).level }}级</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="color:var(--text-light);">宠物状态:</span>
              <span>{{ selectedStudent.petDead ? '已死亡' : '正常' }}</span>
            </div>
          </div>
          <button class="btn btn-ghost" style="width:100%;margin-top:20px;" @click="selectedStudent=null">关闭</button>
        </div>
      </div>
    </div>
  `,
};

// ---------- 系统设置 ----------
const TeacherSettings = {
  name: 'TeacherSettings',
  props: ['user'],
  emits: ['toast'],
  data() {
    return {
      confirmReset: false,
      confirmImport: false,
      activeTab: 'rules', // rules / class / growth / about
      // 班级名称
      className: '',
      // 积分规则配置
      pointRules: {
        homework: 45,      // 完成作业
        classAnswer: 20,   // 课堂回答
        reading: 30,       // 阅读打卡
        creative: 50,      // 创意作品
        attendance: 10,    // 考勤
        behavior: 15,      // 行为表现
      },
      // 宠物成长规则配置
      growthRules: {
        expMultiplier: 0.5, // 积分转经验倍率
        dailyExpLimit: 50,  // 每日经验上限
        growthStages: [
          { level: 0, name: '蛋', minExp: 0, maxExp: 100 },
          { level: 1, name: '小幼宠', minExp: 100, maxExp: 300 },
          { level: 2, name: '幼宠', minExp: 300, maxExp: 600 },
          { level: 3, name: '活泼期', minExp: 600, maxExp: 1000 },
          { level: 4, name: '成长期', minExp: 1000, maxExp: 1500 },
          { level: 5, name: '少年宠', minExp: 1500, maxExp: 2200 },
          { level: 6, name: '青春期', minExp: 2200, maxExp: 3100 },
          { level: 7, name: '亚成体', minExp: 3100, maxExp: 4200 },
          { level: 8, name: '成长宠', minExp: 4200, maxExp: 5600 },
          { level: 9, name: '壮年宠', minExp: 5600, maxExp: 7200 },
          { level: 10, name: '熟练宠', minExp: 7200, maxExp: 9000 },
          { level: 11, name: '精英宠', minExp: 9000, maxExp: 11200 },
          { level: 12, name: '强化宠', minExp: 11200, maxExp: 13700 },
          { level: 13, name: '进化宠', minExp: 13700, maxExp: 16500 },
          { level: 14, name: '超进化', minExp: 16500, maxExp: 20000 },
          { level: 15, name: '稀有宠', minExp: 20000, maxExp: 24000 },
          { level: 16, name: '史诗宠', minExp: 24000, maxExp: 28500 },
          { level: 17, name: '传奇宠', minExp: 28500, maxExp: 33500 },
          { level: 18, name: '神话宠', minExp: 33500, maxExp: 39000 },
          { level: 19, name: '✨传说✨', minExp: 39000, maxExp: 45000 },
          { level: 20, name: '巅峰宠', minExp: 45000, maxExp: 99999 },
        ],
      },
      showSaveConfirm: false,
    };
  },
  created() {
    // 从 localStorage 读取已保存的班级名，兜底用 user.class
    const saved = localStorage.getItem('className');
    this.className = saved || this.user?.class || '高一一班';
  },
  methods: {
    saveClassName() {
      const name = (this.className || '').trim();
      if (!name) {
        this.$emit('toast', '请输入班级名称', 'warning');
        return;
      }
      localStorage.setItem('className', name);
      // 同步更新当前 user 对象（影响顶部导航显示）
      if (this.user) this.user.class = name;
      this.$emit('toast', `✅ 班级名称已保存为「${name}」`, 'success');
    },
    resetDemo() {
      Store.resetDemo();
      this.$emit('toast', '✅ 演示数据已重置！', 'success');
      this.confirmReset = false;
    },
    saveRules() {
      // 这里可以实现保存规则到后端或localStorage
      this.showSaveConfirm = false;
      this.$emit('toast', '✅ 规则保存成功！', 'success');
    },
    validateRules() {
      // 简单的规则验证
      for (const key in this.pointRules) {
        if (this.pointRules[key] < 0) {
          this.$emit('toast', '积分规则不能为负数', 'error');
          return false;
        }
      }
      if (this.growthRules.expMultiplier < 0) {
        this.$emit('toast', '经验倍率不能为负数', 'error');
        return false;
      }
      if (this.growthRules.dailyExpLimit < 0) {
        this.$emit('toast', '每日经验上限不能为负数', 'error');
        return false;
      }
      return true;
    },
    confirmSave() {
      if (this.validateRules()) {
        this.showSaveConfirm = true;
      }
    },
    doExportJSON() {
      Store.exportJSON();
    },
    async doImportJSON(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      e.target.value = '';
      if (!confirm('⚠️ 导入将覆盖当前所有数据，是否继续？')) return;
      const ok = await Store.importJSON(file);
      if (ok) this.$emit('toast', '✅ 数据导入成功，已恢复！', 'success');
    },
  },
  template: `
    <div class="animate-pageIn">
      <div class="teacher-header">
        <div class="teacher-page-title">⚙️ 系统设置</div>
        <button v-if="activeTab !== 'about'" class="btn btn-primary btn-sm" @click="confirmSave">💾 保存设置</button>
      </div>

      <!-- 标签页 -->
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
        <button class="btn btn-sm" :class="activeTab==='rules'?'btn-primary':'btn-ghost'" @click="activeTab='rules'">⭐ 积分规则</button>
        <button class="btn btn-sm" :class="activeTab==='class'?'btn-primary':'btn-ghost'" @click="activeTab='class'">🏫 班级设置</button>
        <button class="btn btn-sm" :class="activeTab==='growth'?'btn-primary':'btn-ghost'" @click="activeTab='growth'">🐾 成长规则</button>
        <button class="btn btn-sm" :class="activeTab==='about'?'btn-primary':'btn-ghost'" @click="activeTab='about'">ℹ️ 关于系统</button>
      </div>

      <!-- 积分规则配置 -->
      <div v-if="activeTab === 'rules'" class="settings-content">
        <div class="card" style="padding:20px;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;">⭐ 积分规则配置</h3>
          <p style="font-size:13px;color:var(--text-light);margin-bottom:20px;">设置不同行为对应的积分值，鼓励学生积极参与课堂活动</p>
          
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="input-group">
              <label>📐 完成作业</label>
              <input class="input-field" type="number" v-model.number="pointRules.homework" min="0" max="100" />
              <span style="font-size:12px;color:var(--text-light);">积分</span>
            </div>
            
            <div class="input-group">
              <label>🙋 课堂回答</label>
              <input class="input-field" type="number" v-model.number="pointRules.classAnswer" min="0" max="50" />
              <span style="font-size:12px;color:var(--text-light);">积分</span>
            </div>
            
            <div class="input-group">
              <label>📖 阅读打卡</label>
              <input class="input-field" type="number" v-model.number="pointRules.reading" min="0" max="60" />
              <span style="font-size:12px;color:var(--text-light);">积分</span>
            </div>
            
            <div class="input-group">
              <label>🎨 创意作品</label>
              <input class="input-field" type="number" v-model.number="pointRules.creative" min="0" max="80" />
              <span style="font-size:12px;color:var(--text-light);">积分</span>
            </div>
            
            <div class="input-group">
              <label>📋 考勤</label>
              <input class="input-field" type="number" v-model.number="pointRules.attendance" min="0" max="30" />
              <span style="font-size:12px;color:var(--text-light);">积分</span>
            </div>
            
            <div class="input-group">
              <label>✨ 行为表现</label>
              <input class="input-field" type="number" v-model.number="pointRules.behavior" min="0" max="40" />
              <span style="font-size:12px;color:var(--text-light);">积分</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 班级设置 -->
      <div v-if="activeTab === 'class'" class="settings-content">
        <div class="card" style="padding:20px;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;">🏫 班级名称设置</h3>
          <p style="font-size:13px;color:var(--text-light);margin-bottom:20px;">设置班级名称，将显示在系统各处（如：高一一班）</p>
          <div class="input-group">
            <label>班级名称</label>
            <input class="input-field" v-model="className" placeholder="例如：高一一班" maxlength="20" />
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
            <button class="btn btn-primary" @click="saveClassName">💾 保存班级名称</button>
          </div>
        </div>
      </div>

      <!-- 宠物成长规则配置 -->
      <div v-if="activeTab === 'growth'" class="settings-content">
        <div class="card" style="padding:20px;margin-bottom:20px;">
          <h3 style="font-size:16px;font-weight:800;margin-bottom:16px;">🐾 宠物成长规则配置</h3>
          <p style="font-size:13px;color:var(--text-light);margin-bottom:20px;">调整宠物成长速度、等级提升条件等参数</p>
          
          <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
            <div class="input-group">
              <label>💫 积分转经验倍率</label>
              <input class="input-field" type="number" v-model.number="growthRules.expMultiplier" min="0" max="2" step="0.1" />
              <span style="font-size:12px;color:var(--text-light);">倍</span>
            </div>
            
            <div class="input-group">
              <label>📈 每日经验上限</label>
              <input class="input-field" type="number" v-model.number="growthRules.dailyExpLimit" min="0" max="200" />
              <span style="font-size:12px;color:var(--text-light);">点</span>
            </div>
          </div>
          
          <div style="margin-bottom:16px;">
            <h4 style="font-size:14px;font-weight:800;margin-bottom:12px;">成长阶段设置</h4>
            <p style="font-size:12px;color:var(--text-light);margin-bottom:12px;">调整各等级所需经验值（注：高级别经验值必须大于低级别）</p>
            
            <div style="max-height:300px;overflow-y:auto;">
              <div v-for="(stage, index) in growthRules.growthStages" :key="stage.level" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
                <div style="width:80px;font-size:13px;font-weight:700;">{{ stage.name }}</div>
                <div style="width:80px;">
                  <input class="input-field" type="number" v-model.number="stage.minExp" min="0" style="width:100%;" />
                </div>
                <div style="width:20px;text-align:center;">~</div>
                <div style="width:80px;">
                  <input class="input-field" type="number" v-model.number="stage.maxExp" min="0" style="width:100%;" />
                </div>
                <div style="font-size:12px;color:var(--text-light);">经验</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 关于系统 -->
      <div v-if="activeTab === 'about'" class="settings-content">
        <div class="settings-grid">
          <!-- 关于系统 -->
          <div class="card" style="padding:20px;">
            <h3 style="font-size:16px;font-weight:800;margin-bottom:14px;">ℹ️ 关于系统</h3>
            <div style="font-size:13px;color:var(--text-mid);line-height:2;">
              <div>系统名称：课堂电子宠物</div>
              <div>版本：v1.0.0</div>
              <div>适用：高中课堂游戏化</div>
              <div>支持：PC + 手机 + 教室投影</div>
            </div>
          </div>

          <!-- 数据备份与恢复 -->
          <div class="card" style="padding:20px;">
            <h3 style="font-size:16px;font-weight:800;margin-bottom:14px;">📦 数据备份 / 恢复</h3>
            <p style="font-size:13px;color:var(--text-light);margin-bottom:14px;">导出完整数据（含学生+任务）为 JSON 文件，可在其他设备或浏览器导入恢复。</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" @click="doExportJSON">📤 导出备份</button>
              <button class="btn btn-ghost btn-sm" @click="$refs.importJsonInput.click()">📥 导入恢复</button>
            </div>
            <input type="file" ref="importJsonInput" accept=".json" style="display:none" @change="doImportJSON" />
            <p style="font-size:12px;color:var(--warning);margin-top:10px;">⚠️ 导入会覆盖当前所有数据，请谨慎操作。</p>
          </div>

          <!-- 演示数据重置 -->
          <div class="card" style="padding:20px;">
            <h3 style="font-size:16px;font-weight:800;margin-bottom:14px;">🔄 演示管理</h3>
            <p style="font-size:13px;color:var(--text-light);margin-bottom:14px;">重置所有学生数据到初始演示状态</p>
            <button class="btn btn-danger" @click="confirmReset=true">🔄 重置演示数据</button>
          </div>
        </div>
      </div>

      <!-- 确认重置 -->
      <div v-if="confirmReset" class="modal-overlay" @click.self="confirmReset=false">
        <div class="modal-box" style="text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
          <h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">确认重置？</h3>
          <p style="color:var(--text-light);font-size:14px;margin-bottom:20px;">这将把所有学生数据恢复到演示初始状态。</p>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-ghost" style="flex:1" @click="confirmReset=false">取消</button>
            <button class="btn btn-danger" style="flex:1" @click="resetDemo">确认重置</button>
          </div>
        </div>
      </div>

      <!-- 确认保存 -->
      <div v-if="showSaveConfirm" class="modal-overlay" @click.self="showSaveConfirm=false">
        <div class="modal-box" style="text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">💾</div>
          <h3 style="font-size:18px;font-weight:800;margin-bottom:8px;">确认保存规则？</h3>
          <p style="color:var(--text-light);font-size:14px;margin-bottom:20px;">保存后新规则将立即生效。</p>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-ghost" style="flex:1" @click="showSaveConfirm=false">取消</button>
            <button class="btn btn-success" style="flex:1" @click="saveRules">确认保存</button>
          </div>
        </div>
      </div>
    </div>
  `
};

// ---------- 教师总容器 ----------
const TeacherApp = {
  name: 'TeacherApp',
  props: ['user'],
  emits: ['logout'],
  data() {
    return {
      currentSection: 'dashboard',
      showAvatarMenu: false,
      // 注意：_pollTimer 和 _pendingCount 不放 data()，直接挂实例，避免 Vue Proxy 包裹导致 clearInterval 失效
    };
  },
  computed: {
    navItems() {
      return [
        { key: 'dashboard', icon: '📊', label: '总览'   },
        { key: 'students',  icon: '👨‍🎓', label: '学生管理' },
        { key: 'analytics', icon: '📈', label: '数据分析' },
        { key: 'rank',      icon: '🏆', label: '排行榜' },
        { key: 'settings',  icon: '⚙️', label: '系统设置' },
      ];
    },
    teacherAvatar() {
      return (this.user && this.user.name && this.user.name[0]) || '👩‍🏫';
    },
  },
  mounted() {
    // 直接挂在实例上（不走 Vue 响应式），避免 Proxy 包裹导致 clearInterval 失效
    this.$_pollTimer = setInterval(async () => {
      await Store.refreshStudents();
    }, 10000);
  },
  beforeUnmount() {
    if (this.$_pollTimer) clearInterval(this.$_pollTimer);
  },
  methods: {
    onToast(msg, type) { Store.toast(msg, type); },
    doLogout() {
      if (this.$_pollTimer) clearInterval(this.$_pollTimer);
      Store.logout();
      this.$emit('logout');
    },
    navTo(key) { this.currentSection = key; this.showAvatarMenu = false; },
  },
  template: `
    <div style="min-height:100vh;background:#F8F0FF;" @click="showAvatarMenu=false">

      <!-- 顶部导航栏（与学生端同款） -->
      <div class="topbar">
        <div class="topbar-logo">
          <span class="logo-icon">🐾</span>
          <span>课堂宠物</span>
        </div>
        <div class="topbar-right">
          <!-- 头像 + 下拉菜单 -->
          <div style="position:relative;" @click.stop="showAvatarMenu=false">
            <div class="topbar-avatar" @click.stop="showAvatarMenu=true"
                 :style="showAvatarMenu ? 'box-shadow:0 0 0 3px var(--primary);' : ''">
              {{ teacherAvatar }}
            </div>
            <transition name="fade">
              <div v-if="showAvatarMenu" class="avatar-dropdown">
                <div class="avatar-menu-header">
                  <div style="font-size:28px;font-weight:900;color:var(--secondary);">
                    {{ teacherAvatar }}
                  </div>
                  <div>
                    <div style="font-size:14px;font-weight:800;color:var(--text-dark);">{{ user && user.name }}</div>
                    <div style="font-size:12px;color:var(--text-light);">{{ user && user.class }} · 教师</div>
                  </div>
                </div>
                <div class="avatar-menu-item avatar-menu-logout" @click="doLogout">
                  <span>🚪</span>
                  <span>退出登录</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 主内容 -->
      <div class="main-content">
        <teacher-dashboard v-if="currentSection==='dashboard'" :teacher="user" @toast="onToast"></teacher-dashboard>
        <teacher-students  v-if="currentSection==='students'"  @toast="onToast"></teacher-students>
        <teacher-analytics v-if="currentSection==='analytics'" @toast="onToast"></teacher-analytics>
        <teacher-rank      v-if="currentSection==='rank'"></teacher-rank>
        <teacher-settings  v-if="currentSection==='settings'"  :user="user" @toast="onToast"></teacher-settings>
      </div>

      <!-- 底部导航栏（与学生端同款） -->
      <div class="bottom-nav">
        <div v-for="item in navItems" :key="item.key" class="nav-item"
             :class="{active: currentSection===item.key}"
             @click="navTo(item.key)">
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>

    </div>
  `,
  components: {
    TeacherDashboard, TeacherStudents, TeacherAnalytics, TeacherRank, TeacherSettings,
    'teacher-dashboard': TeacherDashboard,
    'teacher-students':  TeacherStudents,
    'teacher-analytics': TeacherAnalytics,
    'teacher-rank':      TeacherRank,
    'teacher-settings':  TeacherSettings,
  }
};
