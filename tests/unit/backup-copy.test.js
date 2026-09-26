import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { copyPath } from '../../utils/backupCopy.js';

function tmpDir(prefix) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('copyPath 递归拷贝目录树（含中文文件名/深层嵌套）内容一致', async () => {
    const src = tmpDir('bk-src-');
    const dest = tmpDir('bk-dst-');
    const deep = path.join(src, 'a', '中文目录', 'b', 'c');
    fs.mkdirSync(deep, { recursive: true });
    const files = [
        [path.join(src, 'root.txt'), '根文件'],
        [path.join(deep, 'deep.txt'), '深层内容'.repeat(100)],
        [path.join(src, 'a', 'empty-content.txt'), ''],
        [path.join(src, 'a', 'plugin.bin'), Buffer.alloc(64 * 1024, 7)],
    ];
    for (const [p, content] of files) fs.writeFileSync(p, content);

    await copyPath(src, path.join(dest, 'tree'), 8);

    for (const [p, content] of files) {
        const destPath = path.join(dest, 'tree', path.relative(src, p));
        assert.ok(fs.existsSync(destPath), `缺少 ${path.relative(src, p)}`);
        assert.deepEqual(fs.readFileSync(destPath), Buffer.isBuffer(content) ? content : Buffer.from(content));
    }
    assert.deepEqual(fs.readdirSync(path.join(dest, 'tree')).sort(), ['a', 'root.txt']);
    fs.rmSync(src, { recursive: true, force: true });
    fs.rmSync(dest, { recursive: true, force: true });
});

test('copyPath 单文件拷贝与覆盖', async () => {
    const dir = tmpDir('bk-single-');
    const src = path.join(dir, 'x.txt');
    fs.writeFileSync(src, 'v1');
    const dest = path.join(dir, 'sub', 'x.txt');
    await copyPath(src, dest);
    assert.equal(fs.readFileSync(dest, 'utf8'), 'v1');
    fs.writeFileSync(src, 'v2');
    await copyPath(src, dest);
    assert.equal(fs.readFileSync(dest, 'utf8'), 'v2');
    fs.rmSync(dir, { recursive: true, force: true });
});

test('copyPath 单文件失败（源不存在）抛错', async () => {
    const dir = tmpDir('bk-err-');
    await assert.rejects(() => copyPath(path.join(dir, '不存在.txt'), path.join(dir, 'out.txt')), /ENOENT/);
    fs.rmSync(dir, { recursive: true, force: true });
});
