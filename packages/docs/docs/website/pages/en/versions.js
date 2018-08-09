/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary');
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

const CWD = process.cwd();

const siteConfig = require(CWD + '/siteConfig.js');
const versions = require(CWD + '/versions.json');

class Versions extends React.Component {
  pastVersions() {
    const latestVersion = versions[0];
    return (
      <div>
        <h3 id="archive">Past Versions</h3>
        <table className="versions">
          <tbody>
            {versions.map(
              version =>
                version !== latestVersion && (
                  <tr key={version}>
                    <th>{version}</th>
                    <td>
                      <a href={ 'docs/' + version + '/start.html' }>Documentation</a>
                    </td>
                    <td>
                      <a href={ 'https://github.com/zeppelinos/zos/releases/tag/v' + version }>Release Notes</a>
                    </td>
                  </tr>
                )
            )}
          </tbody>
        </table>
        <p>
          You can find past versions of this project{' '}
          <a href="https://github.com/zeppelinos/zos"> on GitHub</a>.
        </p>
      </div>
    );
  }

  render() {
    const latestVersion = versions[0];
    const pastVersions = versions.length > 1 ? this.pastVersions() : ''
    return (
      <div className="docMainWrapper wrapper">
        <Container className="mainContainer versionsContainer">
          <div className="post">
            <header className="postHeader">
              <h2>{siteConfig.title + ' Versions'}</h2>
            </header>
            <h3 id="latest">Current version</h3>
            <table className="versions">
              <tbody>
                <tr>
                  <th>{latestVersion}</th>
                  <td>
                    <a href="docs/start.html">Documentation</a>
                  </td>
                  <td>
                    <a href={ 'https://github.com/zeppelinos/zos/releases/tag/v' + latestVersion }>Release Notes</a>
                  </td>
                </tr>
              </tbody>
            </table>
            { pastVersions }
          </div>
        </Container>
      </div>
    );
  }
}

module.exports = Versions;
