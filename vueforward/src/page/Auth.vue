    <template>
    <div class="auth-container">
        <div class="auth-card animate__animated animate__fadeIn">
        <div class="auth-header">
            <div class="github-logo">
            <svg height="48" viewBox="0 0 16 16" width="48" fill="white">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            </div>
            <h1>{{ isLogin ? '登录到 OS-AI' : '创建您的账号' }}</h1>
        </div>

        <div class="auth-body">
            <form @submit.prevent="handleSubmit">
            
            <div v-if="!isLogin" class="input-group">
                <label>用户名</label>
                <input 
                v-model="formData.username" 
                type="text" 
                placeholder="设置唯一用户名"
                required
                />
            </div>

            <div class="input-group">
                <label>邮箱地址</label>
                <input 
                v-model="formData.email" 
                type="email" 
                placeholder="name@example.com"
                required
                />
            </div>

            <div v-if="!isLogin" class="input-group">
                <label>邮箱验证码</label>
                <div class="verify-wrapper">
                <input v-model="formData.code" type="text" placeholder="6位数字" maxlength="6" />
                <button 
                    type="button" 
                    :disabled="cooldown > 0" 
                    @click="sendVerifyCode"
                    class="btn-verify"
                >
                    {{ cooldown > 0 ? `${cooldown}s` : '获取验证码' }}
                </button>
                </div>
            </div>

            <div class="input-group">
                <div class="label-row">
                <label>密码</label>
                <a v-if="isLogin" href="#" class="forgot-link">忘记密码?</a>
                </div>
                <input 
                v-model="formData.password" 
                type="password" 
                required
                />
            </div>

            <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? '处理中...' : (isLogin ? '立即登录' : '创建账号') }}
            </button>
            </form>
        </div>

        <div class="auth-footer">
            <p v-if="isLogin">
            还没有账号? <a @click="toggleMode">创建一个</a>
            </p>
            <p v-else>
            已有账号? <a @click="toggleMode">去登录</a>
            </p>
        </div>
        </div>
    </div>
    </template>

    <script setup>
    import { ref, reactive } from 'vue';
    import axios from 'axios';
    import { useRouter } from 'vue-router';
    const router = useRouter();

    const isLogin = ref(true);  
    const loading = ref(false);
    const cooldown = ref(0);
    const API_BASE = 'http://127.0.0.1:33001/api/auth';

    const formData = reactive({
    username: '',
    email: '',
    password: '',
    code: ''
    });

    // 切换登录/注册模式
    const toggleMode = () => {
    isLogin.value = !isLogin.value;
    // 重置表单
    formData.username = '';
    formData.email = '';
    formData.password = '';
    formData.code = '';
    };

    // 发送验证码逻辑
    const sendVerifyCode = async () => {
    if (!formData.email) return alert('请先输入邮箱');
    
    try {
        // 模拟后端调用
        console.log('正在向邮箱发送验证码:', formData.email);
        // const res = await axios.post(`${API_BASE}/send-code`, { email: formData.email });
        
        alert('验证码已发送至您的邮箱');
        
        // 启动倒计时
        cooldown.value = 60;
        const timer = setInterval(() => {
        cooldown.value--;
        if (cooldown.value <= 0) clearInterval(timer);
        }, 1000);
    } catch (err) {
        alert('发送失败，请稍后再试');
    }
    };

    const handleSubmit = async () => {
    loading.value = true;
    try {
        // 这里是你之后的 axios 请求逻辑，现在先写模拟数据
        // 假设后端返回了用户信息：{ email, username, role, token }
        const mockRole = formData.email.includes('teacher') ? 'teacher' : 'student'; // 演示用逻辑
        
        const userData = {
        username: formData.username || '新用户',
        email: formData.email,
        role: mockRole, 
        token: 'temp_token_' + Date.now()
        };

        // 1. 存储到本地，供路由守卫检查
        localStorage.setItem('user', JSON.stringify(userData));

        // 2. 注册/登录成功后，统一跳转到作业助手
        alert(isLogin.value ? '登录成功' : '注册成功并已自动登录');
        router.push('/HomeworkAssistant');

    } catch (err) {
        alert('操作失败，请检查网络');
    } finally {
        loading.value = false;
    }
    };
    </script>

    <style scoped>
    .auth-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #0d1117; /* GitHub 背景色 */
    color: #c9d1d9;
    }

    .auth-card {
    width: 340px;
    padding: 20px;
    }

    .auth-header {
    text-align: center;
    margin-bottom: 20px;
    }

    .auth-header h1 {
    font-size: 24px;
    font-weight: 300;
    margin-top: 15px;
    letter-spacing: -0.5px;
    }

    .auth-body {
    background-color: #161b22;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 15px;
    }

    .input-group {
    margin-bottom: 15px;
    }

    .input-group label {
    display: block;
    font-size: 14px;
    margin-bottom: 7px;
    text-align: left;
    }

    .input-group input {
    width: 100%;
    padding: 5px 12px;
    font-size: 14px;
    background-color: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: white;
    box-sizing: border-box;
    }

    .input-group input:focus {
    border-color: #58a6ff;
    outline: none;
    box-shadow: 0 0 0 3px rgba(56, 139, 253, 0.3);
    }

    .verify-wrapper {
    display: flex;
    gap: 8px;
    }

    .btn-verify {
    white-space: nowrap;
    background-color: #21262d;
    border: 1px solid #30363d;
    color: #58a6ff;
    border-radius: 6px;
    padding: 0 10px;
    cursor: pointer;
    font-size: 12px;
    }

    .btn-verify:disabled {
    color: #8b949e;
    cursor: not-allowed;
    }

    .btn-primary {
    width: 100%;
    background-color: #238636;
    color: white;
    border: 1px solid rgba(240, 246, 252, 0.1);
    border-radius: 6px;
    padding: 7px 16px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 10px;
    }

    .btn-primary:hover {
    background-color: #2ea043;
    }

    .auth-footer {
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 15px;
    text-align: center;
    font-size: 14px;
    }

    .auth-footer a, .forgot-link {
    color: #58a6ff;
    cursor: pointer;
    text-decoration: none;
    }

    .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    }

    .forgot-link {
    font-size: 12px;
    }
    </style>