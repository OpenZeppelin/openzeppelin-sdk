import isNull from 'lodash.isnull';
import isUndefined from 'lodash.isundefined';

const CURRENT_ZOS_VERSION = ['2', '2'];
const [CURRENT_MAJOR_VERSION, CURRENT_MINOR_VERSION] = CURRENT_ZOS_VERSION;
export const ZOS_VERSION = stringifyCurrentZosversion();

export function checkVersion(version: string, where: any): void | never {
  if (version === ZOS_VERSION) return;
  else if (isUndefined(version)) {
    throw Error(
      `zos version identifier not found in ${where}. This means the project was built with an older version of zos (1.x), and needs to be upgraded. Please refer to the documentation at https://docs.zeppelinos.org for more info.`,
    );
  } else if (
    !isCurrentMajor(version) ||
    (!isCurrentMinor(version) && !isUndefinedMinor(version))
  ) {
    throw Error(
      `Unrecognized zos version identifier ${version} found in ${where}. This means the project was built with an unknown version of zos. Please refer to the documentation at https://docs.zeppelinos.org for more info.`,
    );
  }
}

export function isMigratableZosversion(version: string): boolean {
  return (
    !isUndefined(version) && !isNull(version) && !isCurrentVersion(version)
  );
}

function stringifyCurrentZosversion(): string {
  return CURRENT_ZOS_VERSION.join('.');
}

function isCurrentVersion(version: string): boolean {
  return isCurrentMinor(version) && isCurrentMajor(version);
}

function isCurrentMinor(version: string): boolean {
  const [major, minor] = version.split('.');
  return minor === CURRENT_MINOR_VERSION;
}

function isUndefinedMinor(version: string): boolean {
  const [major, minor] = version.split('.');
  return isUndefined(minor);
}

function isCurrentMajor(version: string): boolean {
  const [major, minor] = version.split('.');
  return major === CURRENT_MAJOR_VERSION;
}
