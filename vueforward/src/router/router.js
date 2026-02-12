import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    // 1. 刚进网站直接跳转到登录注册页
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../page/auth.vue'),
        meta: { title: '身份认证', freeAuth: true } // 标记不需要登录
    },
    {
        path: '/TeacherConsole',
        name: 'TeacherConsole',
        component: () => import('../page/TeacherConsole.vue'),
        meta: { title: '教师控制台', role: 'teacher' } // 标记只有教师可进
    },
    {
        path: '/ImmersiveLab',
        name: 'ImmersiveLab',
        component: () => import('../page/ImmersiveLab.vue'),
        meta: {
            title: '沉浸式AI实验室',
            freeAuth: true
        }
    },
    {
        path: '/TeacherConsole',
        name: 'TeacherConsole',
        component: () => import('../page/TeacherConsole.vue'),
        meta: {
            title: '教师控制台',
            freeAuth: false
        }
    },
    {
        path: '/HomeworkAssistant',
        name: 'HomeworkAssistant',
        component: () => import('../page/HomeworkAssistant.vue'),
        meta: {
            title: '作业助手',
            freeAuth: false
        }
    },
    {
        path: '/LearningDashboard',
        name: 'LearningDashboard',
        component: () => import('../page/LearningDashboard.vue'),
        meta: {
            title: '学习仪表盘',
            freeAuth: false
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// --- 路由守卫：实现登录拦截和角色过滤 ---
router.beforeEach((to, from, next) => {
    // 从 localStorage 获取用户信息
    const user = JSON.parse(localStorage.getItem('user'));

    // 如果要去的是免登录页面（如 Login），直接放行
    if (to.meta.freeAuth) {
        return next();
    }

    // 如果未登录，全部踢回登录页
    if (!user || !user.token) {
        return next({ name: 'Login' });
    }

    // 如果要去教师端，检查角色
    if (to.meta.role === 'teacher') {
        if (user.role === 'teacher') {
            next(); // 是老师，放行
        } else {
            alert('权限不足：学生无法进入教师管理后台');
            next({ name: 'HomeworkAssistant' }); // 学生强制跳回作业助手
        }
    } else {
        next(); // 其他页面正常放行
    }
});

export default router;