import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import FileHeaderManager from '../../utils/fileHeaderManager.js';

// 临时目录里真实读写，覆盖 writeHeader 的 py coding 声明场景（红果漫剧.py 事故回归）
function tmpFile(content) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fhm-'));
    const file = path.join(dir, 'src.py');
    fs.writeFileSync(file, content);
    return file;
}

const META = {title: '测试源', lang: 'hipy'};
const headerCount = (s) => (s.match(/@header\(/g) || []).length;

test('py coding 声明 + 已有 @header docstring：原地更新，不重复、coding 保持首行', async () => {
    const f = tmpFile('# -*- coding: utf-8 -*-\n"""\n@header({\n  title: \'旧源\'\n})\n"""\n\nprint(1)\n');
    await FileHeaderManager.writeHeader(f, META);
    const out = fs.readFileSync(f, 'utf8');
    assert.ok(out.startsWith('# -*- coding: utf-8 -*-'), 'coding 声明必须在首行');
    assert.equal(headerCount(out), 1, '@header 不得重复');
    assert.ok(out.includes("'测试源'"), 'header 应被更新为新值');
    assert.ok(out.includes('print(1)'), '正文不得丢失');
});

test('py coding 声明 + docstring 无 @header：插入 docstring 内而非文件最前', async () => {
    const f = tmpFile('# -*- coding: utf-8 -*-\n"""\n说明文字\n"""\n\nprint(1)\n');
    await FileHeaderManager.writeHeader(f, META);
    const out = fs.readFileSync(f, 'utf8');
    assert.ok(out.startsWith('# -*- coding: utf-8 -*-'));
    assert.equal(headerCount(out), 1);
    assert.ok(out.includes('说明文字'), '原 docstring 内容保留');
    assert.ok(out.includes('print(1)'));
});

test('py 仅 coding 声明无 docstring：新 docstring 插到 coding 之后', async () => {
    const f = tmpFile('# -*- coding: utf-8 -*-\nimport os\nprint(1)\n');
    await FileHeaderManager.writeHeader(f, META);
    const out = fs.readFileSync(f, 'utf8');
    assert.ok(out.startsWith('# -*- coding: utf-8 -*-'));
    assert.equal(headerCount(out), 1);
    assert.ok(out.includes('import os'));
    // docstring 应插在 coding 行与 import 之间
    assert.ok(out.indexOf('"""') < out.indexOf('import os'));
});

test('py shebang + coding 两行声明：前缀完整保留', async () => {
    const f = tmpFile('#!/usr/bin/env python\n# -*- coding: utf-8 -*-\n"""\n@header({\'title\': \'旧\'})\n"""\nprint(1)\n');
    await FileHeaderManager.writeHeader(f, META);
    const out = fs.readFileSync(f, 'utf8');
    assert.ok(out.startsWith('#!/usr/bin/env python\n# -*- coding: utf-8 -*-'));
    assert.equal(headerCount(out), 1);
    assert.ok(out.includes('print(1)'));
});

test('py 普通 docstring 开头（无 coding）：原行为不回归', async () => {
    const f = tmpFile('"""\n@header({\'title\': \'旧\'})\n"""\nprint(1)\n');
    await FileHeaderManager.writeHeader(f, META);
    const out = fs.readFileSync(f, 'utf8');
    assert.equal(headerCount(out), 1);
    assert.ok(out.includes("'测试源'"));
    assert.ok(out.includes('print(1)'));
});

test('readHeader 能读 coding + docstring 形态的 header', async () => {
    const f = tmpFile('# -*- coding: utf-8 -*-\n"""\n@header({\n  title: \'测试源\',\n  lang: \'hipy\'\n})\n"""\nprint(1)\n');
    const header = await FileHeaderManager.readHeader(f);
    assert.deepEqual(header, {title: '测试源', lang: 'hipy'});
});
