<template>
  <div class="dashboard-container">
    <aside class="stats-sidebar animate__animated animate__fadeInLeft">
      <div class="sidebar-header">
        <span class="icon">📈</span>
        <h2>成长评价中心</h2>
      </div>

      <div class="progress-card">
        <div class="label-row">
          <span>知识点掌握度</span>
          <span class="percent">{{ progress }}%</span>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: progress + '%' }"></div>
        </div>
        <p class="status-text">数据基于您的最新测评得分实时同步</p>
      </div>

      <nav class="nav-menu">
        <button @click="activeTab = 'efficacy'" :class="{ active: activeTab === 'efficacy' }">
          <span class="m-icon">🎯</span> 学业自我效能自评
        </button>
        <button @click="activeTab = 'sus'" :class="{ active: activeTab === 'sus' }">
          <span class="m-icon">⚙️</span> 系统可用性评价 (SUS)
        </button>
        <button @click="activeTab = 'faq'" :class="{ active: activeTab === 'faq' }">
          <span class="m-icon">❓</span> 考前高频问题集
        </button>
      </nav>
    </aside>

    <main class="content-area">
      <Transition name="fade-transform" mode="out-in">
        
        <section v-if="activeTab === 'efficacy'" class="scale-section" key="efficacy">
          <div class="section-title">
            <h3>学业自我效能感测评 (Post-test)</h3>
            <p class="subtitle">请根据您完成 AI 实验室学习后的真实感受进行打分</p>
          </div>
          
          <div class="likert-table">
            <div class="likert-header">
              <span class="q-label">测评项</span>
              <div class="options-legend">
                <span>完全不符合</span>
                <span>完全符合</span>
              </div>
            </div>
            
            <div v-for="(item, index) in efficacyItems" :key="index" class="likert-row">
              <div class="likert-q">{{ index + 1 }}. {{ item }}</div>
              <div class="likert-options">
                <label v-for="n in 5" :key="n" class="likert-item">
                  <input type="radio" :name="'eff'+index" v-model="effAnswers[index]" :value="n" @change="calculateProgress">
                  <span class="likert-circle">{{ n }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="action-footer">
            <button class="save-btn" @click="saveEfficacy">保存并更新掌握度数据</button>
          </div>
        </section>

        <section v-else-if="activeTab === 'sus'" class="scale-section" key="sus">
          <div class="section-title">
            <h3>系统可用性量表 (SUS)</h3>
            <p class="subtitle">针对本套本地部署 AI 助学系统的交互体验评价</p>
          </div>

          <div class="sus-list">
            <div v-for="(item, index) in susItems" :key="index" class="sus-card">
              <div class="sus-q-text">{{ index + 1 }}. {{ item }}</div>
              <div class="sus-options">
                <label v-for="n in 5" :key="n" class="sus-opt-label">
                  <input type="radio" :name="'sus'+index" v-model="susAnswers[index]" :value="n">
                  <span class="sus-dot">{{ n }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="action-footer">
            <button class="save-btn sus" @click="calculateSUS">提交系统评价结果</button>
          </div>
        </section>

        <section v-else class="faq-section" key="faq">
          <div class="section-title">
            <h3>考前高频问题集</h3>
            <p class="subtitle">提问 7 天内支持修改或撤回，数据同步至教师端</p>
          </div>

          <div class="ask-input-group">
            <input v-model="newQuestion" placeholder="在此输入你的 OS 相关疑问..." @keyup.enter="submitNewQuestion">
            <button @click="submitNewQuestion" class="ask-btn">发起提问</button>
          </div>

          <div class="faq-grid">
            <div v-for="faq in dynamicFaqList" :key="faq.id" class="faq-card" :class="{ 'is-student': faq.isStudent }">
              <div class="faq-header">
                <span class="faq-tag">{{ faq.isStudent ? '我的提问' : '热点点击' }}</span>
                <div v-if="faq.isStudent && canModify(faq.id)" class="faq-actions">
                  <button @click="editQuestion(faq)" class="act-btn edit">🖊️</button>
                  <button @click="deleteQuestion(faq.id)" class="act-btn del">🗑️</button>
                </div>
              </div>
              <h4>{{ faq.question }}</h4>
              <p class="faq-ans">{{ faq.answer }}</p>
              <div class="faq-footer">
                <span class="hot-val">🔥 热度: {{ faq.hot }}</span>
                <span v-if="faq.isStudent" class="time-limit">有效期至: {{ getExpiryDate(faq.id) }}</span>
              </div>
            </div>
          </div>
        </section>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const activeTab = ref('efficacy');
const progress = ref(0);
const newQuestion = ref('');

// --- 核心修改：将数据转为响应式 ref ---
const studentQuestions = ref([]);
const systemHotTopics = ref([]);

const efficacyItems = ["理解 OS 虚拟内存等难点", "掌握核心概念和原理", "有信心在考试中取得佳绩", "无需指导也能通过自学掌握", "能解决 OS 相关的编程模拟", "能清晰解释 PV 操作等机制", "AI 助手提升了我的学习信心", "有能力克服理解上的困难", "将理论应用到实际系统开发"];
const susItems = ["我愿意经常使用该系统", "我发现系统设计并不复杂", "系统非常易于使用", "我不需要技术人员支持就能用", "各项功能整合得非常到位", "我发现系统存在很多不一致性", "大部分人能很快学会使用", "我感觉系统操作起来很笨拙", "使用该系统时我感到很自信", "我需要学习很多背景知识才能用"];

const effAnswers = ref(new Array(9).fill(0));
const susAnswers = ref(new Array(10).fill(3));

// 计算掌握度逻辑
const calculateProgress = () => {
  const answered = effAnswers.value.filter(v => v > 0);
  if (answered.length === 0) return;
  const avg = answered.reduce((a, b) => a + b, 0) / answered.length;
  progress.value = Math.round((avg / 5) * 100);
};

// 初始化：将所有本地存储读入响应式变量
onMounted(() => {
  // 1. 读取学生问题
  studentQuestions.value = JSON.parse(localStorage.getItem('os_student_questions') || '[]');
  
  // 2. 读取热点数据 (这就是“问题1”所在的地方)
  const clickData = JSON.parse(localStorage.getItem('os_topic_clicks') || '{}');
  systemHotTopics.value = Object.keys(clickData).map(topic => ({
    id: topic,
    question: topic,
    hot: clickData[topic],
    isStudent: false,
    answer: "点击实验室快捷键可获取此考点的详细 AI 回答。"
  }));

  const savedEff = localStorage.getItem('os_survey_efficacy');
  if (savedEff) { effAnswers.value = JSON.parse(savedEff); calculateProgress(); }
});

// 计算属性：自动合并并过滤脏数据
const dynamicFaqList = computed(() => {
  // 增加强力过滤，防止顽固的“问题1”再次出现
  return [...studentQuestions.value, ...systemHotTopics.value]
    .filter(item => item.question !== ' ' && item.question.trim() !== '')
    .sort((a, b) => (b.hot || 0) - (a.hot || 0));
});

const canModify = (timestamp) => {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return (Date.now() - timestamp) < sevenDaysInMs;
};

const getExpiryDate = (timestamp) => {
  return new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
};

const submitNewQuestion = () => {
  if (!newQuestion.value.trim()) return;
  const newItem = {
    id: Date.now(),
    question: newQuestion.value,
    hot: 1,
    isStudent: true,
    answer: "老师正在审阅，解析将在稍后同步。"
  };
  studentQuestions.value.unshift(newItem);
  localStorage.setItem('os_student_questions', JSON.stringify(studentQuestions.value));
  newQuestion.value = '';
};

// 彻底修复：点击删除时同时清理内存和存储
const deleteQuestion = (id) => {
  if (!confirm("确定要删除这个问题吗？")) return;
  
  // 1. 更新学生问题列表
  studentQuestions.value = studentQuestions.value.filter(q => q.id !== id);
  localStorage.setItem('os_student_questions', JSON.stringify(studentQuestions.value));
};

const editQuestion = (faq) => {
  const updated = prompt("修改你的问题：", faq.question);
  if (updated && updated.trim()) {
    const index = studentQuestions.value.findIndex(q => q.id === faq.id);
    if (index !== -1) {
      studentQuestions.value[index].question = updated;
      localStorage.setItem('os_student_questions', JSON.stringify(studentQuestions.value));
    }
  }
};

const saveEfficacy = () => {
  localStorage.setItem('os_survey_efficacy', JSON.stringify(effAnswers.value));
  alert("自评已存档，掌握度已同步更新。");
};

const calculateSUS = () => {
  let total = 0;
  susAnswers.value.forEach((v, i) => {
    total += ((i + 1) % 2 !== 0) ? (v - 1) : (5 - v);
  });
  localStorage.setItem('os_survey_sus_score', total * 2.5);
  alert("系统评价已提交，感谢反馈！");
};
</script>

<style scoped>
/* 保持原有样式不变 */
.dashboard-container { display: flex; height: 100vh; background: #0f172a; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }
.stats-sidebar { width: 320px; background: #1e293b; padding: 40px 24px; border-right: 1px solid rgba(255,255,255,0.05); }
.sidebar-header { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
.sidebar-header h2 { font-size: 1.4rem; font-weight: 800; color: #3b82f6; }
.progress-card { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; margin-bottom: 30px; }
.percent { font-size: 1.8rem; font-weight: 900; color: #3b82f6; }
.progress-bar { height: 8px; background: #334155; border-radius: 4px; margin: 12px 0; overflow: hidden; }
.fill { background: linear-gradient(90deg, #3b82f6, #60a5fa); height: 100%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
.status-text { font-size: 0.75rem; color: #64748b; }
.nav-menu { display: flex; flex-direction: column; gap: 12px; }
.nav-menu button { display: flex; align-items: center; gap: 12px; padding: 16px; background: transparent; border: 1px solid transparent; border-radius: 12px; color: #94a3b8; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.nav-menu button.active { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; color: white; }
.content-area { flex: 1; padding: 50px; overflow-y: auto; }
.section-title { margin-bottom: 40px; }
.section-title h3 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; }
.subtitle { color: #64748b; font-size: 1rem; }
.likert-table { background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
.likert-header { display: flex; justify-content: space-between; padding: 20px 30px; background: rgba(255,255,255,0.02); font-weight: bold; color: #3b82f6; }
.options-legend { display: flex; gap: 80px; font-size: 0.85rem; }
.likert-row { display: flex; justify-content: space-between; align-items: center; padding: 24px 30px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.likert-q { flex: 1; font-size: 1rem; line-height: 1.6; }
.likert-options { display: flex; gap: 12px; }
.likert-circle { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #334155; border-radius: 50%; cursor: pointer; transition: all 0.2s; }
input:checked + .likert-circle { background: #3b82f6; color: white; transform: scale(1.15); box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
input[type="radio"] { display: none; }
.sus-list { display: grid; gap: 20px; }
.sus-card { background: #1e293b; padding: 24px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; }
.sus-dot { padding: 8px 16px; background: #334155; border-radius: 8px; cursor: pointer; }
input:checked + .sus-dot { background: #3b82f6; }
.ask-input-group { display: flex; gap: 12px; margin-bottom: 40px; }
.ask-input-group input { flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 18px; color: white; font-size: 1rem; }
.ask-btn { background: #3b82f6; color: white; border: none; padding: 0 30px; border-radius: 12px; font-weight: bold; cursor: pointer; }
.faq-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
.faq-card { background: #1e293b; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
.faq-card.is-student { border-left: 5px solid #3b82f6; background: rgba(59, 130, 246, 0.05); }
.faq-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
.faq-tag { font-size: 0.7rem; padding: 4px 10px; background: #334155; border-radius: 20px; }
.act-btn { background: transparent; border: none; cursor: pointer; opacity: 0.6; margin-left: 8px; font-size: 1.1rem; }
.act-btn:hover { opacity: 1; transform: scale(1.2); }
.faq-ans { font-size: 0.9rem; color: #94a3b8; margin: 15px 0; min-height: 40px; }
.faq-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; }
.action-footer { margin-top: 40px; display: flex; justify-content: flex-end; }
.save-btn { background: #3b82f6; color: white; border: none; padding: 18px 40px; border-radius: 12px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
.fade-transform-enter-active, .fade-transform-leave-active { transition: all 0.4s ease; }
.fade-transform-enter-from { opacity: 0; transform: translateY(20px); }
.fade-transform-leave-to { opacity: 0; transform: translateY(-20px); }
</style>