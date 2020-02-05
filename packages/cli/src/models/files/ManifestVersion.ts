import { isNull, isUndefined } from 'lodash';

const OPEN_ZEPPELIN = 'openzeppelin';
const CURRENT_MANIFEST_VERSION = ['2', '2'];
const [CURRENT_MAJOR_VERSION, CURRENT_MINOR_VERSION] = CURRENT_MANIFEST_VERSION;
export const MANIFEST_VERSION = stringifyCurrentManifestVersion();

export function checkVersion(version: string, where: any): void | never {
  if (version === MANIFEST_VERSION) return;
  else if (isUndefined(version)) {
    throw Error(
      `Manifest version identifier not found in ${where}. This means the project was built with an older version of ${OPEN_ZEPPELIN} (1.x), and needs to be upgraded. Please refer to the documentation at https://docs.openzeppelin.com/cli for more info.`,
    );
  } else if (!isCurrentMajor(version) || (!isCurrentMinor(version) && !isUndefinedMinor(version))) {
    throw Error(
      `Unrecognized manifest version identifier ${version} found in ${where}. This means the project was built with an unknown version of ${OPEN_ZEPPELIN}. Please refer to the documentation at https://docs.openzeppelin.com/cli for more info.`,
    );
  }
}

export function isMigratableManifestVersion(version: string): boolean {
  return !isUndefined(version) && !isNull(version) && !isCurrentVersion(version);
}

function stringifyCurrentManifestVersion(): string {
  return CURRENT_MANIFEST_VERSION.join('.');
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
