import { FileSystem as fs } from 'zos-lib';

export function editJson(file, cb) {
  const data = fs.parseJson(file);
  cb(data);
  fs.writeJson(file, data);
}