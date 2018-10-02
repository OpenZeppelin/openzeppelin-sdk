import _ from 'lodash';

export const ZOS_VERSION = '1';

export function checkVersion(version, where) {
  if (version == ZOS_VERSION || _.isUndefined(version)) {
    return true;
  } else {
    throw Error(`Unrecognized version identifier ${version} found in ${where}. This means the project was built with an unknown version of zos. Please upgrade to the latest version of zos, or refer to the documentation at https://docs.zeppelinos.org for more info.`)
  }
}