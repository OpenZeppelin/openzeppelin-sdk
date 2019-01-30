import isUndefined from 'lodash.isundefined';

const CURRENT_ZOS_VERSION = ['2', '2'];
const [CURRENT_MAJOR_VERSION, CURRENT_MINOR_VERSION] = CURRENT_ZOS_VERSION;
export const ZOS_VERSION = stringifyCurrentZosVersion();

export function checkVersion(version: string, where: any): boolean | never {
  if (version === ZOS_VERSION) return true;
  else if (isUndefined(version)) {
    throw Error(`zos version identifier not found in ${where}. This means the project was built with an older version of zos (1.x), and needs to be upgraded. Please refer to the documentation at https://docs.zeppelinos.org for more info.`);
  }
  else {
    throw Error(`Unrecognized zos version identifier ${version} found in ${where}. This means the project was built with an unknown version of zos. Please refer to the documentation at https://docs.zeppelinos.org for more info.`);
  }
}

export function isLatestZosVersion(version: string): boolean {
  return isUndefined(version) && isCurrentVersion(version);
}

function stringifyCurrentZosVersion(): string {
  return CURRENT_ZOS_VERSION.join('.');
}

function isCurrentVersion(version: string): boolean {
  const [major, minor] = version.split('.');
  return isCurrentMinor(minor) && isCurrentMajor(major);
}

function isCurrentMinor(minor: string): boolean {
  return minor === CURRENT_MINOR_VERSION
}

function isCurrentMajor(major: string): boolean {
  return major === CURRENT_MAJOR_VERSION;
}
