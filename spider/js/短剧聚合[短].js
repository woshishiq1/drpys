/*
@header({
  searchable: 1,
  filterable: 1,
  quickSearch: 1,
  title: '聚合短剧[短]',
  lang: 'ds'
})
*/
// 全局配置：统一管理常量、平台配置、专用请求头
globalThis.aggConfig = {
  keys: 'd3dGiJc651gSQ8w1',
  charMap: {
    '+': 'P', '/': 'X', '0': 'M', '1': 'U', '2': 'l', '3': 'E', '4': 'r', '5': 'Y', '6': 'W', '7': 'b', '8': 'd', '9': 'J',
    'A': '9', 'B': 's', 'C': 'a', 'D': 'I', 'E': '0', 'F': 'o', 'G': 'y', 'H': '_', 'I': 'H', 'J': 'G', 'K': 'i', 'L': 't',
    'M': 'g', 'N': 'N', 'O': 'A', 'P': '8', 'Q': 'F', 'R': 'k', 'S': '3', 'T': 'h', 'U': 'f', 'V': 'R', 'W': 'q', 'X': 'C',
    'Y': '4', 'Z': 'p', 'a': 'm', 'b': 'B', 'c': 'O', 'd': 'u', 'e': 'c', 'f': '6', 'g': 'K', 'h': 'x', 'i': '5', 'j': 'T',
    'k': '-', 'l': '2', 'm': 'z', 'n': 'S', 'o': 'Z', 'p': '1', 'q': 'V', 'r': 'v', 's': 'j', 't': 'Q', 'u': '7', 'v': 'D',
    'w': 'w', 'x': 'n', 'y': 'L', 'z': 'e'
  },
  headers: {
    niuniu: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json;charset=UTF-8',
      'User-Agent': 'okhttp/4.12.0'
    },
    default: {
      'User-Agent': 'okhttp/3.12.11',
      'content-type': 'application/json; charset=utf-8'
    }
  },
  platform: {
    百度: {
      host: 'https://api.jkyai.top',
      url1: '/API/bddjss.php?name=fyclass&page=fypage',
      url2: '/API/bddjss.php?id=fyid',
      search: '/API/bddjss.php?name=**&page=fypage'
    },
    甜圈: {
      host: 'https://mov.cenguigui.cn',
      url1: '/duanju/api.php?classname',
      url2: '/duanju/api.php?book_id',
      search: '/duanju/api.php?name'
    },
    锦鲤: {
      host: 'https://api.jinlidj.com',
      search: '/api/search',
      url2: '/api/detail'
    },
    番茄: {
      host: 'https://reading.snssdk.com',
      url1: '/reading/bookapi/bookmall/cell/change/v',
      url2: 'https://fqgo.52dns.cc/catalog',
      search: 'https://fqgo.52dns.cc/search'
    },
    星芽: {
      host: 'https://app.whjzjx.cn',
      url1: '/cloud/v2/theater/home_page?theater_class_id',
      url2: '/v2/theater_parent/detail',
      search: '/v3/search',
      loginUrl: 'https://u.shytkjgs.com/user/v1/account/login'
    },
    西饭: {
      host: 'https://xifan-api-cn.youlishipin.com',
      url1: '/xifan/drama/portalPage',
      url2: '/xifan/drama/getDuanjuInfo',
      search: '/xifan/search/getSearchList'
    },
    软鸭: {
      host: 'https://api.xingzhige.com',
      url1: '/API/playlet',
      search: '/API/playlet'
    },
    七猫: {
      host: 'https://api-store.qmplaylet.com',
      url1: '/api/v1/playlet/index',
      url2: 'https://api-read.qmplaylet.com/player/api/v1/playlet/info',
      search: '/api/v1/playlet/search'
    },
    牛牛: {
      host: 'https://new.tianjinzhitongdaohe.com',
      url1: '/api/v1/app/screen/screenMovie',
      url2: '/api/v1/app/play/movieDetails',
      search: '/api/v1/app/search/searchMovie'
    },
    围观: {
      host: 'https://api.drama.9ddm.com',
      url1: '/drama/home/shortVideoTags',
      url2: '/drama/home/shortVideoDetail',
      search: '/drama/home/search'
    },
    碎片: {
      host: 'https://free-api.bighotwind.cc',
      url1: '/papaya/papaya-api/theater/tags',
      url2: '/papaya/papaya-api/videos/info',
      search: '/papaya/papaya-api/videos/page'
    }
  },
  // 平台列表：用于推荐、分类解析
  platformList: [
    { name: '星芽', id: '星芽' },
    { name: '锦鲤', id: '锦鲤' },
    { name: '番茄', id: '番茄' },
    { name: '西饭', id: '西饭' },
    { name: '百度', id: '百度' },
    { name: '七猫', id: '七猫' },
    { name: '软鸭', id: '软鸭' },
    { name: '甜圈', id: '甜圈' },
    //{ name: '牛牛', id: '牛牛' },
    { name: '围观', id: '围观' },
    { name: '碎片', id: '碎片' }
  ],
  // 新增统一配置
  search: {
    limit: 50,  // 统一搜索结果数量限制
    timeout: 6000  // 统一超时时间
  }
};

// 碎片剧场专用函数
globalThis.guid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

globalThis.encHex = function(txt) {
    var k = CryptoJS.enc.Utf8.parse("p0sfjw@k&qmewu#w");
    var e = CryptoJS.AES.encrypt(
        CryptoJS.enc.Utf8.parse(txt),
        k, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }
    );
    return e.ciphertext.toString(CryptoJS.enc.Hex);
};

var rule = {
  类型: '聚合短剧',
  title: '聚合短剧[短]',
  author: '聚合短剧',
  host: '',
  url: '',
  searchUrl: '*',
  searchable: 1,
  quickSearch: 1,
  filterable: 1,
  timeout: 5000,
  play_parse: true,
  search_match: true,
  headers: globalThis.aggConfig.headers.default,

  filter_url: '{{fl.area}}',
  filter: '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',
  filter_def: {
    百度: { area: '逆袭' },
    甜圈: { area: '推荐榜' },
    锦鲤: { area: '' },
    番茄: { area: 'videoseries_hot' },
    星芽: { area: '1' },
    西饭: { area: '' },
    软鸭: { area: '战神' },
    七猫: { area: '0' },
    牛牛: { area: '现言' },
    围观: { area: '' },
    碎片: { area: '' }
  },
  推荐: async function () {
  let { publicUrl} = this;

    let recommendList = [];
    const cfg = globalThis.aggConfig;

    if (cfg.platformList && cfg.platformList.length > 0) {
        const randomPlat = getRandomItem(cfg.platformList);
        const platBaseConfig = cfg.platform[randomPlat.id];
        const platDefaultFilter = rule.filter_def[randomPlat.id] || {};
        const defaultArea = platDefaultFilter.area || '';

        try {
            let platContentList = [];

            if (randomPlat.id === '百度') {
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1.replace('fyclass', defaultArea).replace('fypage', '1')}`;
                const response = JSON.parse(await request(requestUrl, { headers: this.headers }));
                platContentList = response.data.map(item => ({
                    title: item.title,
                    img: item.cover,
                    year: '更新至' + item.totalChapterNum + '集',
                    desc: `百度短剧 | ${item.title || '无简介'}`,
                    url: `百度@${item.id}`
                }));
            }

            else if (randomPlat.id === '甜圈') {
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1}=${defaultArea}&offset=1`;
                const response = JSON.parse(await request(requestUrl, { headers: this.headers }));
                platContentList = response.data.map(item => ({
                    title: item.title,
                    img: item.cover,
                    year: item.copyright || '未知',
                    desc: `甜圈短剧 | ${item.sub_title || '无简介'}`,
                    url: `甜圈@${item.book_id}`
                }));
            }

            else if (randomPlat.id === '锦鲤') {
                const requestBody = JSON.stringify({
                    page: 1,
                    limit: 10,
                    type_id: defaultArea,
                    year: '',
                    keyword: ''
                });
                const response = JSON.parse(await request(
                    `${platBaseConfig.host}${platBaseConfig.search}`,
                    { method: 'POST', body: requestBody }
                ));
                platContentList = response.data.list.map(item => ({
                    title: item.vod_name || '未知短剧',
                    img: item.vod_pic || '',
                    year: item.vod_year || '未知',
                    desc: `锦鲤短剧 | ${item.vod_total || 0}集`,
                    url: `锦鲤@${item.vod_id}`
                }));
            }

            else if (randomPlat.id === '番茄') {
                const fmSessionId = new Date().toISOString().slice(0, 16).replace(/-|T:/g, '');
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1}?change_type=0&selected_items=${defaultArea}&tab_type=8&cell_id=6952850996422770718&version_tag=video_feed_refactor&device_id=1423244030195267&aid=1967&app_name=novelapp&ssmix=a&session_id=${fmSessionId}`;
                const response = JSON.parse(await request(requestUrl, { headers: cfg.headers.default }));
                const fmItems = response?.data?.cell_view?.cell_data || [];
                platContentList = fmItems.map(item => {
                    const videoInfo = item.video_data?.[0] || item;
                    return {
                        title: videoInfo.title || '未知标题',
                        img: videoInfo.cover || videoInfo.horiz_cover || '',
                        year: '未知',
                        desc: `番茄短剧 | ${videoInfo.sub_title || '无简介'}`,
                        url: `番茄@${videoInfo.series_id || videoInfo.book_id || ''}`
                    };
                });
            }

            else if (randomPlat.id === '星芽') {
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1}=${defaultArea}&type=1&class2_ids=0&page_num=1&page_size=10`;
                const response = JSON.parse(await request(requestUrl, { headers: this.xingya_headers }));
                platContentList = response.data.list.map(item => {
                    const detailUrl = `${platBaseConfig.host}${platBaseConfig.url2}?theater_parent_id=${item.theater.id}`;
                    return {
                        title: item.theater.title,
                        img: item.theater.cover_url,
                        year: '未知',
                        desc: `星芽短剧 | ${item.theater.total || 0}集 | 播放量:${item.theater.play_amount_str}`,
                        url: `星芽@${detailUrl}`
                    };
                });
            }

            else if (randomPlat.id === '西饭') {
                const [typeId, typeName] = defaultArea.split('@');
                const ts = Math.floor(Date.now() / 1000);
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1}?reqType=aggregationPage&offset=0&categoryId=${typeId}&quickEngineVersion=-1&scene=&categoryNames=${encodeURIComponent(typeName)}&categoryVersion=1&density=1.5&pageID=page_theater&version=2001001&androidVersionCode=28&requestId=${ts}aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3NzUxMTZjMWQ3NWI3ZDAiLCJpZCI6IjNiMzViZmYzYWE0OTgxNDQxNDBlZjI5N2JkMDY5NGNhIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
                const response = JSON.parse(await request(requestUrl, { headers: cfg.headers.default }));
                const xfElements = response.result.elements || [];
                platContentList = [];
                xfElements.forEach(soup => {
                    soup.contents.forEach(vod => {
                        const dj = vod.duanjuVo;
                        platContentList.push({
                            title: dj.title,
                            img: dj.coverImageUrl,
                            year: '未知',
                            desc: `西饭短剧 | ${dj.total || 0}集`,
                            url: `西饭@${dj.duanjuId}#${dj.source}`
                        });
                    });
                });
            }

            else if (randomPlat.id === '软鸭') {
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1}/?keyword=${encodeURIComponent(defaultArea)}&page=1`;
                const response = JSON.parse(await request(requestUrl, { headers: cfg.headers.default }));
                platContentList = response.data.map(item => {
                    const purl = `${item.title}@${item.cover}@${item.author}@${item.type}@${item.desc}@${item.book_id}`;
                    return {
                        title: item.title,
                        img: item.cover,
                        year: '未知',
                        desc: `软鸭短剧 | ${item.type || '无分类'}`,
                        url: `软鸭@${encodeURIComponent(purl)}`
                    };
                });
            }

            else if (randomPlat.id === '七猫') {
                let signStr = `operation=1playlet_privacy=1tag_id=${defaultArea}${cfg.keys}`;
                const sign = await md5(signStr);
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.url1}?tag_id=${defaultArea}&playlet_privacy=1&operation=1&sign=${sign}`;
                const headers = { ...await getHeaderX(), ...cfg.headers.default };
                const response = JSON.parse(await request(requestUrl, { method: 'GET', headers }));
                platContentList = (response?.data?.list || []).map(item => ({
                    title: item.title || '未知标题',
                    img: item.image_link || '',
                    year: '未知',
                    desc: `七猫短剧 | ${item.tags} ${item.total_episode_num || 0}集`,
                    url: `七猫@${encodeURIComponent(item.playlet_id)}`
                }));
            }

            else if (randomPlat.id === '牛牛') {
                const requestBody = JSON.stringify({
                    condition: { classify: defaultArea, typeId: 'S1' },
                    pageNum: '1',
                    pageSize: 10
                });
                const response = JSON.parse(await request(
                    `${platBaseConfig.host}${platBaseConfig.url1}`,
                    { method: 'POST', headers: cfg.headers.niuniu, body: requestBody }
                ));
                platContentList = (response.data?.records || []).map(item => ({
                    title: item.name,
                    img: item.cover,
                    year: '未知',
                    desc: `牛牛短剧 | ${item.totalEpisode || 0}集`,
                    url: `牛牛@${item.id}`
                }));
            }

            else if (randomPlat.id === '围观') {
                const postData = JSON.stringify({
                    "audience": "",
                    "page": 1,
                    "pageSize": 10,
                    "searchWord": "",
                    "subject": ""
                });
                const response = JSON.parse(await request(
                    `${platBaseConfig.host}${platBaseConfig.search}`,
                    { method: 'POST', body: postData }
                ));
                platContentList = response.data.map(it => ({
                    title: it.title,
                    img: it.vertPoster,
                    year: it.publishDate ? it.publishDate.toString() : '',
                    desc: `围观短剧 | 集数:${it.episodeCount} 播放:${it.viewCount}`,
                    remarks: it.description,
                    url: `围观@${it.oneId}`
                }));
            }

            else if (randomPlat.id === '碎片') {
                // 碎片剧场需要先获取token
                let openId = md5(guid()).substring(0, 16);
                let api = "https://free-api.bighotwind.cc/papaya/papaya-api/oauth2/uuid";
                let body = JSON.stringify({ "openId": openId });
                let key = encHex(Date.now().toString());
                let tokenResponse = JSON.parse(await request(api, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "key": key
                    },
                    body: body
                }));
                
                const headers = { ...this.headers, 'Authorization': tokenResponse.data.token };
                const requestUrl = `${platBaseConfig.host}${platBaseConfig.search}?type=5&tagId=&pageNum=1&pageSize=10`;
                const response = JSON.parse(await request(requestUrl, { headers }));
                
                platContentList = response.list.map(it => {
                    let compoundId = it.itemId + '@' + it.videoCode;
                    return {
                        title: it.title,
                        img: "https://speed.hiknz.com/papaya/papaya-file/files/download/" + it.imageKey + "/" + it.imageName,
                        year: it.publishDate ? it.publishDate.toString() : '',
                        desc: `碎片剧场 | 集数:${it.episodesMax} 播放:${it.hitShowNum}`,
                        remarks: it.content || it.description || '',
                        url: `碎片@${compoundId}`
                    };
                });
            }

            recommendList.push(...platContentList.slice(0, 10));
        } catch (error) {
            log(`随机推荐拉取失败（平台：${randomPlat.name}）：${error.message}`);
            recommendList.push({
                title: '推荐加载失败',
                img: '',
                desc: `当前平台（${randomPlat.name}）数据获取异常，请稍后重试`,
                url: '',
                year: ''
            });
        }
    } 

    return setResult(recommendList);
    },
    
  // 预处理：初始化平台接口、获取星芽token
  预处理: async function () {
    const cfg = globalThis.aggConfig;
    const plat = cfg.platform;

    // 绑定平台完整接口URL
    this.platforms = cfg.platformList.map(item => ({
      ...item,
      url: `${plat[item.id].host}${plat[item.id].url1}`
    }));

    try {
      const data = {
        'device': '24250683a3bdb3f118dff25ba4b1cba1a'
    };
    
    const options = {
        method: 'POST',
        headers: {
            'User-Agent': 'okhttp/4.10.0',
            'platform': '1',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    
    let url = 'https://u.shytkjgs.com/user/v1/account/login';
    let html = await request(plat.星芽.loginUrl, options);
      const res = JSON.parse(html);
      const token = res?.data?.token || res?.data?.data?.token;
      this.xingya_headers = { ...rule.headers, authorization: token };
      log('星芽短剧token获取成功');
    } catch (e) {
      log(`星芽短剧token获取失败: ${e.message} | 详情: ${e.stack}`);
    }
  },

  // 分类解析
  class_parse: async () => {
    const classes = globalThis.aggConfig.platformList.map(item => ({
      type_id: item.id,
      type_name: item.name
    }));
    return { class: classes };
  },

  // 一级列表
  一级: async function () {
    const { MY_CATE, MY_FL, MY_PAGE } = this;
    const d = [];
    const area = MY_FL.area || '';
    const cfg = globalThis.aggConfig;
    const plat = cfg.platform[MY_CATE];

    switch (MY_CATE) {
      case '百度': {
        const url = `${plat.host}${plat.url1.replace('fyclass', area).replace('fypage', MY_PAGE)}`;
        const res = JSON.parse(await request(url, { headers: this.headers }));
        res.data.forEach(it => {
          d.push({
            title: it.title,
            img: it.cover,
          //  year: '更新至' + it.totalChapterNum + '集',
            desc: '更新至' + it.totalChapterNum + '集',
            url: `百度@${it.id}`
          });
        });
        break;
      }
      case '甜圈': {
        const url = `${plat.host}${plat.url1}=${area}&offset=${MY_PAGE}`;
        const res = JSON.parse(await request(url, { headers: this.headers }));
        res.data.forEach(it => {
          d.push({
            title: it.title,
            img: it.cover,
            year: it.copyright,
            desc: it.sub_title,
            url: `甜圈@${it.book_id}`
          });
        });
        break;
      }
      case '锦鲤': {
        const body = JSON.stringify({ page: MY_PAGE, limit: 24, type_id: area, year: '', keyword: '' });
        const res = JSON.parse(await request(plat.host + plat.search, { method: 'POST', body }));
        res.data.list.forEach(item => {
          d.push({
            title: item.vod_name || '',
            year: item.vod_year,
            desc: `${item.vod_total}集`,
            content: item.vod_tag,
            img: item.vod_pic,
            url: `锦鲤@${item.vod_id}`
          });
        });
        break;
      }
      
      case '番茄': {
        const sessionId = new Date().toISOString().slice(0, 16).replace(/-|T:/g, '');
        let url = `${plat.host}${plat.url1}?change_type=0&selected_items=${area}&tab_type=8&cell_id=6952850996422770718&version_tag=video_feed_refactor&device_id=1423244030195267&aid=1967&app_name=novelapp&ssmix=a&session_id=${sessionId}`;
        if (MY_PAGE > 1) url += `&offset=${(MY_PAGE - 1) * 12}`;
        
        const res = JSON.parse(await request(url, { headers: cfg.headers.default }));
        let items = [];
        if (res?.data?.cell_view?.cell_data) items = res.data.cell_view.cell_data;
        else if (res?.search_tabs) items = res.search_tabs.find(t => t.title === '短剧' && t.data)?.data || [];
        else if (Array.isArray(res?.data)) items = res.data;
        else if (res?.data) items = [res.data];
        else items = [res || {}];

        items.forEach(item => {
          const videoData = item.video_data?.[0] || item;
          d.push({
            title: videoData.title || '未知短剧',
            img: videoData.cover || videoData.horiz_cover || '',
            desc: videoData.sub_title || videoData.rec_text || '',
            url: `番茄@${videoData.series_id || videoData.book_id || videoData.id || ''}`
          });
        });
        break;
      }
      
      case '星芽': {
        const url = `${plat.host}${plat.url1}=${area}&type=1&class2_ids=0&page_num=${MY_PAGE}&page_size=24`;
        const res = JSON.parse(await request(url, { headers: this.xingya_headers }));
        res.data.list.forEach(it => {
          const id = `${plat.host}${plat.url2}?theater_parent_id=${it.theater.id}`;
          d.push({
            title: it.theater.title,
            img: it.theater.cover_url,
            desc: `${it.theater.total}集`,
            content: `播放量:${it.theater.play_amount_str}`,
            url: `星芽@${id}`
          });
        });
        break;
      }
      case '西饭': {
        const [typeId, typeName] = area.split('@');
        const ts = Math.floor(Date.now() / 1000);
        const url = `${plat.host}${plat.url1}?reqType=aggregationPage&offset=${(MY_PAGE - 1) * 30}&categoryId=${typeId}&quickEngineVersion=-1&scene=&categoryNames=${encodeURIComponent(typeName)}&categoryVersion=1&density=1.5&pageID=page_theater&version=2001001&androidVersionCode=28&requestId=${ts}aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3NzUxMTZjMWQ3NWI3ZDAiLCJpZCI6IjNiMzViZmYzYWE0OTgxNDQxNDBlZjI5N2JkMDY5NGNhIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
        
        const res = JSON.parse(await request(url, { headers: cfg.headers.default }));
        res.result.elements.forEach(soup => {
          soup.contents.forEach(vod => {
            const dj = vod.duanjuVo;
            d.push({
              title: dj.title,
              img: dj.coverImageUrl,
              desc: `${dj.total}集`,
              url: `西饭@${dj.duanjuId}#${dj.source}`
            });
          });
        });
        break;
      }
      case '软鸭': {
        const url = `${plat.host}${plat.url1}/?keyword=${encodeURIComponent(area)}&page=${MY_PAGE}`;
        const res = JSON.parse(await request(url, { headers: cfg.headers.default }));
        res.data.forEach(item => {
          const purl = `${item.title}@${item.cover}@${item.author}@${item.type}@${item.desc}@${item.book_id}`;
          d.push({
            title: item.title,
            img: item.cover,
            desc: item.type,
            content: item.author,
            url: `软鸭@${encodeURIComponent(purl)}`
          });
        });
        break;
      }
      case '七猫': {
        let signStr = `operation=1playlet_privacy=1tag_id=${area}${cfg.keys}`;
        const sign = await md5(signStr);
        const url = `${plat.host}${plat.url1}?tag_id=${area}&playlet_privacy=1&operation=1&sign=${sign}`;
        const headers = { ...await getHeaderX(), ...cfg.headers.default };
        const res = JSON.parse(await request(url, { method: 'GET', headers }));
        (res?.data?.list || []).forEach(item => {
          d.push({
            title: item.title || '',
            img: item.image_link || '',
            desc: `${item.total_episode_num || 0}集`,
            content: item.tags,
            url: `七猫@${encodeURIComponent(item.playlet_id)}`
          });
        });
        break;
      }
      case '牛牛': {
        const body = JSON.stringify({
          condition: { classify: area, typeId: 'S1' },
          pageNum: MY_PAGE,
          pageSize: 24
        });
        const res = JSON.parse(await request(plat.host + plat.url1, { method: 'POST', headers: cfg.headers.niuniu, body }));
        (res.data?.records || []).forEach(item => {
          d.push({
            title: item.name,
            img: item.cover,
            desc: `${item.totalEpisode || 0}集`,
            url: `牛牛@${item.id}`
          });
        });
        break;
      }
      case '围观': {
        const postData = JSON.stringify({
          "audience": "全部受众",
          "page": MY_PAGE,
          "pageSize": 30,
          "searchWord": "",
           "subject": "全部主题"
        });
        const res = JSON.parse(await request(`${plat.host}${plat.search}`, { method: 'POST', headers: cfg.headers.default, body: postData }));
        res.data.forEach(it => {
          d.push({
            title: it.title,
            img: it.vertPoster,
            year: it.publishDate ? it.publishDate.toString() : '',
            desc: `集数:${it.episodeCount} 播放:${it.viewCount}`,
            remarks: it.description,
            url: `围观@${it.oneId}`
          });
        });
        break;
      }
      case '碎片': {
        // 碎片剧场需要先获取token
        let openId = md5(guid()).substring(0, 16);
        let api = "https://free-api.bighotwind.cc/papaya/papaya-api/oauth2/uuid";
        let body = JSON.stringify({ "openId": openId });
        let key = encHex(Date.now().toString());
        let tokenResponse = JSON.parse(await request(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "key": key
          },
          body: body
        }));
        
        const headers = { ...this.headers, 'Authorization': tokenResponse.data.token };
        const requestUrl = `${plat.host}${plat.search}?type=5&tagId=&pageNum=${MY_PAGE}&pageSize=24`;
        const response = JSON.parse(await request(requestUrl, { headers }));
        
        response.list.forEach(it => {
          let compoundId = it.itemId + '@' + it.videoCode;
          d.push({
            title: it.title,
            img: "https://speed.hiknz.com/papaya/papaya-file/files/download/" + it.imageKey + "/" + it.imageName,
            year: it.publishDate ? it.publishDate.toString() : '',
            desc: `集数:${it.episodesMax} 播放:${it.hitShowNum}`,
            remarks: it.content || it.description || '',
            url: `碎片@${compoundId}`
          });
        });
        break;
      }
    }
    return setResult(d);
  },

  // 二级详情
  二级: async function () {
    const { orId } = this;
    if (orId === 'update_info') {
      return {
        vod_content: rule.update_info,
        vod_name: '更新日志',
        type_name: '更新日志',
        vod_pic: 'https://resource-cdn.tuxiaobei.com/video/FtWhs2mewX_7nEuE51_k6zvg极awl.png',
        vod_remarks: `版本:${rule.version}`,
        vod_play_from: '聚合短剧',
        vod_play_url: '随机小视频$http://api.yujn.cn/api/zzxjj.php'
      };
    }

    const parts = orId.split('@');
    const platform = parts[0];
    const id = parts.slice(1).join('@'); // 获取@之后的所有内容
    const cfg = globalThis.aggConfig;
    const plat = cfg.platform[platform];
    let VOD = {};

    switch (platform) {
      case '百度': {
        const res = JSON.parse(await request(`${plat.host}${plat.url2.replace('fyid', id)}`));
        VOD = {
          vod_name: res.title,
          vod_pic: res.data[0].cover,
          vod_year: '更新至:' + res.total + '集',
          vod_play_from: '百度短剧',
          vod_play_url: res.data.map(item => `${item.title}$${item.video_id}`).join("#")
        };
        break;
      }
      case '甜圈': {
        const res = JSON.parse(await request(`${plat.host}${plat.url2}=${id}`));
        VOD = {
          vod_name: res.book_name,
          type_name: res.category,
          vod_pic: res.book_pic,
          vod_content: res.desc,
          vod_remarks: res.duration,
          vod_year: `更新时间:${res.time}`,
          vod_actor: res.author,
          vod_play_from: '甜圈短剧',
          vod_play_url: res.data.map(item => `${item.title}$${item.video_id}`).join('#')
        };
        break;
      }
      case '锦鲤': {
        const res = JSON.parse(await request(`${plat.host}${plat.url2}/${id}`));
        const list = res.data;
        const playUrls = Object.keys(list.player).map(key => `${key}$${list.player[key]}`);
        VOD = {
          vod_id: list.vod_id || '暂无id',
          vod_name: list.vod_name || '暂无名称',
          type_name: list.vod_class || '暂无类型',
          vod_pic: list.vod_pic || '暂无图片',
          vod_remarks: list.vod_remarks || '暂无备注',
          vod_year: list.vod_year || '暂无年份',
          vod_area: list.vod_area || '暂无地区',
          vod_actor: list.vod_actor || '暂无演员',
          vod_director: list.vod_director || '暂无导演',
          vod_content: list.vod_blurb || '暂无剧情',
          vod_play_from: '锦鲤短剧',
          vod_play_url: playUrls.join('#')
        };
        break;
      }
      
      case '番茄': {
        const res = JSON.parse(await request(`${plat.url2}?book_id=${id}`));
        const bookInfo = res.data.book_info;
        const playList = res.data.item_data_list.map(item => `${item.title}$${item.item_id}`).join('#');
        VOD = {
          vod_id: bookInfo.book_id,
          vod_name: bookInfo.book_name,
          vod_type: bookInfo.tags,
          vod_year: bookInfo.create_time,
          vod_pic: bookInfo.thumb_url || bookInfo.audio_thumb_uri,
          vod_content: bookInfo.abstract || bookInfo.book_abstract_v2,
          vod_remarks: bookInfo.sub_info || `更新至${res.data.item_data_list.length}集`,
          vod_play_from: '番茄短剧',
          vod_play_url: playList
        };
        break;
      }
      
      case '星芽': {
        const res = JSON.parse(await request(id, { headers: this.xingya_headers }));
        const data = res.data;
        const playUrls = data.theaters.map(it => `${it.num}$${it.son_video_url}`);
        VOD = {
          vod_id: id,
          vod_name: data.title,
          type_name: data.score,
          vod_pic: data.cover_url,
          vod_area: `收藏${data.collect_number}`,
          vod_actor: `点赞${data.like_num}`,
          vod_director: `评分${data.score}`,
          vod_remarks: data.desc_tags + '',
          vod_content: data.introduction,
          vod_play_from: '星芽短剧',
          vod_play_url: playUrls.join('#')
        };
        break;
      }
      case '西饭': {
        const [duanjuId, source] = id.split('#');
        const url = `${plat.host}${plat.url2}?duanjuId=${duanjuId}&source=${source}&openFrom=homescreen&type=&pageID=page_inner_flow&density=1.5&version=2001001&androidVersionCode=28&requestId=1740658944980aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciI6MiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3NzUxMTY2YzFkNzViN2QwIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
        
        const res = JSON.parse(await request(url, { headers: cfg.headers.default }));
        const data = res.result;
        const playUrls = data.episodeList.map(ep => `${ep.index}$${ep.playUrl}`);
        VOD = {
          vod_name: data.title,
          vod_pic: data.coverImageUrl,
          vod_content: data.desc || '未知',
          vod_remarks: data.updateStatus === 'over' ? `${data.total}集 已完结` : `更新${data.total}集`,
          vod_play_from: '西饭短剧',
          vod_play_url: playUrls.join('#')
        };
        break;
      }
      case '软鸭': {
        const did = decodeURIComponent(id);
        const [title, img, author, type, desc, book_id] = did.split('@');
        const detailUrl = `${plat.host}${plat.url1}/?book_id=${book_id || id.split('@')[5]}`;
        const res = JSON.parse(await request(detailUrl, { headers: cfg.headers.default }));
        const playUrls = (res.data?.video_list || []).map(ep => `${ep.title}$${ep.video_id}`).join('#');
        VOD = {
          vod_name: title,
          vod_pic: img,
          vod_actor: author,
          vod_remarks: type,
          vod_content: desc,
          vod_play_from: '软鸭短剧',
          vod_play_url: playUrls
        };
        break;
      }
      case '七猫': {
        const did = decodeURIComponent(id);
        const sign = await md5(`playlet_id=${did}${cfg.keys}`);
        const url = `${plat.url2}?playlet_id=${did}&sign=${sign}`;
        const headers = { ...await getHeaderX(), ...cfg.headers.default };
        
        const res = JSON.parse(await request(url, { method: 'GET', headers }));
        const data = res.data;
        VOD = {
          vod_name: data.title || '未知标题',
          vod_pic: data.image_link || '未知图片',
          vod_actor: '',
          vod_remarks: `${data.tags} ${data.total_episode_num}集`,
          vod_content: data.intro || '未知剧情',
          vod_play_from: '七猫短剧',
          vod_play_url: data.play_list.map(it => `${it.sort}$${it.video_url}`).join('#')
        };
        break;
      }
      case '牛牛': {
        const body = JSON.stringify({ id, source: 0, typeId: 'S1', userId: '223664' });
        const res = JSON.parse(await request(plat.host + plat.url2, {
          method: 'POST',
          headers: cfg.headers.niuniu,
          body
        }));
        const data = res.data || {};
        const playUrls = (data.episodeList || []).map(ep => `${ep.episode}$${id}@${ep.id}`);
        
        VOD = {
          vod_name: data.name || '未知名称',
          vod_pic: data.cover || '',
          vod_content: data.introduce || '暂无剧情',
          vod_play_from: '牛牛短剧',
          vod_play_url: playUrls.join('#') || '暂无播放地址$0'
        };
        break;
      }
      case '围观': {
        const res = JSON.parse(await request(
          `${plat.host}${plat.url2}?oneId=${id}&page=1&pageSize=1000`,
          { headers: this.headers }
        ));
        const data = res.data;
        const firstEpisode = data[0];
        VOD = {
          vod_name: firstEpisode.title,
          vod_pic: firstEpisode.vertPoster,
          vod_remarks: `共${data.length}集`,
          vod_content: `播放量:${firstEpisode.collectionCount} 评论:${firstEpisode.commentCount}`,
          vod_play_from: '围观短剧',
          vod_play_url: data.map(episode => {
            // 直接传递playSetting给lazy函数处理
            return `${episode.title}第${episode.playOrder}集$${episode.playSetting}`;
          }).join('#')
        };
        break;
      }
      case '碎片': {
        // 碎片剧场需要先获取token
        let openId = md5(guid()).substring(0, 16);
        let api = "https://free-api.bighotwind.cc/papaya/papaya-api/oauth2/uuid";
        let body = JSON.stringify({ "openId": openId });
        let key = encHex(Date.now().toString());
        let tokenResponse = JSON.parse(await request(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "key": key
          },
          body: body
        }));
        
        const headers = { ...this.headers, 'Authorization': tokenResponse.data.token };
        const [itemId, videoCode] = id.split('@');
        const requestUrl = `${plat.host}${plat.url2}?videoCode=${videoCode}&itemId=${itemId}`;
        const response = JSON.parse(await request(requestUrl, { headers }));
        const data = response.data || response;
        VOD = {
          vod_name: data.title,
          vod_pic: "https://speed.hiknz.com/papaya/papaya-file/files/download/" + data.imageKey + "/" + data.imageName,
          vod_remarks: `共${data.episodesMax}集`,
          vod_content: data.content || data.description || `播放量:${data.hitShowNum} 点赞:${data.likeNum}`,
          vod_play_from: '碎片剧场',
          vod_play_url: (data.episodesList || []).map(episode => {
            let episodeTitle = `第${episode.episodes}集`;
            let playUrl = "";
            
            if (episode.resolutionList && episode.resolutionList.length > 0) {
              episode.resolutionList.sort((a, b) => b.resolution - a.resolution);
              let bestResolution = episode.resolutionList[0];
              playUrl = `https://speed.hiknz.com/papaya/papaya-file/files/download/${bestResolution.fileKey}/${bestResolution.fileName}`;
            }
            return playUrl ? `${episodeTitle}$${playUrl}` : null;
          }).filter(item => item !== null).join('#')
        };
        break;
      }
    }

    return VOD;
  },

  // 播放地址解析
  lazy: async function (flag, id, flags) {
    const { input } = this;
    const cfg = globalThis.aggConfig;
    console.log(`✅[input]: ${input}`);
    if (/百度/.test(flag)) {
      const item = JSON.parse(await request(`https://api.jkyai.top/API/bddjss.php?video_id=${input}`));
      let qualities = item.data.qualities;
      let urls = [];
      
      // 按清晰度优先级从高到低添加链接
      const qualityOrder = ["1080p", "sc", "sd"];
      const qualityNames = {
        "1080p": "蓝光",
        "sc": "超清",
        "sd": "标清"
      };
      
      qualityOrder.forEach(qualityKey => {
        let quality = qualities.find(q => q.quality === qualityKey);
        if (quality) {
          urls.push(qualityNames[qualityKey], quality.download_url);
        }
      });
      
      return {
        parse: 0,
        url: urls
      };
    }
    if (/甜圈/.test(flag)) {
      return { parse: 0, url: `https://mov.cenguigui.cn/duanju/api.php?video_id=${input}&type=mp4` };
    }
    if (/锦鲤/.test(flag)) {
      const html = await request(`${input}&auto=1`, { headers: { referer: 'https://www.jinlidj.com/' } });
      const match = html.match(/let data\s*=\s*({[^;]*});/);
      return { parse: 0, url: JSON.parse(match[1]).url };
    }
    if (/番茄/.test(flag)) {
      const res = JSON.parse(await request(`https://fqgo.52dns.cc/video?item_ids=${input}`, { headers: cfg.headers.default }));
      const videoModel = res.data?.[input] ? JSON.parse(res.data[input].video_model) : null;
      const url = videoModel?.video_list?.video_1 ? atob(videoModel.video_list.video_1.main_url) : '';
      return { parse: 0, url};
    }
    if (/软鸭/.test(flag)) {
      const res = JSON.parse(await request(`${cfg.platform.软鸭.host}/API/playlet/?video_id=${input}&quality=1080p`, { headers: cfg.headers.default }));
      return { parse: 0, url: res.data?.video?.url || '' };
    }
    if (/牛牛/.test(flag)) {
      const [videoId, episodeId] = input.split('@');
      const body = JSON.stringify({ episodeId, id: videoId, source: 0, typeId: 'S1', userId: '223664' });
      const res = JSON.parse(await request(`${cfg.platform.牛牛.host}/api/v1/app/play/movieDetails`, {
        method: 'POST',
        headers: cfg.headers.niuniu,
        body
      }));
      return {
        parse: 0,
        url: res.data?.url || '',
        header: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.87 Safari/537.36' }
      };
    }
    if (/围观/.test(flag)) {
      // 解析传入的 playSetting JSON 字符串
      let playSetting;
      try {
        playSetting = typeof input === 'string' ? JSON.parse(input) : input;
      } catch (e) {
        // 如果不是 JSON，直接使用 input 作为 URL
        return { parse: 0, url: input };
      }
      let urls = [];
      // 按清晰度优先级添加链接
      if (playSetting.super) {
        urls.push("超清", playSetting.super);
      }
      if (playSetting.high) {
        urls.push("高清", playSetting.high);
      }
      if (playSetting.normal) {
        urls.push("流畅", playSetting.normal);
      }
      return { parse: 0, url: urls };
    }
    return { parse: 0, url: input };
  },

  // 搜索
  搜索: async function (wd, quick, pg) {
    const { KEY, MY_PAGE } = this;
    
    const cfg = globalThis.aggConfig;
    const d = [];
    const searchLimit = cfg.search.limit || 20;
    const searchTimeout = cfg.search.timeout || 6000;

    // 并行搜索所有平台
    const searchPromises = cfg.platformList.map(async (platform) => {
      try {
        const plat = cfg.platform[platform.id];
        let results = [];

        switch (platform.id) {
          case '百度': {
            const url = `${plat.host}${plat.search.replace('**', encodeURIComponent(KEY)).replace('fypage', MY_PAGE)}`;
            const res = JSON.parse(await request(url, { headers: this.headers, timeout: searchTimeout }));
            if (res && res.data) {
              results = res.data.map(item => ({
                title: item.title,
                img: item.cover,
                year: '更新至' + item.totalChapterNum + '集',
                desc: `百度短剧 | ${item.title || '无简介'}`,
                url: `百度@${item.id}`
              }));
            }
            break;
          }
          case '甜圈': {
            const url = `${plat.host}${plat.search}=${encodeURIComponent(KEY)}&offset=${MY_PAGE}`;
            const res = JSON.parse(await request(url, { headers: this.headers, timeout: searchTimeout }));
            if (res && res.data) {
              results = res.data.map(item => ({
                title: item.title,
                img: item.cover,
                year: item.copyright || '未知',
                desc: `甜圈短剧 | ${item.sub_title || '无简介'}`,
                url: `甜圈@${item.book_id}`
              }));
            }
            break;
          }
          case '锦鲤': {
            const body = JSON.stringify({ page: MY_PAGE, limit: searchLimit, type_id: '', year: '', keyword: KEY });
            const res = JSON.parse(await request(plat.host + plat.search, { method: 'POST', body, timeout: searchTimeout }));
            if (res && res.data && res.data.list) {
              results = res.data.list.map(item => ({
                title: item.vod_name || '未知短剧',
                img: item.vod_pic || '',
                year: item.vod_year || '未知',
                desc: `锦鲤短剧 | ${item.vod_total || 0}集`,
                url: `锦鲤@${item.vod_id}`
              }));
            }
            break;
          }
          
          case '番茄': {
            try {
              const res = JSON.parse(await request(plat.search + '?keyword=' + encodeURIComponent(KEY) + '&page=' + MY_PAGE, { timeout: searchTimeout }));
              if (res && res.data && Array.isArray(res.data)) {
                results = res.data.map(item => ({
                  title: item.title || '未知标题',
                  img: item.cover || '',
                  year: '未知',
                  desc: `番茄短剧 | ${item.sub_title || '无简介'}`,
                  url: `番茄@${item.series_id || ''}`
                }));
              }
            } catch (e) {
              log(`番茄搜索失败: ${e.message}`);
            }
            break;
          }
          
          case '星芽': {
            const url = `${plat.host}${plat.search}`;
            const body = JSON.stringify({ text: KEY });
            const html = await request(url, { 
              method: 'POST',
              headers: this.xingya_headers, 
              body: body,
              timeout: searchTimeout 
            });
            
            // 先检查响应内容
            const res = JSON.parse(html);
            if (res && res.data) {
              results = res.data.theater.search_data.map(item => {
                const id = `${plat.host}${plat.url2}?theater_parent_id=${item.id}`;
                return {
                  title: item.title,
                  desc: `星芽短剧 | ${item.total || 0}集`,
                  img: item.cover_url || '',
                  content: item.introduction || '',
                  url: `星芽@${id}`
                };
              });
            }
            break;
          }
          case '西饭': {
            try {
              const ts = Math.floor(Date.now() / 1000);
              const url = `${plat.host}${plat.search}?reqType=search&offset=${(MY_PAGE - 1) * searchLimit}&keyword=${encodeURIComponent(KEY)}&quickEngineVersion=-1&scene=&categoryVersion=1&density=1.5&pageID=page_theater&version=2001001&androidVersionCode=28&requestId=${ts}aa498144140ef297&appId=drama&teenMode=false&userBaseMode=false&session=eyJpbmZvIjp7InVpZCI6IiIsInJ0IjoiMTc0MDY1ODI5NCIsInVuIjoiT1BHXzFlZGQ5OTZhNjQ3ZTQ1MjU4Nzc1MTE2YzFkNzViN2QwIiwiZnQiOiIxNzQwNjU4Mjk0In19&feedssession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dHlwIjowLCJidWlkIjoxNjMzOTY4MTI2MTQ4NjQxNTM2LCJhdWQiOiJkcmFtYSIsInZlciIowiwicmF0IjoxNzQwNjU4Mjk0LCJ1bm0iOiJPUEdfMWVkZDk5NmE2NDdlNDUyNTg3NzUxMTZjMWQ3NWI3ZDAiLCJpZCI6IjNiMzViZmYzYWE0OTgxNDQxNDBlZjI5N2JkMDY5NGNhIiwiZXhwIjoxNzQxMjYzMDk0LCJkYyI6Imd6cXkifQ.JS3QY6ER0P2cQSxAE_OGKSMIWNAMsYUZ3mJTnEpf-Rc`;
              const res = JSON.parse(await request(url, { headers: cfg.headers.default, timeout: searchTimeout }));
              if (res && res.result && res.result.elements) {
                results = res.result.elements.map(vod => {
                  const dj = vod.duanjuVo || {};
                  return {
                    title: dj.title || '未知标题',
                    img: dj.coverImageUrl || '',
                    year: '未知',
                    desc: `西饭短剧 | ${dj.total || 0}集`,
                    url: `西饭@${dj.duanjuId || ''}#${dj.source || ''}`
                  };
                }).filter(item => item.title !== '未知标题');
              }
            } catch (e) {
              log(`西饭搜索失败: ${e.message}`);
            }
            break;
          }
          case '软鸭': {
            try {
              const url = `${plat.host}${plat.search}/?keyword=${encodeURIComponent(KEY)}&page=${MY_PAGE}`;
              const res = JSON.parse(await request(url, { headers: cfg.headers.default, timeout: searchTimeout }));
              if (res && res.data) {
                results = res.data.map(item => {
                  const purl = `${item.title}@${item.cover}@${item.author}@${item.type}@${item.desc}@${item.book_id}`;
                  return {
                    title: item.title,
                    img: item.cover,
                    year: '未知',
                    desc: `软鸭短剧 | ${item.type || '无分类'}`,
                    url: `软鸭@${encodeURIComponent(purl)}`
                  };
                });
              }
            } catch (e) {
              log(`软鸭搜索失败: ${e.message}`);
            }
            break;
          }
          case '七猫': {
            try {
              let signStr = `operation=2playlet_privacy=1search_word=${KEY}${cfg.keys}`;
              const sign = await md5(signStr);
              const url = `${plat.host}${plat.search}?search_word=${encodeURIComponent(KEY)}&playlet_privacy=1&operation=2&sign=${sign}`;
              const headers = { ...await getHeaderX(), ...cfg.headers.default };
              const res = JSON.parse(await request(url, { method: 'GET', headers, timeout: searchTimeout }));
              if (res && res.data && res.data.list) {
                results = res.data.list.map(item => ({
                  title: item.title || '未知标题',
                  img: item.image_link || '',
                  year: '未知',
                  desc: `七猫短剧 | ${item.tags} ${item.total_episode_num || 0}集`,
                  url: `七猫@${encodeURIComponent(item.playlet_id)}`
                }));
              }
            } catch (e) {
              log(`七猫搜索失败: ${e.message}`);
            }
            break;
          }
          case '牛牛': {
            try {
              const body = JSON.stringify({
                condition: { name: KEY, typeId: 'S1' },
                pageNum: MY_PAGE,
                pageSize: searchLimit
              });
              const res = JSON.parse(await request(plat.host + plat.search, { method: 'POST', headers: cfg.headers.niuniu, body, timeout: searchTimeout }));
              if (res && res.data && res.data.records) {
                results = res.data.records.map(item => ({
                  title: item.name,
                  img: item.cover,
                  year: '未知',
                  desc: `牛牛短剧 | ${item.totalEpisode || 0}集`,
                  url: `牛牛@${item.id}`
                }));
              }
            } catch (e) {
              log(`牛牛搜索失败: ${e.message}`);
            }
            break;
          }
          case '围观': {
            try {
              const postData = JSON.stringify({
                "audience": "",
                "page": MY_PAGE,
                "pageSize": searchLimit,
                "searchWord": KEY,
                "subject": ""
              });
              const res = JSON.parse(await request(
                `${plat.host}${plat.search}`,
                { method: 'POST', body: postData, timeout: searchTimeout }
              ));
              if (res && res.data && Array.isArray(res.data)) {
                results = res.data.map(it => ({
                  title: it.title || '未知标题',
                  img: it.vertPoster || '',
                  year: it.publishDate ? it.publishDate.toString() : '',
                  desc: `围观短剧 | 集数:${it.episodeCount || 0} 播放:${it.viewCount || 0}`,
                  remarks: it.description || '',
                  url: `围观@${it.oneId || ''}`
                }));
              }
            } catch (e) {
              log(`围观搜索失败: ${e.message}`);
            }
            break;
          }
          case '碎片': {
            try {
              let openId = md5(guid()).substring(0, 16);
              let api = "https://free-api.bighotwind.cc/papaya/papaya-api/oauth2/uuid";
              let body = JSON.stringify({ "openId": openId });
              let key = encHex(Date.now().toString());
              let tokenResponse = JSON.parse(await request(api, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  "key": key
                },
                body: body,
                timeout: searchTimeout
              }));
              
              if (tokenResponse && tokenResponse.data && tokenResponse.data.token) {
                const headers = { ...this.headers, 'Authorization': tokenResponse.data.token };
                const requestUrl = `${plat.host}${plat.search}?type=5&tagId=&pageNum=${MY_PAGE}&pageSize=${searchLimit}&title=${encodeURIComponent(KEY)}`;
                const response = JSON.parse(await request(requestUrl, { headers, timeout: searchTimeout }));
                
                if (response && response.list) {
                  results = response.list.map(it => {
                    let compoundId = (it.itemId || '') + '@' + (it.videoCode || '');
                    return {
                      title: it.title || '未知标题',
                      img: "https://speed.hiknz.com/papaya/papaya-file/files/download/" + (it.imageKey || '') + "/" + (it.imageName || ''),
                      year: it.publishDate ? it.publishDate.toString() : '',
                      desc: `碎片剧场 | 集数:${it.episodesMax || 0} 播放:${it.hitShowNum || 0}`,
                      remarks: it.content || it.description || '',
                      url: `碎片@${compoundId}`
                    };
                  });
                }
              }
            } catch (e) {
              log(`碎片搜索失败: ${e.message}`);
            }
            break;
          }
        }
        return { platform: platform.name, results: results || [] };
      } catch (error) {
        log(`搜索失败（平台：${platform.name}）：${error.message}`);
        return { platform: platform.name, results: [] };
      }
    });

    // 等待所有搜索完成
    const searchResults = await Promise.allSettled(searchPromises);
    
    // 合并结果
    searchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.results && result.value.results.length > 0) {
        d.push(...result.value.results);
      }
    });
    // 搜索过滤：只保留标题中包含关键词的结果
    if (rule.search_match ) {
      const filteredResults = d.filter(item => {
        const title = item.title || '';
        return title.toLowerCase().includes(KEY.toLowerCase());
      });
      console.log(`🔍 搜索过滤: 原始结果 ${d.length} 条，过滤后 ${filteredResults.length} 条`);
      return setResult(filteredResults);
    }
  }
};

// 工具函数
function getRandomItem(items) {
  return items[Math.random() * items.length | 0];
}

// 七猫参数生成
async function getQmParamsAndSign() {
  try {
    const sessionId = Math.floor(Date.now()).toString();
    let data = {
      "static_score": "0.8", 
      "uuid": "00000000-7fc7-08dc-0000-000000000000",
      "device-id": "20250220125449b9b8cac84c2dd3d035c9052a2572f7dd0122edde3cc42a70",
      "mac": "", 
      "sourceuid": "aa7de295aad621a6", 
      "refresh-type": "0", 
      "model": "22021211RC",
      "wlb-imei": "", 
      "client-id": "aa7de295aad621a6", 
      "brand": "Redmi", 
      "oaid": "",
      "oaid-no-cache": "", 
      "sys-ver": "12", 
      "trusted-id": "", 
      "phone-level": "H",
      "imei": "", 
      "wlb-uid": "aa7de295aad621a6", 
      "session-id": sessionId
    };
    const jsonStr = JSON.stringify(data);
    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
    let qmParams = '';
    for (const c of base64Str) qmParams += globalThis.aggConfig.charMap[c] || c;
    
    const paramsStr = `AUTHORIZATION=app-version=10001application-id=com.duoduo.readchannel=unknownis-white=net-env=5platform=androidqm-params=${qmParams}reg=${globalThis.aggConfig.keys}`;
    return { qmParams, sign: await md5(paramsStr) };
  } catch (e) {
    console.error('qm参数生成失败:', e);
    throw e;
  }
}

// 七猫请求头生成
async function getHeaderX() {
  const { qmParams, sign } = await getQmParamsAndSign();
  return {
    'net-env': '5', 'reg': '', 'channel': 'unknown', 'is-white': '', 'platform': 'android',
    'application-id': 'com.duoduo.read', 'authorization': '', 'app-version': '10001',
    'user-agent': 'webviewversion/0', 'qm-params': qmParams, 'sign': sign
  };
}
