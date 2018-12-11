/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const siteConfig = {
  title: 'ZeppelinOS',
  tagline: 'ZeppelinOS, securely develop and manage any smart contract application',
  url: 'https://docs.zeppelinos.org',
  baseUrl: '/',
  organizationName: 'zeppelinos',
  projectName: 'zos-docs',
  initialDoc: 'start',
  headerLinks: [
    {
      doc: 'start',
      label: 'Quickstart',
    },
    {
      doc: 'apis',
      label: 'Reference',
    },
    {
    href: 'https://blog.zeppelinos.org',
      label: 'Blog',
    },
    {
      href: 'https://github.com/zeppelinos',
      label: 'GitHub',
    },
  ],
  headerIcon: 'img/logo.svg',
  disableHeaderTitle: true,
  footerIcon: 'img/symbol-zeppelin.png',
  favicon: 'img/favicon.png',
  colors: {
    primaryColor: '#5CB6E4',
    secondaryColor: 'white',
  },
  copyright: 'Copyright © 2018 ZeppelinOS Global',
  // gaTrackingId: 'UA-85043059-1',
  highlight: {
    theme: 'default',
    hljs: function(hljs) {
      require('highlightjs-solidity')(hljs);
    }
  },
  scripts: ['https://buttons.github.io/buttons.js'],
  stylesheets: [
    'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
    'https://fonts.googleapis.com/css?family=Lato:100,200,300,400,500,700,400italic,700italic',
  ],
  repoUrl: 'https://github.com/zeppelinos/',
  gaTrackingId: 'UA-102575245-1',
  algolia: {
    apiKey: '8d0b5afbba49947d9efb5659d1b08df7',
    indexName: 'zeppelinos',
    algoliaOptions: {} // Optional, if provided by Algolia
  }
};

module.exports = siteConfig;
