/*
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    // 影视|漫画|小说
    类型: '影视',
    // 源主页链接作为推荐入口
    homeUrl: '/',
    // 反爬核查 premier 弹窗
    headers: {
        'User-Agent': 'Spider-Access',
        'Accept-Encoding': 'none',                       // 关闭压缩
        'X-Requested-With': 'XMLHttpRequest'              // 报头设置
    },

    // 搜索验证
    搜索: async function () {
        let res = await req(this.input, {
            headers: {
                'Referer': this.host
            }
        });
        
        // 解析搜索结果
        let items = res.html('.list .item', {
            title: 'a&&title',
            link: 'a&&href'
        });
        
        // 处理反爬逻辑
        if (items.length === 0) {
            res = await req(this.input, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
                }
            });
            items = res.html('.search-result .item', {
                title: 'a&&title',
                link: 'a&&href',
            });
        }
        
        return {
            list: items,
            hasNext: res.has('.pagination span:eq(-2)', 'textContent', '下一页')
        }
    }
};