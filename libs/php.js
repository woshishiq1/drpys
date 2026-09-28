import {logError} from '../utils/log.js';
import path from "path";
import {readFile} from "fs/promises";
import {fileURLToPath} from 'url';
import {spawn} from 'child_process';
import {LRUCache} from 'lru-cache';
import {computeHash, deepCopy, getNowTime} from "../utils/utils.js";
import {prepareBinary} from "../utils/binHelper.js";
import {md5} from "../libs_drpy/crypto-util.js";
import {fastify} from "../controllers/fastlogger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _bridge_path = path.join(__dirname, '../spider/php/_bridge.php');

// Cache for module objects（LRU 有界，淘汰=下次重新 init，与 refresh 路径等价）
const moduleCache = new LRUCache({max: 200, ttl: 1000 * 60 * 10});

// Mapping from JS method names to PHP Spider method names
const methodMapping = {
    'init': 'init',
    'home': 'homeContent',
    'homeVod': 'homeVideoContent',
    'category': 'categoryContent',
    'detail': 'detailContent',
    'search': 'searchContent',
    'play': 'playerContent',
    'proxy': 'proxy', // Not standard in BaseSpider, but might exist
    'action': 'action' // Not standard
};

// Helper to stringify args for CLI
function stringify(arg) {
    if (arg === undefined) return 'null';
    return JSON.stringify(arg);
}

// Helper to parse JSON output
function json2Object(json) {
    if (!json) return {};
    if (typeof json === 'object') return json;
    try {
        return JSON.parse(json);
    } catch (e) {
        return json;
    }
}

// Execute PHP bridge
const callPhpMethod = async (filePath, methodName, env, ...args) => {
    let phpPath = process.env.PHP_PATH || 'php';
    
    const validPath = prepareBinary(phpPath);
    if (!validPath) {
         throw new Error(`PHP executable not found or invalid: ${phpPath}`);
    }
    phpPath = validPath;

    const phpMethodName = methodMapping[methodName] || methodName;

    const cliArgs = [
        // db 版大响应源在 PHP 侧同样会撞默认 128M memory_limit（Fatal: Allowed memory
        // size exhausted），随流式收集一并放开；仅是上限、不预分配，低内存设备安全
        '-d', `memory_limit=${process.env.PHP_MEMORY_LIMIT || '512M'}`,
        _bridge_path,
        filePath,
        phpMethodName,
        JSON.stringify(env),
        ...args.map(stringify)
    ];

    try {
        // 流式收集 stdout：上限=内存，不再有 execFile maxBuffer 的 10MB 硬顶
        // （db 版大响应源动辄 >10MB，曾报 "stdout maxBuffer length exceeded"）
        const {stdout, stderr, code} = await new Promise((resolve, reject) => {
            const child = spawn(phpPath, cliArgs, {env: {...process.env}});
            const chunks = [];
            const stderrChunks = [];
            let settled = false;

            // 沿用原 execFile timeout 语义：超时 kill，避免孤儿 php 进程占用连接与内存
            // （比 Node 侧 withTimeout(API_TIMEOUT) 多 5s 宽限；输家 rejection 由 with-timeout 的 noop 分支静默）
            const timeoutMs = (parseInt(process.env.API_TIMEOUT || '20') + 5) * 1000;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                child.kill('SIGTERM');
                reject(new Error(`PHP process timeout (${timeoutMs}ms): ${phpMethodName} ${filePath}`));
            }, timeoutMs);

            child.stdout.on('data', (c) => chunks.push(c));
            child.stderr.on('data', (c) => stderrChunks.push(c));
            child.on('error', (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                reject(err);
            });
            child.on('close', (exitCode) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve({
                    stdout: Buffer.concat(chunks).toString('utf8'),
                    stderr: Buffer.concat(stderrChunks).toString('utf8'),
                    code: exitCode,
                });
            });
        });

        if (stderr.trim()) {
            logError(`PHP Stderr: ${stderr}`);
        }

        const result = json2Object(stdout.trim());

        if (result && result.error) {
            // _bridge.php sendError 走 exit(1)：优先透出源内错误信息，而非笼统的退出码
            throw new Error(`PHP Error: ${result.error}\nTrace: ${result.traceback}`);
        }

        if (code !== 0) {
            throw new Error(`PHP process exited with code ${code}${stderr.trim() ? `: ${stderr.trim().slice(0, 500)}` : ''}`);
        }

        return result;

    } catch (error) {
        logError(`Error calling PHP method ${methodName}:`, error);
        throw error;
    }
};

const loadEsmWithHash = async function (filePath, fileHash, env) {
    const spiderProxy = {};
    const spiderMethods = Object.keys(methodMapping);

    spiderMethods.forEach(method => {
        spiderProxy[method] = async (...args) => {
            return callPhpMethod(filePath, method, env, ...args);
        };
    });

    return spiderProxy;
};

const init = async function (filePath, env = {}, refresh) {
    try {
        const fileContent = await readFile(filePath, 'utf-8');
        const fileHash = computeHash(fileContent);
        const moduleName = path.basename(filePath, '.php'); // .php extension
        let moduleExt = env.ext || '';

        let hashMd5 = md5(filePath + '#php#' + moduleExt);

        if (moduleCache.has(hashMd5) && !refresh) {
            const cached = moduleCache.get(hashMd5);
            if (cached.hash === fileHash) {
                return cached.moduleObject;
            }
        }

        fastify.log.info(`Loading PHP module: ${filePath}`);
        let t1 = getNowTime();

        const module = await loadEsmWithHash(filePath, fileHash, env);
        const rule = module;

        // Initialize the spider
        const initValue = await rule.init(moduleExt) || {};

        let t2 = getNowTime();
        const moduleObject = deepCopy(rule);
        moduleObject.cost = t2 - t1;

        moduleCache.set(hashMd5, {moduleObject, hash: fileHash});
        return {...moduleObject, ...initValue};

    } catch (error) {
        fastify.log.error(`Error in php.init :${filePath}`, error);
        throw new Error(`Failed to initialize PHP module:${error.message}`);
    }
};

const getRule = async function (filePath, env) {
    const moduleObject = await init(filePath, env);
    return JSON.stringify(moduleObject);
};

const home = async function (filePath, env, filter = 1) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.home(filter));
};

const homeVod = async function (filePath, env) {
    const moduleObject = await init(filePath, env);
    const homeVodResult = json2Object(await moduleObject.homeVod());
    return homeVodResult && homeVodResult.list ? homeVodResult.list : homeVodResult;
};

const category = async function (filePath, env, tid, pg = 1, filter = 1, extend = {}) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.category(tid, pg, filter, extend));
};

const detail = async function (filePath, env, ids) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.detail(ids));
};

const search = async function (filePath, env, wd, quick = 0, pg = 1) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.search(wd, quick, pg));
};

const play = async function (filePath, env, flag, id, flags) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.play(flag, id, flags));
};

const proxy = async function (filePath, env, params) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.proxy(params));
};

const action = async function (filePath, env, action, value) {
    const moduleObject = await init(filePath, env);
    return json2Object(await moduleObject.action(action, value));
};

export default {
    getRule,
    init,
    home,
    homeVod,
    category,
    detail,
    search,
    play,
    proxy,
    action
};
