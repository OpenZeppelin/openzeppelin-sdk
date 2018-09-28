import semver from 'semver';
import _ from 'lodash';

export function toSemanticVersion(version) {
  if (_.isString(version)) {
    const semanticVersion = semver.parse(version)
    if (!semanticVersion) throw Error(`Cannot parse version identifier ${version}`)
    return [semanticVersion.major, semanticVersion.minor, semanticVersion.patch]
  } else if (_.isArray(version) && version.length === 3) {
    return version.map(x => x.toNumber ? x.toNumber() : x)
  } else {
    throw Error(`Cannot parse version identifier ${version}`)
  }
}

export function semanticVersionToString(version) {
  if (_.isString(version)) {
    return version;
  } else if (_.isArray(version)) {
    return version.join('.');
  } else {
    throw Error(`Cannot handle version identifier ${version}`)
  }
}

export function semanticVersionEqual(v1, v2) {
  const semver1 = toSemanticVersion(v1),
        semver2 = toSemanticVersion(v2);
  return semver1[0] === semver2[0]
      && semver1[1] === semver2[1]
      && semver1[2] === semver2[2];
}