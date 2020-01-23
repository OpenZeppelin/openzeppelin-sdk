'use strict';

require('../setup');
import sinon from 'sinon';
import { ZWeb3 } from '@openzeppelin/upgrades';
import { defaultSender, accounts as accountList } from '@openzeppelin/test-environment';

import accounts from '../../src/scripts/accounts';
import CaptureLogs from '../helpers/captureLogs';

describe('accounts script', function() {
  const network = 'test';

  beforeEach('caputre logs', function() {
    this.logs = new CaptureLogs();
  });

  afterEach('restore logs', function() {
    this.logs.restore();
  });

  context('when there are accounts to list', function() {
    it('shows the default account and lists all the accounts', async function() {
      await accounts({ network });

      this.logs.infos.should.have.lengthOf(3);
      this.logs.infos[0].should.eq(`Accounts for ${network}:`);
      this.logs.infos[1].should.eq(`Default: ${defaultSender}`);
      accountList.forEach(account => this.logs.infos[2].should.match(new RegExp(account)));
    });
  });

  context('when there are no accounts to list', function() {
    beforeEach('stubs ZWeb3', function() {
      sinon.stub(ZWeb3.eth, 'getAccounts').returns([]);
    });

    afterEach('restores stubs', function() {
      sinon.restore();
    });

    it('logs that there are no accounts', async function() {
      await accounts({ network });
      this.logs.infos.should.have.lengthOf(1);
      this.logs.infos[0].should.match(/There are no accounts/);
    });
  });
});
