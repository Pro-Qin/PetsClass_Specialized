// ===== 主应用入口 =====

const { createApp, reactive, ref, computed, onMounted, onBeforeUnmount } = Vue;

const App = {
  name: 'App',
  components: {
    LoginPage,
    StudentApp,
    TeacherApp,
    AdminApp,
    'login-page': LoginPage,
    'student-app': StudentApp,
    'teacher-app': TeacherApp,
    'admin-app': AdminApp,
  },
  data() {
    return {
      // 登录状态：null表示未登录，登录后为用户对象
      currentUser: null,
      isLoggedIn: false,
      appMode: 'student',  // 登录后的显示模式：student/teacher/admin
      debugMode: false,    // Debug模式开关
      modePanelExpanded: false,  // 系统模式面板展开状态
      showUserSwitcher: false,  // 用户切换面板
      appReady: false,    // Store 初始化完成后为 true
      teacherPreview: null, // 教师预览模式：保存原始教师用户，非 null 表示正在以学生视角预览
    };
  },
  computed: {
    // 当前显示的应用
    currentApp() {
      if (!this.isLoggedIn) return 'login';
      switch (this.appMode) {
        case 'admin':   return 'admin';
        case 'teacher': return 'teacher';
        default:        return 'student';
      }
    },
    // 当前用户信息
    userDisplay() {
      if (!this.currentUser) return '';
      const roleMap = {
        admin: '管理员',
        teacher: '教师',
        student: '学生'
      };
      return `${roleMap[this.currentUser.role] || '用户'}：${this.currentUser.name}`;
    },
    toasts() { return Store.state.toasts; },
  },
  methods: {
    // 登录成功处理
    onLoginSuccess(user) {
      this.currentUser = user;
      this.isLoggedIn = true;
      
      // 根据用户角色设置显示模式
      switch (user.role) {
        case 'admin':
          this.appMode = 'admin';
          break;
        case 'teacher':
          this.appMode = 'teacher';
          break;
        default:
          this.appMode = 'student';
      }
      
      // 保存登录状态到localStorage
      localStorage.setItem('petSystemUser', JSON.stringify({
        id: user.id,
        role: user.role,
        name: user.name,
        username: user.username || user.name
      }));
    },
    
    // 退出登录
    logout() {
      // 如果是教师预览学生模式，返回教师端而非退出
      if (this.teacherPreview) {
        this.currentUser = this.teacherPreview;
        this.appMode = 'teacher';
        this.teacherPreview = null;
        return;
      }
      this.isLoggedIn = false;
      this.currentUser = null;
      this.appMode = 'student';
      localStorage.removeItem('petSystemUser');
    },

    // 教师/管理员以学生身份预览
    viewAsStudent(student) {
      this.teacherPreview = this.currentUser; // 保存当前教师身份
      this.currentUser = { ...student, role: 'student' };
      this.appMode = 'student';
      this.isLoggedIn = true;
    },
    
    // 切换显示模式
    switchMode(mode) {
      // 已登录用户可以切换查看不同角色的界面
      if (!this.isLoggedIn) return;
      
      // 只有对应角色的用户才能切换到该模式
      if (mode === 'admin' && this.currentUser.role !== 'admin') {
        Store.toast('只有管理员才能进入管理后台', 'warning');
        return;
      }
      
      this.appMode = mode;
    },
    
    // 切换用户
    switchUser() {
      this.showUserSwitcher = true;
    },
    
    // 确认切换用户
    confirmSwitchUser() {
      this.showUserSwitcher = false;
      this.logout();
    },
    
    spawnCoinFly(x, y) {
      const el = document.createElement('div');
      el.className = 'coin-fly';
      el.textContent = '⭐';
      const tx = (Math.random() - 0.5) * 200;
      const ty = -(Math.random() * 150 + 80);
      el.style.setProperty('--tx', tx + 'px');
      el.style.setProperty('--ty', ty + 'px');
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    },
    
    toggleDebugMode() {
      this.debugMode = !this.debugMode;
      if (this.debugMode) {
        this.loadDebugData();
      }
    },
    
    async loadDebugData() {
      // 示例学生数据
      const sampleStudents = [
        { id: 1, name: '小明', username: 'xiaoming', password: '123456', class: '高一一班', points: 320, money: 100, petType: 'dragon', petName: '小明的宠物', petExp: 220, petStage: 2, petStatus: { health: 75, hungry: 60, happy: 80, clean: 70 }, backpack: { apple: 3, cake: 1, soap: 2, ball: 1, medicine: 1 }, joinDate: '2026-02-01' },
        { id: 2, name: '小红', username: 'xiaohong', password: '123456', class: '高一一班', points: 580, money: 100, petType: 'cat', petName: '小红的宠物', petExp: 530, petStage: 3, petStatus: { health: 90, hungry: 70, happy: 95, clean: 85 }, backpack: { apple: 5, cake: 2, soap: 3, ball: 2, medicine: 0 }, joinDate: '2026-02-01' },
        { id: 3, name: '小刚', username: 'xiaogang', password: '123456', class: '高一一班', points: 180, money: 100, petType: 'bunny', petName: '小刚的宠物', petExp: 150, petStage: 1, petStatus: { health: 55, hungry: 30, happy: 40, clean: 50 }, backpack: { apple: 1, soap: 1, medicine: 2 }, joinDate: '2026-02-01' }
      ];
      
      // 示例任务数据
      const sampleTasks = [
        { id: 1737849600000, title: '完成数学作业', desc: '完成今日数学练习题（P45-P47）并提交照片', points: 50, icon: '📐', subject: '数学', deadline: '2026-03-14 18:00', status: 'active', createdBy: 100, createdAt: '2026-03-14 08:00', submissions: [] },
        { id: 1737849600001, title: '背诵古诗《静夜思》', desc: '背诵全文，明日课堂当场检查', points: 35, icon: '📝', subject: '语文', deadline: '2026-03-15 08:00', status: 'active', createdBy: 100, createdAt: '2026-03-14 08:00', submissions: [] }
      ];
      
      // 清空现有数据
      Store.state.students = [];
      Store.state.tasks = [];
      
      // 添加示例学生数据
      for (const student of sampleStudents) {
        Store.state.students.push(student);
      }
      
      // 添加示例任务数据
      for (const task of sampleTasks) {
        Store.state.tasks.push(task);
      }
      
      // 同步到IndexedDB
      await dbStorage.storeStudents(Store.state.students);
      await dbStorage.storeTasks(Store.state.tasks);
      
      Store.toast('🐛 Debug模式已启用，示例数据已载入', 'success');
    },
    
    // 恢复登录状态
    restoreLoginState() {
      const savedUser = localStorage.getItem('petSystemUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          // 根据角色查找完整用户信息
          let user = null;
          if (userData.role === 'student') {
            user = Store.state.students.find(s => s.id === userData.id);
          } else if (userData.role === 'teacher') {
            user = TEACHER_ACCOUNTS.find(t => t.username === userData.username);
          } else if (userData.role === 'admin') {
            user = { ...ADMIN_ACCOUNT };
          }
          
        if (user) {
          this.currentUser = { ...user, role: userData.role };
          this.isLoggedIn = true;
          this.appMode = userData.role;
        }
        } catch (e) {
          localStorage.removeItem('petSystemUser');
        }
      }
    },
  },
  
  async mounted() {
    const statusEl = document.getElementById('loading-status');
    const barEl = document.getElementById('loading-bar');

    // 阶段1：触发 Store 初始化（本地 IndexedDB 加载，极快；云端后台同步不阻塞）
    if (statusEl) statusEl.textContent = '正在加载数据...';
    Store.init();  // 本地数据先就绪，云端后台静默同步

    // 阶段2：等待 Store 本地数据就绪（通常 < 500ms）
    let waited = 0;
    while (!Store.state._initialized && waited < 20000) {
      if (waited > 1000 && statusEl) statusEl.textContent = '加载本地数据...';
      if (waited > 5000 && statusEl) statusEl.textContent = '正在同步云端数据...';
      if (waited > 15000 && statusEl) statusEl.textContent = '加载较慢，请稍候...';
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }

    if (!Store.state._initialized && statusEl) {
      statusEl.textContent = '⚠️ 加载超时，部分数据可能不完整';
    }

    this.appReady = true;

    // 恢复登录状态（数据已就绪）
    this.restoreLoginState();

    // 淡出加载画面
    const splash = document.getElementById('loading-splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }

    // 关闭/刷新页面时自动推送操作记录到云端
    this._unloadHandler = () => {
      const logs = Store.state.auditLog;
      if (logs && logs.length > 0) {
        // 使用 sendBeacon 或同步方式推送（fetch keep-alive）
        CloudSync.pushAuditLog(logs).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', this._unloadHandler);
  },

  beforeUnmount() {
    if (this._unloadHandler) {
      window.removeEventListener('beforeunload', this._unloadHandler);
    }
  },
  
  template: `
    <div id="root">
      <!-- 未就绪时 Vue 侧不渲染（由 index.html loading-splash 覆盖） -->
      <template v-if="appReady">
        <!-- 顶部导航（登录后显示）：系统类型标签 + 退出/返回按钮 -->
        <div v-if="isLoggedIn" style="position:fixed;top:20px;right:20px;z-index:1000;display:flex;align-items:center;gap:8px;">
          <!-- 系统类型标签 -->
          <div style="background:white;padding:7px 14px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <span style="font-size:14px;font-weight:700;color:var(--text-dark);" v-if="!teacherPreview">
              {{ appMode === 'admin' ? '🛡️ 管理后台' : appMode === 'teacher' ? '👩‍🏫 教师系统' : '👨‍🎓 学生系统' }}
            </span>
            <span style="font-size:14px;font-weight:700;color:var(--text-dark);" v-else>
              👁️ 预览：{{ currentUser.name }}
            </span>
          </div>
          <!-- 教师预览模式 → 返回按钮；否则 → 退出按钮 -->
          <button v-if="teacherPreview" class="btn btn-sm" style="color:var(--primary);border-color:var(--primary);background:white;box-shadow:0 4px 20px rgba(0,0,0,0.1);"
                  @click="logout" title="返回教师端">
            ↩️ 返回教师端
          </button>
          <button v-else class="btn btn-sm btn-ghost" style="color:#F44336;border-color:#F44336;background:white;box-shadow:0 4px 20px rgba(0,0,0,0.1);"
                  @click="logout" title="退出登录">
            🚪
          </button>
        </div>

        <!-- 登录页面 -->
        <login-page v-if="!isLoggedIn" @login-success="onLoginSuccess"></login-page>

        <!-- 学生端 -->
        <student-app v-else-if="appMode==='student'" :user="currentUser" @logout="logout"></student-app>

        <!-- 教师端 -->
        <teacher-app v-else-if="appMode==='teacher'" :user="currentUser" @logout="logout" @view-as-student="viewAsStudent"></teacher-app>

        <!-- 管理员端 -->
        <admin-app v-else-if="appMode==='admin'" :user="currentUser" @logout="logout" @view-as-student="viewAsStudent"></admin-app>

        <!-- Toast 通知 -->
        <div class="toast-container">
          <div v-for="toast in toasts" :key="toast.id" class="toast" :class="'toast-'+toast.type">
            <span>{{ {success:'✅', error:'❌', warning:'⚠️', info:'💬'}[toast.type] || '💬' }}</span>
            <span>{{ toast.msg }}</span>
          </div>
        </div>
      </template>
    </div>
  `
};

// 挂载应用
const app = createApp(App);
app.mount('#app');
