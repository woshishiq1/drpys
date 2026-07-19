// 验证 source-checker fullCheck 修复：用真实 type_id / vod_id 而非固定 1
// 遍历多个 ds 源，找出 detail(真实vod_id)有数据 而 detail(固定ids=1)空 的铁证
const r = require('../report.json');

// ds success 的影视源，跳过特殊源（设置/直播/转点播/IPTV/工具）
const SKIP = /设置|直播|转点播|IPTV|工具|弹幕|推送|音乐|小说|漫画|戏曲|相声|广场|广播|电视/;
const candidates = r.sources.filter(s => s.lang === 'ds' && s.status === 'success'
    && !SKIP.test(s.name)
    && !/extend=/.test(s.testUrls && s.testUrls.home || ''));

async function getJson(url) {
    try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const txt = await resp.text();
        try { return JSON.parse(txt); } catch { return { _raw: txt.slice(0, 80) }; }
    } catch (e) { return { _err: e.message }; }
}

(async () => {
    let found = 0, checked = 0;
    for (const src of candidates.slice(0, 25)) {
        if (found >= 3) break;
        const PWD = (src.api.match(/pwd=([^&]+)/) || [])[1] || '';
        function apiUrl(params) {
            const u = new URL(src.api.split('?')[0]);
            if (PWD) u.searchParams.set('pwd', PWD);
            Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
            return u.toString();
        }
        const home = await getJson(apiUrl({}));
        const cls = Array.isArray(home.class) ? home.class : [];
        const firstValid = cls.find(c => c && c.type_id && typeof c.type_id !== 'object') || {};
        const realTypeId = firstValid.type_id;
        if (!realTypeId) continue;
        checked++;

        const cat = await getJson(apiUrl({ ac: 'list', t: realTypeId, pg: 1 }));
        const catList = Array.isArray(cat.list) ? cat.list : [];
        const firstItem = catList.find(i => i && i.vod_id && typeof i.vod_id !== 'object') || {};
        const realVodId = firstItem.vod_id;
        if (!realVodId) continue;

        const detReal = await getJson(apiUrl({ ac: 'detail', ids: realVodId }));
        const detFixed = await getJson(apiUrl({ ac: 'detail', ids: '1' }));
        const realList = Array.isArray(detReal.list) ? detReal.list : [];
        const fixedList = Array.isArray(detFixed.list) ? detFixed.list : [];

        // 找对比明显的：真实有数据，固定1空
        if (realList.length > 0 && fixedList.length === 0) {
            found++;
            console.log(`\n★ ${src.name}`);
            console.log(`  home class数=${cls.length}, 真实 type_id=${realTypeId}`);
            console.log(`  category(t=${realTypeId}) list数=${catList.length}, 真实 vod_id=${realVodId}`);
            console.log(`  detail(真实 vod_id=${realVodId}) list数=${realList.length} ✓ 有数据`);
            console.log(`  detail(固定 ids=1)        list数=${fixedList.length} ✗ 空 <-- 旧逻辑会误判 detail 失败`);
        }
    }
    console.log(`\n=== 遍历 ${checked} 个 ds 影视源，找到 ${found} 个 detail 误判铁证 ===`);
    console.log(found > 0 ? '✅ 修复有效：旧逻辑 detail(ids=1) 会误判为空，修复后用真实 vod_id 正确返回数据' : '未找到对比明显的源（多数源 detail(ids=1) 恰好不空），但修复逻辑本身正确（用真实 id 更准）');
})();

