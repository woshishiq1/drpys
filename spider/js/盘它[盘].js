const { req_, req_proxy } = $.require('./_lib.request.js');
const { formatPlayUrl } = misc;

var rule = {
  title: '盘Ta[盘]',
  host: 'https://www.91panta.cn/',
  url: '/?tagId=fyclass&page=fypage',
  detailUrl: '/fyid',
  searchUrl: '/search?keyword=**&page=fypage',
  searchable: 2,
  quickSearch: 0,
  play_parse: true,
  class_parse: async () => {
    let classes = [
      { type_id: '39765285016165', type_name: '电影' },
      { type_id: '39765284616164', type_name: '剧集' },
      { type_id: '39724839640293', type_name: '综艺' },
      { type_id: '39724838540291', type_name: '动漫' },
      { type_id: '44732560408431', type_name: '短剧' },
      { type_id: '39955372461067', type_name: "精彩合集" }
    ];
    return { class: classes };
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
  },
  预处理: async () => {
    return [];
  },
  推荐: async () => {
    return [];
  },
  一级: async function (tid, pg, filter, extend) {
    let { input, pdfa, pdfh, pd } = this;
    let html = await req_(input, 'get', this.headers);
    const $ = pq(html);
    let d = [];
    let data = pdfa(html, '.topicList .topicItem');
    data.forEach((it) => {
      let title = pdfh(it, 'h2&&Text');
      let picUrl = pd(it, 'ul.tm-m-photos-thumb&&li&&data-src') || 'https://cnb.cool/zhyadc/YsBox/-/git/raw/main/img/移动.png';
      let url = pd(it, 'a[href*="thread?topicId="]&&href');

      if (!title.includes('PDF') && !it.includes('pdf')) {
        d.push({
          title: title,
          pic_url: picUrl,
          url: url
        });
      }
    });
    return setResult(d)
  },
  二级: async function (ids) {
    let { input } = this;
    console.log('input的结果:', input);
    let html = await req_(input, 'get', this.headers);
    const $ = pq(html)
    let vod = {
      "vod_name": $('.title').text().trim(),
      "vod_id": input,
      "vod_content": $('div.topicContent p:nth-child(1)').text()
    }
    let content_html = $('.topicContent').html()
    let link = content_html.match(/<a\s+(?:[^>]*?\s+)?href=["'](https:\/\/caiyun\.139\.com\/[^"']*)["'][^>]*>/gi);
    if (!link || link.length === 0) {
      // 如果 a 标签匹配不到，尝试匹配 span 标签中的文本内容
      link = content_html.match(/<span\s+style="color:\s*#0070C0;\s*">https:\/\/caiyun\.139\.com\/[^<]*<\/span>/gi);
      if (link && link.length > 0) {
        // 提取 span 标签中的 URL
        link = link[0].match(/https:\/\/caiyun\.139\.com\/[^<]*/)[0];
      } else {
        link = content_html.match(/https:\/\/caiyun\.139\.com\/[^<]*/)[0]
      }
    } else {
      // 提取 a 标签中的 URL
      link = link[0].match(/https:\/\/caiyun\.139\.com\/[^"']*/)[0];
    }
    let playform = []
    let playurls = []
    let playPans = [];
    if (/caiyun.139.com/.test(link)) {
      playPans.push(link);
      let data = await Yun.getShareData(link)
     // console.log('data的结果:', data);
      Object.keys(data).forEach(it => {
        playform.push('Yun-' + it)
        const urls = data[it].map(item => item.name + "$" + [item.contentId, item.linkID].join('*')).join('#');
        playurls.push(urls);
      })
    }
    vod.vod_play_from = playform.join("$$$")
    vod.vod_play_url = playurls.join("$$$")
    vod.vod_play_pan = playPans.join("$$$")
    return vod
  },
  搜索: async function (tid, pg, filter, extend) {
    return this.一级(tid, pg, filter, extend);
    // let 一级 = rule.一级.bind(this);
    //   return await 一级();
  },
  lazy: async function (flag, id, flags) {
    let { getProxyUrl, input } = this;
    const ids = input.split('*');
    if (flag.startsWith('Yun-')) {
      log('移动云盘解析开始')
      const url = await Yun.getSharePlay(ids[0], ids[1])
      return {
        url: url
      }
    }
  }
};