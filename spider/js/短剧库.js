/*
@header({
  searchable: 2,
  filterable: 1,
  quickSearch: 1,
  title: '短剧库',
  '类型': '短剧',
  lang: 'ds'
})
*/

// 主分类 = 平台（红果/黄豆/黄果），子分类 = 各平台自己的分类（filter 按主分类 id 分组）
var filter_def = 'H4sIAEXpsWoC/6tWysjPS08vzVeyUoiuVspOrQQylJITS5R0FJTyEnNTQdynHW3PN+4GiZQl5pSmQpTmgWSez5n/ZNeup53LwZIgkaLUxBzdlKLE3ESlWh0FqLJne1Yjq0nOz81MxlDk6ImsJjETQ8HTrhVAg1BNUaqNrY0FimSUJualp+SXkueNZw27ny2bg7A7JwfJ2pdrpzybshNZPjc/PTET2XsT5jzfsghZRXFqYlFyBrKSKdteTO9HVpKWWJZflFmSiuzBdT3Pd09GUZSZl1mcgeJJsuPqaeuKl80rcHjyxf55z3evRY4AEyTZ5/PXPu9sh0sZIUn5hum/nL/5yc4JyHoNkfV2tj9btxUuZQz2TC0AnvPK03gCAAA=';

var rule = {
    title: '短剧库',
    host: 'http://127.0.0.1:8998',
    homeUrl: 'http://127.0.0.1:8998/api/home?plat=hongguo&page=1',
    searchUrl: 'http://127.0.0.1:8998/api/search?wd=**&page=fypage',
    url: 'http://127.0.0.1:8998/api/category?plat=fyclass&page=fypage',
    filter_url: 'cat={{fl.cat}}',
    class_name: '红果&黄豆&黄果',
    class_url: 'hongguo&huangdou&huangguo',
    filter: filter_def,
    filterable: 1,
    headers: {
        'User-Agent': 'MOBILE_UA'
    },
    timeout: 15000,
    multi: 1,
    searchable: 2,
    play_parse: true,
    推荐: 'json:data.list;vod_name;vod_pic;vod_remarks;vod_id;vod_content',
    一级: 'json:data.list;vod_name;vod_pic;vod_remarks;vod_id;vod_content',
    搜索: 'json:data.list;vod_name;vod_pic;vod_remarks;vod_id;vod_content',
    二级: async function () {
        let id = String(this.vid || this.orId || '').trim();
        if (!id) {
            id = String(this.input || '').split('?')[0].split('/').pop();
        }
        let platKey = '';
        let platName = '短剧库';
        let colonIdx = id.indexOf(':');
        if (colonIdx > 0) {
            platKey = id.substring(0, colonIdx);
            if (platKey === 'hongguo') platName = '红果';
            else if (platKey === 'huangdou') platName = '黄豆';
            else if (platKey === 'huangguo') platName = '黄果';
        }
        let api = 'http://127.0.0.1:8998/api/detail?id=' + encodeURIComponent(id);
        let html = JSON.parse(await request(api));
        let d = html.data || {};
        let base_vod = {
            vod_id: id,
            vod_name: d.vod_name || '',
            type_name: d.vod_class || '',
            vod_pic: d.vod_pic || '',
            vod_content: d.vod_content || ''
        };
        let playUrls = [];
        for (let ep of (d.episodes || [])) {
            playUrls.push((ep.name || ('第' + ep.no + '集')) + '$' + ep.url);
        }
        base_vod.vod_play_from = platName;
        base_vod.vod_play_url = playUrls.join('#');
        return base_vod;
    },
    lazy: async function () {
        let {input} = this;
        let playPage = String(input || '').trim();
        if (!playPage) {
            return {parse: 0, url: ''};
        }
        let api = 'http://127.0.0.1:8998/api/play?url=' + encodeURIComponent(playPage);
        let res = JSON.parse(await request(api));
        if (res && res.code === 200 && res.data && res.data.url) {
            return {parse: 0, url: res.data.url + '#.mp4'};
        }
        return {parse: 0, url: playPage};
    }
};