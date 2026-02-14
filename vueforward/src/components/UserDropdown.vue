<template>
  <div class="user-profile-container" ref="dropdownRef">
    <div class="avatar-trigger" @click="toggleDropdown">
      <div class="avatar-circle">
        {{ username.charAt(0).toUpperCase() }}
      </div>
      <span class="material-icons">arrow_drop_down</span>
    </div>

    <transition name="github-fade">
      <div v-if="isOpen" class="profile-dropdown">
        <div class="user-header">
          <p class="signed-in-as">当前登录身份</p>
          <p class="user-name">{{ username }}</p>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <div class="user-status">
          <span class="status-dot" :class="role"></span>
          {{ role === 'teacher' ? '教师权限' : '学生用户' }}
        </div>

        <div class="dropdown-divider"></div>

        <div class="menu-links">
          <a @click="handleProfile">个人设置</a>
          <a @click="handleHelp">获取帮助</a>
          <div class="dropdown-divider"></div>
          <a @click="handleLogout" class="logout-btn">退出登录</a>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const isOpen = ref(false);
const dropdownRef = ref(null);

// 从本地存储获取用户信息
const user = JSON.parse(localStorage.getItem('user') || '{}');
const username = user.username || 'User';
const role = user.role || 'student';

const toggleDropdown = () => { isOpen.value = !isOpen.value; };

// UserDropdown.vue 中的 script 部分

const handleLogout = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      // ⚠️ 注意：这里的 URL 路径要根据你后端的实际配置修改
      // 如果你配置了 axios 拦截器，可以直接写 '/auth/logout'
      await axios.post('http://127.0.0.1:33001/api/auth/logout', {}, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
    }
  } catch (error) {
    // 即使后端接口报错（比如网络问题），前端通常也要清理本地缓存并跳转
    console.error('后端退出接口调用失败:', error);
  } finally {
    // 无论成功还是失败，都执行下面的清理工作
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    isOpen.value = false;
    router.push('/login'); // 跳转回登录页
  }
};

const handleProfile = () => { alert('个人中心开发中...'); isOpen.value = false; };
const handleHelp = () => { window.open('https://github.com/', '_blank'); isOpen.value = false; };

// 点击外部自动关闭
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<style scoped>
.user-profile-container { position: relative; display: inline-block; }

.avatar-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: 0.2s;
}
.avatar-trigger:hover { background: rgba(255,255,255,0.1); }

.avatar-circle {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  border: 1px solid rgba(255,255,255,0.2);
}

.profile-dropdown {
  position: absolute;
  top: 45px;
  right: 0;
  width: 200px;
  background: #161b22; /* GitHub 深色背景 */
  border: 1px solid #30363d;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  z-index: 1000;
  padding: 8px 0;
}

.user-header { padding: 8px 16px; }
.signed-in-as { font-size: 12px; color: #8b949e; margin: 0; }
.user-name { font-size: 14px; color: #c9d1d9; font-weight: 600; margin: 4px 0 0 0; }

.user-status {
  padding: 8px 16px;
  font-size: 13px;
  color: #c9d1d9;
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.teacher { background: #238636; box-shadow: 0 0 8px #238636; }
.status-dot.student { background: #388bfd; }

.dropdown-divider { height: 1px; background: #30363d; margin: 8px 0; }

.menu-links a {
  display: block;
  padding: 6px 16px;
  font-size: 14px;
  color: #c9d1d9;
  cursor: pointer;
  text-decoration: none;
}
.menu-links a:hover { background: #1f6feb; color: white; }
.logout-btn:hover { background: #da3633 !important; }

/* 动画 */
.github-fade-enter-active, .github-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.github-fade-enter-from, .github-fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>