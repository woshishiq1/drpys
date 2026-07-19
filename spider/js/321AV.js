/*
@header({
  searchable: 2,
  filterable: 0,
  quickSearch: 0,
  title: '321AV',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    title: '321AV',
    host: 'https://www.321xav.top',
    homeUrl: '/enter',
    url: '/vodtype/fyclass-fypage.html',
    searchUrl: '/vod/search.html?wd=**',
    searchable: 2,
    quickSearch: 0,
    headers: { 'User-Agent': 'MOBILE_UA' },
    class_name: '有码影片&无码影片&中文字幕',
    class_url: '20&21&22',
    play_parse: true,
    lazy: 'js: input = {parse: 1, url: input};',
    limit: 6,
    推荐: '.thumbnail.group;a.text-secondary&&Text;img.thumbnail-poster&&data-src;span.absolute&&Text;a&&href',
    一级: '.thumbnail.group;a.text-secondary&&Text;img.thumbnail-poster&&data-src;span.absolute&&Text;a&&href',
    二级: async function () {
        let { input, pdfh, pdfa, pd } = this;
        let html = await request(input);
        let VOD = {};
        VOD.vod_name = pdfh(html, 'meta[property="og:title"]&&content');
        VOD.vod_pic = pdfh(html, 'meta[property="og:image"]&&content');
        VOD.vod_content = pdfh(html, 'meta[property="og:description"]&&content');
        // 提取标签(限定在详情区域内)
        let tags = [];
        try {
            let tagEls = pdfa(html, '.space-y-2 a.text-nord13');
            tagEls.forEach(function (el) {
                let t = pdfh(el, 'Text').trim();
                if (t) tags.push(t);
            });
        } catch (e) { }
        if (tags.length) VOD.vod_class = tags.join(',');
        // 提取日期
        try {
            VOD.vod_year = pdfh(html, '.space-y-2 .font-medium&&Text');
        } catch (e) { }
        // 播放源
        VOD.vod_play_from = '321AV';
        VOD.vod_play_url = '播放$' + input;
        return VOD;
    },
    搜索: '.thumbnail.group;a.text-secondary&&Text;img.thumbnail-poster&&data-src;span.absolute&&Text;a&&href',
};
