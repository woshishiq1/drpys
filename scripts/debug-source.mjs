// drpyS 源离线调试器：脱离 5757 沙箱，打桩 request/log/setResult 后直接调用源方法。
// 用于区分「源逻辑错误」与「引擎层问题」（如惯例字段缺失导致前置 parse 拦截、方法根本不被调用）。
// 用法：
//   node scripts/debug-source.mjs <源文件路径> [方法] [JSON参数数组] [orId]
// 例：
//   node scripts/debug-source.mjs "spider/js/红果短剧[短].js" 搜索 '["闪婚",false,1]'
//   node scripts/debug-source.mjs "spider/js/红果短剧[短].js" 一级 '["all",1,false,{}]'
//   node scripts/debug-source.mjs "spider/js/红果短剧[短].js" 二级 '[]' '7123456789'
//   node scripts/debug-source.mjs "spider/js/红果短剧[短].js" class_parse
// 环境变量：DS_INJECT（JSON）注入 this 变量（MY_CATE/MY_FL/MY_PAGE 等）；DS_HOST 覆盖 requestHost。
import {readFileSync} from 'fs';
import {createRequire} from 'module';
import path from 'path';
import axios from 'axios';
import {urljoin, urljoin2, joinUrl, naturalSort} from '../utils/utils.js';
import {ENV} from '../utils/env.js';
import * as drpyCustom from '../libs_drpy/drpyCustom.js';

const file = path.resolve(process.argv[2] || '');
const method = process.argv[3] || '';
const args = process.argv[4] ? JSON.parse(process.argv[4]) : [];

const code = readFileSync(file, 'utf8');
const mod = {exports: {}};
// 与 drpyS.js 沙箱注入对齐：先展开 drpyCustom 全集（gzip/CryptoJS/UA/jinja/md5 等），
// 再用下方桩覆盖 request/req/log/setResult（调试桩必须赢过 drpyCustom 的同名导出），
// 最后补 urljoin 系列/ENV/_ENV/pathLib 等源顶层常引用的全局（缺桩会在加载期 ReferenceError）。
const injected = {
    ...drpyCustom,
    request: async (url, obj = {}) => {
        // 与引擎 drpyInject request 同语义：method/body(兼容 data)/headers/timeout 全透传。
        // 此前桩写死 GET，POST 型源方法（request(url,{method:'POST',body})）在此静默失效返回空。
        const method = obj.method || 'get';
        let body = obj.body != null ? obj.body : obj.data;
        if (body != null && typeof body === 'object') {
            body = obj.postType === 'form' ? new URLSearchParams(body).toString() : JSON.stringify(body);
        }
        if (['get', 'head'].includes(String(method).toLowerCase())) body = undefined; // GET/HEAD 不允许带 body
        const r = await fetch(url, {
            method,
            headers: obj.headers || {},
            body,
            signal: AbortSignal.timeout(obj.timeout || 30000),
        });
        return await r.text();
    },
    req: async (url, obj = {}) => {
        const r = await fetch(url, {
            method: obj.method || 'GET',
            headers: obj.headers || {},
            body: obj.body != null ? obj.body : undefined,
            signal: AbortSignal.timeout((obj.timeout || 5000)),
        });
        return {code: r.status, headers: Object.fromEntries(r.headers), content: await r.text()};
    },
    axios,
    // batchFetch 桩：引擎全局批量请求（二级分批拉集数等场景），返回文本数组、失败项为空串
    batchFetch: async (arr) => Promise.all((arr || []).map(it =>
        axios.get(it.url, {
            timeout: it.options?.timeout || 5000,
            headers: it.options?.headers || {},
        }).then(r => r.data).catch(() => '')
    )),
    require: createRequire(import.meta.url), // 沙箱 rootRequire 直通真实 require，此处保持一致
    log: (...a) => console.log('[log]', ...a),
    setResult: d => ({list: d}),
    urljoin, urljoin2, joinUrl, naturalSort,
    ENV: {...ENV, set: (k, v) => console.log('[ENV.set 桩，不落盘]', k, v)},
    _ENV: process.env,
    pathLib: path,
    // $.require 桩：支持源文件 `const hg = $.require('./_lib.xxx.js')` —— 与 moduleLoader 同约定
    // （读 spider/js 下 _lib* 源码、以 $.exports 导出、主 realm 执行）；远程 URL lib 不支持。
    $: (() => {
        const dollar = {exports: {}};
        const realRequire = createRequire(import.meta.url);
        dollar.require = (p) => {
            if (/^(https?:)?\/\//.test(p)) throw new Error('debug 桩不支持远程 lib: ' + p);
            const libCode = readFileSync(path.resolve(path.dirname(file), p), 'utf8');
            dollar.exports = {};
            const libFn = new Function('require', 'axios', 'log', '$', 'module', 'exports', libCode);
            libFn(realRequire, axios, (...a) => console.log('[lib.log]', ...a), dollar, {exports: {}}, {});
            return dollar.exports;
        };
        return dollar;
    })(),
};
// rule 方法禁止箭头函数 → 它们是普通 function，转调时补 this 上下文（二级用 orId，lazy/proxy 用 requestHost）
const ctx = {requestHost: process.env.DS_HOST || 'http://127.0.0.1:5757', hostUrl: process.env.DS_HOST || 'http://127.0.0.1:5757', orId: process.argv[5] || ''};
// DS_INJECT='{"MY_CATE":"video_real","MY_FL":{"find_theme":"cate_756"}}'：模拟引擎注入变量（一级/搜索的 MY_CATE/MY_FL/MY_PAGE 等）
if (process.env.DS_INJECT) Object.assign(ctx, JSON.parse(process.env.DS_INJECT));
const fn = new Function('module', 'exports', ...Object.keys(injected), code + '\nmodule.exports = rule;');
fn(mod, mod.exports, ...Object.values(injected));
const rule = mod.exports;

if (!method) {
    console.log('可用方法:', Object.keys(rule).join(', '));
    process.exit(0);
}
if (typeof rule[method] !== 'function') {
    console.error(`方法 ${method} 不存在或不是函数（检查方法名拼写：引擎约定为 中文方法名/lazy/proxy_rule）`);
    process.exit(1);
}
// 与引擎 invokeWithInjectVars（libs/drpysParser.js）同款 this 代理：优先 injectVars，回退 rule；
// set 时双写（rule 上的状态如 this._quality 在同进程多次调用间保持，与引擎行为一致）
const thisProxy = new Proxy(ctx, {
    get(target, key) {
        return target[key] !== undefined ? target[key] : rule[key];
    },
    set(target, key, value) {
        rule[key] = value;
        target[key] = value;
        return true;
    },
});
const result = await rule[method].apply(thisProxy, args);
console.log('返回:', JSON.stringify(result, null, 1).slice(0, parseInt(process.env.DS_OUT_LIMIT || '3000', 10)));
