import fs from "fs";
import path from 'path';
import pino from "pino";
import Fastify from "fastify";
import {fileURLToPath} from 'url';
import {createStream} from 'rotating-file-stream';
import dotenv from 'dotenv';

dotenv.config();

const LOG_WITH_FILE = Number(process.env.LOG_WITH_FILE) || 0;
const LOG_LEVEL = process.env.LOG_LEVEL && ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : 'info';
const COOKIE_AUTH_CODE = process.env.COOKIE_AUTH_CODE || 'drpys';
// console.log('LOG_WITH_FILE:', LOG_WITH_FILE);
// console.log('LOG_LEVEL:', LOG_LEVEL);
// console.log('COOKIE_AUTH_CODE:', COOKIE_AUTH_CODE);
let _logger = true;
let logStream = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDirectory = path.join(__dirname, '../logs');

// 检测操作系统
const isWindows = process.platform === 'win32';

// 自定义时间戳函数
const customTimestamp = () => {
    const now = new Date();
    return `,"time":"${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}"`;
};

// 安全的文件路径生成函数
const safeFileNameGenerator = (time, index) => {
    if (!time) return "output.log";

    // 确保文件名中不包含路径分隔符
    const dateStr = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(time.getDate()).padStart(2, '0')}`;
    return `output-${dateStr}.log.${index || 1}`;
};


if (LOG_WITH_FILE) {
    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, {recursive: true});
    }

    // 配置选项
    const streamOptions = {
        size: '500M',
        // compress: isWindows ? false : 'gzip', // Windows 上禁用压缩
        compress: false,
        interval: '1d',
        path: logDirectory,
        maxFiles: 30
    };


    // 创建日志流
    logStream = createStream(safeFileNameGenerator, streamOptions);

    // 添加错误处理
    logStream.on('error', (err) => {
        // console.error('日志流错误:', err);
    });

    logStream.on('rotated', (filename) => {
        console.log('日志轮转完成:', filename);
    });

    _logger = pino({
        level: LOG_LEVEL,
        serializers: {
            req: pino.stdSerializers.req,
            res: pino.stdSerializers.res,
        },
        timestamp: customTimestamp,
    }, logStream);

    console.log('日志输出到文件');
} else {
    _logger = pino({
        level: LOG_LEVEL,
        serializers: {
            req: pino.stdSerializers.req,
            res: pino.stdSerializers.res,
        },
        timestamp: customTimestamp,
    });
    console.log('日志输出到控制台');
}

export const fastify = Fastify({
    logger: _logger,
});

export const wsApp = Fastify({
    logger: _logger,
});

// 添加CORS支持的钩子
[fastify, wsApp].forEach(server => {
    server.addHook('onRequest', async (request, reply) => {
        // 设置CORS头部
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        reply.header('Access-Control-Allow-Credentials', 'true');

        // 处理预检请求
        if (request.method === 'OPTIONS') {
            reply.status(200).send();
            return;
        }
    });
});

// 安全的轮转测试端点
// if (LOG_WITH_FILE && logStream) {
//     fastify.get('/test-rotate', async (request, reply) => {
//         try {
//             // 确保日志流可用
//             if (!logStream || typeof logStream.write !== 'function') {
//                 throw new Error('日志流不可用');
//             }
//
//             // 写入轮转前的日志
//             const preRotateLog = '--- 手动触发轮转前的测试日志 ---\n';
//             await new Promise((resolve, reject) => {
//                 logStream.write(preRotateLog, 'utf8', (err) => {
//                     if (err) reject(err);
//                     else resolve();
//                 });
//             });
//
//             // 确保写入完成
//             await new Promise(resolve => setTimeout(resolve, 100));
//
//             // 触发轮转
//             logStream.rotate();
//
//             // 等待轮转完成
//             await new Promise((resolve) => {
//                 logStream.once('rotated', resolve);
//             });
//
//             // 确保日志流在轮转后仍然可用
//             if (!logStream || typeof logStream.write !== 'function') {
//                 throw new Error('轮转后日志流不可用');
//             }
//
//             // 写入轮转后的日志
//             const postRotateLog = '--- 手动触发轮转后的测试日志 ---\n';
//             await new Promise((resolve, reject) => {
//                 logStream.write(postRotateLog, 'utf8', (err) => {
//                     if (err) reject(err);
//                     else resolve();
//                 });
//             });
//
//             reply.send({
//                 status: 'success',
//                 message: '日志轮转已手动触发',
//                 logDirectory: path.resolve(logDirectory)
//             });
//         } catch (err) {
//             console.error('轮转过程中出错:', err);
//             reply.status(500).send({
//                 status: 'error',
//                 message: '轮转失败',
//                 error: err.message
//             });
//         }
//     });
//
//     console.log('测试端点已注册: GET /test-rotate');
// }