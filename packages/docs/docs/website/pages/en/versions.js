/**
 * Copyright (c) 2018-present, OpenZeppelin.
 * Copyright (c) 2017, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary');
const Container = CompLibrary.Container; // eslint-disable-line no-unused-vars
const GridBlock = CompLibrary.GridBlock; // eslint-disable-line no-unused-vars

const CWD = process.cwd();

const siteConfig = require(CWD + '/siteConfig.js');
const versions = require(CWD + '/versions.json');

class Versions extends React.Component {
  render () {
    const latestVersion = versions[0];
    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer versionsContainer">
          <div className="post">
            <header className="postHeader">
              <h2>{siteConfig.title + ' Versions'}</h2>
            </header>
            <a name="latest" />
            <h3>Current version</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <a href={`${siteConfig.baseUrl}docs/open-zeppelin.html`}>Documentation</a>
                  </td>
                  <td>
                    <a href={getVersionReleaseNotes(latestVersion)}>Release Notes</a>
                  </td>
                </tr>
              </tbody>
            </table>
            <a name="rc" />
            <h3>Past Versions</h3>
            <table className="versions">
              <tbody>
                {versions.map(
                  version => {
                    return version !== latestVersion && (
                      <tr key={version}>
                        <th>{version}</th>
                        <td>
                          <a href={`${siteConfig.baseUrl}docs/${version}/open-zeppelin.html`}>Documentation</a>
                        </td>
                        <td>
                          <a href={getVersionReleaseNotes(version)}>Release Notes</a>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
            <p>
              You can find all releases of this project{' '}
              <a href="https://github.com/OpenZeppelin/zeppelin-solidity/releases/"> on GitHub </a>.
            </p>
          </div>
        </Container>
      </div>
    );
  }
}

/**
 * Get release notes' URL for a specific version.
 */
function getVersionReleaseNotes (version) {
  return [
    'https://github.com/OpenZeppelin/zeppelin-solidity/releases/tag/',
    `v${version}`,
  ].join('');
}

module.exports = Versions;
