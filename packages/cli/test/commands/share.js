import sinon from 'sinon';

import * as addAll from '../../src/scripts/add-all';
import * as add from '../../src/scripts/add';
import * as bump from '../../src/scripts/bump';
import * as check from '../../src/scripts/check';
import * as create from '../../src/scripts/create';
import * as queryDeployment from '../../src/scripts/query-deployment';
import * as querySignedDeployment from '../../src/scripts/query-signed-deployment';
import * as freeze from '../../src/scripts/freeze';
import * as init from '../../src/scripts/init';
import * as link from '../../src/scripts/link';
import * as unlink from '../../src/scripts/unlink';
import * as publish from '../../src/scripts/publish';
import * as push from '../../src/scripts/push';
import * as remove from '../../src/scripts/remove';
import * as session from '../../src/scripts/session';
import * as update from '../../src/scripts/update';
import * as verify from '../../src/scripts/verify';
import * as setAdmin from '../../src/scripts/set-admin';
import * as unpack from '../../src/scripts/unpack';
import * as transfer from '../../src/scripts/transfer';
import * as balance from '../../src/scripts/balance';
import * as sendTx from '../../src/scripts/send-tx';
import * as call from '../../src/scripts/call';
import * as accounts from '../../src/scripts/accounts';

import program from '../../src/bin/program';
import Session from '../../src/models/network/Session';
import NetworkFile from '../../src/models/files/NetworkFile';
import ProjectFile from '../../src/models/files/ProjectFile';
import * as Compiler from '../../src/models/compiler/Compiler';
import Dependency from '../../src/models/dependency/Dependency';
import ErrorHandler from '../../src/models/errors/ErrorHandler';
import ConfigManager from '../../src/models/config/ConfigManager';

program.Command.prototype.parseReset = function() {
  var self = this;
  this.args = [];
  this.rawArgs = [];
  this.options.forEach(function(option) {
    self[option.name()] = undefined;
  });
  this.commands.forEach(function(command) {
    if (command.options) {
      command.options.forEach(function(option) {
        command[option.name()] = undefined;
      });
    }
  });
};

exports.stubCommands = function() {
  beforeEach('set up stubs', function() {
    this.addAll = sinon.stub(addAll, 'default');
    this.add = sinon.stub(add, 'default');
    this.bump = sinon.stub(bump, 'default');
    this.check = sinon.stub(check, 'default');
    this.create = sinon.stub(create, 'default');
    this.queryDeployment = sinon.stub(queryDeployment, 'default');
    this.querySignedDeployment = sinon.stub(querySignedDeployment, 'default');
    this.freeze = sinon.stub(freeze, 'default');
    this.init = sinon.stub(init, 'default');
    this.link = sinon.stub(link, 'default');
    this.unlink = sinon.stub(unlink, 'default');
    this.publish = sinon.stub(publish, 'default');
    this.push = sinon.stub(push, 'default');
    this.remove = sinon.stub(remove, 'default');
    this.session = sinon.stub(session, 'default');
    this.update = sinon.stub(update, 'default');
    this.verify = sinon.stub(verify, 'default');
    this.setAdmin = sinon.stub(setAdmin, 'default');
    this.unpack = sinon.stub(unpack, 'default');
    this.transfer = sinon.stub(transfer, 'default');
    this.balance = sinon.stub(balance, 'default');
    this.sendTx = sinon.stub(sendTx, 'default');
    this.call = sinon.stub(call, 'default');
    this.accounts = sinon.stub(accounts, 'default');

    this.compiler = sinon.stub(Compiler, 'compile');
    this.errorHandler = sinon.stub(ErrorHandler.prototype, 'call').callsFake(() => null);
    this.initializer = sinon.stub(ConfigManager, 'initNetworkConfiguration').callsFake(function(options) {
      ConfigManager.initStaticConfiguration();
      const { network, from } = Session.getOptions(options);
      const txParams = from ? { from } : {};
      return { network, txParams };
    });
    this.getManifestVersion = sinon.stub(NetworkFile, 'getManifestVersion').returns('2.2');
    this.projectFile = sinon.stub(ProjectFile.prototype, 'exists').returns(true);
    const projectFile = new ProjectFile('test/mocks/mock-stdlib/zos.json');
    this.dependency = sinon.stub(Dependency.prototype, 'projectFile').get(function getterFn() {
      return projectFile;
    });
  });

  afterEach('restore', function() {
    sinon.restore();
    program.parseReset();
  });
};

exports.itShouldParse = function(name, cmd, args, cb) {
  it(name, function(done) {
    this[cmd].onFirstCall().callsFake(() => {
      let err;
      try {
        cb(this[cmd]);
      } catch (e) {
        err = e;
      }
      done(err);
    });
    args = args.split(' ');
    args.unshift('node');
    program.parse(args);
  });
};
