import path from 'path';
import findUp from 'find-up';

import { PROJECT_FILE_NAME } from '../models/files/ProjectFile';

export default function findRootDirectory(cwd: string): string | null {
  const filePath = findUp.sync(['package.json', PROJECT_FILE_NAME], { cwd });
  if (!filePath) return null;
  return path.dirname(filePath);
}
