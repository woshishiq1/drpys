/**
 * 控制器路由注册模块
 * 统一管理和注册所有控制器路由
 * 提供应用程序的所有API端点和功能模块
 */
import formBody from '@fastify/formbody';
import websocket from '@fastify/websocket';
// WebSocket实时日志控制器-最早引入才能全局拦截console日志
import websocketController from './websocket.js';
// 静态文件服务控制器
import staticController from './static.js';
// 文档服务控制器
import docsController from './docs.js';
// 配置管理控制器
import configController from './config.js';
// API接口控制器
import apiController from './api.js';
// 媒体代理控制器
import mediaProxyController from './mediaProxy.js';
// 根路径控制器
import rootController from './root.js';
// 编码器控制器
import encoderController from './encoder.js';
// 解码器控制器
import decoderController from './decoder.js';
// 认证编码控制器
import authCoderController from './authcoder.js';
// Web界面控制器
import webController from './web.js';
// HTTP请求控制器
import httpController from './http.js';
// 剪贴板推送控制器
import clipboardPusherController from './clipboard-pusher.js';
// 任务控制器（已注释）
// import taskController from './tasker.js';
// 定时任务控制器
import cronTaskerController from './cron-tasker.js';
// 源检查控制器
import sourceCheckerController from './source-checker.js';
// 图片存储控制器
import imageStoreController from './image-store.js';
// WebDAV 代理控制器
import webdavProxyController from './webdav-proxy.js';
// FTP 代理控制器
import ftpProxyController from './ftp-proxy.js';
// 文件代理控制器
import fileProxyController from './file-proxy.js';
import m3u8ProxyController from './m3u8-proxy.js';
import unifiedProxyController from './unified-proxy.js';
// WebSocket实时弹幕日志控制器
import websocketServerController from "./websocketServer.js";
import githubController from './github.js';

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
    // 注册WebSocket路由
    fastify.register(websocketController, options);
    // 注册静态文件服务路由
    fastify.register(staticController, options);
    // 注册文档服务路由
    fastify.register(docsController, options);
    // 注册配置管理路由
    fastify.register(configController, options);
    // 注册API接口路由
    fastify.register(apiController, options);
    // 注册媒体代理路由
    fastify.register(mediaProxyController, options);
    // 注册根路径路由
    fastify.register(rootController, options);
    // 注册编码器路由
    fastify.register(encoderController, options);
    // 注册解码器路由
    fastify.register(decoderController, options);
    // 注册认证编码路由
    fastify.register(authCoderController, options);
    // 注册Web界面路由
    fastify.register(webController, options);
    // 注册HTTP请求路由
    fastify.register(httpController, options);
    // 注册剪贴板推送路由
    fastify.register(clipboardPusherController, options);
    // 注册任务路由（已注释）
    // fastify.register(taskController, options);
    // 注册定时任务路由
    fastify.register(cronTaskerController, options);
    // 注册源检查路由
    fastify.register(sourceCheckerController, options);
    // 注册图片存储路由
    fastify.register(imageStoreController, options);
    // 注册 WebDAV 代理路由
    fastify.register(webdavProxyController, options);
    // 注册 FTP 代理路由
    fastify.register(ftpProxyController, options);
    // 注册文件代理路由
    fastify.register(fileProxyController, options);
    fastify.register(m3u8ProxyController, options);
    // 注册统一代理路由
    fastify.register(unifiedProxyController, options);
    // 注册GitHub Release路由
    fastify.register(githubController, options);
};

/**
 * 注册弹幕路由控制器
 * 将弹幕功能模块的路由注册到Fastify实例中
 * @param {Object} wsApp - Ws实时弹幕预览应用实例
 * @param {Object} options - 路由配置选项
 */
export const registerWsRoutes = (wsApp, options) => {
    wsApp.register(websocketServerController, options);
}
