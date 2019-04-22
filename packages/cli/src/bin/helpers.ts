import fs from 'fs';

export default function lookForRootDirectory(dirPath: string): string | null {
  if (dirPath.length === 0) return null;
  const dirFiles = fs.readdirSync(dirPath);

  if ((dirFiles.includes('package.json') && dirFiles.includes('package-lock.json')) || dirFiles.includes('zos.json')) {
    return dirPath;
  } else {
    const dir = dirPath.split('/');
    dir.pop();
    return lookForRootDirectory(dir.join('/'));
  }
}
