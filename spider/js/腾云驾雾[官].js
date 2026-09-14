/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '腾云驾雾[官]',
  '类型': '影视',
  logo: 'https://v.%71%71.com/favicon.ico',
  lang: 'ds'
})
*/

// ─── 腾讯频道列表接口（旧 /x/bu/pagesheet/list 已下线返回 Not Found）───
const MVL_API = 'https://pbaccess.video.qq.com/trpc.multi_vector_layout.mvl_controller.MVLPageHTTPService/getMVLPage?&vversion_platform=2';
const MVL_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Origin': 'https://v.qq.com',
    'Referer': 'https://v.qq.com/'
};
// 分类英文 id → 腾讯频道 channel_id（取自接口 nav_card，短剧 mini_series 走下方专用分支）
const MVL_CHANNELS = {
    movie: '100173',
    tv: '100113',
    cartoon: '100119',
    child: '100150',
    variety: '100109',
    doco: '100105'
};
// 推荐聚合的频道集：各频道「最热」第一页去重（精选分类走 fetchHomeChoice 首页运营位，勿混用）
const MVL_CHOICE_CHANNELS = ['100113', '100173', '100109', '100119'];

// getMVLPage 翻页上下文为前端构造式：n 为已加载屏数(第2屏起传)，offset = n*12
// 实测规律来自 v.qq.com 频道列表页真实流量（page_index 每屏 +1、poster_offset 每次 +12）
function buildMvlPageContext(n) {
    return {
        _ctrl_page_index: String(n),
        _ctrl_showed_module_num: String(n),
        _ds_cli_6970df954e7a9803_poster_offset: String(n * 12),
        _ds_cli_6970df954e7a9803_poster_size: '12',
        _merger_mod_cnt: String(n),
        page_index: String(n),
        sdk_page_ctx: JSON.stringify({page_offset: n, page_size: 5, used_module_num: 1}),
        video_un_page_index: String(n)
    };
}

async function fetchMvl(channelId, filterParams, page) {
    let body = {
        page_params: {
            page_type: 'operation',
            page_id: 'channel_list',
            channel_id: channelId,
            filter_params: filterParams
        }
    };
    if (page > 1) body.page_context = buildMvlPageContext(page - 1);
    let html = await request(MVL_API, {
        body: JSON.stringify(body),
        headers: MVL_HEADERS,
        method: 'POST'
    });
    return JSON.parse(html);
}

function parseMvlCards(json) {
    let d = [];
    let cards = json && json.data && json.data.modules && json.data.modules.normal && json.data.modules.normal.cards || [];
    cards.forEach(function (card) {
        let posters = card && card.children_list && card.children_list.poster_card && card.children_list.poster_card.cards || [];
        posters.forEach(function (it) {
            let p = it.params || {};
            if (p.cid && p.title) {
                d.push({
                    title: p.title,
                    img: p.new_pic_hz || p.new_pic_vt || '',
                    desc: p.timelong || p.sub_title || '',
                    url: 'https://node.video.qq.com/x/api/float_vinfo2?cid=' + p.cid
                });
            }
        });
    });
    return d;
}

// 聚合多个频道第一页（推荐/精选用），按 url 去重
async function fetchMvlAggregate(channelIds) {
    let d = [];
    let seen = {};
    let results = await Promise.all(channelIds.map(function (cid) {
        return fetchMvl(cid, 'sort=75&iarea=0', 1).catch(function (e) {
            log('聚合频道 ' + cid + ' 失败: ' + e.message);
            return null;
        });
    }));
    results.forEach(function (json) {
        if (!json) return;
        parseMvlCards(json).forEach(function (it) {
            if (!seen[it.url]) {
                seen[it.url] = 1;
                d.push(it);
            }
        });
    });
    return d;
}

// 精选：腾讯首页运营位（PageService/getPage，page_id=100101 即 v.qq.com 首页「精选」频道），
// 轮播+货架+视频流混合内容，与推荐的多频道聚合是不同数据源
async function fetchHomeChoice() {
    let requestBody = {
        page_params: {
            page_type: 'channel',
            page_id: '100101',
            scene: 'channel',
            new_mark_label_enabled: '1',
            vl_to_mvl: '',
            ad_exp_ids: '100000',
            skip_privacy_types: '0',
            support_click_scan: '1'
        },
        page_bypass_params: {
            params: {
                platform_id: '2',
                caller_id: '3000010',
                data_mode: 'default',
                user_mode: 'default',
                page_type: 'channel',
                page_id: '100101',
                scene: 'channel',
                new_mark_label_enabled: '1'
            },
            scene: 'channel',
            app_version: ''
        },
        page_context: null
    };
    let html = await request('https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getPage?video_appid=3000010&vversion_platform=2', {
        body: JSON.stringify(requestBody),
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            'Content-Type': 'application/json',
            'Origin': 'https://v.qq.com',
            'Referer': 'https://v.qq.com/'
        },
        method: 'POST'
    });
    let json = JSON.parse(html);
    let d = [];
    let cards = json && json.data && json.data.CardList || [];
    cards.forEach(function (card) {
        let inner = card && card.children_list && card.children_list.list && card.children_list.list.cards || [];
        inner.forEach(function (it) {
            let p = it.params || {};
            if (p.cid && (p.mz_title || p.title)) {
                d.push({
                    title: p.mz_title || p.title,
                    img: p.image_url || p.pic_276x386 || '',
                    desc: p.episode_updated || p.second_title || '',
                    url: 'https://node.video.qq.com/x/api/float_vinfo2?cid=' + p.cid
                });
            }
        });
    });
    return d;
}

var rule = {
    title: '腾云驾雾[官]',
    host: 'https://v.%71%71.com',
    logo: 'https://v.%71%71.com/favicon.ico',
    homeUrl: 'https://pbaccess.video.qq.com/trpc.multi_vector_layout.mvl_controller.MVLPageHTTPService/getMVLPage?&vversion_platform=2',
    detailUrl: 'https://node.video.%71%71.com/x/api/float_vinfo2?cid=fyid',
    searchUrl: 'https://pbaccess.video.%71%71.com/trpc.videosearch.smartboxServer.HttpRountRecall/Smartbox?query=**&appID=3172&appKey=lGhFIPeD3HsO9xEp&pageNum=(fypage-1)&pageSize=10',
    searchable: 2,
    filterable: 1,
    url: '/x/bu/pagesheet/list?_all=1&append=1&channel=fyclass&listpage=1&offset=((fypage-1)*21)&pagesize=21&iarea=-1',
    // 筛选定义取自 getMVLPage 各频道 filter_card 实时 dump（2026-09-11），键值与新接口一致
    filter: {
     "movie": [
      {
       "key": "sort",
       "name": "排序",
       "value": [
        {
         "n": "最热",
         "v": "75"
        },
        {
         "n": "最新",
         "v": "83"
        },
        {
         "n": "高分好评",
         "v": "81"
        }
       ]
      },
      {
       "key": "itype",
       "name": "类型",
       "value": [
        {
         "n": "类型",
         "v": "-1"
        },
        {
         "n": "动作",
         "v": "4"
        },
        {
         "n": "喜剧",
         "v": "3"
        },
        {
         "n": "爱情",
         "v": "5"
        },
        {
         "n": "科幻",
         "v": "12"
        },
        {
         "n": "犯罪",
         "v": "6"
        },
        {
         "n": "冒险",
         "v": "7"
        },
        {
         "n": "恐怖",
         "v": "11"
        },
        {
         "n": "动画",
         "v": "15"
        },
        {
         "n": "战争",
         "v": "8"
        },
        {
         "n": "悬疑",
         "v": "10"
        },
        {
         "n": "灾难",
         "v": "25"
        },
        {
         "n": "青春",
         "v": "26"
        }
       ]
      },
      {
       "key": "ipay",
       "name": "免费/VIP",
       "value": [
        {
         "n": "资费",
         "v": "-1"
        },
        {
         "n": "免费",
         "v": "1"
        },
        {
         "n": "会员",
         "v": "8"
        },
        {
         "n": "付费",
         "v": "4"
        },
        {
         "n": "限免",
         "v": "3300"
        }
       ]
      },
      {
       "key": "iarea",
       "name": "地区",
       "value": [
        {
         "n": "地区",
         "v": "-1"
        },
        {
         "n": "内地",
         "v": "100024"
        },
        {
         "n": "中国香港",
         "v": "100025"
        },
        {
         "n": "中国台湾",
         "v": "100026"
        },
        {
         "n": "美国",
         "v": "100029"
        },
        {
         "n": "日本",
         "v": "100027"
        },
        {
         "n": "韩国",
         "v": "100028"
        },
        {
         "n": "泰国",
         "v": "100031"
        },
        {
         "n": "印度",
         "v": "100030"
        },
        {
         "n": "英国",
         "v": "15"
        },
        {
         "n": "法国",
         "v": "16"
        },
        {
         "n": "德国",
         "v": "17"
        },
        {
         "n": "加拿大",
         "v": "18"
        },
        {
         "n": "西班牙",
         "v": "19"
        },
        {
         "n": "意大利",
         "v": "20"
        },
        {
         "n": "澳大利亚",
         "v": "21"
        },
        {
         "n": "其他",
         "v": "100033"
        }
       ]
      },
      {
       "key": "iyear",
       "name": "年份",
       "value": [
        {
         "n": "年份",
         "v": "-1"
        },
        {
         "n": "即将上线",
         "v": "999"
        },
        {
         "n": "2026",
         "v": "2026"
        },
        {
         "n": "2025",
         "v": "2025"
        },
        {
         "n": "2024",
         "v": "2024"
        },
        {
         "n": "2023",
         "v": "2023"
        },
        {
         "n": "2022",
         "v": "2022"
        },
        {
         "n": "2021",
         "v": "2021"
        },
        {
         "n": "2020",
         "v": "2020"
        },
        {
         "n": "2019",
         "v": "20"
        },
        {
         "n": "2018",
         "v": "2018"
        },
        {
         "n": "2017",
         "v": "1"
        },
        {
         "n": "2016",
         "v": "2"
        },
        {
         "n": "2015",
         "v": "3"
        },
        {
         "n": "2014",
         "v": "4"
        },
        {
         "n": "2013-2011",
         "v": "5"
        },
        {
         "n": "2010-2006",
         "v": "6"
        },
        {
         "n": "2005-2000",
         "v": "7"
        },
        {
         "n": "90年代",
         "v": "8"
        },
        {
         "n": "80年代",
         "v": "9"
        },
        {
         "n": "其他",
         "v": "10"
        }
       ]
      },
      {
       "key": "producer",
       "name": "出品方",
       "value": [
        {
         "n": "出品",
         "v": "-1"
        },
        {
         "n": "腾讯出品",
         "v": "1"
        },
        {
         "n": "索尼",
         "v": "2"
        },
        {
         "n": "派拉蒙",
         "v": "3"
        },
        {
         "n": "迪士尼",
         "v": "4"
        },
        {
         "n": "环球",
         "v": "5"
        },
        {
         "n": "华谊",
         "v": "6"
        },
        {
         "n": "华纳",
         "v": "7"
        },
        {
         "n": "光线",
         "v": "8"
        },
        {
         "n": "BBC",
         "v": "10"
        },
        {
         "n": "20世纪影业",
         "v": "11"
        },
        {
         "n": "开心麻花",
         "v": "12"
        }
       ]
      },
      {
       "key": "characteristic",
       "name": "院线/网络",
       "value": [
        {
         "n": "其他",
         "v": "-1"
        },
        {
         "n": "院线电影",
         "v": "1"
        },
        {
         "n": "网络电影",
         "v": "2"
        },
        {
         "n": "独播",
         "v": "5"
        },
        {
         "n": "原声",
         "v": "8"
        },
        {
         "n": "粤语",
         "v": "9"
        },
        {
         "n": "获奖佳片",
         "v": "6"
        }
       ]
      }
     ],
     "tv": [
      {
       "key": "sort",
       "name": "排序",
       "value": [
        {
         "n": "最热",
         "v": "75"
        },
        {
         "n": "最新上架",
         "v": "79"
        },
        {
         "n": "高分好评",
         "v": "85"
        }
       ]
      },
      {
       "key": "itype",
       "name": "类型",
       "value": [
        {
         "n": "类型",
         "v": "-1"
        },
        {
         "n": "爱情",
         "v": "1"
        },
        {
         "n": "都市",
         "v": "2"
        },
        {
         "n": "青春",
         "v": "3"
        },
        {
         "n": "奇幻",
         "v": "4"
        },
        {
         "n": "武侠",
         "v": "5"
        },
        {
         "n": "古装",
         "v": "6"
        },
        {
         "n": "科幻",
         "v": "7"
        },
        {
         "n": "猎奇",
         "v": "8"
        },
        {
         "n": "竞技",
         "v": "9"
        },
        {
         "n": "传奇",
         "v": "10"
        },
        {
         "n": "逆袭",
         "v": "19"
        },
        {
         "n": "军旅",
         "v": "11"
        },
        {
         "n": "家庭",
         "v": "12"
        },
        {
         "n": "喜剧",
         "v": "13"
        },
        {
         "n": "悬疑",
         "v": "14"
        },
        {
         "n": "权谋",
         "v": "15"
        },
        {
         "n": "革命",
         "v": "16"
        },
        {
         "n": "现实",
         "v": "17"
        },
        {
         "n": "刑侦",
         "v": "18"
        },
        {
         "n": "民国",
         "v": "20"
        },
        {
         "n": "IP改编",
         "v": "21"
        }
       ]
      },
      {
       "key": "ipay",
       "name": "资费",
       "value": [
        {
         "n": "资费",
         "v": "-1"
        },
        {
         "n": "免费",
         "v": "1"
        },
        {
         "n": "限免",
         "v": "2"
        },
        {
         "n": "会员",
         "v": "3"
        }
       ]
      },
      {
       "key": "iarea",
       "name": "地区",
       "value": [
        {
         "n": "地区",
         "v": "-1"
        },
        {
         "n": "内地",
         "v": "0"
        },
        {
         "n": "中国香港",
         "v": "14"
        },
        {
         "n": "中国台湾",
         "v": "4"
        },
        {
         "n": "美国",
         "v": "8"
        },
        {
         "n": "泰国",
         "v": "9"
        },
        {
         "n": "英国",
         "v": "1"
        },
        {
         "n": "韩国",
         "v": "5"
        },
        {
         "n": "日本",
         "v": "10"
        },
        {
         "n": "其他",
         "v": "9999"
        }
       ]
      },
      {
       "key": "iyear",
       "name": "年份",
       "value": [
        {
         "n": "年份",
         "v": "-1"
        },
        {
         "n": "即将上线",
         "v": "1"
        },
        {
         "n": "2026",
         "v": "2026"
        },
        {
         "n": "2025",
         "v": "2025"
        },
        {
         "n": "2024",
         "v": "2"
        },
        {
         "n": "2023",
         "v": "3"
        },
        {
         "n": "2022",
         "v": "4"
        },
        {
         "n": "2021",
         "v": "5"
        },
        {
         "n": "2020-2016",
         "v": "6"
        },
        {
         "n": "2015-2011",
         "v": "7"
        },
        {
         "n": "2010-2000",
         "v": "8"
        },
        {
         "n": "更早",
         "v": "9"
        }
       ]
      },
      {
       "key": "theater",
       "name": "剧场",
       "value": [
        {
         "n": "剧场",
         "v": "-1"
        },
        {
         "n": "X剧场",
         "v": "1"
        },
        {
         "n": "板凳单元",
         "v": "2"
        },
        {
         "n": "萤火单元",
         "v": "3"
        },
        {
         "n": "十分剧场",
         "v": "4"
        }
       ]
      },
      {
       "key": "award",
       "name": "获奖",
       "value": [
        {
         "n": "奖项",
         "v": "-1"
        },
        {
         "n": "白玉兰奖",
         "v": "1"
        },
        {
         "n": "飞天奖",
         "v": "2"
        },
        {
         "n": "金鹰奖",
         "v": "3"
        }
       ]
      }
     ],
     "cartoon": [
      {
       "key": "sort",
       "name": "排序",
       "value": [
        {
         "n": "最热",
         "v": "75"
        },
        {
         "n": "最近更新",
         "v": "23"
        },
        {
         "n": "高分好评",
         "v": "85"
        }
       ]
      },
      {
       "key": "iarea",
       "name": "地区",
       "value": [
        {
         "n": "地区",
         "v": "-1"
        },
        {
         "n": "内地",
         "v": "1"
        },
        {
         "n": "日本",
         "v": "2"
        },
        {
         "n": "欧美",
         "v": "3"
        },
        {
         "n": "其他",
         "v": "4"
        }
       ]
      },
      {
       "key": "ipay",
       "name": "免费/VIP",
       "value": [
        {
         "n": "资费",
         "v": "-1"
        },
        {
         "n": "免费",
         "v": "867"
        },
        {
         "n": "会员",
         "v": "6"
        },
        {
         "n": "限免",
         "v": "3300"
        }
       ]
      },
      {
       "key": "itype",
       "name": "类型",
       "value": [
        {
         "n": "类型",
         "v": "-1"
        },
        {
         "n": "玄幻",
         "v": "9"
        },
        {
         "n": "科幻",
         "v": "4"
        },
        {
         "n": "奇幻",
         "v": "21"
        },
        {
         "n": "武侠",
         "v": "13"
        },
        {
         "n": "仙侠",
         "v": "23"
        },
        {
         "n": "都市",
         "v": "24"
        },
        {
         "n": "恋爱",
         "v": "7"
        },
        {
         "n": "搞笑",
         "v": "1"
        },
        {
         "n": "冒险",
         "v": "2"
        },
        {
         "n": "悬疑",
         "v": "17"
        },
        {
         "n": "竞技",
         "v": "20"
        },
        {
         "n": "日常",
         "v": "15"
        },
        {
         "n": "真人",
         "v": "18"
        },
        {
         "n": "治愈",
         "v": "25"
        },
        {
         "n": "游戏",
         "v": "26"
        },
        {
         "n": "异能",
         "v": "27"
        },
        {
         "n": "历史",
         "v": "19"
        },
        {
         "n": "古风",
         "v": "28"
        },
        {
         "n": "智斗",
         "v": "29"
        },
        {
         "n": "恐怖",
         "v": "30"
        },
        {
         "n": "美食",
         "v": "31"
        },
        {
         "n": "音乐",
         "v": "32"
        },
        {
         "n": "其他",
         "v": "12"
        }
       ]
      },
      {
       "key": "iyear",
       "name": "年份",
       "value": [
        {
         "n": "年份",
         "v": "-1"
        },
        {
         "n": "2026",
         "v": "2026"
        },
        {
         "n": "2025",
         "v": "2025"
        },
        {
         "n": "2024",
         "v": "2024"
        },
        {
         "n": "2023",
         "v": "2023"
        },
        {
         "n": "2022",
         "v": "2022"
        },
        {
         "n": "2021",
         "v": "2021"
        },
        {
         "n": "2020",
         "v": "50"
        },
        {
         "n": "2019",
         "v": "11"
        },
        {
         "n": "2018",
         "v": "2018"
        },
        {
         "n": "2017",
         "v": "2017"
        },
        {
         "n": "2016",
         "v": "1"
        },
        {
         "n": "2015",
         "v": "2"
        },
        {
         "n": "2014",
         "v": "3"
        },
        {
         "n": "2013",
         "v": "4"
        },
        {
         "n": "2012",
         "v": "5"
        },
        {
         "n": "2011",
         "v": "6"
        },
        {
         "n": "00年代",
         "v": "7"
        },
        {
         "n": "90年代",
         "v": "8"
        },
        {
         "n": "80年代",
         "v": "9"
        },
        {
         "n": "更早",
         "v": "10"
        }
       ]
      },
      {
       "key": "anime_status",
       "name": "连载/完结",
       "value": [
        {
         "n": "状态",
         "v": "-1"
        },
        {
         "n": "即将上线",
         "v": "46"
        },
        {
         "n": "更新中",
         "v": "44"
        },
        {
         "n": "已完结",
         "v": "45"
        }
       ]
      },
      {
       "key": "item",
       "name": "3D/2D",
       "value": [
        {
         "n": "画风",
         "v": "1"
        },
        {
         "n": "3D动画",
         "v": "2"
        },
        {
         "n": "2D动画",
         "v": "3"
        },
        {
         "n": "特摄",
         "v": "4"
        },
        {
         "n": "其他",
         "v": "5"
        }
       ]
      }
     ],
     "child": [
      {
       "key": "sort",
       "name": "排序",
       "value": [
        {
         "n": "最热",
         "v": "75"
        },
        {
         "n": "最新",
         "v": "76"
        }
       ]
      },
      {
       "key": "iyear",
       "name": "年龄",
       "value": [
        {
         "n": "年龄",
         "v": "-1"
        },
        {
         "n": "0-3岁",
         "v": "1"
        },
        {
         "n": "4-6岁",
         "v": "2"
        },
        {
         "n": "7-9岁",
         "v": "3"
        },
        {
         "n": "10岁以上",
         "v": "4"
        },
        {
         "n": "全年龄",
         "v": "7"
        }
       ]
      },
      {
       "key": "all",
       "name": "全部",
       "value": [
        {
         "n": "全部",
         "v": "-1"
        },
        {
         "n": "叫早·哄睡",
         "v": "1"
        },
        {
         "n": "入园",
         "v": "9"
        },
        {
         "n": "幼小衔接",
         "v": "18"
        },
        {
         "n": "出行工具",
         "v": "16"
        },
        {
         "n": "恐龙",
         "v": "6"
        },
        {
         "n": "玩具节目",
         "v": "10"
        },
        {
         "n": "安全",
         "v": "12"
        },
        {
         "n": "行为习惯",
         "v": "14"
        },
        {
         "n": "情商教育",
         "v": "17"
        },
        {
         "n": "儿歌·童谣",
         "v": "2"
        },
        {
         "n": "绘本·故事",
         "v": "3"
        },
        {
         "n": "颜色",
         "v": "4"
        },
        {
         "n": "汽车",
         "v": "5"
        },
        {
         "n": "百科",
         "v": "13"
        },
        {
         "n": "早教",
         "v": "7"
        },
        {
         "n": "德智体",
         "v": "19"
        },
        {
         "n": "动画",
         "v": "20"
        },
        {
         "n": "真人剧",
         "v": "21"
        },
        {
         "n": "童年记忆",
         "v": "22"
        },
        {
         "n": "科普",
         "v": "23"
        },
        {
         "n": "英语",
         "v": "15"
        },
        {
         "n": "创意玩耍",
         "v": "8"
        },
        {
         "n": "国学",
         "v": "11"
        },
        {
         "n": "搞笑",
         "v": "25"
        },
        {
         "n": "优质���作",
         "v": "26"
        },
        {
         "n": "学科内容",
         "v": "24"
        }
       ]
      },
      {
       "key": "ipay",
       "name": "免费/VIP",
       "value": [
        {
         "n": "资费",
         "v": "-1"
        },
        {
         "n": "免费",
         "v": "1"
        },
        {
         "n": "会员",
         "v": "2"
        }
       ]
      },
      {
       "key": "itype",
       "name": "类型",
       "value": [
        {
         "n": "类型",
         "v": "-1"
        },
        {
         "n": "磨耳朵",
         "v": "22"
        },
        {
         "n": "涨知识",
         "v": "23"
        },
        {
         "n": "冒险",
         "v": "10"
        },
        {
         "n": "儿歌",
         "v": "1"
        },
        {
         "n": "交通工具",
         "v": "11"
        },
        {
         "n": "益智早教",
         "v": "2"
        },
        {
         "n": "玩具",
         "v": "4"
        },
        {
         "n": "魔幻·科幻",
         "v": "12"
        },
        {
         "n": "动物",
         "v": "13"
        },
        {
         "n": "真人·特摄",
         "v": "14"
        },
        {
         "n": "家长甄选",
         "v": "17"
        },
        {
         "n": "动画电影",
         "v": "20"
        }
       ]
      },
      {
       "key": "gender",
       "name": "性别",
       "value": [
        {
         "n": "性别",
         "v": "-1"
        },
        {
         "n": "女孩",
         "v": "1"
        },
        {
         "n": "男孩",
         "v": "2"
        }
       ]
      },
      {
       "key": "language",
       "name": "语言",
       "value": [
        {
         "n": "语言",
         "v": "-1"
        },
        {
         "n": "普通话版",
         "v": "3"
        },
        {
         "n": "英文版",
         "v": "1"
        }
       ]
      },
      {
       "key": "child_ip",
       "name": "动画明星",
       "value": [
        {
         "n": "动画明星",
         "v": "-1"
        },
        {
         "n": "小猪佩奇",
         "v": "1"
        },
        {
         "n": "汪汪队",
         "v": "2"
        },
        {
         "n": "猪猪侠",
         "v": "3"
        },
        {
         "n": "喜羊羊",
         "v": "4"
        },
        {
         "n": "乐迪",
         "v": "5"
        },
        {
         "n": "米小圈",
         "v": "6"
        },
        {
         "n": "米奇",
         "v": "14"
        },
        {
         "n": "舒克贝塔",
         "v": "7"
        },
        {
         "n": "猫和老鼠",
         "v": "8"
        },
        {
         "n": "海绵宝宝",
         "v": "9"
        },
        {
         "n": "芭比",
         "v": "10"
        },
        {
         "n": "叶罗丽",
         "v": "11"
        },
        {
         "n": "开心超人",
         "v": "12"
        },
        {
         "n": "小马宝莉",
         "v": "13"
        }
       ]
      }
     ],
     "variety": [
      {
       "key": "sort",
       "name": "排序",
       "value": [
        {
         "n": "最热",
         "v": "75"
        },
        {
         "n": "最近更新",
         "v": "23"
        },
        {
         "n": "高分好评",
         "v": "85"
        }
       ]
      },
      {
       "key": "itype",
       "name": "类型",
       "value": [
        {
         "n": "类型",
         "v": "-1"
        },
        {
         "n": "游戏",
         "v": "10"
        },
        {
         "n": "脱口秀",
         "v": "2"
        },
        {
         "n": "音乐舞台",
         "v": "11"
        },
        {
         "n": "情感",
         "v": "12"
        },
        {
         "n": "生活",
         "v": "22"
        },
        {
         "n": "职场",
         "v": "20"
        },
        {
         "n": "喜剧",
         "v": "14"
        },
        {
         "n": "美食",
         "v": "19"
        },
        {
         "n": "潮流运动",
         "v": "21"
        },
        {
         "n": "竞技",
         "v": "24"
        },
        {
         "n": "影视",
         "v": "16"
        },
        {
         "n": "电竞",
         "v": "15"
        },
        {
         "n": "推理",
         "v": "25"
        },
        {
         "n": "访谈",
         "v": "3"
        },
        {
         "n": "亲子",
         "v": "17"
        },
        {
         "n": "文化",
         "v": "26"
        },
        {
         "n": "互动",
         "v": "23"
        },
        {
         "n": "晚会",
         "v": "6"
        },
        {
         "n": "资讯",
         "v": "7"
        }
       ]
      },
      {
       "key": "ipay",
       "name": "资费",
       "value": [
        {
         "n": "资费",
         "v": "-1"
        },
        {
         "n": "免费",
         "v": "1"
        },
        {
         "n": "会员",
         "v": "6"
        }
       ]
      },
      {
       "key": "exclusive",
       "name": "自制/独播",
       "value": [
        {
         "n": "出品",
         "v": "-1"
        },
        {
         "n": "腾讯自制",
         "v": "1"
        },
        {
         "n": "独播",
         "v": "2"
        }
       ]
      },
      {
       "key": "iarea",
       "name": "地区",
       "value": [
        {
         "n": "地区",
         "v": "-1"
        },
        {
         "n": "国内",
         "v": "1"
        },
        {
         "n": "海外",
         "v": "2"
        }
       ]
      },
      {
       "key": "iyear",
       "name": "年份",
       "value": [
        {
         "n": "年份",
         "v": "-1"
        },
        {
         "n": "2026",
         "v": "2026"
        },
        {
         "n": "2025",
         "v": "2025"
        },
        {
         "n": "2024",
         "v": "2024"
        },
        {
         "n": "2023",
         "v": "2023"
        },
        {
         "n": "2022",
         "v": "2022"
        },
        {
         "n": "2021",
         "v": "2021"
        },
        {
         "n": "2020",
         "v": "50"
        },
        {
         "n": "2019",
         "v": "7"
        },
        {
         "n": "2018",
         "v": "1"
        },
        {
         "n": "2017",
         "v": "2"
        },
        {
         "n": "2016",
         "v": "3"
        },
        {
         "n": "2015",
         "v": "4"
        },
        {
         "n": "2014",
         "v": "5"
        },
        {
         "n": "2013",
         "v": "6"
        },
        {
         "n": "2012",
         "v": "2012"
        },
        {
         "n": "2011",
         "v": "2011"
        },
        {
         "n": "2010",
         "v": "2010"
        },
        {
         "n": "更早",
         "v": "99"
        }
       ]
      }
     ],
     "doco": [
      {
       "key": "sort",
       "name": "排序",
       "value": [
        {
         "n": "最热",
         "v": "75"
        },
        {
         "n": "最新",
         "v": "74"
        },
        {
         "n": "高分好评",
         "v": "85"
        }
       ]
      },
      {
       "key": "itrailer",
       "name": "出品机构",
       "value": [
        {
         "n": "出品",
         "v": "-1"
        },
        {
         "n": "腾讯出品",
         "v": "15"
        },
        {
         "n": "央视",
         "v": "8"
        },
        {
         "n": "BBC",
         "v": "1"
        },
        {
         "n": "国家地理",
         "v": "4"
        },
        {
         "n": "探索频道",
         "v": "3174"
        },
        {
         "n": "HBO",
         "v": "3175"
        },
        {
         "n": "NHK",
         "v": "2"
        },
        {
         "n": "ITV",
         "v": "3530"
        },
        {
         "n": "历史频道",
         "v": "7"
        }
       ]
      },
      {
       "key": "itype",
       "name": "分类",
       "value": [
        {
         "n": "类型",
         "v": "-1"
        },
        {
         "n": "自然",
         "v": "4"
        },
        {
         "n": "美食",
         "v": "10"
        },
        {
         "n": "社会",
         "v": "3"
        },
        {
         "n": "人文",
         "v": "6"
        },
        {
         "n": "历史",
         "v": "1"
        },
        {
         "n": "军事",
         "v": "2"
        },
        {
         "n": "科技",
         "v": "8"
        },
        {
         "n": "财经",
         "v": "14"
        },
        {
         "n": "探险",
         "v": "15"
        },
        {
         "n": "罪案",
         "v": "7"
        },
        {
         "n": "竞技",
         "v": "12"
        },
        {
         "n": "旅游",
         "v": "11"
        }
       ]
      },
      {
       "key": "iregion",
       "name": "地区",
       "value": [
        {
         "n": "地区",
         "v": "0"
        },
        {
         "n": "国内",
         "v": "1"
        },
        {
         "n": "国外",
         "v": "2"
        }
       ]
      },
      {
       "key": "pay",
       "name": "资费",
       "value": [
        {
         "n": "资费",
         "v": "-1"
        },
        {
         "n": "免费",
         "v": "1"
        },
        {
         "n": "会员",
         "v": "2"
        },
        {
         "n": "限免",
         "v": "3"
        }
       ]
      },
      {
       "key": "iyear",
       "name": "年份",
       "value": [
        {
         "n": "年份",
         "v": "-1"
        },
        {
         "n": "2026",
         "v": "2026"
        },
        {
         "n": "2025",
         "v": "2025"
        },
        {
         "n": "2024",
         "v": "1"
        },
        {
         "n": "2023",
         "v": "2"
        },
        {
         "n": "2022",
         "v": "3"
        },
        {
         "n": "2021",
         "v": "4"
        },
        {
         "n": "2020",
         "v": "5"
        },
        {
         "n": "2019-2015",
         "v": "6"
        },
        {
         "n": "2014-2010",
         "v": "7"
        },
        {
         "n": "2009-2005",
         "v": "8"
        },
        {
         "n": "更早",
         "v": "9"
        }
       ]
      }
     ]
    },
    headers: {
        'User-Agent': 'PC_UA'
    },
    timeout: 5000,
    cate_exclude: '会员|游戏|全部',
    class_name: '精选&电影&电视剧&动漫&少儿&综艺&短剧&纪录片',
    class_url: 'choice&movie&tv&cartoon&child&variety&mini_series&doco',
    limit: 20,
    play_parse: true,
    推荐: async function () {
        let d = await fetchMvlAggregate(MVL_CHOICE_CHANNELS);
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd, MY_CATE, MY_PAGE, MY_FL} = this;
        let d = [];

        // 短剧特殊处理
        if (MY_CATE === 'mini_series') {
            let apiUrl = 'https://pbaccess.video.qq.com/trpc.vector_layout.page_view.PageService/getPage?video_appid=3000010&vversion_platform=2';
            let fl = MY_FL || {};
            let filterParts = [];
            if (fl.prefer) filterParts.push('prefer=' + fl.prefer);
            if (fl.identity) filterParts.push('identity=' + fl.identity);
            if (fl.attraction) filterParts.push('attraction=' + fl.attraction);
            if (fl.story) filterParts.push('story=' + fl.story);
            let filterValue = filterParts.length > 0 ? filterParts.join('&') : 'sort=75';

            let pageContext = null;
            let cacheKey = 'mini_series_ctx_' + filterValue;

            if (MY_PAGE > 1) {
                try {
                    let cachedContext = typeof storage0 !== 'undefined' ? storage0.getItem(cacheKey) : '';
                    if (cachedContext) {
                        let contextObj = JSON.parse(cachedContext);
                        if (contextObj.page === MY_PAGE - 1 && contextObj.nextContext) {
                            pageContext = contextObj.nextContext;
                        } else if (MY_PAGE === 1) {
                            pageContext = null;
                        }
                    }
                } catch (e) {
                    log('读取缓存失败: ' + e.message);
                }
            } else {
                try {
                    if (typeof storage0 !== 'undefined') storage0.setItem(cacheKey, '');
                } catch (e) {}
            }

            let requestBody = {
                "page_params": {
                    "page_type": "channel",
                    "page_id": "120188",
                    "scene": "channel",
                    "new_mark_label_enabled": "1",
                    "vl_to_mvl": "1",
                    "free_watch_trans_info": "{\"ad_frequency_control_time_list\":{}}",
                    "ad_exp_ids": "100000",
                    "skip_privacy_types": "0",
                    "support_click_scan": "1"
                },
                "page_bypass_params": {
                    "params": {
                        "platform_id": "2",
                        "caller_id": "3000010",
                        "data_mode": "default",
                        "user_mode": "default",
                        "page_type": "channel",
                        "page_id": "120188",
                        "scene": "channel",
                        "new_mark_label_enabled": "1"
                    },
                    "scene": "channel",
                    "app_version": ""
                },
                "page_context": pageContext
            };

            if (filterParts.length > 0) {
                requestBody.page_bypass_params.params.filter_value = filterValue;
            }

            try {
                let html = await request(apiUrl, {
                    body: JSON.stringify(requestBody),
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                        'Content-Type': 'application/json',
                        'Origin': 'https://v.qq.com',
                        'Referer': 'https://v.qq.com/channel/mini_series'
                    },
                    method: 'POST'
                });

                let json = JSON.parse(html);
                if (json.ret === 0 && json.data && json.data.CardList) {
                    if (json.data.has_next_page && json.data.page_context) {
                        try {
                            if (typeof storage0 !== 'undefined') {
                                storage0.setItem(cacheKey, JSON.stringify({
                                    page: MY_PAGE,
                                    nextContext: json.data.page_context
                                }));
                            }
                        } catch (e) {
                            log('保存缓存失败: ' + e.message);
                        }
                    }

                    json.data.CardList.forEach(function(card) {
                        if (card.type === 'pc_hot_filter') return;
                        if (card.type === '_eco_video_staggered' && card.children_list && card.children_list.card_list) {
                            let cards = card.children_list.card_list.cards || [];
                            cards.forEach(function(item) {
                                if (item.type === '_eco_video_staggered_drama_item' && item.params) {
                                    let params = item.params;
                                    let cid = params.cid || '';
                                    let posterInfo = {};
                                    let markInfo = {};
                                    try { posterInfo = JSON.parse(params.poster || '{}'); } catch (e) {}
                                    try { markInfo = JSON.parse(params.mark_label_list || '{}'); } catch (e) {}
                                    let title = posterInfo.title || '';
                                    let img = posterInfo.image_url || '';
                                    let remarks = '';
                                    if (markInfo.mark_label_list && markInfo.mark_label_list.length > 0) {
                                        remarks = markInfo.mark_label_list[0].prime_text || '';
                                    }

                                    if (cid && title) {
                                        d.push({
                                            title: title,
                                            pic_url: img,
                                            desc: remarks,
                                            url: 'https://node.video.qq.com/x/api/float_vinfo2?cid=' + cid
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                log('短剧请求失败: ' + e.message);
            }
        } else {
            // 普通分类：getMVLPage 频道列表接口（旧 pagesheet/list 已下线）
            // 筛选键映射：旧 filter 的 type/feature/area → 新接口 itype/ifeature/iarea；
            // ifeature/year 新接口已不识别（实测被忽略），只传有效键
            let channelId = MVL_CHANNELS[MY_CATE];
            if (channelId) {
                let fl = MY_FL || {};
                let filterParts = [];
                // rule.filter 的 key 即接口 filter_key（sort/itype/ipay/iarea/...），直接透传；-1 表示「全部」不传
                Object.keys(fl).forEach(function (k) {
                    let v = fl[k];
                    if (v && v !== '-1') filterParts.push(k + '=' + v);
                });
                let json = await fetchMvl(channelId, filterParts.join('&') || 'sort=75&iarea=0', MY_PAGE);
                d = parseMvlCards(json);
            } else {
                // 精选：腾讯首页运营位内容（与推荐的频道聚合是不同数据源）
                d = await fetchHomeChoice();
            }
        }
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfh, pd, fetch_params} = this;
        let d = [];
        let VOD = {};
        let video_list = [];
        let video_lists = [];
        let list = [];
        let QZOutputJson;
        let html = await request(input);
        let sourceId = /get_playsource/.test(input) ? input.match(/id=(\d*?)&/)[1] : input.split("cid=")[1];
        let cid = sourceId;
        let detailUrl = "https://v.%71%71.com/detail/m/" + cid + ".html";
        log("详情页:" + detailUrl);
        try {
            let json = JSON.parse(html);
            VOD = {
                vod_url: input,
                vod_name: json.c.title,
                type_name: json.typ.join(","),
                vod_actor: json.nam.join(","),
                vod_year: json.c.year,
                vod_content: json.c.description,
                vod_remarks: json.rec,
                vod_pic: urljoin(input, json.c.pic)
            }
        } catch (e) {
            log("解析片名海报等基础信息发生错误:" + e.message)
        }
        if (/get_playsource/.test(input)) {
            eval(html);
            let indexList = QZOutputJson.PlaylistItem.indexList;
            for (const it of indexList) {
                let dataUrl = "https://s.video.qq.com/get_playsource?id=" + sourceId + "&plat=2&type=4&data_type=3&range=" + it + "&video_type=10&plname=qq&otype=json";
                eval(await fetch(dataUrl, fetch_params));
                let vdata = QZOutputJson.PlaylistItem.videoPlayList;
                vdata.forEach(function (item) {
                    d.push({
                        title: item.title,
                        pic_url: item.pic,
                        desc: item.episode_number + "\t\t\t播放量：" + item.thirdLine,
                        url: item.playUrl
                    })
                });
                video_lists = video_lists.concat(vdata)
            }
        } else {
            let json = JSON.parse(html);
            video_lists = json.c.video_ids;
            let url = "https://v.qq.com/x/cover/" + sourceId + ".html";
            if (video_lists.length === 1) {
                let vid = video_lists[0];
                url = "https://v.qq.com/x/cover/" + cid + "/" + vid + ".html";
                d.push({
                    title: "在线播放",
                    url: url
                })
            } else if (video_lists.length > 1) {
                for (let i = 0; i < video_lists.length; i += 30) {
                    video_list.push(video_lists.slice(i, i + 30))
                }
                let t1 = (new Date()).getTime();
                let reqUrls = video_list.map(it => {
                    let o_url = "https://union.video.qq.com/fcgi-bin/data?otype=json&tid=1804&appid=20001238&appkey=6c03bbe9658448a4&union_platform=1&idlist=" + it.join(",");
                    return {
                        url: o_url,
                        options: {
                            timeout: rule.timeout,
                            headers: rule.headers
                        }
                    }
                });
                let htmls = await batchFetch(reqUrls);
                let t2 = (new Date()).getTime();
                log(`批量请求二级 ${detailUrl} 耗时${t2 - t1}毫秒:`);
                htmls.forEach((ht) => {
                    if (ht) {
                        eval(ht);
                        QZOutputJson.results.forEach(function (it1) {
                            it1 = it1.fields;
                            let url = "https://v.qq.com/x/cover/" + cid + "/" + it1.vid + ".html";
                            d.push({
                                title: it1.title,
                                pic_url: it1.pic160x90.replace("/160", ""),
                                desc: it1.video_checkup_time,
                                url: url,
                                type: it1.category_map && it1.category_map.length > 1 ? it1.category_map[1] : ""
                            })
                        })
                    }
                });
            }
        }
        
        // 修正分类逻辑：使用关键词判断是否为预告/花絮
        let ygKeywords = ["预告", "花絮", "片花", "特辑", "幕后", "采访", "制作", "MV", "主题曲"];
        let yg = d.filter(function(it) {
            return it.type && ygKeywords.some(keyword => it.type.includes(keyword));
        });
        let zp = d.filter(function(it) {
            return !(it.type && ygKeywords.some(keyword => it.type.includes(keyword)));
        });

        // 构造播放线路
        let playFrom = [];
        let playUrl = [];
        
        if (zp.length > 0) {
            playFrom.push("qq");
            playUrl.push(zp.map(it => it.title + "$" + it.url).join("#"));
        }

        if (yg.length > 0) {
            playFrom.push("qq 预告及花絮");
            playUrl.push(yg.map(it => it.title + "$" + it.url).join("#"));
        }

        VOD.vod_play_from = playFrom.join("$$$");
        VOD.vod_play_url = playUrl.join("$$$");
        return VOD
    },

    搜索: async function () {
        let {input} = this;
        let d = [];
        let html = await request(input);
        let json = JSON.parse(html);
        if (json.data.smartboxItemList.length > 0) {
            for (const vod of json.data.smartboxItemList.filter(it => it.basicDoc && it.basicDoc.id)) {
                let cid = vod.basicDoc.id;
                let title = vod.basicDoc.title;
                let url = 'https://node.video.qq.com/x/api/float_vinfo2?cid=' + cid;
                if (vod.videoInfo && vod.videoInfo.imgUrl) {
                    d.push({
                        title: title,
                        img: vod.videoInfo.imgUrl,
                        url: url,
                        content: '',
                        desc: vod.videoInfo.typeName || ''
                    });
                } else {
                    let html1 = await request(url);
                    let data = JSON.parse(html1);
                    d.push({
                        title: data.c.title,
                        img: data.c.pic,
                        url: url,
                        content: data.c.description,
                        desc: data.rec
                    });
                }
            }
        }
        return setResult(d);
    },
    lazy: async function () {
        let {input} = this;
        return {jx: 1, url: input}
    }
}
