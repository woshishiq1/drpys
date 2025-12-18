var rule = {
    author: '冰水化合物/251201/第1版',
    title: '爱看高清',
    类型: '影视',
    host: 'https://www.ikanbd.com/',
    //↑域名
    searchable: 2,
    quickSearch: 1,
    filterable: 1,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; M2102J2SC Build/TKQ1.221114.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.7390.17 Mobile Safari/537.36'
      //  'Cookie': '__ancc_token=AwqCYYWUogiNgPq7H8aYIw==; PHPSESSID=mt2usfo70osr86srutb9lfdei1'
    },
    //↑请求头
    url: '/s/fyfilter.html',
    //↑分类url
   // homeUrl: 'vodtype/fyid.html',
    //↑主页url
//filter_url: '{{fl.area}}{{fl.by}}{{fl.class}}/id/{{fl.cateId or "fyclass"}}{{fl.lang}}{{fl.letter}}/page/fypage{{fl.year}}',
filter_url: '{{fl.cateId or "fyclass"}}-{{fl.area}}-{{fl.by}}-{{fl.class}}-{{fl.lang}}-{{fl.letter}}---fypage---{{fl.year}}',
    //filter_url: '{{fl.cateId}}{{fl.area}}{{fl.by}}{{fl.class}}{{fl.letter}}/page/fypage',
    //↓详情页url
    detailUrl: '/v_fyid.html',
   searchUrl: '/search/**----------fypage---.html',
    //搜索url
     //  searchUrl: '/index.php/ajax/suggest?mid=1&wd=**&page=fypage&limit=30',
    搜索: '.hl-item-pic;a&&title;a&&data-original;.remarks&&Text;a&&href',
    // 搜索: 'json:list;name;pic;en;id',
    推荐: '*',
    class_name: '电影&连续剧&综艺&动漫&纪录片&动画片&电影解说&网络短剧&体育&',
    //分类: '电影&电视剧&综艺&动漫',
    class_url: 'movie&series&variety&anime&documentary&animation&jieshuo&skit&sports',
    //分类值: '1&2&3&4',

    //推荐: '数组;标题;图片;副标题;链接',
    一级: '.hl-vod-list.clearfix li;a&&title;a&&data-original;.remarks&&Text;a&&href',
    //一级: '数组;标题;图片;副标题;链接',
二级: $js.toString(() => {
    let html = request(input);
    VOD = {};
    
    // 基本信息
    VOD.vod_id = input;
    VOD.vod_name = pdfh(html, '.hl-dc-title&&Text');
    VOD.vod_sub = pdfh(html, '.hl-dc-sub&&Text'); // 副标题
    
    // 类型信息
    let typeText = pdfh(html, 'li:contains(类型：)&&Text');
    if (typeText) {
        VOD.type_name = typeText.replace('类型：', '').replace(/<[^>]*>/g, '').replace(/\//g, ' ').trim();
    }
    
    // 封面图片
    VOD.vod_pic = pd(html, '.hl-item-thumb&&data-original', input);
    
    // 状态/备注
    VOD.vod_remarks = pdfh(html, 'li:contains(状态：)&&Text').replace('状态：', '');
    
    // 年份和地区
    VOD.vod_year = pdfh(html, 'li:contains(年份：)&&Text').replace('年份：', '');
    VOD.vod_area = pdfh(html, 'li:contains(地区：)&&Text').replace('地区：', '');
    
    // 导演和演员
    VOD.vod_director = pdfh(html, 'li:contains(导演：)&&Text').replace('导演：', '');
    VOD.vod_actor = pdfh(html, 'li:contains(主演：)&&Text').replace('主演：', '');
    
    // 剧情介绍
    let content = pdfh(html, 'li:contains(简介：)&&Text');
 //↓线路数组
let r_ktabs = pdfa(html,'.hl-plays-from.hl-tabs a');
 let ktabs = r_ktabs.map(it => pdfh(it, 'Text'));
 VOD.vod_play_from = ktabs.join('$$$');
 
let klists = [];
//↓播放数组
let r_plists = pdfa(html, '.hl-plays-list.hl-sort-list');
r_plists.forEach((rp) => {
    let klist = pdfa(rp, 'a').map((it) => {
        return pdfh(it, 'a&&Text') + '$' + pd(it, 'a&&href', input);
    }).filter(item => {
        // 过滤掉标题包含"APP播放"的无关项
        return !item.includes('展开全部');
    });
    klist = klist.join('#');
    klists.push(klist);
});
VOD.vod_play_url = klists.join('$$$');
}),
    /*二级: {
        title: '标题;类型',
        img: '图片链接',
        desc: '主要信息;年代;地区;演员;导演',
        content: '简介',
        tabs: '线路数组',
        tab_text: '线路标题',
        lists: '播放数组',       
        list_text: '播放标题',
        list_url: '播放链接',
    },*/

    //播放地址通用解析
    play_parse: true,
lazy: $js.toString(() => {
    let html = fetch(input);
    let kcode = html.match(/src="\/player\/mui-player\.php\?([^"]*)"/);
    
    if (kcode) {
        let kurl = kcode[1].split(',')[1];
        
        if (kurl && /\.(m3u8|mp4)/.test(kurl)) {
            input = { 
                jx: 0, 
                parse: 0, 
                url: kurl,  
                header: {
                    'User-Agent': MOBILE_UA,
                    'Referer': getHome(kurl)
                }
            }
        } else {
            input = { jx: 0, parse: 1, url: input }
        }
    }
}),

    
filter_def: {
        movie: {
            cateId: 'movie'
        },
        series: {
            cateId: 'series'
        },
        variety: {
            cateId: 'variety'
        },
        anime: {
            cateId: 'anime'
        },
        skit: {
            cateId: 'skit'
        },animation: {
            cateId: 'animation'
        },sports: {
            cateId: 'sports'
        }
    },
filter: {
  "movie": [
    {
      "key": "cateId",
      "name": "分类",
      "value": [
        {"n": "全部", "v": "all"},
        {"n": "动作片", "v": "Action"},
        {"n": "喜剧片", "v": "Funny"},
        {"n": "爱情片", "v": "Lovestory"},
        {"n": "科幻片", "v": "Science"},
        {"n": "恐怖片", "v": "terrorist"},
        {"n": "剧情片", "v": "plot"},
        {"n": "战争片", "v": "war"}
      ]
    },
    {
      "key": "area",
      "name": "地区",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "大陆", "v": "大陆"},
        {"n": "香港", "v": "香港"},
        {"n": "台湾", "v": "台湾"},
        {"n": "美国", "v": "美国"},
        {"n": "法国", "v": "法国"},
        {"n": "英国", "v": "英国"},
        {"n": "日本", "v": "日本"},
        {"n": "韩国", "v": "韩国"},
        {"n": "德国", "v": "德国"},
        {"n": "泰国", "v": "泰国"},
        {"n": "印度", "v": "印度"},
        {"n": "意大利", "v": "意大利"},
        {"n": "西班牙", "v": "西班牙"},
        {"n": "加拿大", "v": "加拿大"},
        {"n": "其他", "v": "其他"}
      ]
    },
    {
      "key": "year",
      "name": "年份",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "2024", "v": "2024"},
        {"n": "2023", "v": "2023"},
        {"n": "2022", "v": "2022"},
        {"n": "2021", "v": "2021"},
        {"n": "2020", "v": "2020"},
        {"n": "2019", "v": "2019"},
        {"n": "2018", "v": "2018"},
        {"n": "2017", "v": "2017"},
        {"n": "2016", "v": "2016"},
        {"n": "2015", "v": "2015"},
        {"n": "2014", "v": "2014"},
        {"n": "2013", "v": "2013"},
        {"n": "2012", "v": "2012"},
        {"n": "2011", "v": "2011"},
        {"n": "2010", "v": "2010"},
        {"n": "2009", "v": "2009"},
        {"n": "2008", "v": "2008"}
      ]
    },
    {
      "key": "letter",
      "name": "字母",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "A", "v": "A"},
        {"n": "B", "v": "B"},
        {"n": "C", "v": "C"},
        {"n": "D", "v": "D"},
        {"n": "E", "v": "E"},
        {"n": "F", "v": "F"},
        {"n": "G", "v": "G"},
        {"n": "H", "v": "H"},
        {"n": "I", "v": "I"},
        {"n": "J", "v": "J"},
        {"n": "K", "v": "K"},
        {"n": "L", "v": "L"},
        {"n": "M", "v": "M"},
        {"n": "N", "v": "N"},
        {"n": "O", "v": "O"},
        {"n": "P", "v": "P"},
        {"n": "Q", "v": "Q"},
        {"n": "R", "v": "R"},
        {"n": "S", "v": "S"},
        {"n": "T", "v": "T"},
        {"n": "U", "v": "U"},
        {"n": "V", "v": "V"},
        {"n": "W", "v": "W"},
        {"n": "X", "v": "X"},
        {"n": "Y", "v": "Y"},
        {"n": "Z", "v": "Z"},
        {"n": "0-9", "v": "0-9"}
      ]
    },{
        "key": "by",
        "name": "排序",
        "value": [
          {"n": "时间", "v": "time"},
          {"n": "人气", "v": "hits"},
          {"n": "评分", "v": "score"}
        ]
      }
  ],
  "series": [
    {
      "key": "cateId",
      "name": "分类",
      "value": [
          {"n": "全部", "v": ""},
    {"n": "国产剧", "v": "china"},
    {"n": "香港剧", "v": "hongkong"},
    {"n": "韩国剧", "v": "korea"},
    {"n": "欧美剧", "v": "eus"},
    {"n": "日本剧", "v": "japan"},
    {"n": "台湾剧", "v": "taiwan"},
    {"n": "海外剧", "v": "overseas"}
]

    },
    {
      "key": "area",
      "name": "地区",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "大陆", "v": "大陆"},
        {"n": "香港", "v": "香港"},
        {"n": "台湾", "v": "台湾"},
        {"n": "美国", "v": "美国"},
        {"n": "法国", "v": "法国"},
        {"n": "英国", "v": "英国"},
        {"n": "日本", "v": "日本"},
        {"n": "韩国", "v": "韩国"},
        {"n": "德国", "v": "德国"},
        {"n": "泰国", "v": "泰国"},
        {"n": "印度", "v": "印度"},
        {"n": "意大利", "v": "意大利"},
        {"n": "西班牙", "v": "西班牙"},
        {"n": "加拿大", "v": "加拿大"},
        {"n": "其他", "v": "其他"}
      ]
    },
    {
      "key": "year",
      "name": "年份",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "2024", "v": "2024"},
        {"n": "2023", "v": "2023"},
        {"n": "2022", "v": "2022"},
        {"n": "2021", "v": "2021"},
        {"n": "2020", "v": "2020"},
        {"n": "2019", "v": "2019"},
        {"n": "2018", "v": "2018"},
        {"n": "2017", "v": "2017"},
        {"n": "2016", "v": "2016"},
        {"n": "2015", "v": "2015"},
        {"n": "2014", "v": "2014"},
        {"n": "2013", "v": "2013"},
        {"n": "2012", "v": "2012"},
        {"n": "2011", "v": "2011"},
        {"n": "2010", "v": "2010"},
        {"n": "2009", "v": "2009"},
        {"n": "2008", "v": "2008"}
      ]
    },
    {
      "key": "letter",
      "name": "字母",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "A", "v": "A"},
        {"n": "B", "v": "B"},
        {"n": "C", "v": "C"},
        {"n": "D", "v": "D"},
        {"n": "E", "v": "E"},
        {"n": "F", "v": "F"},
        {"n": "G", "v": "G"},
        {"n": "H", "v": "H"},
        {"n": "I", "v": "I"},
        {"n": "J", "v": "J"},
        {"n": "K", "v": "K"},
        {"n": "L", "v": "L"},
        {"n": "M", "v": "M"},
        {"n": "N", "v": "N"},
        {"n": "O", "v": "O"},
        {"n": "P", "v": "P"},
        {"n": "Q", "v": "Q"},
        {"n": "R", "v": "R"},
        {"n": "S", "v": "S"},
        {"n": "T", "v": "T"},
        {"n": "U", "v": "U"},
        {"n": "V", "v": "V"},
        {"n": "W", "v": "W"},
        {"n": "X", "v": "X"},
        {"n": "Y", "v": "Y"},
        {"n": "Z", "v": "Z"},
        {"n": "0-9", "v": "0-9"}
      ]
    },{
        "key": "by",
        "name": "排序",
        "value": [
          {"n": "时间", "v": "time"},
          {"n": "人气", "v": "hits"},
          {"n": "评分", "v": "score"}
        ]
      }
  ],
  "variety": [
    {
      "key": "cateId",
      "name": "分类",
      "value": [
        {"n": "全部", "v": "all"},
{"n": "大陆", "v": "cn"},{"n": "日韩", "v": "JapanKorea"},{"n": "港台", "v": "HongKongTaiwan"},{"n": "欧美", "v": "Eusa"},
      ]
    },
    {
      "key": "area",
      "name": "地区",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "大陆", "v": "大陆"},
        {"n": "香港", "v": "香港"},
        {"n": "台湾", "v": "台湾"},
        {"n": "美国", "v": "美国"},
        {"n": "法国", "v": "法国"},
        {"n": "英国", "v": "英国"},
        {"n": "日本", "v": "日本"},
        {"n": "韩国", "v": "韩国"},
        {"n": "德国", "v": "德国"},
        {"n": "泰国", "v": "泰国"},
        {"n": "印度", "v": "印度"},
        {"n": "意大利", "v": "意大利"},
        {"n": "西班牙", "v": "西班牙"},
        {"n": "加拿大", "v": "加拿大"},
        {"n": "其他", "v": "其他"}
      ]
    },
    {
      "key": "year",
      "name": "年份",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "2024", "v": "2024"},
        {"n": "2023", "v": "2023"},
        {"n": "2022", "v": "2022"},
        {"n": "2021", "v": "2021"},
        {"n": "2020", "v": "2020"},
        {"n": "2019", "v": "2019"},
        {"n": "2018", "v": "2018"},
        {"n": "2017", "v": "2017"},
        {"n": "2016", "v": "2016"},
        {"n": "2015", "v": "2015"},
        {"n": "2014", "v": "2014"},
        {"n": "2013", "v": "2013"},
        {"n": "2012", "v": "2012"},
        {"n": "2011", "v": "2011"},
        {"n": "2010", "v": "2010"},
        {"n": "2009", "v": "2009"},
        {"n": "2008", "v": "2008"}
      ]
    },
    {
      "key": "letter",
      "name": "字母",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "A", "v": "A"},
        {"n": "B", "v": "B"},
        {"n": "C", "v": "C"},
        {"n": "D", "v": "D"},
        {"n": "E", "v": "E"},
        {"n": "F", "v": "F"},
        {"n": "G", "v": "G"},
        {"n": "H", "v": "H"},
        {"n": "I", "v": "I"},
        {"n": "J", "v": "J"},
        {"n": "K", "v": "K"},
        {"n": "L", "v": "L"},
        {"n": "M", "v": "M"},
        {"n": "N", "v": "N"},
        {"n": "O", "v": "O"},
        {"n": "P", "v": "P"},
        {"n": "Q", "v": "Q"},
        {"n": "R", "v": "R"},
        {"n": "S", "v": "S"},
        {"n": "T", "v": "T"},
        {"n": "U", "v": "U"},
        {"n": "V", "v": "V"},
        {"n": "W", "v": "W"},
        {"n": "X", "v": "X"},
        {"n": "Y", "v": "Y"},
        {"n": "Z", "v": "Z"},
        {"n": "0-9", "v": "0-9"}
      ]
    },{
        "key": "by",
        "name": "排序",
        "value": [
          {"n": "时间", "v": "time"},
          {"n": "人气", "v": "hits"},
          {"n": "评分", "v": "score"}
        ]
      }
  ],

  "anime": [
    {
      "key": "cateId",
      "name": "分类",
      "value": [
    {"n": "全部", "v": "all"},
    {"n": "国产", "v": "chn"},
    {"n": "日本", "v": "jp"},
    {"n": "欧美", "v": "usa"},
    {"n": "海外", "v": "others"}
]
    },
    {
      "key": "area",
      "name": "地区",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "大陆", "v": "大陆"},
        {"n": "香港", "v": "香港"},
        {"n": "台湾", "v": "台湾"},
        {"n": "美国", "v": "美国"},
        {"n": "法国", "v": "法国"},
        {"n": "英国", "v": "英国"},
        {"n": "日本", "v": "日本"},
        {"n": "韩国", "v": "韩国"},
        {"n": "德国", "v": "德国"},
        {"n": "泰国", "v": "泰国"},
        {"n": "印度", "v": "印度"},
        {"n": "意大利", "v": "意大利"},
        {"n": "西班牙", "v": "西班牙"},
        {"n": "加拿大", "v": "加拿大"},
        {"n": "其他", "v": "其他"}
      ]
    },
    {
      "key": "year",
      "name": "年份",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "2024", "v": "2024"},
        {"n": "2023", "v": "2023"},
        {"n": "2022", "v": "2022"},
        {"n": "2021", "v": "2021"},
        {"n": "2020", "v": "2020"},
        {"n": "2019", "v": "2019"},
        {"n": "2018", "v": "2018"},
        {"n": "2017", "v": "2017"},
        {"n": "2016", "v": "2016"},
        {"n": "2015", "v": "2015"},
        {"n": "2014", "v": "2014"},
        {"n": "2013", "v": "2013"},
        {"n": "2012", "v": "2012"},
        {"n": "2011", "v": "2011"},
        {"n": "2010", "v": "2010"},
        {"n": "2009", "v": "2009"},
        {"n": "2008", "v": "2008"}
      ]
    },
    {
      "key": "letter",
      "name": "字母",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "A", "v": "A"},
        {"n": "B", "v": "B"},
        {"n": "C", "v": "C"},
        {"n": "D", "v": "D"},
        {"n": "E", "v": "E"},
        {"n": "F", "v": "F"},
        {"n": "G", "v": "G"},
        {"n": "H", "v": "H"},
        {"n": "I", "v": "I"},
        {"n": "J", "v": "J"},
        {"n": "K", "v": "K"},
        {"n": "L", "v": "L"},
        {"n": "M", "v": "M"},
        {"n": "N", "v": "N"},
        {"n": "O", "v": "O"},
        {"n": "P", "v": "P"},
        {"n": "Q", "v": "Q"},
        {"n": "R", "v": "R"},
        {"n": "S", "v": "S"},
        {"n": "T", "v": "T"},
        {"n": "U", "v": "U"},
        {"n": "V", "v": "V"},
        {"n": "W", "v": "W"},
        {"n": "X", "v": "X"},
        {"n": "Y", "v": "Y"},
        {"n": "Z", "v": "Z"},
        {"n": "0-9", "v": "0-9"}
      ]
    },{
        "key": "by",
        "name": "排序",
        "value": [
          {"n": "时间", "v": "time"},
          {"n": "人气", "v": "hits"},
          {"n": "评分", "v": "score"}
        ]
      }
  ],

  "animation": [
    {
      "key": "area",
      "name": "地区",
      "value": [
        {"n": "全部", "v": "all"},

    {"n": "大陆动画片", "v": "大陆"},
    {"n": "日本动画片", "v": "日本"},
    {"n": "美国动画片", "v": "美国"},
    {"n": "韩国动画片", "v": "韩国"},
    {"n": "香港动画片", "v": "香港"},
    {"n": "台湾动画片", "v": "台湾"},
    {"n": "法国动画片", "v": "法国"},
    {"n": "英国动画片", "v": "英国"},
    {"n": "德国动画片", "v": "德国"},
    {"n": "泰国动画片", "v": "泰国"}
]

    },
    {
      "key": "area",
      "name": "地区",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "大陆", "v": "大陆"},
        {"n": "香港", "v": "香港"},
        {"n": "台湾", "v": "台湾"},
        {"n": "美国", "v": "美国"},
        {"n": "法国", "v": "法国"},
        {"n": "英国", "v": "英国"},
        {"n": "日本", "v": "日本"},
        {"n": "韩国", "v": "韩国"},
        {"n": "德国", "v": "德国"},
        {"n": "泰国", "v": "泰国"},
        {"n": "印度", "v": "印度"},
        {"n": "意大利", "v": "意大利"},
        {"n": "西班牙", "v": "西班牙"},
        {"n": "加拿大", "v": "加拿大"},
        {"n": "其他", "v": "其他"}
      ]
    },
    {
      "key": "year",
      "name": "年份",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "2024", "v": "2024"},
        {"n": "2023", "v": "2023"},
        {"n": "2022", "v": "2022"},
        {"n": "2021", "v": "2021"},
        {"n": "2020", "v": "2020"},
        {"n": "2019", "v": "2019"},
        {"n": "2018", "v": "2018"},
        {"n": "2017", "v": "2017"},
        {"n": "2016", "v": "2016"},
        {"n": "2015", "v": "2015"},
        {"n": "2014", "v": "2014"},
        {"n": "2013", "v": "2013"},
        {"n": "2012", "v": "2012"},
        {"n": "2011", "v": "2011"},
        {"n": "2010", "v": "2010"},
        {"n": "2009", "v": "2009"},
        {"n": "2008", "v": "2008"}
      ]
    },
    {
      "key": "letter",
      "name": "字母",
      "value": [
        {"n": "全部", "v": ""},
        {"n": "A", "v": "A"},
        {"n": "B", "v": "B"},
        {"n": "C", "v": "C"},
        {"n": "D", "v": "D"},
        {"n": "E", "v": "E"},
        {"n": "F", "v": "F"},
        {"n": "G", "v": "G"},
        {"n": "H", "v": "H"},
        {"n": "I", "v": "I"},
        {"n": "J", "v": "J"},
        {"n": "K", "v": "K"},
        {"n": "L", "v": "L"},
        {"n": "M", "v": "M"},
        {"n": "N", "v": "N"},
        {"n": "O", "v": "O"},
        {"n": "P", "v": "P"},
        {"n": "Q", "v": "Q"},
        {"n": "R", "v": "R"},
        {"n": "S", "v": "S"},
        {"n": "T", "v": "T"},
        {"n": "U", "v": "U"},
        {"n": "V", "v": "V"},
        {"n": "W", "v": "W"},
        {"n": "X", "v": "X"},
        {"n": "Y", "v": "Y"},
        {"n": "Z", "v": "Z"},
        {"n": "0-9", "v": "0-9"}
      ]
    },{
        "key": "by",
        "name": "排序",
        "value": [
          {"n": "时间", "v": "time"},
          {"n": "人气", "v": "hits"},
          {"n": "评分", "v": "score"}
        ]
      }
  ],
  "skit": [
    
{
        "key": "by",
        "name": "排序",
        "value": [
          {"n": "时间", "v": "time"},
          {"n": "人气", "v": "hits"},
          {"n": "评分", "v": "score"}
        ]
      }
  ],
    "sports": [
    
{
        "key": "cateId",
        "name": "分类",
        "value": [
        {"n": "全部", "v": ""},
        {"n": "足球", "v": "football"},{"n": "篮球", "v": "basketball"},{"n": "网球", "v": "tennis"},{"n": "斯诺克", "v": "snooker"}]
      }
  ]
}

    //搜索: '数组;标题;图片;副标题;链接',
}