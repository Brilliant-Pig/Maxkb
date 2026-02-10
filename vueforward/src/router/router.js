import { createRouter, createWebHistory } from 'vue-router';

const routes = [
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

// // 升级版导航守卫（兼容原有逻辑，增加 Vuex 状态检查）
// router.beforeEach((to, from, next) => {
// // 1. 优先从 Vuex 读取 token（保持状态集中管理）
// const isAuthenticated = store.getters.isAuthenticated;

// // 2. 兼容性回退：如果 Vuex 未启用，则从 localStorage 读取（逐步迁移用）
// const fallbackToken = localStorage.getItem('token');

// // 3. 判断是否免认证页面
// const isFreeAuth = to.matched.some(record => record.meta.freeAuth);

//  // 4. 权限判断逻辑（优先级：Vuex > localStorage）
// if (!isFreeAuth) {
//     if (!isAuthenticated && !fallbackToken) {
//     // 情况1：需要认证但未登录 → 跳登录页
//         next({ name: 'login' });
//         return;
//     } else if (to.name === 'login' && (isAuthenticated || fallbackToken)) {
//         // 情况2：已登录但访问登录页 → 跳首页
//         next('/LotteryMain');
//         return;
//     }
// }

// // 5. 其他情况放行
//     next();
// });

export default router;