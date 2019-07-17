'use strict';
require('../../setup');

import sinon from 'sinon';
import Spinners from 'spinnies';

import {
  Loggy,
  SpinnerAction,
  LogLevel,
  LogType,
} from '../../../src/utils/Logger';

describe('Logger', function() {
  beforeEach(function () {
    Loggy.testing(false);
  });

  afterEach('restore logger', function() {    
    Loggy.testing(true);
    Loggy.silent(false);
    Loggy.verbose(false);
    Loggy.logs = {};
    sinon.restore();
  });

  describe('methods', function() {
    describe('#silent', function() {
      it('changes isSilent property value', function() {
        Loggy.silent(false);
        Loggy.isSilent.should.be.false;
      });
    });

    describe('#verbose', function() {
      it('changes isVerbose property value', function() {
        Loggy.verbose(true);
        Loggy.isVerbose.should.be.true;
      });
    });

    describe('#testing', function() {
      it('changes isTesting property value', function() {
        Loggy.testing(true);
        Loggy.isTesting.should.be.true;
      });
    });

    const shouldSetLogProperties = (
      log,
      logType,
      logLevel,
      spinnerAction,
      message,
    ) => {
      log.should.deep.equal({
        file: 'filename',
        fnName: 'function',
        text: message,
        logLevel,
        logType,
        spinnerAction,
      });
    };

    const shouldBehaveLikeSpinnerLog = (
      spinnerAction,
      method,
      reference = 'reference',
    ) => {
      it(`sets log and calls spinner#${method}`, function() {
        Loggy[method]('filename', 'function', reference, 'message');
        shouldSetLogProperties(
          Loggy.logs[reference],
          LogType.Info,
          LogLevel.Normal,
          spinnerAction,
          'message',
        );
        this.spyLogger.should.have.been.calledOnceWith(reference, {
          text: 'message',
          status: spinnerAction,
        });
      });

      describe('warn', function() {
        it(`sets log and calls spinner#${method} with warn color`, function() {
          Loggy[method].warn('filename', 'function', reference, 'message');
          shouldSetLogProperties(
            Loggy.logs[reference],
            LogType.Warn,
            LogLevel.Normal,
            spinnerAction,
            'message',
          );
          this.spyLogger.should.have.been.calledOnceWith(reference, {
            text: 'message',
            status: spinnerAction,
            color: 'yellow',
          });
        });
      });

      describe('error', function() {
        it(`sets log and calls spinner#${method} with error color`, function() {
          Loggy[method].error('filename', 'function', reference, 'message');
          shouldSetLogProperties(
            Loggy.logs[reference],
            LogType.Err,
            LogLevel.Normal,
            spinnerAction,
            'message',
          );
          this.spyLogger.should.have.been.calledOnceWith(reference, {
            text: 'message',
            status: spinnerAction,
            color: 'red',
          });
        });
      });
    };

    context('in normal mode', function() {
      beforeEach('set logger silent prop to false', function() {
        Loggy.silent(false);
      });

      describe('#add', function() {
        beforeEach(function() {
          this.spyLogger = sinon.stub(Spinners.prototype, 'add');
        });

        describe('noSpin', function() {
          shouldBehaveLikeSpinnerLog(SpinnerAction.NonSpinnable, 'noSpin');
        });

        describe('spin', function() {
          shouldBehaveLikeSpinnerLog(SpinnerAction.Add, 'spin');
        });
      });

      describe('#succeed', function() {
        beforeEach(function() {
          Loggy.spin('filename', 'function', 'ref-succeed', 'message');
          this.spyLogger = sinon.stub(Spinners.prototype, 'update');
        });

        it('sets log as succeeded', function() {
          Loggy.succeed('ref-succeed', 'new message');
          shouldSetLogProperties(
            Loggy.logs['ref-succeed'],
            LogType.Info,
            LogLevel.Normal,
            SpinnerAction.Succeed,
            'new message',
          );
          this.spyLogger.should.have.been.calledOnceWith('ref-succeed', {
            text: 'new message',
            status: SpinnerAction.Succeed,
          });
        });
      });

      describe('#fail', function() {
        beforeEach(function() {
          Loggy.spin('filename', 'function', 'ref-fail', 'message');
          this.spyLogger = sinon.stub(Spinners.prototype, 'update');
        });

        it('sets log as failed', function() {
          Loggy.fail('ref-fail', 'new message');
          shouldSetLogProperties(
            Loggy.logs['ref-fail'],
            LogType.Info,
            LogLevel.Normal,
            SpinnerAction.Fail,
            'new message',
          );
          this.spyLogger.should.have.been.calledOnceWith('ref-fail', {
            text: 'new message',
            status: SpinnerAction.Fail,
          });
        });
      });

      describe('#update', function() {
        beforeEach(function() {
          Loggy.spin('filename', 'function', 'ref-update', 'message');
          this.spyLogger = sinon.stub(Spinners.prototype, 'update');
        });

        describe('noSpin', function() {
          shouldBehaveLikeSpinnerLog(
            SpinnerAction.NonSpinnable,
            'noSpin',
            'ref-update',
          );
        });

        describe('spin', function() {
          shouldBehaveLikeSpinnerLog(SpinnerAction.Add, 'spin', 'ref-update');
        });
      });
    });

    context('in verbose mode', function() {
      beforeEach(function() {
        Loggy.verbose(true);
        Loggy.silent(false);
        this.spyLogger = sinon.stub(console, 'error');
      });

      describe('#add', function() {
        it(`sets log and calls console.error`, function() {
          Loggy.add('filename', 'function', 'reference', 'message');
          shouldSetLogProperties(
            Loggy.logs['reference'],
            LogType.Info,
            LogLevel.Normal,
            SpinnerAction.Add,
            'message',
          );
          this.spyLogger.should.have.been.calledOnceWith(
            sinon.match(/<started> message/),
          );
        });
      });

      describe('#succeed', function() {
        it('sets log as succeeded', function() {
          Loggy.spin('filename', 'function', 'ref-succeed', 'message');
          Loggy.succeed('ref-succeed', 'new message');
          shouldSetLogProperties(
            Loggy.logs['ref-succeed'],
            LogType.Info,
            LogLevel.Normal,
            SpinnerAction.Succeed,
            'new message',
          );
          this.spyLogger.should.have.been.calledWith(
            sinon.match(/<started> message/),
          );
          this.spyLogger.should.have.been.calledWith(
            sinon.match(/<succeeded> new message/),
          );
        });
      });

      describe('#fail', function() {
        it('sets log as failed', function() {
          Loggy.spin('filename', 'function', 'ref-fail', 'message');
          Loggy.fail('ref-fail', 'new message');
          shouldSetLogProperties(
            Loggy.logs['ref-fail'],
            LogType.Info,
            LogLevel.Normal,
            SpinnerAction.Fail,
            'new message',
          );
          this.spyLogger.should.have.been.calledWith(
            sinon.match(/<started> message/),
          );
          this.spyLogger.should.have.been.calledWith(
            sinon.match(/<failed> new message/),
          );
        });
      });
    });
  });
});
