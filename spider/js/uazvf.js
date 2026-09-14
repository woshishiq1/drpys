/*
* @File     : uazvf.js
* @Author   : user
* @Date     : 2026-04-18
* @Comments : 萝莉屋网站爬虫，处理登录限制
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '萝莉屋',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    // 影视|漫画|小说
    类型: '影视',
    // 源标题
    title: '萝莉屋',
    // 源主域名，可以自动处理后续链接的相对路径
    host: 'https://uazvf.cc',
    // 源主页链接，作为推荐的this.input
    homeUrl: '/uu/shou.html',
    // 源一级列表链接 (fyclass=分类, fypage=页码)
    url: '/uu/shou.html', 
    // 源搜索链接 (**=关键词, fypage=页码)
    searchUrl: '/uu/shou.html',
    // 允许搜索(1)、允许快搜(1)、允许筛选(1)
    searchable: 1, 
    quickSearch: 0, 
    filterable: 0, 
    // 源默认请求头、调用await request如果参数二不填会自动添加
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://uazvf.cc/uu/shou.html'
    },
    // 接口访问超时时间
    timeout: 10000,
    // 静态分类名称
    class_name: '默认',
    // 静态分类id
    class_url: '1',
    
    // 是否需要调用免嗅lazy函数 (服务器解析播放)
    play_parse: false,
    // 免嗅lazy执行函数 (如果play_parse为true则需要)
    lazy: '',
    // 首页推荐显示数量
    limit: 10,
    // 是否双层列表定位,默认false
    double: false,
    
    // 推荐列表解析: 列表;标题;图片;描述;链接
    推荐: '.search-container;a&&placeholder;img&&src;span&&Text;a&&href',
    // 一级列表解析: 列表;标题;图片;描述;链接
    一级: '.search-container;a&&placeholder;img&&src;span&&Text;a&&href',
    // 二级详情解析 (字典模式)
    二级: {
        "title": "h2&&Text",
        "img": "img&&src",
        "desc": ".popup h2&&Text",
        "content": ".container&&Text",
        "tabs": ".popup a",
        "lists": ".popup"
    },
    // 搜索结果解析: 列表;标题;图片;描述;链接
    搜索: '.search-container;a&&placeholder;img&&src;span&&Text;a&&href',

    /**
     * 高级函数用法
     */
    
    // 预处理 (初始化时执行一次，用于获取cookie等)
    预处理: async function () {
        let {HOST} = this;
        // 尝试获取首页内容，检查是否需要登录
        let res = await this.request(HOST + this.homeUrl);
        if (res.includes('游客身份:无访问权限')) {
            console.log('需要登录才能访问该网站');
            // 这里可以添加自动登录逻辑
            // 例如：模拟登录表单提交
        }
        return HOST;
    },
    
    // 自定义推荐列表解析
    推荐: async function () {
        let {input} = this;
        let res = await this.request(input);
        
        // 检查是否需要登录
        if (res.includes('游客身份:无访问权限')) {
            return [{
                vod_name: '需要登录',
                vod_pic: '',
                vod_remarks: '请先登录后访问',
                vod_id: '/uu/login.html'
            }];
        }
        
        // 解析页面内容
        let $ = this.cheerio.load(res);
        let results = [];
        
        // 获取搜索框提示
        let placeholder = $('#searchInput').attr('placeholder') || '搜索';
        
        results.push({
            vod_name: '搜索',
            vod_pic: $('img').first().attr('src') || '',
            vod_remarks: placeholder,
            vod_id: '/uu/shou.html'
        });
        
        // 获取热搜词
        $('#myDropdown a').each((i, el) => {
            let title = $(el).text();
            results.push({
                vod_name: title,
                vod_pic: '',
                vod_remarks: '热搜',
                vod_id: '/uu/shou.html'
            });
        });
        
        return results;
    },
    
    // 自定义一级列表解析
    一级: async function () {
        return this.推荐();
    },
    
    // 自定义二级详情解析
    二级: async function () {
        let {input} = this;
        let res = await this.request(input);
        
        let $ = this.cheerio.load(res);
        
        return {
            vod_name: '萝莉屋',
            vod_pic: $('img').first().attr('src') || '',
            type_name: '默认',
            vod_year: '',
            vod_area: '',
            vod_actors: '',
            vod_director: '',
            vod_content: '需要登录才能访问',
            vod_play_from: '登录',
            vod_play_url: '登录$' + input
        };
    },
    
    // 自定义搜索解析
    搜索: async function () {
        let {input} = this;
        // 搜索需要登录，返回登录提示
        return [{
            vod_name: '搜索需要登录',
            vod_pic: '',
            vod_remarks: '请先登录后搜索',
            vod_id: '/uu/login.html'
        }];
    }
}
