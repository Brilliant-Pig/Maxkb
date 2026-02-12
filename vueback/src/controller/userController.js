const router = require('express').Router();
const userService = require('../service/userService');

// ==========================================
// 1. 学生提问模块 (student_questions)
// ==========================================

// 获取所有提问列表（教师端查看或学生端 FAQ 加载）
router.get('/getQuestions', async (req, res, next) => {
    const result = await userService.getQuestions();
    res.ResultVO(0, '获取提问列表成功', result);
});

// 学生提交新提问（实现提交后本地不存，直接入库）
router.post('/addQuestion', async (req, res, next) => {
    const questionData = req.body; // 包含 student_id, content
    const result = await userService.addQuestion(questionData);
    res.ResultVO(0, '提问已实时同步至教师端', result);
});

// 物理删除提问（实现你要求的彻底消失）
router.delete('/deleteQuestion', async (req, res, next) => {
    const { id, type } = req.query; // id 为主键，type 用于区分是提问还是热点点击
    const result = await userService.deleteQuestion(id, type);
    res.ResultVO(0, '数据已从数据库物理删除', result);
});

// 修改提问内容
router.put('/updateQuestion', async (req, res, next) => {
    const { id, content } = req.body;
    const result = await userService.updateQuestion(id, content);
    res.ResultVO(0, '问题修改成功', result);
});

// ==========================================
// 2. 考点热点点击模块 (os_topic_clicks)
// ==========================================

// 记录一次考点点击（热度 +1）
router.post('/recordClick', async (req, res, next) => {
    const { topicName } = req.body;
    const result = await userService.recordClick(topicName);
    res.ResultVO(0, '热度统计更新成功', result);
});

// ==========================================
// 3. 效能感测评模块 (student_self_efficacy)
// ==========================================

// 提交自我效能感评分
router.post('/submitEfficacy', async (req, res, next) => {
    const efficacyData = req.body; // 包含 9 个评分和学生 ID
    const result = await userService.submitEfficacy(efficacyData);
    res.ResultVO(0, '掌握度数据已同步存档', result);
});

// ==========================================
// 4. 系统可用性评价模块 (system_usability)
// ==========================================

// 提交 SUS 量表结果
router.post('/submitSus', async (req, res, next) => {
    const susData = req.body; // 包含分数和原始答案
    const result = await userService.submitSus(susData);
    res.ResultVO(0, '系统评价提交成功', result);
});

// ==========================================
// 5. 教师端科研数据统计 (综合查询)
// ==========================================

// 获取班级整体统计数据（用于教师端看板）
router.get('/getClassStats', async (req, res, next) => {
    const result = await userService.getClassStats();
    res.ResultVO(0, '科研报表数据获取成功', result);
});

// 获取所有学生状态列表
router.get('/getStudentStatus', async (req, res, next) => {
    const result = await userService.getStudentStatus();
    res.ResultVO(0, '学生画像同步成功', result);
});

module.exports = router;
