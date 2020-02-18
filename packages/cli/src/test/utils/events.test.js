'use strict';
require('../setup');

import utils from 'web3-utils';
import { Transactions, Contracts } from '@openzeppelin/upgrades';

import CaptureLogs from '../helpers/captureLogs';
import { describeEvents } from '../../utils/events';

const ImplV1 = Contracts.getFromLocal('ImplV1');

describe('events', function() {
  beforeEach('set capture logs', async function() {
    this.implV1 = await ImplV1.new();
    this.logs = new CaptureLogs();
  });

  afterEach('restore capture logs', function() {
    this.logs.restore();
  });

  describe('#describeEvents', function() {
    context('when the contract function emits an event', function() {
      it('logs the emitted events', async function() {
        const { events } = await Transactions.sendTransaction(this.implV1.methods.initializeWithEvent, [42]);
        describeEvents(events);

        this.logs.infos[0].should.eq('Events emitted: \n - InitializeEvent(42)');
      });
    });

    context('when the contract function does not emit events', function() {
      it('does not log events', async function() {
        const { events } = await Transactions.sendTransaction(this.implV1.methods.initialize, [42]);
        describeEvents(events);

        this.logs.infos.should.have.lengthOf(0);
      });
    });
  });
});
