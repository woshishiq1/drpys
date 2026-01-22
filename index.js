import * as fastlogger from './controllers/fastlogger.js'
import path from 'path';
import os from 'os';
import qs from 'qs';
import {fileURLToPath} from 'url';
import {validateBasicAuth, validateJs, validatePwd, validatHtml} from "./utils/api_validate.js";
import {startAllPlugins} from "./utils/pluginManager.js";
// 注册自定义import钩子
import './utils/esm-register.mjs';
// 引入python守护进程
import {daemon} from "./utils/daemonManager.js";
// 注册控制器
import {registerRoutes, registerWsRoutes} from './controllers/index.js';

const {fastify, wsApp} = fastlogger;

// 获取当前路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5757;
const WsPORT = 57575;
const MAX_TEXT_SIZE = process.env.MAX_TEXT_SIZE || 0.1 * 1024 * 1024; // 设置最大文本大小为 0.1 MB
const MAX_IMAGE_SIZE = process.env.MAX_IMAGE_SIZE || 0.5 * 1024 * 1024; // 设置最大图片大小为 500 KB
// 定义options的目录
const rootDir = __dirname;
const docsDir = path.join(__dirname, 'docs');
const jxDir = path.join(__dirname, 'jx');
const publicDir = path.join(__dirname, 'public');
const appsDir = path.join(__dirname, 'apps');
const jsonDir = path.join(__dirname, 'json');
const jsDir = path.join(__dirname, 'spider/js');
const dr2Dir = path.join(__dirname, 'spider/js_dr2');
const pyDir = path.join(__dirname, 'spider/py');
const catDir = path.join(__dirname, 'spider/catvod');
const catLibDir = path.join(__dirname, 'spider/catLib');
const xbpqDir = path.join(__dirname, 'spider/xbpq');
const configDir = path.join(__dirname, 'config');

const pluginProcs = startAllPlugins(__dirname);
// console.log('pluginProcs:', pluginProcs);

// 添加钩子事件
fastify.addHook('onReady', async () => {
    try {
        await daemon.startDaemon();
        fastify.log.info('Python守护进程已启动');
    } catch (error) {
        fastify.log.error(`启动Python守护进程失败: ${error.message}`);
        fastify.log.error('Python相关功能将不可用');
    }
});

async function onClose() {
    try {
        await daemon.stopDaemon();
        fastify.log.info('Python守护进程已停止');
    } catch (error) {
        fastify.log.error(`停止Python守护进程失败: ${error.message}`);
    }
}

// 停止时清理守护进程
fastify.addHook('onClose', async () => {
    await onClose();
});

// 给静态目录插件中心挂载basic验证
fastify.addHook('preHandler', (req, reply, done) => {
    if (req.raw.url.startsWith('/apps/')) {
        if (req.raw.url.includes('clipboard-pusher/index.html')) {
            validateBasicAuth(req, reply, async () => {
                validatHtml(req, reply, rootDir).then(() => done());
            });
        } else {
            validateBasicAuth(req, reply, done);
        }

    } else if (req.raw.url.startsWith('/js/') || req.raw.url.startsWith('/py/')) {
        validatePwd(req, reply, done).then(async () => {
            validateJs(req, reply, dr2Dir).then(() => done());
        });
    } else {
        done();
    }
});

// 自定义插件替换 querystring 解析行为.避免出现两个相同参数被解析成列表
fastify.addHook('onRequest', async (req, reply) => {
    // 获取原始 URL 中的 query 部分
    const rawUrl = req.raw.url;
    const urlParts = rawUrl.split('?');
    const urlPath = urlParts[0];
    let rawQuery = urlParts.slice(1).join('?'); // 处理可能存在的多个 '?' 情况
    // log('rawQuery:', rawQuery);
    // 使用 qs 库解析 query 参数，确保兼容参数值中包含 '?' 的情况
    req.query = qs.parse(rawQuery, {
        strictNullHandling: true, // 确保 `=` 被解析为空字符串
        arrayLimit: 100,         // 自定义数组限制
        allowDots: false,        // 禁止点号表示嵌套对象
    });
    // 如果需要，可以在这里对 req.query 进行进一步处理
});

process.on("uncaughtException", (err) => {
    console.error("未捕获异常:", err);
    // 不退出，让主进程继续跑
});

process.on('unhandledRejection', (err) => {
    fastify.log.error(`未处理的Promise拒绝:${err.message}`);
    console.log(`发生了致命的错误，已阻止进程崩溃。${err.stack}`);
    // 根据情况决定是否退出进程
    // 清理后退出进程（避免程序处于未知状态）
    // process.exit(1);
});

// 统一退出处理函数
const handleExit = async (signal) => {
    console.log(`\n收到信号 ${signal}，正在优雅关闭服务器...`);
    try {
        await onClose();
        // 停止 WebSocket 服务器
        await stopWebSocketServer();
        // 停止主服务器
        await fastify.server.close();
        console.log('🛑 所有服务器已优雅关闭');
        process.exit(0);
    } catch (error) {
        console.error('关闭服务器时出错:', error);
        process.exit(1);
    }
};

// 捕获常见退出信号（Linux 上 pm2 stop 会发 SIGINT 或 SIGTERM）
['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach((sig) => {
    process.on(sig, () => handleExit(sig));
});

// Windows 上的兼容处理：捕获 Ctrl+C
if (process.platform === 'win32') {
    const rl = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.on('SIGINT', () => {
        handleExit('SIGINT');
    });
}

// 捕获 Node.js 主动退出（比如 pm2 stop 也会触发 exit）
process.on('exit', async (code) => {
    console.log(`Process exiting with code: ${code}`);
    // 这里不能直接用 await fastify.close()（Node 在 exit 里不等异步）
    // 但 Fastify 的 SIGINT/SIGTERM 会提前触发，所以这里只记录日志
    for (const [name, proc] of Object.entries(pluginProcs)) {
        console.log(`[pluginManager] 结束插件 ${name} ${proc.pid}`);
        proc.kill();
    }
});

const registerOptions = {
    rootDir,
    docsDir,
    jxDir,
    publicDir,
    appsDir,
    jsonDir,
    jsDir,
    dr2Dir,
    pyDir,
    catDir,
    catLibDir,
    xbpqDir,
    PORT,
    WsPORT,
    MAX_TEXT_SIZE,
    MAX_IMAGE_SIZE,
    configDir,
    indexFilePath: path.join(__dirname, 'index.json'),
    customFilePath: path.join(__dirname, 'custom.json'),
    subFilePath: path.join(__dirname, 'public/sub/sub.json'),
    wsApp,
    fastify,
};
registerRoutes(fastify, registerOptions);
registerWsRoutes(wsApp, registerOptions);

// 启动WebSocket服务器
const startWebSocketServer = async (option) => {
    try {
        const address = await wsApp.listen(option);
        return wsApp;
    } catch (err) {
        wsApp.log.error(`WebSocket服务器启动失败,将会影响一些实时弹幕源的使用:${err.message}`);
    }
};

// 停止WebSocket服务器
const stopWebSocketServer = async () => {
    try {
        await wsApp.server.close();
        wsApp.log.info('WebSocket服务器已停止');
    } catch (err) {
        wsApp.log.error(`停止WebSocket服务器失败:${err.message}`);
    }
};

// 启动服务
const start = async () => {
    try {
        // 启动 Fastify 主服务
        // await fastify.listen({port: PORT, host: '0.0.0.0'});
        await fastify.listen({port: PORT, host: '::'});
        // 启动 WebSocket 服务器 (端口 57577)
        await startWebSocketServer({port: WsPORT, host: '::'});

        // 获取本地和局域网地址
        const localAddress = `http://localhost:${PORT}`;
        const wsLocalAddress = `http://localhost:${WsPORT}`;
        const interfaces = os.networkInterfaces();
        let lanAddress = 'Not available';
        let wsLanAddress = 'Not available';
        // console.log('interfaces:', interfaces);
        for (const [key, iface] of Object.entries(interfaces)) {
            if (key.startsWith('VMware Network Adapter VMnet') || !iface) continue;
            for (const config of iface) {
                if (config.family === 'IPv4' && !config.internal) {
                    lanAddress = `http://${config.address}:${PORT}`;
                    wsLanAddress = `http://${config.address}:${WsPORT}`;
                    break;
                }
            }
        }

        console.log(`🚀 服务器启动成功:`);
        console.log(`📡 主服务 (端口 ${PORT}):`);
        console.log(`  - Local: ${localAddress}`);
        console.log(`  - LAN:   ${lanAddress}`);
        console.log(`🔌 WebSocket服务 (端口 ${WsPORT}):`);
        console.log(`  - Local: ${wsLocalAddress}`);
        console.log(`  - LAN:   ${wsLanAddress}`);
        console.log(`⚙️  系统信息:`);
        console.log(`  - PLATFORM: ${process.platform} ${process.arch}`);
        console.log(`  - VERSION:  ${process.version}`);
        if (process.env.VERCEL) {
            console.log('Running on Vercel!');
            console.log('Vercel Environment:', process.env.VERCEL_ENV); // development, preview, production
            console.log('Vercel URL:', process.env.VERCEL_URL);
            console.log('Vercel Region:', process.env.VERCEL_REGION);
        } else {
            console.log('Not running on Vercel!');
        }
        return true;
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// 停止服务
const stop = async () => {
    try {
        // 停止 WebSocket 服务器
        await stopWebSocketServer();
        // 停止主服务器
        await fastify.server.close();
        console.log('🛑 所有服务已优雅停止');
        return true;
    } catch (err) {
        fastify.log.error(`停止服务器时发生错误:${err.message}`);
        return false;
    }
};

// 导出 start 和 stop 方法
export {start, stop};
export default async function handler(req, res) {
    await fastify.ready()
    fastify.server.emit('request', req, res)
}

// 判断当前模块是否为主模块，如果是主模块，则启动服务
const currentFile = path.normalize(fileURLToPath(import.meta.url)); // 使用 normalize 确保路径一致
const indexFile = path.normalize(path.resolve(__dirname, 'index.js')); // 标准化路径

if (currentFile === indexFile) {
    start();
}
