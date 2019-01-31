/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl (doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + 'docs/' + (language ? language + '/' : '') + doc;
  }

  pageUrl (doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? language + '/' : '') + doc;
  }

  render () {
    const currentYear = new Date().getFullYear();
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href="/docs/start.html">
              Guides
            </a>
            <a href="/docs/apis.html">
              Reference
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a href="https://forum.zeppelin.solutions/" target="_blank">
              Forum
            </a>
            <a
              href="https://t.me/zeppelinos/"
              target="_blank">
              Telegram chat
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://zeppelinos.org">Main Site</a>
            <a href="https://blog.zeppelinos.org">Blog</a>
            <a href="https://github.com/zeppelinos">GitHub</a>
          </div>
        </section>

        <a
          href="https://zeppelinos.org"
          target="_blank"
          className="fbOpenSource">
          <img
            src={this.props.config.baseUrl + 'img/logo.svg'}
            alt="ZeppelinOS"
            width="170"
            height="45"
          />
        </a>
        <section className="copyright">
          Copyright &copy; 2017-present ZeppelinOS Global
        </section>
        <section className="report-bugs">
          <a href="https://github.com/zeppelinos/zos/issues/new?labels=kind:documentation">Report a bug on this site</a>
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
