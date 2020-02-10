import semver from 'semver';
import { isString } from 'lodash';
import util from 'util';

// TS-TODO: use typed SemVer dependency, some of these methods may actually
// return a custom object.

export type SemanticVersion = [number, number, number];
type RawSemanticVersion = [any, any, any];

export function toSemanticVersion(version: string | RawSemanticVersion): SemanticVersion | never {
  if (isString(version)) {
    const semanticVersion: any = semver.parse(version as string);
    if (!semanticVersion) throw Error(`Cannot parse version identifier ${version}`);
    return [semanticVersion.major, semanticVersion.minor, semanticVersion.patch];
  } else if (Array.isArray(version) && version.length === 3) {
    version = (version as RawSemanticVersion).map(Number) as [number, number, number];
    const semverGenericArray: RawSemanticVersion = version as RawSemanticVersion;
    const semverTyped: number[] = semverGenericArray.map((x: any) => {
      return x.toNumber ? x.toNumber() : x;
    });
    return semverTyped as SemanticVersion;
  } else throw Error(`Cannot parse version identifier ${version}`);
}

export function semanticVersionToString(version: string | RawSemanticVersion): string | never {
  if (isString(version)) return version as string;
  else if (Array.isArray(version)) {
    const semverGenericArray: RawSemanticVersion = version as RawSemanticVersion;
    return semverGenericArray.join('.') as string;
  } else throw Error(`Cannot handle version identifier ${util.inspect(version)}`);
}

export function semanticVersionEqual(v1: string | RawSemanticVersion, v2: string | RawSemanticVersion): boolean {
  const semver1: SemanticVersion = toSemanticVersion(v1);
  const semver2: SemanticVersion = toSemanticVersion(v2);
  return semver1[0] === semver2[0] && semver1[1] === semver2[1] && semver1[2] === semver2[2];
}

export default {
  toSemanticVersion,
  semanticVersionToString,
  semanticVersionEqual,
};
