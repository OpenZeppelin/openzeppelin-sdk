'use strict';
require('../setup');

import { expect } from 'chai';

import session from '../../src/scripts/session';
import Session, { DEFAULT_TX_TIMEOUT } from '../../src/models/network/Session';

describe('session script', function() {
  afterEach(() => Session.close());

  const opts = { network: 'foo', from: '0x1', timeout: 10 };

  describe('opening a new session', function() {
    context('when there was no session opened before', function() {
      context('when the time out does not expire', function() {
        beforeEach(function() {
          session(opts);
        });

        it('sets the new options', function() {
          Session.getOptions().should.include(opts);
        });

        it('merges given options with session defaults', function() {
          Session.getOptions({ from: '0x2' }).should.include({
            network: 'foo',
            timeout: 10,
            from: '0x2',
          });
        });
      });

      context('when the time out expires', function() {
        it('clears all options', function() {
          session({ ...opts, expires: 0 });
          Session.getOptions().should.be.deep.equal({
            timeout: DEFAULT_TX_TIMEOUT,
          });
        });

        it('returns given options', function() {
          Session.getOptions({ from: '0x2' }).should.be.deep.equal({
            from: '0x2',
            timeout: DEFAULT_TX_TIMEOUT,
          });
        });
      });
    });

    context('when there was a session opened before', function() {
      beforeEach(() => session(opts));

      context('when the time out does not expire', function() {
        it('replaces all options', function() {
          session({ network: 'bar' });
          Session.getOptions().should.include({
            network: 'bar',
            timeout: DEFAULT_TX_TIMEOUT,
          });
        });
      });

      context('when the time out expires', function() {
        it('clears all options', function() {
          session({ network: 'bar', expires: 0 });
          Session.getOptions().should.be.deep.equal({
            timeout: DEFAULT_TX_TIMEOUT,
          });
        });
      });
    });
  });

  describe('closing a session', function() {
    context('when there was no session opened before', function() {
      it('sets the new network', function() {
        session({ close: true });
        Session.getOptions().should.be.deep.equal({
          timeout: DEFAULT_TX_TIMEOUT,
        });
      });
    });

    context('when there was a session opened before', function() {
      beforeEach(() => session(opts));

      it('replaces the previous network', function() {
        session({ close: true });
        Session.getOptions().should.be.deep.equal({
          timeout: DEFAULT_TX_TIMEOUT,
        });
      });
    });
  });

  describe('arguments', function() {
    context('when no arguments are given', function() {
      it('throws an error', function() {
        expect(() => session({})).to.throw(
          'Please provide either a network option (--network, --timeout, --from) or --close.',
        );
      });
    });

    context('when both arguments are given', function() {
      it('throws an error', function() {
        expect(() => session({ network: 'boo', close: true })).to.throw(
          'Please provide either a network option (--network, --timeout, --from) or --close.',
        );
      });
    });
  });
});
