// ===== 登录页面组件 =====

const LoginPage = {
  name: 'LoginPage',
  emits: ['login-success', 'go-admin'],
  data() {
    return {
      activeTab: 'student', // student / teacher / admin
      // 学生登录
      studentUsername: '',
      studentPassword: '',
      // 教师登录
      teacherUsername: '',
      teacherPassword: '',
      // 管理员登录
      adminUsername: '',
      adminPassword: '',
      // 状态
      loading: false,
      error: '',
      showPassword: false,
    };
  },
  computed: {
    studentAccounts() {
      return Store.state.students.map(s => ({
        id: s.id,
        name: s.name,
        username: s.username,
        class: s.class,
        avatar: s.name ? s.name[0] : '👤',
      }));
    },
  },
  methods: {
    // 切换Tab
    switchTab(tab) {
      this.activeTab = tab;
      this.error = '';
      this.studentUsername = '';
      this.studentPassword = '';
      // 教师账号自动填充，只需输密码
      this.teacherUsername = TEACHER_ACCOUNTS[0]?.username || 'teacher';
      this.teacherPassword = '';
      this.adminUsername = '';
      this.adminPassword = '';
    },
    // 学生快速登录
    async quickLogin(student) {
      this.loading = true;
      this.error = '';
      
      // 模拟登录延迟
      await new Promise(r => setTimeout(r, 300));
      
      // 学生快速登录无需密码
      const user = {
        ...student,
        role: 'student',
      };
      
      this.loading = false;
      this.$emit('login-success', user);
    },
    // 学生账号密码登录
    async loginStudent() {
      if (!this.studentUsername.trim()) {
        this.error = '请输入账号'; return;
      }
      if (!this.studentPassword.trim()) {
        this.error = '请输入密码'; return;
      }
      
      this.loading = true;
      this.error = '';
      
      // 模拟网络延迟
      await new Promise(r => setTimeout(r, 500));
      
      // 查找学生账号
      const student = Store.state.students.find(s => 
        (s.username === this.studentUsername.trim() || s.name === this.studentUsername.trim()) &&
        (s.password === this.studentPassword || this.studentPassword === '123456')
      );
      
      if (student) {
        this.$emit('login-success', { ...student, role: 'student' });
      } else {
        this.error = '账号或密码错误';
      }
      
      this.loading = false;
    },
    // 教师登录
    async loginTeacher() {
      if (!this.teacherPassword.trim()) {
        this.error = '请输入密码'; return;
      }
      
      this.loading = true;
      this.error = '';
      
      await new Promise(r => setTimeout(r, 500));
      
      // 查找教师账号
      const teacher = TEACHER_ACCOUNTS.find(t => 
        t.username === this.teacherUsername.trim() &&
        (t.password === this.teacherPassword || this.teacherPassword === '123456')
      );
      
      if (teacher) {
        this.$emit('login-success', { ...teacher, role: 'teacher' });
      } else {
        this.error = '账号或密码错误';
      }
      
      this.loading = false;
    },
    // 管理员登录
    async loginAdmin() {
      if (!this.adminUsername.trim()) {
        this.error = '请输入账号'; return;
      }
      if (!this.adminPassword.trim()) {
        this.error = '请输入密码'; return;
      }

      this.loading = true;
      this.error = '';

      await new Promise(r => setTimeout(r, 500));

      // 通过 Store.login 做 SHA-256 哈希比对
      const result = await Store.login(this.adminUsername.trim(), this.adminPassword);
      if (result.success && result.role === 'admin') {
        this.$emit('login-success', { ...result.user, role: 'admin' });
      } else {
        this.error = '管理员账号或密码错误';
      }

      this.loading = false;
    },
    // 去管理员登录
    goAdmin() {
      this.switchTab('admin');
    },
  },
  template: `
    <div class="login-page animate-fadeIn">
      <!-- 背景装饰 -->
      <div class="login-bg">
        <div class="login-bg-circle circle-1"></div>
        <div class="login-bg-circle circle-2"></div>
        <div class="login-bg-circle circle-3"></div>
      </div>
      
      <!-- 登录卡片 -->
      <div class="login-card">
        <!-- Logo区域 -->
        <div class="login-header">
          <div class="login-logo">🐾</div>
          <h1 class="login-title">课堂电子宠物</h1>
          <p class="login-subtitle">把学习变成养宠物！</p>
        </div>
        
        <!-- Tab切换 -->
        <div class="login-tabs">
          <button class="login-tab" :class="{ active: activeTab === 'student' }" @click="switchTab('student')">
            👨‍🎓 学生
          </button>
          <button class="login-tab" :class="{ active: activeTab === 'teacher' }" @click="switchTab('teacher')">
            👩‍🏫 教师
          </button>
          <button class="login-tab" :class="{ active: activeTab === 'admin' }" @click="switchTab('admin')">
            🛡️ 管理
          </button>
        </div>
        
        <!-- 学生登录 -->
        <div v-if="activeTab === 'student'" class="login-form">
          <!-- 快速登录区 -->
          <div v-if="studentAccounts.length > 0" class="quick-login">
            <div class="quick-login-title">快速登录</div>
            <div class="quick-login-grid">
              <div v-for="student in studentAccounts" :key="student.id"
                   class="quick-login-item"
                   @click="quickLogin(student)">
                <div class="quick-login-avatar">{{ student.avatar }}</div>
                <div class="quick-login-name">{{ student.name }}</div>
                <div class="quick-login-class">{{ student.class }}</div>
              </div>
            </div>
          </div>
          
          <!-- 分隔线 -->
          <div v-if="studentAccounts.length > 0" class="login-divider">
            <span>或使用账号密码登录</span>
          </div>
          
          <!-- 账号密码登录 -->
          <div class="input-group">
            <label>账号 / 姓名</label>
            <input class="input-field" v-model="studentUsername" 
                   placeholder="输入账号或姓名" @keyup.enter="loginStudent" />
          </div>
          <div class="input-group">
            <label>密码</label>
            <div style="position:relative;">
              <input class="input-field" v-model="studentPassword" 
                     :type="showPassword ? 'text' : 'password'" 
                     placeholder="输入密码（默认：123456）" @keyup.enter="loginStudent" />
              <span class="input-icon" style="cursor:pointer;" @click="showPassword=!showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </span>
            </div>
          </div>
          
          <button class="btn btn-primary btn-lg" style="width:100%;" 
                  @click="loginStudent" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
        
        <!-- 教师登录 -->
        <div v-if="activeTab === 'teacher'" class="login-form">
          <!-- 教师账号已自动填充 -->
          <div class="input-group">
            <label>密码</label>
            <div style="position:relative;">
              <input class="input-field" v-model="teacherPassword" 
                     :type="showPassword ? 'text' : 'password'" 
                     placeholder="输入密码（默认：123456）" @keyup.enter="loginTeacher" />
              <span class="input-icon" style="cursor:pointer;" @click="showPassword=!showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </span>
            </div>
          </div>
          
          <!-- 教师账号提示 -->
          <div class="demo-hint">
            <div class="demo-hint-title">教师账号</div>
            <div class="demo-hint-item">{{ teacherUsername }} / 123456</div>
          </div>
          
          <button class="btn btn-primary btn-lg" style="width:100%;" 
                  @click="loginTeacher" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
        
        <!-- 管理员登录 -->
        <div v-if="activeTab === 'admin'" class="login-form">
          <div class="input-group">
            <label>管理员账号</label>
            <input class="input-field" v-model="adminUsername" 
                   placeholder="输入管理员账号" @keyup.enter="loginAdmin" />
          </div>
          <div class="input-group">
            <label>密码</label>
            <div style="position:relative;">
              <input class="input-field" v-model="adminPassword" 
                     :type="showPassword ? 'text' : 'password'" 
                     placeholder="输入管理员密码" @keyup.enter="loginAdmin" />
              <span class="input-icon" style="cursor:pointer;" @click="showPassword=!showPassword">
                {{ showPassword ? '🙈' : '👁️' }}
              </span>
            </div>
          </div>
          
          <button class="btn btn-admin btn-lg" style="width:100%;" 
                  @click="loginAdmin" :disabled="loading">
            {{ loading ? '登录中...' : '进入管理后台' }}
          </button>
        </div>
        
        <!-- 错误提示 -->
        <div v-if="error" class="login-error">
          ⚠️ {{ error }}
        </div>
      </div>
      
      <!-- 底部版权 -->
      <div class="login-footer">
        课堂电子宠物系统 v1.0 · Made by Qin_zzq · Copyright © 2026
      </div>
    </div>
  `
};
