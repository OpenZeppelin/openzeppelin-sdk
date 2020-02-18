import sinon from 'sinon';

import * as addAll from '../../scripts/add-all';
import * as add from '../../scripts/add';
import * as bump from '../../scripts/bump';
import * as check from '../../scripts/check';
import * as create from '../../scripts/create';
import * as queryDeployment from '../../scripts/query-deployment';
import * as querySignedDeployment from '../../scripts/query-signed-deployment';
import * as freeze from '../../scripts/freeze';
import * as init from '../../scripts/init';
import * as link from '../../scripts/link';
import * as unlink from '../../scripts/unlink';
import * as publish from '../../scripts/publish';
import * as push from '../../scripts/push';
import * as remove from '../../scripts/remove';
import * as session from '../../scripts/session';
import * as update from '../../scripts/update';
import * as setAdmin from '../../scripts/set-admin';
import * as unpack from '../../scripts/unpack';
import * as transfer from '../../scripts/transfer';
import * as balance from '../../scripts/balance';
import * as sendTx from '../../scripts/send-tx';
import * as call from '../../scripts/call';
import * as accounts from '../../scripts/accounts';

import program from '../../bin/program';
import Session from '../../models/network/Session';
import NetworkFile from '../../models/files/NetworkFile';
import ProjectFile from '../../models/files/ProjectFile';
import * as Compiler from '../../models/compiler/Compiler';
import Dependency from '../../models/dependency/Dependency';
import ConfigManager from '../../models/config/ConfigManager';
import Telemetry from '../../telemetry';

program.Command.prototype.parseReset = function() {
  this.args = [];
  this.rawArgs = [];
  this.options.forEach(option => {
    this[option.name()] = undefined;
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
    this.setAdmin = sinon.stub(setAdmin, 'default');
    this.unpack = sinon.stub(unpack, 'default');
    this.transfer = sinon.stub(transfer, 'default');
    this.balance = sinon.stub(balance, 'default');
    this.sendTx = sinon.stub(sendTx, 'default');
    this.call = sinon.stub(call, 'default');
    this.accounts = sinon.stub(accounts, 'default');

    this.compiler = sinon.stub(Compiler, 'compile');
    this.initializer = sinon.stub(ConfigManager, 'initNetworkConfiguration').callsFake(function(options) {
      ConfigManager.initStaticConfiguration();
      const { network, from } = Session.getOptions(options);
      const txParams = from ? { from } : {};
      return { network, txParams };
    });
    this.getManifestVersion = sinon.stub(NetworkFile, 'getManifestVersion').returns('2.2');
    this.projectFile = sinon.stub(ProjectFile.prototype, 'exists').returns(true);
    const projectFile = new ProjectFile('mocks/mock-stdlib/zos.json');
    this.dependency = sinon.stub(Dependency.prototype, 'projectFile').get(function getterFn() {
      return projectFile;
    });
    this.report = sinon.stub(Telemetry, 'report');
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
