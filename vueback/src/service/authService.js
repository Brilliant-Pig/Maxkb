const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const jwt_conf = require('config').get('jwtConfig');
const authDao = require('../dao/authDao');

// 1. 配置邮件传输器 (以QQ邮箱为例，请替换为你自己的授权码)
const transporter = nodemailer.createTransport({
    service: 'qq',
    auth: {
        user: '2861755894@qq.com',
        pass: 'pzbwtflumlnsdgja'
    }
});

// --- 工具函数：生成6位随机验证码 ---
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * 发送邮件验证码
 */
exports.sendEmailCode = async (email) => {
    // 检查邮箱是否已被注册
    const existingUser = await authDao.findUserByEmail(email);
    if (existingUser && existingUser.length > 0) {
        return { success: false, msg: '该邮箱已被注册' };
    }

    const code = generateCode();
    try {
        // 将验证码存入数据库，设置有效期（由 Dao 实现）
        await authDao.saveEmailCode(email, code);

        // 发送真实邮件
        await transporter.sendMail({
            from: '"OS-AI系统" <2861755894@qq.com>',
            to: email,
            subject: '您的注册验证码',
            text: `您好！您的注册验证码为：${code}，有效期为5分钟。请勿泄露给他人。`
        });

        return { success: true };
    } catch (err) {
        console.error('邮件发送失败:', err);
        return { success: false, msg: '邮件发送失败，请检查配置' };
    }
};

/**
 * 用户注册逻辑
 */
exports.register = async ({ username, email, password, code, role }) => {
    // 1. 验证码校验
    const isCodeValid = await authDao.verifyEmailCode(email, code);
    if (!isCodeValid) {
        return { success: false, msg: '验证码错误或已过期' };
    }

    // 2. 检查用户名唯一性
    const existingUser = await authDao.findUserByUsername(username);
    if (existingUser && existingUser.length > 0) {
        return { success: false, msg: '用户名已存在' };
    }

    // 3. 密码加盐加密
    const passwordHash = await bcrypt.hash(password, 10);

    const userRole = role || 'student';

    // 5. 写入数据库 (使用 userRole)
    const newUser = await authDao.createUser({
        username,
        email,
        passwordHash,
        role: userRole
    });

    // 6. 注册成功直接生成 Token
    const token = await this.generateToken(newUser.id, username, userRole);

    return {
        success: true,
        data: {
            token,
            user: { username, email, role: userRole }
        }
    };
};

/**
 * 用户登录（支持邮箱登录）
 */
exports.login = async (email, password) => {
    // 1. 根据邮箱查找用户
    const users = await authDao.findUserByEmail(email);
    if (!users || users.length === 0) {
        return { success: false, msg: '用户不存在' };
    }

    const user = users[0];

    // 2. 验证密码
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        return { success: false, msg: '密码错误' };
    }

    // 3. 生成 token
    const token = await this.generateToken(user.id, user.username, user.role);

    return {
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        }
    };
};

/**
 * 生成 JWT Token 的通用方法
 */
exports.generateToken = async (userId, username, role) => {
    return jwt.sign({ userId, username, role }, jwt_conf.secret, { expiresIn: jwt_conf.expiresIn });
};

/**
 * 凭证校验
 */
exports.tokenVerify = async (token) => {
    try {
        return jwt.verify(token, jwt_conf.secret);
    } catch (err) {
        return null;
    }
};
// src/service/authService.js

exports.logout = async (token) => {
    try {
        // 1. 解析 token 拿到过期时间 (exp)
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return { success: false, msg: '无效的凭证' };
        }

        // 2. 将秒级时间戳转为数据库日期格式
        const expiresAt = new Date(decoded.exp * 1000).toISOString();

        // 3. 存入黑名单
        await authDao.addTokenToBlacklist(token, expiresAt);

        return { success: true, msg: '已安全退出' };
    } catch (err) {
        console.error('退出逻辑异常:', err);
        return { success: false, msg: '退出失败' };
    }
};
