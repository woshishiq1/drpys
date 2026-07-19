/*
@header({
  title: '网抑云[听]',
  author: '',
  more: {
    sourceTag: "音乐,MV,评论",
    errorPlayNext: true
  },
  '类型': '音乐',
  logo: 'https://s1.music.126.net/style/favicon.ico?v20180823',
  lang: 'cat'
})
*/

let host = 'https://ncm.zhenxin.me';
let play_api = 'https://oiapi.net/api/Music_163';
let headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36',
    'Referer': 'https://music.163.com/'
};

const init = async () => {
};

const generateFilters = () => {
    return {
        "cat_lang": [{
            "key": "cat",
            "name": "语种",
            "value": [{"n": "华语", "v": "华语"}, {"n": "欧美", "v": "欧美"}, {"n": "日语", "v": "日语"}, {
                "n": "韩语",
                "v": "韩语"
            }, {"n": "粤语", "v": "粤语"}, {"n": "全部", "v": "全部"}]
        }],
        "cat_style": [{
            "key": "cat",
            "name": "风格",
            "value": [{"n": "流行", "v": "流行"}, {"n": "摇滚", "v": "摇滚"}, {"n": "民谣", "v": "民谣"}, {
                "n": "电子",
                "v": "电子"
            }, {"n": "说唱", "v": "说唱"}, {"n": "轻音乐", "v": "轻音乐"}, {"n": "古风", "v": "古风"}]
        }]
    };
};

const home = async () => {
    const classes = [
        {type_id: "toplist", type_name: "排行榜"},
        {type_id: "recommend_playlist", type_name: "推荐歌单"},
        {type_id: "hot_playlist", type_name: "热门歌单"},
        {type_id: "top_artists", type_name: "热门歌手"},
        {type_id: "mv", type_name: "推荐MV"}
    ];

    const url = host + '/personalized?limit=30';
    let res = await req(url, {headers});
    let json = JSON.parse(res.content || res);
    let list = (json.result || []).map(it => ({
        vod_name: it.name,
        vod_pic: it.picUrl || it.coverImgUrl,
        vod_remarks: it.playCount ? '🎧 ' + formatCount(it.playCount) : '',
        vod_id: 'playlist_' + it.id
    }));

    return JSON.stringify({
        class: classes,
        filters: generateFilters(),
        list: list
    });
};

const category = async (tid, pg, filter, extend) => {
    let limit = 20;
    let offset = (pg - 1) * limit;
    let cat = extend.cat || '全部';

    let url = '';
    if (tid === 'toplist') url = `${host}/toplist`;
    else if (tid === 'recommend_playlist') url = `${host}/personalized?limit=${limit}`;
    else if (tid === 'hot_playlist') url = `${host}/top/playlist?cat=${encodeURIComponent(cat)}&limit=${limit}&offset=${offset}`;
    else if (tid === 'top_artists') url = `${host}/top/artists?limit=${limit}&offset=${offset}`;
    else if (tid === 'mv') url = `${host}/mv/all?limit=${limit}&offset=${offset}`;

    let res = await req(url, {headers});
    let json = JSON.parse(res.content || res);
    let rawList = json.list || json.result || json.playlists || json.artists || json.data || [];

    let list = rawList.map(it => {
        let idPrefix = 'playlist_';
        if (tid === 'toplist') idPrefix = 'toplist_';
        else if (tid === 'top_artists') idPrefix = 'artist_';
        else if (tid === 'mv') idPrefix = 'mv_';

        return {
            vod_name: it.name || it.title,
            vod_pic: it.coverImgUrl || it.picUrl || it.img1v1Url || it.cover,
            vod_remarks: it.playCount ? formatCount(it.playCount) : (it.artistName || '音乐'),
            vod_id: idPrefix + it.id
        };
    });

    return JSON.stringify({
        list: list,
        page: +pg,
        limit: limit
    });
};

const detail = async (id) => {
    let did = id.toString();
    if (did.includes('@')) {
        let parts = did.split('@');
        return await getSongDetail(parts[0], parts[1], parts[3]);
    }

    let realId = did.split('_')[1];
    let url = '';
    if (did.startsWith('artist_')) url = `${host}/artists?id=${realId}`;
    else if (did.startsWith('mv_')) return await getMvDetail(realId);
    else url = `${host}/playlist/detail?id=${realId}`;

    let res = await req(url, {headers});
    let json = JSON.parse(res.content || res);
    let data = json.playlist || json.artist || {};
    let tracks = json.hotSongs || data.tracks || [];

    const qs = [["标准", "standard"]];
    let playUrl = qs.map(q => {
        return tracks.map(s => {
            let artist = (s.ar || s.artists || []).map(a => a.name).join('/');
            return `${s.name} - ${artist}$${s.id}|${q[1]}`;
        }).join('#');
    }).join('$$$');

    return JSON.stringify({
        list: [{
            vod_id: did,
            vod_name: data.name || '歌单详情',
            vod_pic: data.coverImgUrl || data.picUrl,
            vod_content: data.description || data.briefDesc || '',
            vod_play_from: qs.map(q => q[0]).join('$$$'),
            vod_play_url: playUrl,
            vod_action: '最新评论'
        }]
    });
};

const getSongDetail = async (id, name, artist) => {
    return JSON.stringify({
        list: [{
            vod_id: id,
            vod_name: name,
            vod_actor: artist,
            vod_play_from: "标准",
            vod_play_url: `${name} - ${artist}$${id}|standard`,
            vod_action: '最新评论'
        }]
    });
};

const getMvDetail = async (id) => {
    let url = `${host}/mv/detail?mvid=${id}`;
    let res = await req(url, {headers});
    let json = JSON.parse(res.content || res);
    let data = json.data || {};
    return JSON.stringify({
        list: [{
            vod_id: 'mv_' + id,
            vod_name: data.name,
            vod_pic: data.cover,
            vod_actor: data.artistName,
            vod_play_from: "MV",
            vod_play_url: `${data.name}$${id}|mv`,
            vod_action: '最新评论'
        }]
    });
};

const search = async (wd, _, pg = 1) => {
    const url = `https://music.163.com/api/cloudsearch/pc`;
    let res = await req(url, {
        method: 'POST',
        headers: headers,
        data: `s=${encodeURIComponent(wd)}&type=1&limit=30&offset=${(pg - 1) * 30}`
    });
    let json = JSON.parse(res.content || res);
    let list = (json.result.songs || []).map(s => {
        let artist = (s.ar || []).map(a => a.name).join('/');
        let vod_id = `${s.id}@${s.name}@remark@${artist}`;
        return {
            vod_name: s.name,
            vod_pic: s.al ? s.al.picUrl : '',
            vod_remarks: artist,
            vod_id: vod_id
        };
    });
    return JSON.stringify({list});
};

const play = async (flag, id) => {
    let [musicId, qa] = id.split('|');
    let playUrl = '';

    if (qa === 'mv') {
        let res = await req(`${host}/mv/url?id=${musicId}&r=1080`, {headers});
        let json = JSON.parse(res.content || res);
        playUrl = json.data.url;
    } else {
        let res = await req(`${play_api}?id=${musicId}`, {headers});
        let json = JSON.parse(res.content || res);
        if (json.code === 0 && json.data.length > 0) {
            playUrl = json.data[0].url;
        }
    }

    // 获取歌词
    let lrcRes = await req(`https://music.163.com/api/song/lyric?id=${musicId}&lv=1`, {headers});
    let lrcJson = JSON.parse(lrcRes.content || lrcRes);
    let lyric = lrcJson.lrc ? lrcJson.lrc.lyric : '';

    return JSON.stringify({
        parse: 0,
        url: playUrl,
        header: headers,
        lrc: lyric
    });
};

function formatCount(count) {
    if (count > 100000000) return (count / 100000000).toFixed(1) + '亿';
    if (count > 10000) return (count / 10000).toFixed(1) + '万';
    return count.toString();
}

const action = async (action, value) => {
    if (action === '最新评论') {
        try {
            let info = typeof value === 'string' ? JSON.parse(value) : value;
            let id = info.series[0].url.split('|')[0];
            let page = info.page || 1;
            let offset = (page - 1) * 30;

            let url = `http://music.163.com/api/v1/resource/comments/R_SO_4_${id}?limit=30&offset=${offset}`;
            let res = await req(url, {headers});
            let data = JSON.parse(res.content || res);

            const list = [];
            let allComments = (data.hotComments || []).concat(data.comments || []);

            for (let it of allComments) {
                list.push({
                    id: it.user.nickname,
                    title: it.user.nickname,
                    subtitle: it.timeStr,
                    logo: it.user.avatarUrl,
                    content: it.content,
                    remarks: it.likedCount ? `${it.likedCount}` : '',
                    remarks2: it.ipLocation ? it.ipLocation.location : ''
                });
            }

            return JSON.stringify({
                action: {
                    type: 'comment',
                    actionId: '最新评论',
                    title: '最新评论',
                    list: list,
                    info: info,
                    keep: true,
                }
            });
        } catch (e) {
            return JSON.stringify({list: [{title: '暂无评论'}]});
        }
    }
    return '';
};

export default {init, home, category, detail, search, play, action};
