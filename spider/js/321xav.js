/*
* @File     : 321xav.js
* @Author   : user
* @Date     : 2026-04-20
* @Comments : 321AV网站爬虫
@header({
  searchable: 1,
  filterable: 0,
  quickSearch: 0,
  title: '321AV',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    类型: '影视',
    title: '321AV',
    host: 'https://www.321xav.top',
    homeUrl: '/enter',
    url: '/vodtype/fyclass/fypage.html',
    searchUrl: '/vod/search.html?wd=**&page=fypage',
    headers: {'User-Agent': 'UC_UA'},
    searchable: 1,
    quickSearch: 0,
    filterable: 0,
    double: false,
    play_parse: true,
    limit: 6,
    class_name: '有码影片&无码影片&中文字幕',
    class_url: '20&21&22',
    
    lazy: function () {
        let {input} = this;
        // 处理空值情况
        if (!input) {
            return '';
        }
        // 去除播放地址中的反引号和空白字符
        let url = input.replace(/[`]/g, '').trim();
        // 提取有效的URL
        const urlMatch = url.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            url = urlMatch[0];
        }
        // 移除重复的host部分
        if (url.includes('https://www.321xav.top/https://www.321xav.top')) {
            url = url.replace('https://www.321xav.top/https://www.321xav.top', 'https://www.321xav.top');
        }
        return url;
    },
    
    推荐: '.grid .thumbnail.group;a.text-secondary&&Text;img.thumbnail-poster&&data-src;span.absolute&&Text;a.text-secondary&&href',
    一级: '.grid .thumbnail.group;a.text-secondary&&Text;img.thumbnail-poster&&data-src;span.absolute&&Text;a.text-secondary&&href',
    二级: function () {
        let {input, pdfa, pdfh} = this;
        let VOD = {};
        
        // 处理播放地址，确保格式正确
        let playUrl = input || '';
        
        // 尝试URL解码
        try {
            playUrl = decodeURIComponent(playUrl);
        } catch (e) {
            // 解码失败，使用原始URL
        }
        
        // 去除反引号和空白字符
        playUrl = playUrl.replace(/[`]/g, '').trim();
        
        // 提取有效的URL
        const urlMatch = playUrl.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
            playUrl = urlMatch[0];
        }
        
        // 移除重复的host部分
        if (playUrl.includes('https://www.321xav.top/https://www.321xav.top')) {
            playUrl = playUrl.replace('https://www.321xav.top/https://www.321xav.top', 'https://www.321xav.top');
        }
        
        // 从页面内容中提取播放地址
        if (pdfa && typeof pdfa === 'string') {
            try {
                // 查找包含播放地址的iframe
                const iframeMatch = pdfa.match(/<iframe[^>]+src="([^"]+)"/i);
                if (iframeMatch && iframeMatch[1]) {
                    let iframeUrl = iframeMatch[1];
                    // 处理相对路径
                    if (!iframeUrl.startsWith('http')) {
                        iframeUrl = this.host + iframeUrl;
                    }
                    playUrl = iframeUrl;
                }
                
                // 查找包含播放地址的script标签
                const scriptMatch = pdfa.match(/player\.src\(["\']([^"\']+)["\']\)/i);
                if (scriptMatch && scriptMatch[1]) {
                    playUrl = scriptMatch[1];
                }
                
                // 查找包含播放地址的其他可能格式
                const sourceMatch = pdfa.match(/<source[^>]+src="([^"]+)"/i);
                if (sourceMatch && sourceMatch[1]) {
                    let sourceUrl = sourceMatch[1];
                    if (!sourceUrl.startsWith('http')) {
                        sourceUrl = this.host + sourceUrl;
                    }
                    playUrl = sourceUrl;
                }
                
                // 查找包含播放地址的其他可能格式
                const embedMatch = pdfa.match(/<embed[^>]+src="([^"]+)"/i);
                if (embedMatch && embedMatch[1]) {
                    let embedUrl = embedMatch[1];
                    if (!embedUrl.startsWith('http')) {
                        embedUrl = this.host + embedUrl;
                    }
                    playUrl = embedUrl;
                }
            } catch (e) {
                // 提取失败，使用处理后的原始URL
            }
        }
        
        // 确保playUrl不为空
        if (!playUrl) {
            playUrl = input || '';
        }
        
        // 设置基本信息
        VOD.vod_name = '视频标题';
        VOD.vod_pic = '';
        VOD.vod_content = '视频简介';
        VOD.type_name = '类型';
        VOD.vod_year = '年份';
        VOD.vod_area = '地区';
        VOD.vod_remarks = '更新信息';
        VOD.vod_actor = '主演';
        VOD.vod_director = '导演';
        
        // 设置播放源信息
        VOD.vod_play_from = '默认';
        VOD.vod_play_url = playUrl;
        
        return VOD;
    },
    搜索: '.grid .thumbnail.group;a.text-secondary&&Text;img.thumbnail-poster&&data-src;span.absolute&&Text;a.text-secondary&&href'
}
