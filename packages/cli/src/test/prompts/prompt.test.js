'use strict';

require('../setup');
import sinon from 'sinon';
import { expect } from 'chai';

import * as prompt from '../../prompts/prompt';

import inquirer from 'inquirer';
import { ContractMethodMutability as Mutability } from '@openzeppelin/upgrades';

import ContractManager from '../../models/local/ContractManager';
import ConfigManager from '../../models/config/ConfigManager';
import ProjectFile from '../../models/files/ProjectFile';
import { promptIfNeeded, contractsList, networksList, methodsList, argsList, proxyInfo } from '../../prompts/prompt';
import NetworkFile from '../../models/files/NetworkFile';

const sandbox = sinon.createSandbox();

describe('prompt', function() {
  describe('functions', function() {
    describe('#promptIfNeeded', function() {
      beforeEach('set stub and initialize', function() {
        this.stub = sandbox.stub(inquirer, 'prompt').returns({});
        this.props = {
          foo: { message: 'message1', type: 'input' },
          bar: { message: 'message2', type: 'input' },
        };
        this.interactive = true;
        this.originalDisableInteractivity = prompt.DISABLE_INTERACTIVITY;
        prompt.DISABLE_INTERACTIVITY = false;
      });

      afterEach('restore stub', function() {
        sandbox.restore();
        prompt.DISABLE_INTERACTIVITY = this.originalDisableInteractivity;
      });

      context('with arguments', function() {
        context('with only some arguments', function() {
          context('without defaults', function() {
            it('prompts for the missing argument', async function() {
              const args = { foo: 'jango', bar: undefined };
              await promptIfNeeded({ args, props: this.props }, this.interactive);
              const questions = this.stub.getCall(0).args[0];

              questions.should.have.lengthOf(1);
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

              questions.should.have.lengthOf(2);
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

      context('with DISABLE_INTERACTIVITY environment variable set', function() {
        beforeEach('disable interactivity', function() {
          prompt.DISABLE_INTERACTIVITY = true;
        });

        afterEach('enable interactivity', function() {
          prompt.DISABLE_INTERACTIVITY = false;
        });

        it('does not prompt', async function() {
          const args = { foo: undefined, bar: undefined };
          await promptIfNeeded({ args, props: this.props }, this.interactive);
          const call = this.stub.getCall(0);

          (call === null).should.be.true;
        });
      });
    });

    describe('#networksList', function() {
      afterEach('restore stub', function() {
        sandbox.restore();
      });

      it('returns an object with correct keys and values', function() {
        this.stub = sandbox.stub(ConfigManager, 'getNetworkNamesFromConfig').returns(['Meinet', 'Rinkebay']);

        const networkList = networksList('network', 'listy');
        networkList.should.be.an('object');
        networkList.network.should.be.an('object').that.has.all.keys('type', 'message', 'choices');
        networkList.network.type.should.eq('listy');
        networkList.network.message.should.eq('Pick a network');
        networkList.network.choices.should.have.members(['Meinet', 'Rinkebay']);
      });

      it('throws if no networks are set', function() {
        this.stub = sandbox.stub(ConfigManager, 'getNetworkNamesFromConfig').returns(undefined);
        expect(() => networksList('network', 'listy')).to.throw(/No 'networks' found/);
      });
    });

    describe('#contractsList', function() {
      beforeEach('set stub and initialize', function() {
        sandbox.stub(ContractManager.prototype, 'getContractNames').returns(['Foo', 'Bar', 'Buz']);
        sandbox.stub(ProjectFile.prototype, 'dependencies').get(() => ({ 'mock-stdlib': '1.1.0' }));
        sandbox.stub(ProjectFile.prototype, 'contracts').get(() => ['Foo', 'Bar']);
      });

      afterEach('restore stub', function() {
        sandbox.restore();
      });

      context('when looking for built contracts', function() {
        it('returns an object with correct keys and values from build dir', function() {
          const contracts = contractsList('keyName', 'Im a message', 'listy', 'built');

          contracts.should.be.an('object');
          contracts.keyName.should.be.an('object').that.has.all.keys('type', 'message', 'choices');
          contracts.keyName.type.should.eq('listy');
          contracts.keyName.message.should.eq('Im a message');
          contracts.keyName.choices.should.include.members(['Foo', 'Bar', 'Buz']);
        });
      });

      context('when looking for added contracts', function() {
        it('returns an object with correct keys and values from local', function() {
          const contracts = contractsList('keyName', 'Im a message', 'listy', 'added');

          contracts.should.be.an('object');
          contracts.keyName.should.be.an('object').that.has.all.keys('type', 'message', 'choices');
          contracts.keyName.type.should.eq('listy');
          contracts.keyName.message.should.eq('Im a message');
          contracts.keyName.choices.should.not.deep.include({
            name: 'Buz',
            value: 'Buz',
          });
          contracts.keyName.choices.should.deep.include.members([
            { name: 'Foo', value: 'Foo' },
            { name: 'Bar', value: 'Bar' },
          ]);
        });
      });

      context('when looking for not yet added but built contracts', function() {
        it('returns an object with not added contracts', function() {
          const contracts = contractsList('keyName', 'Im a message', 'listy', 'notAdded');
          contracts.keyName.choices.should.include.members(['Buz']);
          contracts.keyName.choices.should.not.include.members(['Foo', 'Bar']);
        });
      });

      context('when looking for both built and package contracts', function() {
        it('returns an object with all correct keys and values', function() {
          const contracts = contractsList('keyName', 'Im a message', 'listy', 'all');

          contracts.should.be.an('object');
          contracts.keyName.should.be.an('object').that.has.all.keys('type', 'message', 'choices');
          contracts.keyName.type.should.eq('listy');
          contracts.keyName.message.should.eq('Im a message');
          contracts.keyName.choices.should.include.members(['Foo', 'Bar', 'mock-stdlib/Foo', 'mock-stdlib/Bar']);
        });
      });
    });

    describe('#methodsList', function() {
      beforeEach('initialize projectFile', function() {
        this.projectFile = new ProjectFile('mocks/mock-stdlib-2/zos.json');
      });

      context('when providing an unexistent contract in the package', function() {
        it('returns an empty array of methods', function() {
          const methods = methodsList('Foobar', Mutability.NotConstant, this.projectFile);
          methods.should.be.an('array').that.is.empty;
        });
      });

      context('when providing an existent contract', function() {
        context('when querying constant methods', function() {
          beforeEach(function() {
            this.methods = methodsList('GreeterImpl', Mutability.Constant, this.projectFile);
          });

          it('returns an array of constant methods', function() {
            this.methods.should.be.an('array');
            this.methods.should.have.lengthOf(3);
            this.methods.every(m => m.should.be.an('object').that.has.all.keys('name', 'value'));
          });

          it('avoids showing paramater name if not present', function() {
            const method = this.methods.find(m => m.name === 'greetings(uint256)');
            method.value.should.be.an('object').that.has.all.keys('name', 'selector');
          });

          it('shows paramater name if present', function() {
            const method = this.methods.find(m => m.name === 'greeting(who: string)');
            method.value.should.be.an('object').that.has.all.keys('name', 'selector');
          });
        });

        context('when querying non-constant methods', function() {
          it('returns an array of non-constant methods', function() {
            const methods = methodsList('GreeterImpl', Mutability.NotConstant, this.projectFile);
            methods.should.be.an('array');
            methods.should.have.lengthOf(1);
            methods[0].should.be.an('object').that.has.all.keys('name', 'value');
            methods[0].name.should.eq('greet(who: string)');
            methods[0].value.should.be.an('object').that.has.all.keys('name', 'selector');
          });
        });
      });
    });

    describe('#argsList', function() {
      beforeEach('initialize projectFile', function() {
        this.projectFile = new ProjectFile('mocks/mock-stdlib-2/zos.json');
      });

      context('when providing an unexistent contract in the package', function() {
        it('returns an empty array', function() {
          const args = argsList('Foobar', 'foo()', Mutability.NotConstant, this.projectFile);
          args.should.be.an('array').that.is.empty;
        });
      });

      context('when providing an existent contract but an existent identifier', function() {
        it('returns an empty array', function() {
          const args = argsList('GreeterImpl', 'foo(string)', Mutability.NotConstant, this.projectFile);
          args.should.be.an('array').that.is.empty;
        });
      });

      context('when providing an existent contract and identifier', function() {
        context('when the argument has an explicit name', function() {
          it('returns an array of method arguments names', function() {
            const args = argsList('GreeterImpl', 'greet(string)', Mutability.NotConstant, this.projectFile);
            args.should.be.an('array');
            args[0].should.deep.include({ name: 'who', type: 'string' });
          });
        });

        context('when the argument has no name', function() {
          it('returns an array of method arguments names', function() {
            const args = argsList('GreeterImpl', 'greetings(uint256)', Mutability.Constant, this.projectFile);
            args.should.be.an('array');
            args[0].should.deep.include({ name: '#0', type: 'uint256' });
          });
        });
      });
    });

    describe('#proxyInfo', function() {
      beforeEach('initialize projectFile', function() {
        this.projectFile = new ProjectFile('mocks/mock-stdlib-2/zos.json');
      });

      afterEach('restore stubs', function() {
        sandbox.restore();
      });

      it('gets proxy info', function() {
        const getProxiesStub = sandbox.stub(NetworkFile.prototype, 'getProxies').returns([
          {
            contractName: 'Foo',
            address: '0x1',
            package: 'box',
          },
        ]);
        const info = proxyInfo(
          {
            contractName: 'Foo',
            proxyAddress: '0x1',
            packageName: 'box',
          },
          'test',
        );

        getProxiesStub.getCall(0).args[0].should.be.eql({ contractName: 'Foo', address: '0x1', package: 'box' });

        info.should.be.eql({ contractFullName: 'box/Foo', address: '0x1', proxyReference: '0x1' });
      });
    });
  });
});
