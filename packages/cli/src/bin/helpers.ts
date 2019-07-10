import path from 'path';
import findUp from 'find-up';

import { OPEN_ZEPPELIN_FOLDER } from '../models/files/constants';

export default function findRootDirectory(cwd: string): string | null {
  const filePath = findUp.sync(['package.json', OPEN_ZEPPELIN_FOLDER], { cwd });
  if (!filePath) return null;
  return path.dirname(filePath);
}
