import _ from 'lodash';

export const ZOS_VERSION = '2';

export function checkVersion(version: string, where: any): boolean | never {
  if (version === ZOS_VERSION) return true;
  else if (_.isUndefined(version)) {
    throw Error(`zos version identifier not found in ${where}. This means the project was built with an older version of zos (1.x), and needs to be upgraded. Please refer to the documentation at https://docs.zeppelinos.org for more info.`);
  }
  else {
    throw Error(`Unrecognized zos version identifier ${version} found in ${where}. This means the project was built with an unknown version of zos. Please refer to the documentation at https://docs.zeppelinos.org for more info.`);
  }
}
