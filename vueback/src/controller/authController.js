const router = require('express').Router();
const authService = require('../service/authService');

module.exports = router;

/**
 * @name sendCode 发送邮箱验证码
 * @description POST /auth/send-code
 * @body {string} email 用户邮箱
 */
router.post('/send-code', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.ResultVO(1, '邮箱不能为空');

    try {
        const result = await authService.sendEmailCode(email);
        if (result.success) {
            res.ResultVO(0, '验证码已发送至邮箱');
        } else {
            res.ResultVO(1, result.msg || '发送失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器错误');
    }
});

/**
 * @name register 用户注册
 * @description POST /auth/register
 * @body {string} username 用户名
 * @body {string} email 邮箱
 * @body {string} password 密码
 * @body {string} code 验证码
 */
router.post('/register', async (req, res) => {
    const { username, email, password, code } = req.body;

    // 基础校验
    if (!username || !email || !password || !code) {
        return res.ResultVO(1, '所有字段均为必填项');
    }

    try {
        const result = await authService.register({ username, email, password, code });
        if (result.success) {
            // 注册成功直接返回登录凭证（实现注册后自动登录）
            res.ResultVO(0, '注册成功', result.data);
        } else {
            res.ResultVO(1, result.msg || '注册失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器注册异常');
    }
});

/**
 * @name login 用户登录（支持邮箱登录）
 * @description POST /auth/login
 * @body {string} email 用户邮箱
 * @body {string} password 用户密码
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // 改为 email 登录

    try {
        const result = await authService.login(email, password);
        if (result.success) {
            res.ResultVO(0, '登录成功', result.data); // result.data 包含 token 和 userInfo
        } else {
            res.ResultVO(1, result.msg || '登录失败');
        }
    } catch (err) {
        res.ResultVO(1, '服务器登录异常');
    }
});

/**
 * @name tokenVerify 凭证校验
 */
router.post('/tokenVerify', async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) return res.ResultVO(1, '未找到凭证');

    const token = authorization.split(' ')[1];
    const payload = await authService.tokenVerify(token);

    if (payload) {
        res.ResultVO(0, '凭证有效', payload);
    } else {
        res.ResultVO(1, '凭证无效');
    }
});
