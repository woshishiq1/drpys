/*
* @File     : wai76.js
* @Author   : user
* @Date     : 2026-04-20
* @Comments : 心动美图网站爬虫
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '心动美图',
  类型: '图片',
  lang: 'ds',
})
*/

var rule = {
    类型: '图片',
    title: '心动美图',
    host: 'https://www.wai76.com',
    homeUrl: '/',
    url: 'tag/fyclass/page/fypage/',
    searchUrl: '/?s=**&page=fypage',
    headers: {'User-Agent': 'PC_UA'},
    searchable: 1,
    quickSearch: 0,
    filterable: 0,
    double: false,
    play_parse: true,
    limit: 6,
    class_name: '丝袜&内衣&制服&性感&美腿',
    class_url: '丝袜&内衣&制服&性感&美腿',

    lazy: function () {
        let {input} = this;
        if (!input) return '';
        return {parse: 0, url: input.replace(/[`]/g, '').trim()};
    },

    推荐: '.hentry;h2.entry-title a&&Text;img&&src;div.entry-header&&Text;h2.entry-title a&&href',

    一级: async function () {
        let {input, HOST, pdfa, pd, pdfh} = this;
        let url = input.replace(/%[0-9A-F]{2}/g, m => m.toLowerCase());
        let resp = await req(url);
        if (!resp || resp.code !== 200) return [];
        let html = resp.content || '';
        let list = pdfa(html, '.hentry');
        let videos = [];
        for (let i = 0; i < list.length; i++) {
            let item = list[i];
            videos.push({
                vod_name: pdfh(item, 'h2.entry-title a&&Text'),
                vod_pic: pd(item, 'img&&src', url),
                vod_remarks: pdfh(item, 'div.entry-header&&Text'),
                vod_id: pd(item, 'h2.entry-title a&&href', url)
            });
        }
        return videos;
    },

    二级: async function () {
        let {input, HOST, pdfa, pd, pdfh} = this;
        let url = input;
        let resp = await req(url);
        if (!resp || resp.code !== 200) return {};
        let html = resp.content || '';
        let VOD = {};
        VOD.vod_name = pdfh(html, 'h1.entry-title&&Text');
        VOD.vod_pic = pd(html, '.entry-content img:eq(0)&&src', url);
        let imgElements = pdfa(html, '.entry-content img');
        let images = [];
        for (let i = 0; i < imgElements.length; i++) {
            let imgUrl = pd(imgElements[i], 'img&&src', url);
            if (imgUrl) images.push(imgUrl);
        }
        VOD.vod_content = '共' + images.length + '张图片';
        VOD.type_name = '图片';
        VOD.vod_play_from = '默认';
        VOD.vod_play_url = images.join('#');
        return VOD;
    },

    搜索: '.hentry;h2.entry-title a&&Text;img&&src;div.entry-header&&Text;h2.entry-title a&&href'
}
