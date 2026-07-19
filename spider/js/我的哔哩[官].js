/**
 * 已知问题：
 * [推荐]页面：'雷电模拟器'播放部份影片会出错，'播放器'改成'ijk' & '解码方式'改成'软解'，即可正常播放
 * 影视TV 超連結跳轉支持
 * 影视TV 弹幕支持
 * https://t.me/fongmi_offical/
 * https://github.com/FongMi/Release/tree/main/apk
 * 皮皮虾DMBox 弹幕支持
 * 设置 > 窗口预览 > 开启
 * https://t.me/pipixiawerun
 * vod_area:'bilidanmu'
 * Cookie设置
 * Cookie获取方法 https://ghproxy.net/https://raw.githubusercontent.com/UndCover/PyramidStore/main/list.md
 * Cookie设置方法1: DR-PY 后台管理界面
 * CMS后台管理 > 设置中心 > 环境变量 > {"bili_cookie":"XXXXXXX","vmid":"XXXXXX"} > 保存
 * Cookie设置方法2: 手动替换Cookie
 * 底下代码 headers的
 * "Cookie":"$bili_cookie"
 * 手动替换为
 * "Cookie":"将获取的Cookie黏贴在这"
 * 客户端长期Cookie设置教程:
 * 抓包哔哩手机端搜索access_key,取任意链接里的access_key和appkey在drpy环境变量中增加同名的环境变量即可
 * 此时哔哩.js这个解析可用于此源的解析线路用
 * 传参 ?render=1&type=url&params=../json/哔哩教育.json@哔哩教育[官]
 * 传参 ?render=1&type=url&params=../json/哔哩大全.json@哔哩大全[官]
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 0,
  title: '我的哔哩[官]',
  lang: 'ds'
})
*/var rule = {
    title: '我的哔哩[官]',
    host: 'https://api.bilibili.com',
    homeUrl: '/x/web-interface/ranking/v2?rid=0&type=origin',
    url: '/x/web-interface/search/type?search_type=video&fyfilter',
    filter_url: 'keyword=fyclass{{fl.tid}}&page=fypage&duration={{fl.duration}}&order={{fl.order}}',
    class_parse: async function () {
        // let html = request('{{host}}/files/json/哔哩教育.json');
        let html = await request(rule.params);
        let json = dealJson(html);
        let classes = json.classes;
        let filters = json.filter;
        return {
            class: classes,
            filters,
        }
    },
    filterable: 1,
    detailUrl: '/x/web-interface/view/detail?aid=fyid',
    searchUrl: '/x/web-interface/search/type?search_type=video&keyword=**&page=fypage',
    searchable: 2,
    quickSearch: 0,
    // params: '?render=1&type=url&params=../json/哔哩教育.json@哔哩教育[官]',
    // params: '?render=1&type=url&params=../json/哔哩大全.json@哔哩大全[官]',
    headers: {
        "User-Agent": "PC_UA",
        "Referer": "https://www.bilibili.com",
        "Cookie": "buvid3=666"
    },
    timeout: 5000,
    limit: 8,
    play_parse: true,
    double: false,
    lazy: async function () {
        let {input} = this;
        let ids = input.split('_');
        let dan = 'https://api.bilibili.com/x/v1/dm/list.so?oid=' + ids[1];
        let result = {};
        let iurl = 'https://api.bilibili.com:443/x/player/playurl?avid=' + ids[0] + '&cid=' + ids[1] + '&qn=116';
        let html = await request(iurl);
        let jRoot = JSON.parse(html);
        let jo = jRoot.data;
        let ja = jo.durl;
        let maxSize = -1;
        let position = -1;
        ja.forEach(function (tmpJo, i) {
            if (maxSize < Number(tmpJo.size)) {
                maxSize = Number(tmpJo.size);
                position = i
            }
        });
        let purl = '';
        if (ja.length > 0) {
            if (position === -1) {
                position = 0
            }
            purl = ja[position].url
        }
        result.parse = 0;
        result.playUrl = '';
        result.url = unescape(purl);
        result.header = {
            'Referer': 'https://live.bilibili.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36'
        };
        if (/\\.flv/.test(purl)) {
            result.contentType = 'video/x-flv';
        } else {
            result.contentType = '';
        }
        result.danmaku = dan;
        return result
    },
    推荐: async function () {
        let {input} = this;
        let html = await request(input);
        let vodList = JSON.parse(html).data.list;
        let videos = [];
        vodList.forEach(function (vod) {
            let aid = vod.aid;
            let title = misc.stripHtmlTag(vod.title);
            let img = vod.pic;
            if (img.startsWith('//')) {
                img = 'https:' + img;
            }
            let remark = turnDHM(vod.duration) + ' ▶' + ConvertNum(vod.stat.view) + ' 🆙' + vod.owner.name;
            videos.push({
                vod_id: aid,
                vod_name: title,
                vod_pic: img,
                vod_remarks: remark
            })
        });
        return videos;
    },
    一级: async function () {
        let {input, MY_CATE, MY_PAGE} = this;
        if (MY_CATE.endsWith('_clicklink')) {
            MY_CATE = MY_CATE.split('_')[0];
            input = rule.host + '/x/web-interface/search/type?search_type=video&keyword=' + MY_CATE + '&page=' + MY_PAGE;
        }
        let data = [];
        let vodList = [];
        if (MY_CATE === '推荐') {
            input = rule.host + '/x/web-interface/index/top/rcmd?ps=14&fresh_idx=' + MY_PAGE + '&fresh_idx_1h=' + MY_PAGE;
            data = JSON.parse(await request(input)).data;
            vodList = data.item;
        } else if (MY_CATE === '历史记录') {
            input = rule.host + '/x/v2/history?pn=' + MY_PAGE;
            data = JSON.parse(await request(input)).data;
            vodList = data;
        } else {
            data = JSON.parse(await request(input)).data;
            vodList = data.result;
        }
        let videos = [];
        vodList.forEach(function (vod) {
            let aid = vod.aid ? vod.aid : vod.id;
            let title = misc.stripHtmlTag(vod.title);
            let img = vod.pic;
            if (img.startsWith('//')) {
                img = 'https:' + img;
            }
            let play = '';
            let danmaku = '';
            if (MY_CATE === '推荐') {
                play = ConvertNum(vod.stat.view);
                danmaku = vod.stat.danmaku;
            } else if (MY_CATE === '历史记录') {
                play = ConvertNum(vod.stat.view);
                danmaku = vod.stat.danmaku;
            } else {
                play = ConvertNum(vod.play);
                danmaku = vod.video_review;
            }
            let remark = turnDHM(vod.duration) + ' ▶' + play + ' 💬' + danmaku;
            videos.push({
                vod_id: aid,
                vod_name: title,
                vod_pic: img,
                vod_remarks: remark
            })
        });
        return videos
    },
    二级: async function () {
        let {input} = this;
        let html = await request(input);
        let jo = JSON.parse(html).data.View;
        // 历史记录
        let cookies = rule.headers.Cookie.split(';');
        let bili_jct = '';
        cookies.forEach(cookie => {
            if (cookie.includes('bili_jct')) {
                bili_jct = cookie.split('=')[1];
            }
        });
        if (bili_jct !== '') {
            let historyReport = 'https://api.bilibili.com/x/v2/history/report';
            let dataPost = {
                aid: jo.aid,
                cid: jo.cid,
                csrf: bili_jct,
            };
            await post(historyReport, dataPost, 'form');
        }

        let stat = jo.stat;
        let up_info = JSON.parse(html).data.Card;
        let relation = up_info.following ? '已关注' : '未关注';
        let aid = jo.aid;
        let title = misc.stripHtmlTag(jo.title);
        let pic = jo.pic;
        let desc = jo.desc;

        let date = new Date(jo.pubdate * 1000);
        let yy = date.getFullYear().toString();
        let mm = date.getMonth() + 1;
        mm = mm < 10 ? ('0' + mm) : mm;
        let dd = date.getDate();
        dd = dd < 10 ? ('0' + dd) : dd;

        let up_name = jo.owner.name;
        let typeName = jo.tname;
        // let remark = jo.duration;
        let vod = {
            vod_id: aid,
            vod_name: title,
            vod_pic: pic,
            type_name: typeName,
            vod_year: yy + mm + dd,
            vod_area: 'bilidanmu',
            // vod_remarks: remark,
            vod_tags: 'mv',
            // vod_director: '🆙 ' + up_name + '　👥 ' + up_info.follower + '　' + relation,
            vod_director: '🆙 ' + '[a=cr:' + JSON.stringify({
                'id': up_name + '_clicklink',
                'name': up_name
            }) + '/]' + up_name + '[/a]' + '　👥 ' + up_info.follower + '　' + relation,
            vod_actor: '▶' + stat.view + '　' + '💬' + stat.danmaku + '　' + '👍' + stat.like + '　' + '💰' + stat.coin + '　' + '⭐' + stat.favorite,
            vod_content: desc
        };
        let ja = jo.pages;
        let treeMap = {};
        let playurls = [];
        ja.forEach(function (tmpJo) {
            let cid = tmpJo.cid;
            let part = tmpJo.part.replaceAll('#', '﹟').replaceAll('$', '﹩');
            playurls.push(
                part + '$' + aid + '_' + cid
            )
        });
        treeMap['B站'] = playurls.join('#');
        let relatedData = JSON.parse(html).data.Related;
        playurls = [];
        relatedData.forEach(function (rd) {
            let ccid = rd.cid;
            let title = rd.title.replaceAll('#', '﹟').replaceAll('$', '﹩');
            let aaid = rd.aid;
            playurls.push(
                title + '$' + aaid + '_' + ccid
            )
        });
        treeMap['相关推荐'] = playurls.join('#');
        vod.vod_play_from = Object.keys(treeMap).join("$$$");
        vod.vod_play_url = Object.values(treeMap).join("$$$");
        return vod;
    },
    搜索: async function () {
        let {input} = this;
        let html = await request(input);
        let videos = [];
        let vodList = JSON.parse(html).data.result;
        vodList.forEach(function (vod) {
            let aid = vod.aid;
            let title = misc.stripHtmlTag(vod.title);
            let img = vod.pic;
            if (img.startsWith('//')) {
                img = 'https:' + img;
            }
            let remark = turnDHM(vod.duration);
            videos.push({
                vod_id: aid,
                vod_name: title,
                vod_pic: img,
                vod_remarks: remark
            })
        });
        return videos;
    },
}


function turnDHM(duration) {
    let min = '';
    let sec = '';
    try {
        min = duration.split(':')[0];
        sec = duration.split(':')[1];
    } catch (e) {
        min = Math.floor(duration / 60);
        sec = duration % 60;
    }
    if (isNaN(parseInt(duration))) {
        return '无效输入';
    }
    if (min == 0) {
        return sec + '秒'
    } else if (0 < min && min < 60) {
        return min + '分'
    } else if (60 <= min && min < 1440) {
        if (min % 60 == 0) {
            let h = min / 60;
            return h + '小时'
        } else {
            let h = min / 60;
            h = (h + '').split('.')[0];
            let m = min % 60;
            return h + '小时' + m + '分';
        }
    } else if (min >= 1440) {
        let d = min / 60 / 24;
        d = (d + '').split('.')[0];
        let h = min / 60 % 24;
        h = (h + '').split('.')[0];
        let m = min % 60;
        let dhm = '';
        if (d > 0) {
            dhm = d + '天'
        }
        if (h >= 1) {
            dhm = dhm + h + '小时'
        }
        if (m > 0) {
            dhm = dhm + m + '分'
        }
        return dhm
    }
    return null
}

function ConvertNum(num) {
    let _ws = Math.pow(10, 1);
    let _b = 1e4;
    if (num < _b) {
        return num.toString();
    }
    let _r = '';
    let _strArg = ['', '万', '亿', '万亿'];
    let _i = Math.floor(Math.log(num) / Math.log(_b));
    if (_i > 3) {
        _i = 3;
    }
    _r = Math.floor(num / Math.pow(_b, _i) * _ws) / _ws + _strArg[_i];
    return _r;
}
