/**
 * 影视TV 弹幕支持
 * https://t.me/fongmi_offical/
 * https://github.com/FongMi/Release/tree/main/apk
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
 * B站DASH线路: 走 /pgc/player/web/v2/playurl + wbi签名(参考PiliPlus), 返回动态MPD由壳子EXO合流播放
 * 清晰度由账号权限决定: 游客=试看档(自动带try_look=1), 普通cookie=1080P, 大会员=4K
 @header({
  searchable: 1,
  filterable: 1,
  quickSearch: 0,
  title: '哔哩影视[官]',
  logo: 'https://img01.sogoucdn.com/v2/thumb/retype_exclude_gif/ext/auto/q/79/crop/xy/ai/w/128/h/128/resize/w/128?url=http%3A%2F%2Fpp.myapp.com%2Fma_icon%2F0%2Ficon_73622_1691575154%2F256&appid=201003&sign=c1faea8b5ba7bc3357e154fd1c83df32',
  lang: 'ds'
  })
 */

// ===== B站DASH 线路：V2 接口 + wbi 签名 + try_look（参考 PiliPlus lib/http/video.dart）=====
// 清晰度上限由账号权限决定：游客=试看档，普通 cookie=1080P(qn80)，大会员=1080P60/4K
const DASH_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DASH_API = 'https://api.bilibili.com/pgc/player/web/v2/playurl';
const DASH_HEADERS = {'User-Agent': DASH_UA, 'Referer': 'https://www.bilibili.com'};
// wbi 置换表（bilibili-API-collect / PiliPlus wbi_sign.dart 同款）
const WBI_TAB = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13];
let wbiCache = {key: '', time: 0};              // mixinKey 缓存 1 小时
let dashCache = {key: '', vi: null, time: 0};   // dash JSON 缓存 5 分钟，proxy 生成 MPD 用

function dashMd5(s) {
    // 沙箱注入全局 md5（crypto-js），node 直跑环境兜底 require('crypto')
    return typeof md5 === 'function' ? md5(s) : require('crypto').createHash('md5').update(s, 'binary').digest('hex');
}

async function getMixinKey() {
    if (wbiCache.key && Date.now() - wbiCache.time < 3600000) return wbiCache.key;
    let j = JSON.parse(await request('https://api.bilibili.com/x/web-interface/nav', {timeout: 10000}));
    let w = j.data.wbi_img;
    // 取 img/sub 文件名去扩展名拼接，按置换表重排取前 32 位
    let raw = w.img_url.split('/').pop().split('.')[0] + w.sub_url.split('/').pop().split('.')[0];
    wbiCache = {key: WBI_TAB.map(i => raw[i]).join(''), time: Date.now()};
    return wbiCache.key;
}

// 拉取 DASH 信息（供 proxy_rule 现场生成 MPD），返回 result.video_info 或 null
async function fetchDash(ep, cid) {
    let cacheKey = ep + '_' + cid;
    if (dashCache.key === cacheKey && dashCache.vi && Date.now() - dashCache.time < 300000) return dashCache.vi;
    let cookie = ENV.get('bili_cookie') || '';
    let params = {ep_id: String(ep), cid: String(cid), qn: '80', fnval: '4048', fourk: '1', fnver: '0'};
    if (!cookie) params.try_look = '1'; // 游客白嫖试看档（PiliPlus: tryLook = !isLogin）
    // wbi 签名；失败不阻塞——V2 无签名目前也能过，签名只是耐造保险
    try {
        params.wts = String(Math.floor(Date.now() / 1000));
        let qs = Object.keys(params).sort().map(k =>
            encodeURIComponent(k) + '=' + encodeURIComponent(params[k].replace(/[!'()*]/g, ''))).join('&');
        params.w_rid = dashMd5(qs + await getMixinKey());
    } catch (e) {
        log('wbi签名失败(降级无签名):', e.message);
        delete params.wts;
    }
    let url = DASH_API + '?' + Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
    let headers = Object.assign({}, DASH_HEADERS);
    if (cookie) headers.Cookie = cookie;
    let j = JSON.parse(await request(url, {headers: headers, timeout: 15000}));
    let vi = j.code === 0 && j.result ? (j.result.video_info || j.result) : null;
    if (!vi || !vi.dash) {
        log('V2 DASH获取失败:', j.code, j.message);
        return null;
    }
    dashCache = {key: cacheKey, vi: vi, time: Date.now()};
    return vi;
}

// DASH JSON → 动态 MPD（on-demand profile，SegmentBase 指向 B 站 CDN，EXO 自行解析 sidx 拖动/合流/ABR）
function buildMpd(vi) {
    // 只挑 avc1(H.264) 轨（EXO 兼容最稳），同清晰度多编码取一条，清晰度大者在前（EXO 默认选最高）
    let vids = vi.dash.video.filter(v => (v.codecs || '').indexOf('avc1') === 0);
    if (!vids.length) vids = vi.dash.video;
    let seen = {};
    vids = vids.filter(v => !seen[v.id]++);
    vids.sort((a, b) => b.id - a.id);
    let https = u => (u || '').replace(/^http:\/\//, 'https://');
    // BaseURL 里的 query & 必须转义为 &amp;，否则 XML 解析（EXO/ffmpeg）报 EntityRef 错直接拒收
    let esc = u => https(u).replace(/&/g, '&amp;');
    let seg = v => {
        let sb = v.segment_base || {};
        return '<SegmentBase indexRange="' + sb.index_range + '"><Initialization range="' + sb.initialization + '"/></SegmentBase>';
    };
    let reps = vids.map(v =>
        '<Representation id="' + v.id + '" bandwidth="' + v.bandwidth + '" codecs="' + v.codecs + '" width="' + v.width + '" height="' + v.height + '">' +
        '<BaseURL>' + esc(v.baseUrl || v.base_url) + '</BaseURL>' + seg(v) + '</Representation>').join('');
    // 音轨取码率最高一条；不写死 audioSamplingRate/timescale，由 EXO 从 init/sidx 读真实值
    let aud = (vi.dash.audio || []).sort((a, b) => b.bandwidth - a.bandwidth)[0];
    let audSet = aud ?
        '<AdaptationSet id="1" contentType="audio" mimeType="audio/mp4" startWithSAP="1">' +
        '<Representation id="' + aud.id + '" bandwidth="' + aud.bandwidth + '" codecs="' + aud.codecs + '">' +
        '<AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"/>' +
        '<BaseURL>' + esc(aud.baseUrl || aud.base_url) + '</BaseURL>' + seg(aud) + '</Representation></AdaptationSet>' : '';
    let dur = 'PT' + Math.round((vi.timelength || 0) / 1000) + 'S';
    return '<?xml version="1.0" encoding="UTF-8"?>' +
        '<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011" mediaPresentationDuration="' + dur + '" minBufferTime="1.5">' +
        '<Period>' +
        '<AdaptationSet id="0" contentType="video" mimeType="video/mp4" segmentAlignment="true" startWithSAP="1">' + reps + '</AdaptationSet>' +
        audSet +
        '</Period></MPD>';
}

var rule = {
    title: '哔哩影视[官]',
    host: 'https://api.bilibili.com',
    url: '/fyclass-fypage&vmid=$vmid',
    detailUrl: '/pgc/view/web/season?season_id=fyid',
    filter_url: 'fl={{fl}}',
    vmid获取教程: '登录后访问https://api.bilibili.com/x/web-interface/nav,搜索mid就是,cookie需要 bili_jct,DedeUserID,SESSDATA参数',
    searchUrl: '/x/web-interface/search/type?keyword=**&page=fypage&search_type=',
    searchable: 1,
    filterable: 1,
    quickSearch: 0,
    headers: {
        'User-Agent': 'PC_UA',
        "Referer": "https://www.bilibili.com",
        // "Cookie": "$bili_cookie"
    },
    tab_order: ['B站', 'bilibili', 'B站DASH'],//线路顺序,DASH放末位(需EXO内核壳子支持mpd),老线路兼容兜底
    timeout: 5000,
    class_name: '番剧&国创&电影&电视剧&纪录片&综艺&全部&追番&追剧&时间表',
    class_url: '1&4&2&5&3&7&全部&追番&追剧&时间表',
    filter: 'H4sIAAAAAAAAA7VSy0rDQBT9lwF3FbRqhW79DAkSaBaiptC0gpRAQfuIosXS2GC6UBBaLGoKUcxLfyZ3MvkLJ2bsJGTt8p5z751zzp02gu48Pp+j6n4bHUlnqIqahzVUQrJ4ItECBr1o6dH6VDxuSb9dMoUj/Rm0WQLTYhOppRQGM4CByeDtFRyN3yFYMrichcmsx/fsrBjyakGgR1qfMVt8xvOJ5jJ4F6lCQqS6642a1ODK8c0I3GFBOR694PEX1q24PywowqaN7yw8+YgnNiM3ODntxAuDvF3QTAoWwXfA0XNreSzkO4imV6HrUr7gCPxOoin7Jg8i/LzExkOOrORMK5Ko1OUDpSk2Wwo3H3oGsZ2CeXbrdNF65m7da9ae0823JCmtlfcqfOJpFvr3cGv8JZGygiqUUCqXPP7Tp6JvqD/Bcj8itwIAAA==',
    play_parse: true,
    pagecount: {"1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "7": 1, "时间表": 1},
    limit: 5,
    推荐: async function () {
        return await home_video();
    },
    预处理: async function () {
        rule.headers.Cookie = ENV.get('bili_cookie');
        try {
            let json = await request('https://api.bilibili.com/x/web-interface/nav');
            json = JSON.parse(json);
            let mid = json.data.mid;
            log('mid:', mid);
            if (mid) {
                rule.url = rule.url.replace('$vmid', mid);
            }
        } catch (e) {
            log('预处理获取vmid错误:', e.message);
        }
    },
    一级: async function () {
        let {input, MY_CATE, MY_PAGE, MY_FL} = this;
        rule.headers.Cookie = ENV.get('bili_cookie');
        let d = [];
        let vmid = input.split("vmid=")[1].split("&")[0];

        async function get_zhui(pg, mode) {
            let url = "https://api.bilibili.com/x/space/bangumi/follow/list?type=" + mode + "&follow_status=0&pn=" + pg + "&ps=10&vmid=" + vmid;
            return get_result(url)
        }

        async function get_all(tid, pg, order, season_status) {
            let url = "https://api.bilibili.com/pgc/season/index/result?order=" + order + "&pagesize=20&type=1&season_type=" + tid + "&page=" + pg + "&season_status=" + season_status;
            return get_result(url)
        }

        async function get_timeline(tid, pg) {
            let videos = [];
            let url = "https://api.bilibili.com/pgc/web/timeline/v2?season_type=" + tid + "&day_before=2&day_after=4";
            let html = await request(url);
            let jo = JSON.parse(html);
            if (jo["code"] === 0) {
                let videos1 = [];
                let vodList = jo.result.latest;
                vodList.forEach(function (vod) {
                    let aid = (vod["season_id"] + "").trim();
                    let title = vod["title"].trim();
                    let img = vod["cover"].trim();
                    let remark = vod["pub_index"] + "　" + vod["follows"].replace("系列", "");
                    videos1.push({vod_id: aid, vod_name: title, vod_pic: img, vod_remarks: remark})
                });
                let videos2 = [];
                for (let i = 0; i < 7; i++) {
                    let vodList = jo["result"]["timeline"][i]["episodes"];
                    vodList.forEach(function (vod) {
                        if (vod["published"] + "" === "0") {
                            let aid = (vod["season_id"] + "").trim();
                            let title = vod["title"].trim();
                            let img = vod["cover"].trim();
                            let date = vod["pub_ts"];
                            let remark = date + "   " + vod["pub_index"];
                            videos2.push({vod_id: aid, vod_name: title, vod_pic: img, vod_remarks: remark})
                        }
                    })
                }
                videos = videos2.concat(videos1)
            }
            return videos
        }

        async function cate_filter(d, cookie) {
            if (MY_CATE === "1") {
                return get_rank(MY_CATE, MY_PAGE)
            } else if (["2", "3", "4", "5", "7"].includes(MY_CATE)) {
                return get_rank2(MY_CATE, MY_PAGE)
            } else if (MY_CATE === "全部") {
                let tid = MY_FL.tid || "1";
                let order = MY_FL.order || "2";
                let season_status = MY_FL.season_status || "-1";
                return get_all(tid, MY_PAGE, order, season_status)
            } else if (MY_CATE === "追番") {
                return get_zhui(MY_PAGE, 1)
            } else if (MY_CATE === "追剧") {
                return get_zhui(MY_PAGE, 2)
            } else if (MY_CATE === "时间表") {
                let tid = MY_FL.tid || "1";
                return get_timeline(tid, MY_PAGE)
            } else {
                return []
            }
        }

        return await cate_filter()

    },
    二级: async function () {
        let {input} = this;

        function zh(num) {
            let p = "";
            if (Number(num) > 1e8) {
                p = (num / 1e8).toFixed(2) + "亿"
            } else if (Number(num) > 1e4) {
                p = (num / 1e4).toFixed(2) + "万"
            } else {
                p = num
            }
            return p
        }

        let html = await request(input);
        let jo = JSON.parse(html).result;
        let id = jo["season_id"];
        let title = jo["title"];
        let pic = jo["cover"];
        let areas = jo["areas"][0]["name"];
        let typeName = jo["share_sub_title"];
        let date = jo["publish"]["pub_time"].substr(0, 4);
        let dec = jo["evaluate"];
        let remark = jo["new_ep"]["desc"];
        let stat = jo["stat"];
        let status = "弹幕: " + zh(stat["danmakus"]) + "　点赞: " + zh(stat["likes"]) + "　投币: " + zh(stat["coins"]) + "　追番追剧: " + zh(stat["favorites"]);
        let score = jo.hasOwnProperty("rating") ? "评分: " + jo["rating"]["score"] + "　" + jo["subtitle"] : "暂无评分" + "　" + jo["subtitle"];
        let vod = {
            vod_id: id,
            vod_name: title,
            vod_pic: pic,
            type_name: typeName,
            vod_year: date,
            vod_area: areas,
            vod_remarks: remark,
            vod_actor: status,
            vod_director: score,
            vod_content: dec
        };
        let ja = jo["episodes"];
        let playurls1 = [];
        let playurls2 = [];
        let playurls3 = [];
        ja.forEach(function (tmpJo) {
            let eid = tmpJo["id"];
            let cid = tmpJo["cid"];
            let link = tmpJo["link"];
            let part = tmpJo["title"].replace("#", "-") + " " + tmpJo["long_title"];
            playurls1.push(part + "$" + eid + "_" + cid);
            playurls2.push(part + "$" + link);
            playurls3.push(part + "$d_" + eid + "_" + cid);
        });
        // 线路名按 cookie 状态动态提示：游客态老接口实测只有 360P，DASH 走 try_look 试看档
        let hasCookie = !!ENV.get('bili_cookie');
        let line1 = hasCookie ? 'B站' : 'B站·游客360P';
        let line3 = hasCookie ? 'B站DASH' : 'B站DASH·试看';
        let playUrl = playurls1.join("#") + "$$$" + playurls2.join("#") + "$$$" + playurls3.join("#");
        vod["vod_play_from"] = line1 + "$$$bilibili$$$" + line3;
        vod["vod_play_url"] = playUrl;
        return vod
    },

    搜索: async function () {
        let {input, KEY, publicUrl} = this;
        let url1 = input + "media_bangumi";
        let url2 = input + "media_ft";
        rule.headers.Cookie = ENV.get('bili_cookie');
        let html = await request(url1);
        let msg = JSON.parse(html).message;
        let VODS = [];
        if (msg !== "0") {
            VODS = [{
                vod_name: KEY + "➢" + msg,
                vod_id: "no_data",
                vod_remarks: "别点,缺少bili_cookie",
                vod_pic: urljoin(publicUrl, './images/404.jpg'),
            }];
            return VODS;
        } else {
            let jo1 = JSON.parse(html).data;
            html = await request(url2);
            let jo2 = JSON.parse(html).data;
            let videos = [];
            let vodList = [];
            if (jo1["numResults"] === 0) {
                vodList = jo2["result"]
            } else if (jo2["numResults"] === 0) {
                vodList = jo1["result"]
            } else {
                vodList = jo1["result"].concat(jo2["result"])
            }
            vodList.forEach(function (vod) {
                let aid = (vod["season_id"] + "").trim();
                let title = KEY + "➢" + vod["title"].trim().replace('<em class="keyword">', "").replace("</em>", "");
                let img = vod["cover"].trim();
                let remark = vod["index_show"];
                videos.push({vod_id: aid, vod_name: title, vod_pic: img, vod_remarks: remark})
            });
            VODS = videos;
        }
        return VODS
    },
    lazy: async function () {
        let {input} = this;
        if (/^http/.test(input)) {
            input = {
                jx: 1,
                url: input,
                parse: 0,
                header: JSON.stringify({
                    "user-agent": "Mozilla/5.0"
                })
            }
        } else {
            let ids = input.split("_");
            // 弹幕 oid 取末段 cid（老线路 id=eid_cid，DASH 线路 id=d_eid_cid）
            let dan = 'https://api.bilibili.com/x/v1/dm/list.so?oid=' + ids[ids.length - 1];
            // B站DASH 线路：id = d_eid_cid → 主服务 /proxy 回调动态生成 MPD
            // #.mpd 伪后缀帮壳子按格式分流到 EXO DashMediaSource（fragment 不发给服务器）
            if (ids[0] === 'd') {
                return {
                    parse: 0,
                    playUrl: "",
                    url: this.requestHost + '/proxy/' + encodeURIComponent(rule.title) + '/?do=mpd&ep=' + ids[1] + '&cid=' + ids[2] + '#.mpd',
                    header: DASH_HEADERS
                };
            }
            let result = {};
            let url = "https://api.bilibili.com/pgc/player/web/playurl?qn=116&ep_id=" + ids[0] + "&cid=" + ids[1];
            rule.headers.Cookie = ENV.get('bili_cookie');
            let html = await request(url);
            let jRoot = JSON.parse(html);
            if (jRoot["message"] !== "success") {
                log("老接口播放失败:", jRoot["message"]);
                // toast 引导而非静默黑屏；多为大会员/版权限制，DASH 线路游客 try_look 可试看
                input = "toast://" + (jRoot["message"] || "播放失败") + ",可切「B站DASH」线路";
            } else {
                let jo = jRoot["result"];
                let ja = jo["durl"];
                let maxSize = -1;
                let position = -1;
                ja.forEach(function (tmpJo, i) {
                    if (maxSize < Number(tmpJo["size"])) {
                        maxSize = Number(tmpJo["size"]);
                        position = i
                    }
                });
                let url = "";
                if (ja.length > 0) {
                    if (position === -1) {
                        position = 0
                    }
                    url = ja[position]["url"]
                }
                result["parse"] = 0;
                result["playUrl"] = "";
                result["url"] = url;
                result["header"] = {
                    Referer: "https://www.bilibili.com",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36",
                };
                if (rule.headers.Cookie) {
                    result["header"]["Cookie"] = rule.headers.Cookie
                }
                result["contentType"] = "video/x-flv";
                result["danmaku"] = dan;
                input = result
            }
        }
        return input
    },
    proxy_rule: async function (params) {
        if (params.do !== 'mpd') return [404, 'text/plain', 'not found'];
        let ep = params.ep || '';
        let cid = params.cid || '';
        if (!/^\d+$/.test(ep) || !/^\d+$/.test(cid)) return [400, 'text/plain', 'invalid ep/cid'];
        let vi = await fetchDash(ep, cid);
        if (!vi) return [502, 'text/plain', '获取DASH失败,请检查bili_cookie或稍后重试'];
        return [200, 'application/dash+xml', buildMpd(vi)];
    }
}

async function get_result(url) {
    let videos = [];
    let html = await request(url);
    let jo = JSON.parse(html);
    if (jo["code"] === 0) {
        let vodList = jo.result ? jo.result.list : jo.data.list;
        vodList.forEach(function (vod) {
            let aid = (vod["season_id"] + "").trim();
            let title = vod["title"].trim();
            let img = vod["cover"].trim();
            let remark = vod.new_ep ? vod["new_ep"]["index_show"] : vod["index_show"];
            videos.push({vod_id: aid, vod_name: title, vod_pic: img, vod_remarks: remark})
        })
    }
    return videos
}

async function get_rank(tid, pg) {
    return get_result("https://api.bilibili.com/pgc/web/rank/list?season_type=" + tid + "&pagesize=20&page=" + pg + "&day=3")
}

async function get_rank2(tid, pg) {
    return get_result("https://api.bilibili.com/pgc/season/rank/web/list?season_type=" + tid + "&pagesize=20&page=" + pg + "&day=3")
}

async function home_video() {
    let videos = (await get_rank(1)).slice(0, 5);
    for (const i of [4, 2, 5, 3, 7]) {
        videos = videos.concat((await get_rank2(i)).slice(0, 5))
    }
    return videos
}
