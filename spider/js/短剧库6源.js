/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '短剧库6源',
  '类型': '短剧',
  lang: 'ds'
})
*/

// 对接 guoapi（duanjuapp/native 的 6 个站源 HTTP 服务，详见 dsp-demo/guoapp/native/cmd/dspapi/README.md）
// 主分类 = 站源，子分类 = 各站源自己的分类（filter 按主分类 id 分组，直接用对象，引擎原生支持）
// 播放集值格式：剧集ID@集序号，lazy 里换成 guoapi 解析出的直连播放地址
// 注意：必须先启动 guoapi.exe（-addr 0.0.0.0:8899），否则无数据、无法播放
// API 必须写"手机能访问到本机"的地址（局域网 IP），不能用 127.0.0.1——
// 播放地址由手机上的播放器直接请求，127.0.0.1 会指向手机自己
var API = 'http://127.0.0.1:8899';

var filter_def = 'H4sIAAAAAAAAA6tWysjPS08vzVeyiq5Wyk6tVLJSSk4sSU3PL6pU0lHKS8xNBYo87Wh7vnE3kF+WmFOaClaaBxJuXfGyeQVIGMhRqtWBiD6fM//Jrl1PO5dDJYoz8otK4gtyEivhSp7tWY2QT87PzUyOL04tykwthqtw9EQoSMyEy8bWxuooZZQmgp2cmEk9Rzt6KjyfvxbZTt0UoDVZpcgqUJwNVJGLoaB30YuWHQgFIJfmZCbmIat5uXbKsyk7kQzJTwd6BOKz5Jz80pS0ovy8Eur57OXulmfz5jztm/+0YzZUzizR0sgiJS01JckoOdnC0DTN3DTF3MjQGMmZzzomACMRJUggulLNUXUZpGHoQgkmiK7kZDRdSUi6UEIEot7UBE29ITiEagGmQ9lbrwIAAA==';

var sourceNames = {
    hongguo: '红果',
    huangdou: '黄豆',
    huangguoai: '黄果AI',
    'huangguo-video': '黄果Video',
    huangju: '黄剧',
    cloudfront: '旧版黄果'
};

var rule = {
    title: '短剧库6源',
    host: API,
    homeUrl: API + '/api/recommendations',
    searchUrl: API + '/api/search/all?wd=**&page=fypage',
    url: API + '/api/catalog?source=fyclass&page=fypage',
    filter_url: 'category={{fl.category}}',
    class_name: '红果&黄豆&黄果AI&黄果Video&黄剧&旧版黄果',
    class_url: 'hongguo&huangdou&huangguoai&huangguo-video&huangju&cloudfront',
    filter: filter_def,
    filterable: 1,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 15000,
    multi: 1,
    searchable: 2,
    play_parse: true,
    推荐: 'json:data.items;title;cover;heat;id;description',
    一级: 'json:data.items;title;cover;heat;id;description',
    搜索: 'json:data.items;title;cover;heat;id;description',
    二级: async function () {
        let id = String(this.vid || this.orId || '').trim();
        if (!id) {
            id = String(this.input || '').split('?')[0].split('/').pop();
        }
        let platKey = '';
        let platName = '短剧库6源';
        let colonIdx = id.indexOf(':');
        if (colonIdx > 0) {
            platKey = id.substring(0, colonIdx);
            if (sourceNames[platKey]) {
                platName = sourceNames[platKey];
            }
        }
        let api = API + '/api/detail?id=' + encodeURIComponent(id);
        let html = JSON.parse(await request(api));
        let payload = html.data || {};
        let drama = payload.drama || {};
        let chapters = payload.chapters || [];
        let playUrls = [];
        for (let i = 0; i < chapters.length; i++) {
            let ep = chapters[i];
            let name = ep.title || ('第' + (i + 1) + '集');
            playUrls.push(name + '$' + id + '@' + (i + 1));
        }
        return {
            vod_id: id,
            vod_name: drama.title || '',
            type_name: drama.category || '',
            vod_pic: drama.cover || '',
            vod_remarks: drama.episodes ? (drama.episodes + '集') : '',
            vod_content: drama.description || '',
            vod_play_from: platName,
            vod_play_url: playUrls.join('#')
        };
    },
    lazy: async function () {
        let {input} = this;
        let parts = String(input || '').trim().split('@');
        if (parts.length !== 2 || !parts[0] || !parts[1]) {
            return {parse: 0, url: ''};
        }
        // 红果默认线路是 CENC 加密流（播放器需带 decryption_key 才能解密，
        // drpy 播放器没有该机制），plain=1 让 guoapi 优先走网页明文流
        let plain = parts[0].indexOf('hongguo:') === 0 ? '&plain=1' : '';
        let api = API + '/api/play?id=' + encodeURIComponent(parts[0]) + '&episode=' + parts[1] + plain;
        let res = JSON.parse(await request(api));
        if (res && res.ok && res.data && res.data.url) {
            // guoapi 的流地址自带 .m3u8/.mp4 后缀，已注入 Referer/密钥，播放器直接播
            return {parse: 0, url: res.data.url};
        }
        return {parse: 0, url: ''};
    }
};
