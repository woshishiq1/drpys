// createAxiosAgent.js
import http from 'http';
import https from 'https';
import axios from 'axios';

/**
 * 创建配置了代理的 axios 实例
 * @typedef {Object} CreateAxiosOptions
 * @property {number} [maxSockets=64] - 最大连接数，默认 64
 * @property {number} [timeout=30000] - 超时时间(毫秒)，默认 30000
 * @property {boolean} [rejectUnauthorized=false] - 是否拒绝未经授权的证书，默认 false(忽略证书错误)
 */

/**
 * 创建配置了代理的 axios 实例
 * @param {CreateAxiosOptions} [options={}] - 配置选项
 * @returns {import('axios').AxiosInstance} 配置好的 axios 实例
 */
export function createAxiosInstance(options = {}) {
    const {
        maxSockets = 64,
        timeout = 30000,
        rejectUnauthorized = false
    } = options;

    const AgentOption = {
        keepAlive: true,
        maxSockets: maxSockets,
        timeout: timeout
    };

    const httpAgent = new http.Agent(AgentOption);

    // 根据参数决定是否添加 rejectUnauthorized 选项
    const httpsAgentOptions = {...AgentOption};
    if (rejectUnauthorized === false) {
        httpsAgentOptions.rejectUnauthorized = false;
    }

    const httpsAgent = new https.Agent(httpsAgentOptions);

    const _axios = axios.create({
        httpAgent,
        httpsAgent,
    });

    _axios.interceptors.request.use(config => {
        if (config && config.headers) {
            const headers = config.headers;
            const keys = Object.keys(headers);
            for (const key of keys) {
                if (key.toLowerCase() === 'user-agent' && headers[key] === 'RemoveUserAgent') {
                    delete headers[key];
                    break;
                }
            }
        }
        return config;
    });

    return _axios;
}

// 默认导出
export default createAxiosInstance;
