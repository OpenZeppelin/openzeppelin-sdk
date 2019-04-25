'use strict';

require('../setup');
import sinon from 'sinon';
import inquirer from 'inquirer';
import Truffle from '../../src/models/initializer/truffle/Truffle';
import LocalController from '../../src/models/local/LocalController';
import ZosPackageFile from '../../src/models/files/ZosPackageFile';
import { promptIfNeeded, contractsList, networksList, methodsList, argsList } from '../../src/prompts/prompt';

contract('prompt', function(_, owner) {
  describe('functions', function() {
    describe('#promptIfNeeded', function() {
      beforeEach('set stub and initialize', function() {
        this.stub = sinon.stub(inquirer, 'prompt').returns({});
        this.props = { foo: { message: 'message1', type: 'input' }, bar: { message: 'message2', type: 'input' } };
        this.interactive = true;
      });

      afterEach('restore stub', function() {
        sinon.restore();
      });

      context('with arguments', function() {
        context('with only some arguments', function() {
          context('without defaults', function() {
            it('prompts for the missing argument', async function() {
              const args = { foo: 'jango', bar: undefined };
              await promptIfNeeded({ args, props: this.props }, this.interactive);
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
              await promptIfNeeded({ args, defaults, props: this.props }, this.interactive);
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
            await promptIfNeeded({ args, props: this.props }, this.interactive);
            const questions = this.stub.getCall(0).args[0];

            questions.should.have.lengthOf(0);
          });
        });
      });

      context('with no arguments', function() {
        it('prompts', async function() {
          const args = { foo: 'foo', bar: 'bar' };
          await promptIfNeeded({ args, props: this.props }, this.interactive);
          const questions = this.stub.getCall(0).args[0];

          questions.should.have.lengthOf(0);
        });
      });
    });

    describe('#networksList', function() {
      beforeEach('set stub and initialize', function() {
        this.stub = sinon.stub(Truffle, 'getNetworkNamesFromConfig').returns(['Meinet', 'Rinkebay']);
      });

      afterEach('restore stub', function() {
        sinon.restore();
      });

      it('returns an object with correct keys and values', function() {
        const networkList = networksList('network', 'listy');
        networkList.should.be.an('object');
        networkList.network.should.be.an('object').that.has.all.keys('type', 'message', 'choices');
        networkList.network.type.should.eq('listy');
        networkList.network.message.should.eq('Select a network from the network list');
        networkList.network.choices.should.have.members(['Meinet', 'Rinkebay']);
      });
    });

    describe('#contractsList', function() {
      beforeEach('set stub and initialize', function() {
        sinon.stub(Truffle, 'getContractNames').returns(['Foo', 'Bar']);
      });

      afterEach('restore stub', function() {
        sinon.restore();
      });

      it('returns an object with correct keys and values', function() {
        const contracts = contractsList('keyName', 'Im a message', 'listy');

        contracts.should.be.an('object');
        contracts.keyName.should.be.an('object').that.has.all.keys('type', 'message', 'choices');
        contracts.keyName.type.should.eq('listy');
        contracts.keyName.message.should.eq('Im a message');
        contracts.keyName.choices.should.include.members(['Foo', 'Bar']);
      });
    });

    describe('#methodsList', function() {
      beforeEach('initialize packageFile', function() {
        this.packageFile = new ZosPackageFile('test/mocks/mock-stdlib-2/zos.json');
      });

      context('when providing an unexistent contract in the package', function() {
        it('returns an empty array of methods', function() {
          const methods = methodsList('Foobar', this.packageFile);
          methods.should.be.an('array').that.is.empty;
        });
      });

      context('when providing an existent contract', function() {
        it('returns an array of methods', function() {
          const methods = methodsList('Greeter', this.packageFile);
          methods.should.be.an('array');
          methods.should.have.lengthOf(3);
          methods[0].should.be.an('object').that.has.all.keys('name', 'value');
          methods[0].name.should.eq('greet(who: string)');
          methods[0].value.should.be.an('object').that.has.all.keys('name', 'selector');
        })
      });
    });

    describe('#argsList', function() {
      beforeEach('initialize packageFile', function() {
        this.packageFile = new ZosPackageFile('test/mocks/mock-stdlib-2/zos.json');
      });

      context('when providing an unexistent contract in the package', function() {
        it('returns an empty array', function() {
          const args = argsList('Foobar', 'foo()', this.packageFile);
          args.should.be.an('array').that.is.empty;
        });
      });

      context('when providing an existent contract but an existent identifier', function() {
        it('returns an empty array', function() {
          const args = argsList('Greeter', 'foo(string)', this.packageFile);
          args.should.be.an('array').that.is.empty;
        });
      });

      context('when providing an existent contract and identifier', function() {
        it('returns an array of method arguments names', function() {
          const args = argsList('Greeter', 'greet(string)', this.packageFile);
          args.should.be.an('array');
          args[0].should.eq('who');
        });
      });
    });
  });
});
