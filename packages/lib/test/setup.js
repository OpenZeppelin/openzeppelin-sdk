'use strict';

process.env.NODE_ENV = 'test'

require('chai')
  .use(require('chai-as-promised')) // TODO: Remove this dependency
  .use(require('chai-bignumber')(web3.BigNumber))
  .use(require('../src/test/helpers/assertions'))
  .should()
