import semver from 'semver';
import isString from 'lodash.isstring';
import isArray from 'lodash.isarray';

import util from 'util';

// TS-TODO: use typed SemVer dependency, some of these methods may actually
// return a custom object.

export type SemanticVersion = [number, number, number];
type RawSemanticVersion = [any, any, any];

export function toSemanticVersion(version: string | RawSemanticVersion): SemanticVersion | never {
  if (isString(version)) {
    const semanticVersion: any = semver.parse(version);
    if (!semanticVersion) throw Error(`Cannot parse version identifier ${version}`);
    return [semanticVersion.major, semanticVersion.minor, semanticVersion.patch];
  } else if (isArray(version) && version.length === 3) {
    version = <[number, number, number]>(<RawSemanticVersion>version).map(Number);
    const semverGenericArray: RawSemanticVersion = <RawSemanticVersion> version;
    const semverTyped: number[] = semverGenericArray.map((x: any) => {
      return x.toNumber ? x.toNumber() : x;
    });
    return <SemanticVersion> semverTyped;
  } else throw Error(`Cannot parse version identifier ${version}`);

}

export function semanticVersionToString(version: string | RawSemanticVersion): string | never {
  if (isString(version)) return <string> version;
    else if (isArray(version)) {
    const semverGenericArray: RawSemanticVersion = <RawSemanticVersion> version;
    return <string> (semverGenericArray.join('.'));
  } else throw Error(`Cannot handle version identifier ${util.inspect(version)}`);
}

export function semanticVersionEqual(v1: string | RawSemanticVersion, v2: string | RawSemanticVersion): boolean {
  const semver1: SemanticVersion = toSemanticVersion(v1);
  const semver2: SemanticVersion = toSemanticVersion(v2);
  return semver1[0] === semver2[0]
      && semver1[1] === semver2[1]
      && semver1[2] === semver2[2];
}

export default {
  toSemanticVersion,
  semanticVersionToString,
  semanticVersionEqual
};
