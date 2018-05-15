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
            <a href="https://docs.zeppelinos.org/docs/building.html">
              Guides
            </a>
            <a href="https://docs.zeppelinos.org/docs/clifront.html">
              Reference
            </a>
          </div>
          {/* <div>
            <h5>Community</h5>
            <a
              href="https://stackoverflow.com/search?q=open+zeppelin/"
              target="_blank">
              Stack Overflow
            </a>
            <a href="https://slack.openzeppelin.org/" target="_blank">
              Chat on Slack
            </a>
          </div> */}
          <div>
            <h5>More</h5>
            <a href="https://blog.zeppelinos.org">Blog</a>
            <a href="https://github.com/zeppelinos">Github</a>
          </div>
        </section>

        <a
          href="https://zeppelinos.org"
          target="_blank"
          className="fbOpenSource">
          <img
            src={this.props.config.baseUrl + 'img/logo.svg'}
            alt="zeppelin_os"
            width="170"
            height="45"
          />
        </a>
        <section className="copyright">
          Copyright &copy; 2017 zOS Global
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
