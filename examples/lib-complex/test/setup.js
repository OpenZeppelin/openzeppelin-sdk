'use strict';

process.env.NODE_ENV = 'test'

require('chai')
  .use(require('zos-lib').assertions)
  .should()
