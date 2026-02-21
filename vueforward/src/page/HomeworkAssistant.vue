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
    // 构造发送给 AI 的提示词（简化版，更自然）
    const fullPrompt = `你是一名操作系统课程教授。请仔细分析以下代码并评估质量，满分100分。
    代码内容：
    ${codeContent.value}
    
    请给出：
    1. 评分（0-100分）
    2. 代码中的问题（如果有）
    3. 改进建议（如果有）
    
    请直接回答，评分可以用以下任一格式：
    - 评分：85分
    - 得分：85/100
    - SCORE: 85`;
    // 真实调用 MaxKB API (根据你的 token 和地址)
    const chatIdResponse = await fetch('http://localhost:8090/chat/api/open', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer application-bb3982ea3ad34a8264a5ac2f7ce2b78b'
      }
    });
    
    if (!chatIdResponse.ok) {
      throw new Error(`获取会话ID失败: ${chatIdResponse.status}`);
    }
    
    const chatIdData = await chatIdResponse.json();
    const chatId = chatIdData.data || chatIdData.id || '';
    
    console.log('获取到的会话 ID:', chatId);
    
    if (!chatId) {
      throw new Error('无法获取会话 ID');
    }
    
    const response = await fetch(`http://localhost:8090/chat/api/chat_message/${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer application-bb3982ea3ad34a8264a5ac2f7ce2b78b'
      },
      body: JSON.stringify({ 
        message: fullPrompt,
        stream: false,
        re_chat: true
      })
    });
    
    const data = await response.json();
    const aiReply = data.data?.content || "";
    
    // 解析 AI 返回的文本
    parseAIResult(aiReply);

  } catch (error) {
    console.error("AI 批改请求失败:", error);
    // alert 已删除
  } finally {
    isSubmitting.value = false;
  }
};

// 解析 AI 回复函数
const parseAIResult = (text) => {
  console.log('AI 原始返回内容:', text);
  
  // 尝试从内容中提取分数
  let score = 70;
  let scoreFound = false;
  
  // 方法1: 尝试匹配标准格式 "SCORE: 数字"
  const scoreMatch = text.match(/SCORE:\s*(\d+)/);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1]);
    scoreFound = true;
  }
  
  // 方法1.5: 尝试匹配 "85/100" 格式
  if (!scoreFound) {
    const slashMatch = text.match(/(\d{1,3})\s*\/\s*100/);
    if (slashMatch) {
      score = parseInt(slashMatch[1]);
      scoreFound = true;
      console.log("通过斜杠格式找到分数:", slashMatch[0]);
    }
  }
  
  if (!scoreFound) {
    // 方法2: 尝试从内容中查找数字分数 - 支持多种格式
    const patterns = [
      /评分[:：](?:大约|可能|大概)?\s*(\d{1,3})\s*分/,
      /分数[:：](?:大约|可能|大概)?\s*(\d{1,3})\s*分/,
      /得分[:：](?:大约|可能|大概)?\s*(\d{1,3})\s*分/,
      /最终评分[:：](?:大约|可能|大概)?\s*(\d{1,3})\s*分/,
      /(?:大约|可能|大概)?\s*(\d{1,3})\s*分左右/,
      /score[:：]\s*(\d{1,3})\s*\/\s*100/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const foundScore = parseInt(match[1] || match[2]);
        if (foundScore >= 0 && foundScore <= 100) {
          const fullText = match[0];
          const matchIndex = text.indexOf(fullText);
          const precedingText = text.substring(Math.max(0, matchIndex - 20), matchIndex);
          
          if (precedingText.match(/满分|0-100|满分是|满分为/)) {
            console.log('跳过描述性文字后的分数:', fullText);
            continue;
          }
          
          score = foundScore;
          scoreFound = true;
          console.log('匹配到完整文本:', match[0], '提取分数:', match[1], '使用模式:', pattern);
          break;
        }
      }
    }
  }
  
  // 方法3: 如果没有找到分数，根据建议的数量和质量智能估算
  if (!scoreFound) {
    console.log('未找到明确分数，开始智能估算...');
    
    // 更精确的错误统计：只统计明确的"错误"描述
    // 忽略建议、代码示例、格式化内容
    const lines = text.split('\n');
    let actualErrorCount = 0;
    let suggestionCount = 0;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // 统计真正的错误（包含"错误"、"问题"、"缺陷"、"bug"等关键词）
      if (trimmedLine.match(/错误|问题|缺陷|bug|Error|issue|fault|第\d+行/) && !trimmedLine.includes('建议')) {
        actualErrorCount++;
      }
      // 统计建议（包含"建议"、"优化"、"改进"等关键词）
      else if (trimmedLine.match(/建议|优化|改进|建议|优化|改进/)) {
        suggestionCount++;
      }
    });
    
    const totalIssues = actualErrorCount + suggestionCount;
    
    console.log('精确统计问题数量:', totalIssues, '(实际错误:', actualErrorCount, ', 建议:', suggestionCount, ')');
    
    // 根据问题数量估算分数 - 更宽松的标准，对好代码给高分
    // 如果主要是建议而非错误，应该给高分
    if (actualErrorCount === 0) {
      // 没有实际错误，只有建议 - 优秀
      if (suggestionCount <= 3) {
        score = 98 - suggestionCount; // 95-98分
      } else {
        score = 95 - (suggestionCount - 3) * 2; // 建议4+：91-93分
      }
    } else if (actualErrorCount <= 2) {
      // 有少量错误，整体良好
      score = 85 - (actualErrorCount * 5); // 75-85分
    } else if (actualErrorCount <= 4) {
      // 有一些错误，需要改进
      score = 70 - (actualErrorCount * 5); // 50-70分
    } else {
      // 错误较多
      score = Math.max(20, 50 - actualErrorCount * 5); // 20-50分
    }
    
    console.log('智能估算分数:', score);
  }
  
  // 检测是否 MaxKB 给了详细分析但没给分数
  // 更合理的评分：综合考虑错误和建议数量
  if (!scoreFound && text.length > 500) {
    const errorKeywords = ['错误', '缺陷', 'bug', '严重', '致命', '失败', '问题'];
    const suggestionKeywords = ['建议', '优化', '改进', '可以', '更好'];
    
    let errorCount = 0;
    let suggestionCount = 0;
    
    // 统计错误关键词出现次数（避免重复统计同一关键词）
    const errorSet = new Set();
    const suggestionSet = new Set();
    
    errorKeywords.forEach(keyword => {
      if (text.includes(keyword)) errorSet.add(keyword);
    });
    
    suggestionKeywords.forEach(keyword => {
      if (text.includes(keyword)) suggestionSet.add(keyword);
    });
    
    errorCount = errorSet.size;
    suggestionCount = suggestionSet.size;
    
    // 评分逻辑：
    // 1. 错误很少（≤1）+ 有建议 → 90-95分
    // 2. 错误很少（≤1）+ 无建议 → 85-90分
    // 3. 错误较少（2-3）+ 建议多于错误 → 75-85分
    // 4. 错误较少（2-3）+ 建议不多 → 65-75分
    // 5. 错误较多（≥4）→ 最多70分，根据错误数量扣分
    
    if (errorCount <= 1) {
      if (suggestionCount >= 2) {
        score = Math.max(score, 92);
        console.log('错误很少且有建议，调整分数为:', score);
      } else if (suggestionCount >= 1) {
        score = Math.max(score, 88);
        console.log('错误很少有少量建议，调整分数为:', score);
      } else {
        score = Math.max(score, 85);
        console.log('错误很少无建议，调整分数为:', score);
      }
    } else if (errorCount <= 3) {
      if (suggestionCount > errorCount) {
        score = Math.max(score, 80 - errorCount * 2);
        console.log('错误较少且建议多，调整分数为:', score);
      } else {
        score = Math.max(score, 70 - errorCount * 3);
        console.log('错误较少建议不多，调整分数为:', score);
      }
    } else {
      // 错误较多，最多给70分
      score = Math.min(score, 70 - (errorCount - 3) * 5);
      console.log('错误较多，调整分数为:', score);
    }
  }
  
  // 最终调整：如果分析中没有真正的错误，直接给100分
  // 检测是否有真正的错误（不仅仅是标题中的'问题'或'错误'）
  const realErrorPatterns = [
    /第\s*\d+\s*行\s*[:：].*?(错误|问题|失败|溢出)/,
    /存在.*?(死锁|竞态|数据竞争|内存泄漏)/,
    /无法.*?(编译|运行|执行)/,
    /致命/,
    /崩溃/,
    /数组越界/,
    /未定义.*?(变量|函数|引用)/,
    /段错误/,
    /空指针/,
    /缓冲区溢出/,
    /数据竞争/,
    /线程错误/,
    /竞争条件/,
    /不一致/,
    /缺乏.*?(互斥|同步|锁)/
  ];
  
  let hasRealError = false;
  for (const pattern of realErrorPatterns) {
    if (text.match(pattern)) {
      hasRealError = true;
      console.log('检测到真正的错误，不给满分');
      break;
    }
  }
  
  // 如果没有真正的错误，给100分
  if (!hasRealError) {
    score = 100;
    console.log('没有检测到真正的错误，调整为满分:', score);
  }
  
  console.log('最终提取到的分数:', score);
  
  const details = [];
  
  // 尝试提取建议
  const lines = text.split('\n');
  let currentType = 'info';
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('ERRORS:') || trimmedLine.includes('错误') || trimmedLine.includes('问题')) {
      currentType = 'error';
    } else if (trimmedLine.includes('SUGGESTIONS:') || trimmedLine.includes('建议') || trimmedLine.includes('优化')) {
      currentType = 'info';
    }
    
    // 提取以 -、•、数字开头的列表项
    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || /^\d+\./.test(trimmedLine)) {
      details.push({ 
        type: currentType, 
        text: trimmedLine.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim() 
      });
    }
  });

  // 如果没有提取到详细内容，使用整个回复
  if (details.length === 0 && text.length > 10) {
    // 简单分段
    const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 5);
    sentences.forEach(sentence => {
      details.push({ type: 'info', text: sentence.trim() });
    });
  }

  diagnosticResult.value = {
    score: score,
    details: details.length > 0 ? details : [{ type: 'info', text: text.substring(0, 200) + '...' }]
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