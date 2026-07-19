/*
* @File     : 萝莉屋.js
* @Author   : AI Assistant
* @Date     : 2026-04-18
* @Comments : 萝莉屋视频网站爬虫源 - 简洁实用版，提供网站导航和信息
@header({
  searchable: 0,
  filterable: 0,
  quickSearch: 0,
  title: '萝莉屋',
  类型: '影视',
  lang: 'ds',
})
*/

var rule = {
    // 源信息配置
    类型: '影视',
    title: '萝莉屋',
    host: 'https://uazvf.cc',
    homeUrl: '/uu/',
    url: '/uu/',
    searchUrl: '',
    searchable: 0,
    quickSearch: 0,
    filterable: 0,
    
    // 请求配置
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://uazvf.cc/uu/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    timeout: 10000,
    
    // 基础配置
    class_name: '网站导航',
    class_url: 'guide',
    play_parse: false,
    lazy: '',
    limit: 10,
    double: false,
    
    // 动态分类
    class_parse: async function() {
        return {
            class: [
                {type_name: '网站功能介绍', type_id: 'guide'},
                {type_name: '热门搜索词', type_id: 'hot'},
                {type_name: '验证码页面分类', type_id: 'captcha_categories'}
            ]
        };
    },
    
    // 预处理
    预处理: async function() {
        let { HOST } = this;
        log(`访问萝莉屋网站: ${HOST}`);
        return HOST;
    },
    
    // 一级分类页面
    一级: async function() {
        let { input, HOST } = this;
        log(`一级分类: ${input || 'guide'}`);
        
        let vods = [];
        
        if (input === 'guide' || !input) {
            // 网站功能介绍
            vods = [
                {
                    vod_name: '网站验证码入口',
                    vod_pic: '🔐',
                    vod_remarks: '点击查看',
                    vod_id: `${HOST}/uu/`
                },
                {
                    vod_name: '网站访问状态',
                    vod_pic: '⚠️',
                    vod_remarks: '点击查看',
                    vod_id: 'site_status'
                },
                {
                    vod_name: '网站防护机制说明',
                    vod_pic: '🛡️',
                    vod_remarks: '点击查看',
                    vod_id: 'protection_info'
                }
            ];
        } else if (input === 'hot') {
            // 热门搜索词
            const hotKeywords = [
                '张婉莹', '海安幼儿园', '阜阳父女', '厕所偷拍',
                '刘雨馨', '紫色面具', '小马拉大车', '我本初中',
                '校园霸凌', '初中'
            ];
            
            hotKeywords.forEach(keyword => {
                vods.push({
                    vod_name: `热搜: ${keyword}`,
                    vod_pic: '🔥',
                    vod_remarks: '热门搜索',
                    vod_id: `hot_search:${keyword}`
                });
            });
        } else if (input === 'captcha_categories') {
            // 验证码页面分类
            vods = [
                {vod_name: '国产呦呦', vod_pic: '🎬', vod_remarks: '需要验证', vod_id: 'category:guochanyouyou'},
                {vod_name: '呦女破处', vod_pic: '🎬', vod_remarks: '需要验证', vod_id: 'category:younvpouchu'},
                {vod_name: '福建兄妹', vod_pic: '🎬', vod_remarks: '需要验证', vod_id: 'category:fujianxiongmei'},
                {vod_name: '萝莉自慰', vod_pic: '🎬', vod_remarks: '需要验证', vod_id: 'category:luoliziwei'},
                {vod_name: '紫色面具', vod_pic: '🎬', vod_remarks: '需要验证', vod_id: 'category:ziseyanju'}
            ];
        }
        
        return vods;
    },
    
    // 二级详情页面
    二级: async function() {
        let { input, HOST } = this;
        log(`二级详情: ${input}`);
        
        const categories = {
            'guochanyouyou': '国产呦呦',
            'younvpouchu': '呦女破处',
            'fujianxiongmei': '福建兄妹',
            'luoliziwei': '萝莉自慰',
            'ziseyanju': '紫色面具'
        };
        
        // 处理分类信息
        if (input.startsWith('category:')) {
            let id = input.substring(9);
            let name = categories[id] || id;
            
            return {
                vod_name: `${name} - 视频分类`,
                vod_pic: '🎬',
                vod_remarks: '需要验证码访问',
                vod_content: `### ${name} 视频分类\n\n此分类需要完成网站验证码验证才能访问。\n\n**访问步骤:**\n1. 访问: ${HOST}/uu/\n2. 输入验证码（中文数字转阿拉伯数字）\n3. 完成验证后访问视频内容\n\n**注意:** 网站需要登录才能观看完整视频。`,
                vod_play_from: '验证码页面',
                vod_play_url: `访问验证码页面$$$${HOST}/uu/`
            };
        }
        
        // 处理热门搜索
        if (input.startsWith('hot_search:')) {
            let keyword = input.substring(11);
            
            return {
                vod_name: `热门搜索: ${keyword}`,
                vod_pic: '🔥',
                vod_remarks: '搜索词',
                vod_content: `### 热门搜索词: ${keyword}\n\n此搜索词在网站上非常流行，但搜索功能需要登录才能使用。\n\n**网站信息:**\n- 网站地址: ${HOST}\n- 验证码页面: ${HOST}/uu/\n- 首页(需登录): ${HOST}/uu/shou.html\n\n**温馨提示:** 请遵守相关法律法规，健康上网。`,
                vod_play_from: '网站链接',
                vod_play_url: `验证码页面$$$${HOST}/uu/&\n网站首页$$$${HOST}/uu/shou.html`
            };
        }
        
        // 其他预定义页面
        switch (input) {
            case `${HOST}/uu/`:
                return {
                    vod_name: '网站验证码页面',
                    vod_pic: '🔐',
                    vod_remarks: '重要入口',
                    vod_content: `### 萝莉屋验证码页面\n\n这是网站的验证码入口页面，需要通过验证才能继续访问。\n\n**验证码提示:** 验证码显示为中文数字（如一、二、三），需要转换为对应的阿拉伯数字（1、2、3）输入。\n\n**示例:** 如果显示"一四"，请输入"14"\n\n**直接访问地址:** ${input}`,
                    vod_play_from: '验证码入口',
                    vod_play_url: `前往验证$$$${input}`
                };
                
            case 'site_status':
                return {
                    vod_name: '网站访问状态',
                    vod_pic: '🌐',
                    vod_remarks: '状态信息',
                    vod_content: `### 网站访问状态信息\n\n**域名:** ${HOST}\n**状态:** 可正常访问，但有防护机制\n**防护措施:** 验证码验证 + 登录要求\n**游客权限:** 有限，需验证码进入\n\n**网站结构:**\n1. 验证码页面: ${HOST}/uu/\n2. 首页(需登录): ${HOST}/uu/shou.html\n\n**说明:** 网站采用了多层防护机制保护内容。`,
                    vod_play_from: '链接',
                    vod_play_url: `验证码页面$$$${HOST}/uu/&\n网站首页$$$${HOST}/uu/shou.html`
                };
                
            case 'protection_info':
                return {
                    vod_name: '网站防护机制',
                    vod_pic: '🛡️',
                    vod_remarks: '安全说明',
                    vod_content: `### 萝莉屋网站防护机制\n\n网站采用多层安全防护：\n\n**第一层: 验证码防护**\n- 中文数字验证码\n- 需要转换为阿拉伯数字\n- 防止自动化脚本访问\n\n**第二层: 登录要求**\n- 搜索功能需要登录\n- 视频播放需要登录\n- 完整浏览需要账号\n\n**第三层: 游客限制**\n- 游客只能看到验证码页面\n- 热门搜索词展示但无法搜索\n- 视频分类可见但无法播放\n\n**说明:** 这些机制用于保护网站内容和遵守相关法律法规。`,
                    vod_play_from: '相关信息',
                    vod_play_url: `验证码页面$$$${HOST}/uu/`
                };
                
            default:
                return {
                    vod_name: '萝莉屋视频网站',
                    vod_pic: '🎥',
                    vod_remarks: '信息页面',
                    vod_content: `### 萝莉屋视频网站\n\n**网站地址:** ${HOST}\n**验证页面:** ${HOST}/uu/\n**首页(需登录):** ${HOST}/uu/shou.html\n\n**热门搜索词:** 张婉莹, 海安幼儿园, 阜阳父女, 厕所偷拍, 刘雨馨, 紫色面具, 小马拉大车, 我本初中, 校园霸凌, 初中等\n\n**验证码页面分类:** 国产呦呦, 呦女破处, 福建兄妹, 萝莉自慰, 紫色面具\n\n**注意事项:** 请遵守国家法律法规，健康文明上网。`,
                    vod_play_from: '网站链接',
                    vod_play_url: `验证码页面$$$${HOST}/uu/&\n网站首页$$$${HOST}/uu/shou.html`
                };
        }
    },
    
    // 首页推荐
    推荐: async function() {
        return [
            {
                vod_name: '网站验证码入口',
                vod_pic: '🔐',
                vod_remarks: '重要入口',
                vod_id: 'guide'
            },
            {
                vod_name: '热门搜索词展示',
                vod_pic: '🔥',
                vod_remarks: '查看热搜',
                vod_id: 'hot'
            },
            {
                vod_name: '验证码页面分类',
                vod_pic: '🎬',
                vod_remarks: '视频分类',
                vod_id: 'captcha_categories'
            },
            {
                vod_name: '紫色面具(热门)',
                vod_pic: '🎭',
                vod_remarks: '热词示例',
                vod_id: 'hot_search:紫色面具'
            }
        ];
    }
}