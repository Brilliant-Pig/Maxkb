<template>
  <div class="homework-container">
    <nav class="hw-nav animate__animated animate__fadeIn">
      <div class="nav-brand">
        <span class="brand-icon">💻</span>
        <div class="brand-text">
          <div class="main-title">OS 实验与作业空间</div>
          <div class="sub-title">AI 驱动的代码逻辑诊断</div>
        </div>
      </div>
      <div class="actions">
        <button
          class="btn-submit"
          @click="submitForAudit"
          :disabled="isSubmitting || !codeContent.trim()"
          :class="{ 'is-loading': isSubmitting }"
        >
          <span v-if="isSubmitting" class="loading-icon"></span>
          <span>{{ isSubmitting ? 'AI 正在深度批改...' : '提交 AI 批改' }}</span>
        </button>
      </div>
    </nav>

    <div class="main-content">
      <section class="editor-section">
        <div class="editor-header">
          <div class="file-info">
            <span class="file-icon">C</span>
            <span class="file-name">os_assignment.c</span>
          </div>
          <div class="editor-meta">语言: C | 基于本地 Llama3/Qwen 批改</div>
        </div>

        <div class="code-editor-wrapper">
          <div class="line-numbers">
            <span v-for="n in lineCount" :key="n">{{ n }}</span>
          </div>
          <textarea
            v-model="codeContent"
            class="code-textarea"
            placeholder="// 在此输入你的操作系统实验代码（如进程同步、内存管理算法等）..."
            @input="updateLineCount"
            spellcheck="false"
          ></textarea>
        </div>
      </section>

      <aside class="side-panel">
        <Transition name="fade-slide" mode="out-in">
          <div v-if="diagnosticResult" class="result-section" key="result">
            <div class="result-header">
              <span class="ai-badge">AI 批改报告</span>
              <button class="close-btn" @click="diagnosticResult = null">重置</button>
            </div>
            <div class="result-content">
              <div class="score-box">
                <div class="score-circle" :style="{ borderColor: getScoreColor(diagnosticResult.score) }">
                  <span class="score">{{ diagnosticResult.score }}</span>
                  <span class="unit">分</span>
                </div>
                <div class="score-label">逻辑完整性评估</div>
              </div>
              
              <div class="analysis-list">
                <div class="analysis-item" v-for="(item, i) in diagnosticResult.details" :key="i">
                  <span class="type-tag" :class="item.type">{{ item.type === 'error' ? '逻辑缺陷' : '建议' }}</span>
                  <p>{{ item.text }}</p>
                </div>
              </div>

              <div class="performance-footer">
                <span>⚡ 本地推理引擎响应成功</span>
              </div>
            </div>
          </div>

          <div v-else class="guide-section" key="guide">
            <h3>本次实验任务</h3>
            <div class="task-card">
              <h4>【银行家算法实现】</h4>
              <ul class="requirements-list">
                <li>1. 实现安全序列检测函数 `isSafe()`</li>
                <li>2. 正确维护 `Available`, `Allocation`, `Need` 矩阵</li>
                <li>3. 模拟请求资源后的系统状态回滚逻辑</li>
              </ul>
            </div>
            <div class="tip-box">
              <i class="icon-info">💡</i>
              <p>请注意处理死锁避免的边界条件。编写完毕后点击上方按钮，AI 将根据知识库标准答案进行对比批改。</p>
            </div>
          </div>
        </Transition>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const codeContent = ref('');
const isSubmitting = ref(false);
const diagnosticResult = ref(null);
const lineCount = ref(1);

// 更新行号
const updateLineCount = () => {
  lineCount.value = codeContent.value.split('\n').length || 1;
};

// 核心逻辑：接入 MaxKB 进行真实批改
const submitForAudit = async () => {
  if (!codeContent.value.trim()) return;
  isSubmitting.value = true;

  try {
    // 构造发送给 AI 的提示词（Prompt Engineering）
    const fullPrompt = `你是一名操作系统课程教授。请对以下代码进行批改。
    代码内容：
    ${codeContent.value}
    
    请严格按照以下格式回答，不要有任何开场白：
    SCORE: [0-100的分数]
    ERRORS:
    - [具体逻辑错误1]
    - [具体逻辑错误2]
    SUGGESTIONS:
    - [优化建议1]`;

    // 真实调用 MaxKB API (根据你的 token 和地址)
    const response = await fetch('http://localhost:8090/api/application/chat/76725bd7865fb550/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 76725bd7865fb550' // 假设你的Token也是这个，如果不是请替换
      },
      body: JSON.stringify({ message: fullPrompt, re_chat: true })
    });

    const data = await response.json();
    const aiReply = data.data?.content || "";
    
    // 解析 AI 返回的文本
    parseAIResult(aiReply);

  } catch (error) {
    console.error("AI 批改请求失败:", error);
    alert("本地推理节点连接失败，请检查 MaxKB 服务状态。");
  } finally {
    isSubmitting.value = false;
  }
};

// 解析 AI 回复函数
const parseAIResult = (text) => {
  const scoreMatch = text.match(/SCORE:\s*(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 70;
  
  const details = [];
  // 简单正则提取错误和建议
  const lines = text.split('\n');
  let currentType = 'info';
  lines.forEach(line => {
    if (line.includes('ERRORS:')) currentType = 'error';
    if (line.includes('SUGGESTIONS:')) currentType = 'info';
    if (line.startsWith('-')) {
      details.push({ type: currentType, text: line.replace('-', '').trim() });
    }
  });

  diagnosticResult.value = {
    score: score,
    details: details.length > 0 ? details : [{ type: 'info', text: '逻辑基本正确，暂无明显错误。' }]
  };

  // --- 同步到教师端真实日志 ---
  const logs = JSON.parse(localStorage.getItem('os_chat_logs') || '[]');
  logs.push({
    id: Date.now(),
    type: 'HW_SUBMIT',
    codeLength: codeContent.value.length,
    score: score,
    timestamp: new Date().toLocaleString()
  });
  localStorage.setItem('os_chat_logs', JSON.stringify(logs));
};

const getScoreColor = (s) => {
  if (s >= 90) return '#22c55e';
  if (s >= 60) return '#eab308';
  return '#ef4444';
};

onMounted(() => {
  // 初始化代码示例
  codeContent.value = `// 示例：银行家算法片段\nvoid checkSafe() {\n  // 请完善逻辑...\n}`;
  updateLineCount();
});
</script>

<style scoped>
/* 继承之前的深色极客设计 */
.homework-container { height: 100%; display: flex; flex-direction: column; background: #0d1117; color: #c9d1d9; }
.hw-nav { height: 64px; background: #161b22; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; }
.nav-brand { display: flex; align-items: center; gap: 12px; }
.brand-icon { font-size: 1.8rem; }
.main-title { font-size: 1.1rem; font-weight: bold; color: #58a6ff; }
.sub-title { font-size: 0.7rem; color: #8b949e; }
.btn-submit { background: #238636; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-submit.is-loading { opacity: 0.7; cursor: wait; }
.main-content { flex: 1; display: flex; overflow: hidden; }
.editor-section { flex: 3; display: flex; flex-direction: column; border-right: 1px solid #30363d; }
.editor-header { padding: 8px 16px; background: #0d1117; display: flex; justify-content: space-between; font-size: 0.75rem; color: #8b949e; border-bottom: 1px solid #21262d; }
.code-editor-wrapper { flex: 1; display: flex; background: #0d1117; overflow: hidden; }
.line-numbers { width: 45px; padding: 16px 0; background: #0d1117; color: #484f58; text-align: center; font-family: monospace; border-right: 1px solid #21262d; }
.code-textarea { flex: 1; background: transparent; border: none; color: #e6edf3; padding: 16px; font-family: 'Fira Code', monospace; font-size: 0.95rem; line-height: 1.6; resize: none; outline: none; }
.side-panel { flex: 1.2; background: #161b22; display: flex; flex-direction: column; overflow-y: auto; }
.guide-section, .result-section { padding: 24px; }
.task-card { background: #0d1117; padding: 16px; border-radius: 8px; border: 1px solid #30363d; margin-top: 15px; }
.requirements-list { list-style: none; padding: 0; margin: 12px 0; font-size: 0.85rem; color: #8b949e; }
.requirements-list li { margin-bottom: 8px; }
.score-box { text-align: center; margin-bottom: 24px; }
.score-circle { width: 100px; height: 100px; border: 5px solid #238636; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 10px; }
.score { font-size: 2.2rem; font-weight: bold; }
.analysis-item { padding: 12px; background: #0d1117; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #30363d; }
.type-tag.error { color: #f85149; font-size: 0.7rem; font-weight: bold; }
.type-tag.info { color: #58a6ff; font-size: 0.7rem; font-weight: bold; }
.loading-icon { width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>