/*
 * 🎬 全球追更 (纯净目录模式)
 * ==================================================
 * 该版本已剥离盘搜与网盘解析引擎，作为纯净的展示与追踪目录。
 * 点击列表中的影片将直接携带剧名唤起全网搜索（goSearch: true）。
 * ==================================================
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  类型: '影视',
  lang: 'ds',
})
*/

const axios = require("axios");
const dayjs = require("dayjs");

// ===================== ⚠️ TMDB API 配置 =====================
const TMDB_API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyY2I1ZDlmYWQyNDc5NWU5NGQ2ZmMyZDY1NGNiZGQ2NCIsIm5iZiI6MTc3MDM5MTk1NS41MDQ5OTk5LCJzdWIiOiI2OTg2MDk5M2I2NTNmZjY1NTI2MWE3ZDQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0L5tAo3YGKNcenDiYftqpKOP5nKnDyszA9S7IEGb7jc";

// ===================== 基础配置 =====================
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
const DATA_SOURCES = {
  tmdbImage: "https://image.tmdb.org/t/p/w500",
  tmdbApis:[
    "https://api.themoviedb.org/3",
    "https://api.tmdb.org/3"
  ]
};

// ===================== 日志模块 =====================
let log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

const init = async (server) => {
  if (log.init) return;
  if (server && server.log) {
    log.info = (...args) => server.log.info(args.join(' '));
    log.error = (...args) => server.log.error(args.join(' '));
    log.warn = (...args) => server.log.warn(args.join(' '));
  }
  log.init = true;
};

// ===================== HTTP 客户端 =====================
const tmdbHttp = axios.create({
  timeout: 10000,
  headers: { "User-Agent": UA }
});

// 新增：TMDB 多域名瞬间切换请求器
const fetchTmdb = async (endpoint, params = {}) => {
  let lastError;
  for (const baseUrl of DATA_SOURCES.tmdbApis) {
    try {
      const url = `${baseUrl}${endpoint}`;
      // Axios params 会自动帮我们拼接 ?api_key=xxx&...
      return await tmdbHttp.get(url, { params: { api_key: TMDB_API_KEY, ...params } });
    } catch (e) {
      lastError = e;
      log.warn(`[TMDB] ${baseUrl} 访问异常 (${e.message})，瞬间切换下一域名...`);
    }
  }
  throw lastError; // 如果全挂了再抛出错误
};

// ===================== 出品平台分类配置 =========================
const PLATFORM_CONFIG =[
  { id: "netflix", name: "Netflix", network: "213" },
  { id: "hbo", name: "HBO Max", network: "49" },
  { id: "disney", name: "Disney+", network: "2739" },
  { id: "appletv", name: "Apple TV+", network: "2552" },
  { id: "amazon", name: "Amazon Prime", network: "1024" },
  { id: "hulu", name: "Hulu", network: "453" },
  { id: "paramount", name: "Paramount+", network: "4330" },
  { id: "tencent", name: "腾讯视频", network: "2007" },
  { id: "youku", name: "优酷", network: "1419" },
  { id: "iqiyi", name: "爱奇艺", network: "1330" },
  { id: "bilibili", name: "哔哩哔哩", network: "1605" },
  { id: "mgtv", name: "芒果TV", network: "1631" }
];

const SUB_FILTERS = {
  "sort": {
    "key": "sort",
    "name": "🔥 动态追踪",
    "value":[
      { "n": "📅 追更模式", "v": "next_episode" },
      { "n": "📆 今日播出", "v": "daily_airing" },
      { "n": "🆕 最新上线", "v": "first_air_date.desc" },
      { "n": "⭐ 综合热度", "v": "popularity.desc" }
    ]
  },
  "type": {
    "key": "type",
    "name": "📺 内容类型",
    "value":[
      { "n": "🎥 电视剧集", "v": "tv" },
      { "n": "🎬 电影作品", "v": "movie" },
      { "n": "🌸 动漫动画", "v": "anime" },
      { "n": "🎤 综艺节目", "v": "variety" }
    ]
  }
};

const generateClassAndFilters = () => {
  const classList = PLATFORM_CONFIG.map(p => ({ type_id: p.id, type_name: p.name }));
  const filters = {};
  PLATFORM_CONFIG.forEach(p => { filters[p.id] =[SUB_FILTERS.sort, SUB_FILTERS.type]; });
  return { class: classList, filters };
};

// ===================== 全局内存缓存 =====================
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;
const MAX_CACHE_SIZE = 800;

const getCachedData = (key) => {
  const data = cache.get(key);
  if (!data) return null;
  if (Date.now() - data.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return data.value;
};

const setCachedData = (key, value) => {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { value, time: Date.now() });
};

// ===================== 核心优化：合并请求与翻译 =====================
const _category = async ({ id, page, filters }) => {
  const pg = parseInt(page) || 1;
  const platform = PLATFORM_CONFIG.find(p => p.id === id);
  if (!platform) return { list:[], page: 1, pagecount: 1, total: 0 };

  const sort = filters?.sort || 'popularity.desc';
  const type = filters?.type || 'tv';
  const today = dayjs().format('YYYY-MM-DD');

  let endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
  let queryParams = { 
    with_networks: platform.network, 
    language: "zh-CN", 
    page: pg,
    sort_by: (sort === 'daily_airing' || sort === 'next_episode') ? 'popularity.desc' : sort
  };

  if (type === 'anime') queryParams.with_genres = "16";
  if (type === 'variety') queryParams.with_genres = "10764|10767";
  if (sort === 'daily_airing') {
    queryParams["air_date.gte"] = today; 
    queryParams["air_date.lte"] = today;
  }

  // 1. 获取基础列表数据 (使用多域名回退请求器)
  let items =[];
  try {
    const res = await fetchTmdb(endpoint, queryParams);
    items = res.data?.results ||[];
  } catch (e) {
    log.error(`基础列表请求失败: ${e.message}`);
    return { list:[], page: pg, pagecount: 1, total: 0 };
  }

  // 取代直接的 Promise.all(items.map(...))
  const processedItems = [];
  const BATCH_SIZE = 5; // 每次并发请求 5 个，避免触发 API 限流和并发风暴

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (item) => {
      // 修复：缓存 Key 加入 sort，区分不同排序模式的展示结果
      const cacheKey = `info_${type}_${item.id}_${sort}`;
      const cached = getCachedData(cacheKey); 
      if (cached) return cached;

      // 保底初值
      let finalTitle = item.name || item.title;
      let remark = `⭐${item.vote_average?.toFixed(1) || '0.0'}`;
      let sortDate = item.first_air_date || item.release_date || "1900-01-01";
      // 优化：只要不包含中文字符，就尝试去查中文名，兼容带特殊字符的小语种剧名
      const hasNoChinese = !/[\u4e00-\u9fa5]/.test(finalTitle);

      try {
        // 2. 获取详情 (使用多域名回退请求器)
        const detailEndpoint = `/${type}/${item.id}`;
        const { data: detail } = await fetchTmdb(detailEndpoint, { 
          language: 'zh-CN', 
          append_to_response: 'alternative_titles,external_ids' 
        });

        // 定义哪些排序模式需要显示“追更集数”标签
        const showEpisodeTag = sort === 'next_episode' || sort === 'daily_airing' || sort === 'first_air_date.desc';

        // 判断若为剧集，且属于上述三种追更模式，才展示季集和日历图标
        if (type !== 'movie' && showEpisodeTag) {
          const targetEp = detail.next_episode_to_air || detail.last_episode_to_air;
          if (targetEp) {
            sortDate = targetEp.air_date || sortDate;
            const s = targetEp.season_number.toString().padStart(2, '0');
            const e = targetEp.episode_number.toString().padStart(2, '0');
            const icon = detail.next_episode_to_air ? "🕒" : "✅";
            remark = `${icon}${dayjs(sortDate).format('MM-DD')} S${s}E${e}`;
          }
        } else {
          // 电影，或者是 "综合热度" 模式下的剧集：统统展示 ⭐评分 + 年份
          const releaseYear = (detail.release_date || detail.first_air_date || "").substring(0, 4);
          if (releaseYear) {
            remark += ` | ${releaseYear}`;
          }
        }

        // 4. 处理智能翻译逻辑
        if (hasNoChinese) {
          const altTitles = detail.alternative_titles?.titles || detail.alternative_titles?.results || [];
          const cnTitle = altTitles.find(t => t.iso_3166_1 === 'CN')?.title;
          
          if (cnTitle) {
            finalTitle = cnTitle;
          } else if (detail.external_ids?.imdb_id) {
            const doubanUrl = `https://api.wmdb.tv/api/v1/movie/search?q=${detail.external_ids.imdb_id}`;
            // 优化：缩短超时时间到 2000ms，防止某一部影片卡顿拖慢整体列表加载速度
            const doubanRes = await axios.get(doubanUrl, { timeout: 2000 }).catch(() => null);
            if (doubanRes?.data?.[0]) {
              const dTitle = doubanRes.data[0].alias || doubanRes.data[0].originalName;
              if (/[\u4e00-\u9fa5]/.test(dTitle)) finalTitle = dTitle;
            }
          }
        }
      } catch (e) {
        log.warn(`详情请求失败 [ID: ${item.id}]: ${e.message}`);
      }

      const result = {
        vod_id: item.id.toString(),
        vod_name: finalTitle,
        vod_pic: item.poster_path ? `${DATA_SOURCES.tmdbImage}${item.poster_path}` : "",
        vod_remarks: remark,
        goSearch: true,
        _date: sortDate
      };

      setCachedData(cacheKey, result);
      return result;
    }));
    
    // 将当前批次的结果追加到总数组中
    processedItems.push(...batchResults);
  }

  // 追更模式下的二次排序逻辑
  if (sort === 'next_episode' && type !== 'movie') {
    processedItems.sort((a, b) => {
      const isAFuture = a._date >= today;
      const isBFuture = b._date >= today;
      if (isAFuture && !isBFuture) return -1;
      if (!isAFuture && isBFuture) return 1;
      return isAFuture ? (a._date > b._date ? 1 : -1) : (a._date < b._date ? 1 : -1);
    });
  }

  return { list: processedItems, page: pg, pagecount: 100, limit: 20, total: 2000 };
};

// ===================== T4协议入口 =====================
const decodeExt = (ext) => {
  if (!ext) return {};
  try { return JSON.parse(Buffer.from(ext, 'base64').toString('utf-8')); } 
  catch (e) { try { return JSON.parse(ext); } catch (e2) { return {}; } }
};

const handleT4Request = async (req) => {
  const { t, pg, ext } = req.query;
  const page = parseInt(pg) || 1;

  if (t) {
    const filters = decodeExt(ext);
    return await _category({ id: t, page, filters });
  }

  const { class: classList, filters } = generateClassAndFilters();
  return { class: classList, filters };
};

// ===================== 模块导出 =====================
module.exports = async (server, opt) => {
  await init(server);
  const apiPath = "/video/qqzg";

  server.get(apiPath, async (req, reply) => {
    try {
      return await handleT4Request(req);
    } catch (error) {
      log.error(`[错误] ${error.message}`);
      return { error: "Internal Server Error", message: error.message };
    }
  });

  opt.sites.push({
    key: "qqzg",
    name: "全球追更",
    type: 4,
    api: apiPath,
    searchable: 0,
    quickSearch: 0,
    filterable: 1,
    indexs: 1
  });

  log.info(`✅ 全球追更已加载 (目录模式，点击资源直调搜索)`);
  const { class: classList } = generateClassAndFilters();
  log.info(`✅ 主分类平台: ${classList.map(c => c.type_name).join(', ')}`);
};