import path from 'path';
import findUp from 'find-up';

export default function findRootDirectory(cwd: string): string | null {
  const filePath = findUp.sync(['package.json', 'zos.json'], { cwd });
  if (!filePath) return null;
  const dir = filePath.split(path.sep);
  dir.pop();
  return dir.join(path.sep);
}
