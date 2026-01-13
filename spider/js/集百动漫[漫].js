/*
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '集百动漫',
  author: 'EylinSir/251129/修复版',
  '类型': '影视',
  lang: 'ds'
})
*/

var rule = {
    类型: '影视',
    author: 'EylinSir/251129/修复版',
    title: '集百动漫',
    host: 'http://www.jibai5.com',
    url: '/vodtype/fyclass-fypage.html',
    searchUrl: '/vodsearch/-------------.html?wd=**',
    homeUrl: '/',
    headers: {'User-Agent': 'UC_UA'},
    searchable: 1, quickSearch: 0, filterable: 0, double: true, play_parse: true, limit: 6,
    class_name: '3D动漫&动漫&沙雕剧场',
    class_url: '20&21&22',
    lazy: async function () {
        let {input, pdfa, pdfh, pd} = this
        const html = JSON.parse((await request(input)).content.match(/player_.*?=(.*?)</)[1]);
        let url = html.url;
        if (html.encrypt == "1") {
            url = unescape(url)
        } else if (html.encrypt == "2") {
            url = unescape(base64Decode(url))
        }
        // 处理 iframe 链接，特别是 Bilibili 播放器
        if (url.includes("player.bilibili.com") || url.includes("iframe")) {
            // 对于 Bilibili iframe，提取 aid 参数并构建视频页面链接
            if (url.includes("player.bilibili.com")) {
                const aidMatch = url.match(/aid=(\d+)/);
                if (aidMatch) {
                    url = `https://www.bilibili.com/video/av${aidMatch[1]}/`;
                }
            }
            return {parse: 1, url: url}
        }
        return {parse: 0, url: url}
    },
    推荐: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.boxlist li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.duration&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    },
    一级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.boxlist li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.duration&&Text'),
                url: pd(it, 'a&&href'),
            })
        });
        return setResult(d)
    },
    二级: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, 'h2&&Text');
        VOD.vod_content = pdfh(html, '.juqing.mbyc&&Text');
        let playlist = pdfa(html, '.dslist-group')
        let tabs = pdfa(html, '.panel-default&&.panel-heading');
        let playmap = {};
        tabs.map((item, i) => {
            const form = pdfh(item, 'Text')
            const list = playlist[i]
            const a = pdfa(list, 'body&&a')
            a.map((it) => {
                let title = pdfh(it, 'a&&title')
                let urls = pd(it, 'a&&href', input)
                if (!playmap.hasOwnProperty(form)) {
                    playmap[form] = [];
                }
                playmap[form].push(title + "$" + urls);
            });
        });
        VOD.vod_play_from = Object.keys(playmap).join('$$$');
        const urls = Object.values(playmap);
        const playUrls = urls.map((urllist) => {
            return urllist.join("#")
        });
        VOD.vod_play_url = playUrls.join('$$$');
        return VOD
    },
    搜索: async function () {
        let {input, pdfa, pdfh, pd} = this;
        let html = await request(input);
        let d = [];
        let data = pdfa(html, '.boxlist li');
        data.forEach((it) => {
            d.push({
                title: pdfh(it, 'a&&title'),
                pic_url: pd(it, 'img&&src'),
                desc: pdfh(it, '.duration&&Text'),
                url: pd(it, 'a&&href'),
                content: pdfh(it, '.list-content&&Text'),
            })
        });
        return setResult(d)
    }
}
