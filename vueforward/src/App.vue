<template>
  <button v-if="userRole === 'teacher'" @click="goToAdmin">
  进入教师管理后台
  </button>
  <div id="app">
    <div class="particles-bg"></div>

    <nav v-if="showNav" class="main-nav animate__animated animate__fadeInDown">
      <div class="nav-logo">OS-AI 智学系统</div>
      <div class="nav-links">
        <router-link to="/ImmersiveLab" class="nav-link">AI实验室</router-link>
        <router-link to="/HomeworkAssistant" class="nav-link">作业助手</router-link>
        <router-link to="/LearningDashboard" class="nav-link">学业评价</router-link>
        <router-link to="/TeacherConsole" class="nav-link">教师后台</router-link>
      </div>
    </nav>
    
    <div class="view-container">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    <footer v-if="showNav" class="app-footer">
      <div class="footer-content">
        <span>当前环境: 实验室私有云 (RTX 4060)</span>
        <span class="divider">|</span>
        <span>推理引擎: Ollama / Qwen2</span>
        <span class="divider">|</span>
        <span class="security-tag">🛡️ 数据不出校 · 安全加密中</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import 'animate.css'

const route = useRoute()
const showNav = computed(() => route.name !== 'login')
const user = JSON.parse(localStorage.getItem('user'));
const userRole = user ? user.role : '';

onMounted(() => {
  // --- 关键修改：建立页面间的联系逻辑 ---
  
  // 1. 初始化分组信息 (模拟准实验研究的分组)
  if (!localStorage.getItem('os_user_group')) {
    // 默认设为实验组，后续可在教师后台切换
    localStorage.setItem('os_user_group', 'experiment_group'); 
  }

  // 2. 初始化行为日志库 (用于 Page 1/2 产生数据，Page 4 展示数据)
  if (!localStorage.getItem('os_chat_logs')) {
    localStorage.setItem('os_chat_logs', JSON.stringify([]));
  }

  // 3. 初始化量表状态
  if (!localStorage.getItem('os_survey_done')) {
    localStorage.setItem('os_survey_done', 'false');
  }

  console.log("OS-AI 系统初始化完成，分组：", localStorage.getItem('os_user_group'));
})
</script>

<style>
/* 基础重置 */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  background: #0a0e14; /* 深色科技背景 */
}

#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  color: #e0e0e0;
}

/* 粒子背景动画 */
.particles-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(circle at center, #1b2735 0%, #090a0f 100%);
  overflow: hidden;
}

.particles-bg::after {
  content: "";
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  box-shadow: 
    10vw 20vh 1px #fff, 30vw 50vh 1px #fff, 70vw 10vh 2px #fff,
    90vw 80vh 1px #fff, 40vw 90vh 2px #fff, 15vw 40vh 1px #fff;
  border-radius: 50%;
  opacity: 0.3;
  animation: bg-move 100s linear infinite;
}

@keyframes bg-move {
  from { transform: translateY(0); }
  to { transform: translateY(-1000px); }
}

/* 导航样式修改 */
.main-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 64px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.nav-logo {
  font-size: 1.4rem;
  font-weight: bold;
  background: linear-gradient(120deg, #409eff, #71b7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  text-decoration: none;
  color: #909399;
  font-size: 1rem;
  transition: all 0.3s;
}

.nav-link:hover, .router-link-active {
  color: #409eff;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

/* 内容容器 */
.view-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.4s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 页脚样式 */
.app-footer {
  height: 32px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #606266;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.divider {
  margin: 0 15px;
  opacity: 0.3;
}

.security-tag {
  color: #67c23a;
}
</style>