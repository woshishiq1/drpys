import path from 'path';
import { readdir, stat, mkdir, copyFile } from 'fs/promises';

// 备份/恢复专用的并发拷贝：plugins 目录可达 GB 级且含数万小文件（插件依赖/二进制），
// 逐条目串行递归（fsWrapper.copy）在冷态磁盘上耗时分钟级；先递归收集文件清单，
// 再按固定并发度 copyFile，小文件场景提升显著。空目录不产生目标侧目录（配置场景无空目录，可接受）。

const DEFAULT_CONCURRENCY = 32;

async function collectFiles(src, out) {
    const entries = await readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        if (entry.isDirectory()) {
            await collectFiles(srcPath, out);
        } else if (entry.isFile()) {
            out.push(srcPath);
        }
    }
}

/**
 * 并发拷贝文件或整个目录树
 * @param {string} src 源路径（文件或目录）
 * @param {string} dest 目标路径（目录拷贝时为对应的目录树根）
 * @param {number} [concurrency=32] 并发度
 */
export async function copyPath(src, dest, concurrency = DEFAULT_CONCURRENCY) {
    const stats = await stat(src);
    if (!stats.isDirectory()) {
        await mkdir(path.dirname(dest), { recursive: true });
        await copyFile(src, dest);
        return;
    }

    const files = [];
    await collectFiles(src, files);

    let index = 0;
    let firstError = null;
    const worker = async () => {
        while (index < files.length) {
            const srcPath = files[index++];
            try {
                const destPath = path.join(dest, path.relative(src, srcPath));
                await mkdir(path.dirname(destPath), { recursive: true });
                await copyFile(srcPath, destPath);
            } catch (e) {
                // 记录首个错误但继续拷贝其余文件，最后统一抛出（避免单文件失败中断整树备份）
                if (!firstError) firstError = e;
            }
        }
    };
    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, files.length)) }, worker);
    await Promise.all(workers);
    if (firstError) throw firstError;
}

export default copyPath;
