'use strict';

require('../setup');

import sinon from 'sinon';
import Inquirer from 'inquirer';
import { promptIfNeeded } from '../../src/utils/prompt';

describe('prompt', function() {
  describe('functions', function() {
    describe('#promptIfNeeded', function() {
      beforeEach('set stub and initialize', function() {
        this.stub = sinon.stub(Inquirer, 'prompt').returns({});
        this.props = { foo: { message: 'message1', type: 'input' }, bar: { message: 'message2', type: 'input' } };
      });

      afterEach('restore stub', function() {
        sinon.restore();
      });

      context('with arguments', function() {
        context('with only some arguments', function() {
          context('without defaults', function() {
            it('prompts for the missing argument', async function() {
              const args = { foo: 'jango', bar: undefined };
              await promptIfNeeded({ args, props: this.props });
              const questions = this.stub.getCall(0).args[0]

              questions.should.have.lengthOf(1)
              questions[0].message.should.eq('message2');
              expect(questions[0].default).to.be.undefined;
            });
          });

          context('with defaults', function() {
            it('prompts for the missing argument', async function() {
              const args = { foo: undefined, bar: undefined };
              const defaults = { foo: 'foo' };
              await promptIfNeeded({ args, defaults, props: this.props });
              const questions = this.stub.getCall(0).args[0];

              questions.should.have.lengthOf(2)
              questions[0].message.should.eq('message1');
              questions[0].default.should.eq('foo');
              questions[1].message.should.eq('message2');
              expect(questions[1].default).to.be.undefined;
            });
          });
        });

        context('with all arguments', function() {
          it('does not prompt', async function() {
            const args = { foo: 'foo', bar: 'bar' };
            await promptIfNeeded({ args, props: this.props });
            const questions = this.stub.getCall(0).args[0];

            questions.should.have.lengthOf(0);
          });
        });
      });

      context('with no arguments', function() {
        it('prompts', async function() {
          const args = { foo: 'foo', bar: 'bar' };
          await promptIfNeeded({ args, props: this.props });
          const questions = this.stub.getCall(0).args[0];

          questions.should.have.lengthOf(0);
        });
      });
    });
  });
});
