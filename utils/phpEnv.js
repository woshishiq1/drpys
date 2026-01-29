import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export let isPhpAvailable = false;

export const checkPhpAvailable = async () => {
    const phpPath = process.env.PHP_PATH || 'php';
    try {
        await execFileAsync(phpPath, ['-v']);
        isPhpAvailable = true;
        console.log('✅ PHP environment check passed.');
    } catch (e) {
        isPhpAvailable = false;
        console.warn('⚠️ PHP environment check failed. PHP features will be disabled.');
        // console.error(e);
    }
    return isPhpAvailable;
};
