import sinon from 'sinon';

import * as addAll from '../../src/scripts/add-all';
import * as add from '../../src/scripts/add';
import * as bump from '../../src/scripts/bump';
import * as check from '../../src/scripts/check';
import * as compare from '../../src/scripts/compare';
import * as create from '../../src/scripts/create';
import * as freeze from '../../src/scripts/freeze';
import * as init from '../../src/scripts/init';
import * as link from '../../src/scripts/link';
import * as unlink from '../../src/scripts/unlink';
import * as publish from '../../src/scripts/publish';
import * as pull from '../../src/scripts/pull';
import * as push from '../../src/scripts/push';
import * as remove from '../../src/scripts/remove';
import * as session from '../../src/scripts/session';
import * as status from '../../src/scripts/status';
import * as update from '../../src/scripts/update';
import * as verify from '../../src/scripts/verify';
import * as setAdmin from '../../src/scripts/set-admin';

import program from '../../src/bin/program';
import Session from '../../src/models/network/Session';
import ZosNetworkFile from '../../src/models/files/ZosNetworkFile';
import Compiler from '../../src/models/compiler/Compiler';
import ErrorHandler from '../../src/models/errors/ErrorHandler';
import ConfigVariablesInitializer from '../../src/models/initializer/ConfigVariablesInitializer';

program.Command.prototype.parseReset = function() {
  var self = this
  this.args = []
  this.rawArgs = []
  this.options.forEach(function(option) {
    self[option.name()] = undefined
  })
  this.commands.forEach(function(command) {
    if (command.options) {
      command.options.forEach(function(option) {
        command[option.name()] = undefined
      })
    }
  })
}

exports.stubCommands = function () {
  beforeEach('set up stubs', function () {
    this.addAll = sinon.stub(addAll, 'default')
    this.add = sinon.stub(add, 'default')
    this.bump = sinon.stub(bump, 'default')
    this.check = sinon.stub(check, 'default')
    this.compare = sinon.stub(compare, 'default')
    this.create = sinon.stub(create, 'default')
    this.freeze = sinon.stub(freeze, 'default')
    this.init = sinon.stub(init, 'default')
    this.link = sinon.stub(link, 'default')
    this.unlink = sinon.stub(unlink, 'default')
    this.publish = sinon.stub(publish, 'default')
    this.pull = sinon.stub(pull, 'default')
    this.push = sinon.stub(push, 'default')
    this.remove = sinon.stub(remove, 'default')
    this.session = sinon.stub(session, 'default')
    this.status = sinon.stub(status, 'default')
    this.update = sinon.stub(update, 'default')
    this.verify = sinon.stub(verify, 'default')
    this.setAdmin = sinon.stub(setAdmin, 'default')
    this.compiler = sinon.stub(Compiler, 'call').callsFake(() => null)
    this.errorHandler = sinon.stub(ErrorHandler.prototype, 'call').callsFake(() => null)
    this.initializer = sinon.stub(ConfigVariablesInitializer, 'initNetworkConfiguration').callsFake(function (options) {
      ConfigVariablesInitializer.initStaticConfiguration()
      const { network, from } = Session.getOptions(options)
      const txParams = from ? { from } : {}
      return { network, txParams }
    })
    this.getZosversion = sinon.stub(ZosNetworkFile, 'getZosversion').returns('2.2');
  })

  afterEach('restore', function () {
    this.addAll.restore()
    this.add.restore()
    this.bump.restore()
    this.check.restore()
    this.compare.restore()
    this.create.restore()
    this.freeze.restore()
    this.init.restore()
    this.link.restore()
    this.unlink.restore()
    this.publish.restore()
    this.pull.restore()
    this.push.restore()
    this.remove.restore()
    this.session.restore()
    this.status.restore()
    this.update.restore()
    this.verify.restore()
    this.setAdmin.restore()
    this.errorHandler.restore()
    this.initializer.restore()
    this.compiler.restore()
    this.getZosversion.restore()
    program.parseReset()
  })
}

exports.itShouldParse = function (name, cmd, args, cb) {
  it(name, function (done) {
    this[cmd].onFirstCall().callsFake(() => {
      cb(this[cmd])
      done()
    })
    args = args.split(' ')
    args.unshift('node')
    program.parse(args)
  })
}
