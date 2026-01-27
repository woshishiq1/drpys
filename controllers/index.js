/**
 * 控制器路由注册模块
 * 统一管理和注册所有控制器路由
 * 提供应用程序的所有API端点和功能模块
 */
import formBody from '@fastify/formbody';
import websocket from '@fastify/websocket';

// 懒加载辅助函数
const lazyRegister = (fastify, importFn, options) => {
    fastify.register(async (instance, opts) => {
        const module = await importFn();
        const plugin = module.default || module;
        // 使用传入的 options (全局配置)
        await instance.register(plugin, options);
    });
};

/**
 * 注册所有路由控制器
 * 将各个功能模块的路由注册到Fastify实例中
 * @param {Object} fastify - Fastify应用实例
 * @param {Object} options - 路由配置选项
 */
export const registerRoutes = (fastify, options) => {
    // 注册插件以支持 application/x-www-form-urlencoded
    fastify.register(formBody);
    // 注册WebSocket插件
    fastify.register(websocket);
    
    // WebSocket实时日志控制器-最早引入才能全局拦截console日志
    lazyRegister(fastify, () => import('./websocket.js'), options);
    // 静态文件服务控制器
    lazyRegister(fastify, () => import('./static.js'), options);
    // 文档服务控制器
    lazyRegister(fastify, () => import('./docs.js'), options);
    // 配置管理控制器
    lazyRegister(fastify, () => import('./config.js'), options);
    // API接口控制器
    lazyRegister(fastify, () => import('./api.js'), options);
    // 媒体代理控制器
    lazyRegister(fastify, () => import('./mediaProxy.js'), options);
    // 根路径控制器
    lazyRegister(fastify, () => import('./root.js'), options);
    // 编码器控制器
    lazyRegister(fastify, () => import('./encoder.js'), options);
    // 解码器控制器
    lazyRegister(fastify, () => import('./decoder.js'), options);
    // 认证编码控制器
    lazyRegister(fastify, () => import('./authcoder.js'), options);
    // Web界面控制器
    lazyRegister(fastify, () => import('./web.js'), options);
    // HTTP请求控制器
    lazyRegister(fastify, () => import('./http.js'), options);
    // 剪贴板推送控制器
    lazyRegister(fastify, () => import('./clipboard-pusher.js'), options);
    // 任务控制器（已注释）
    // lazyRegister(fastify, () => import('./tasker.js'), options);
    // 定时任务控制器
    lazyRegister(fastify, () => import('./cron-tasker.js'), options);
    // 源检查控制器
    lazyRegister(fastify, () => import('./source-checker.js'), options);
    // 图片存储控制器
    lazyRegister(fastify, () => import('./image-store.js'), options);
    // WebDAV 代理控制器
    lazyRegister(fastify, () => import('./webdav-proxy.js'), options);
    // FTP 代理控制器
    lazyRegister(fastify, () => import('./ftp-proxy.js'), options);
    // 文件代理控制器
    lazyRegister(fastify, () => import('./file-proxy.js'), options);
    lazyRegister(fastify, () => import('./m3u8-proxy.js'), options);
    // 注册统一代理路由
    lazyRegister(fastify, () => import('./unified-proxy.js'), options);
    // 注册GitHub Release路由
    lazyRegister(fastify, () => import('./github.js'), options);
};

/**
 * 注册弹幕路由控制器
 * 将弹幕功能模块的路由注册到Fastify实例中
 * @param {Object} wsApp - Ws实时弹幕预览应用实例
 * @param {Object} options - 路由配置选项
 */
export const registerWsRoutes = (wsApp, options) => {
    lazyRegister(wsApp, () => import("./websocketServer.js"), options);
}
