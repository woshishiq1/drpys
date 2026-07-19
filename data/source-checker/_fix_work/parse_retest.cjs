const j = require('E:/gitwork/drpy-node/data/source-checker/_fix_work/retest_detail.json');
for (const r of j.results) {
  const dp = r.detail_preview || {};
  const keys = dp.play_url_diagnosis ? dp.play_url_diagnosis.item_keys : null;
  console.log('== ' + r.name + ' (score=' + r.score + ', play:' + r.play_success + ') ==');
  console.log('  vod_id=' + (dp.vod_id || '?') + ' name=' + (dp.vod_name || '?').slice(0, 24) + ' from=[' + (dp.vod_play_from || '') + '] count=' + (dp.vod_play_url_count ?? '?'));
  console.log('  play_err: ' + r.play_error);
  if (keys) console.log('  item_keys: ' + JSON.stringify(keys));
}
