// 导入数据库配置
const db_conf = require('config').get('dbConfig');
// 打开数据库文件
const sqlite = require('better-sqlite3');
const dbFile = new sqlite(db_conf.filename, {
    readonly: false,
    fileMustExist: false,
    verbose: console.log
});

// 封装 SQL 执行的方法
exports.query = async (sql, sqlParams) => {
    try {
        const stmt = dbFile.prepare(sql);

        // --- 核心修复：判断是查询还是写入 ---
        // 检查 SQL 语句是否以 SELECT 开头（忽略大小写和空格）
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA');

        if (isSelect) {
            // 查询操作：返回所有结果行
            return sqlParams ? stmt.all(sqlParams) : stmt.all();
        } else {
            // 写入操作（INSERT/UPDATE/DELETE）：执行并返回受影响的信息
            const info = sqlParams ? stmt.run(sqlParams) : stmt.run();
            // better-sqlite3 的 run() 返回的是 { changes: 1, lastInsertRowid: 1 }
            return info;
        }
    } catch (err) {
        console.error('数据库操作失败:', err);
        return err;
    }
};
