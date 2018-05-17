'use strict';

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .use(require('../src/test/helpers/assertions'))
  .should()
