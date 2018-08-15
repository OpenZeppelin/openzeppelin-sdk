import sinon from 'sinon';

import * as addAll from '../../src/scripts/add-all';
import * as add from '../../src/scripts/add';
import * as bump from '../../src/scripts/bump';
import * as compare from '../../src/scripts/compare';
import * as create from '../../src/scripts/create';
import * as freeze from '../../src/scripts/freeze';
import * as initLib from '../../src/scripts/init-lib';
import * as init from '../../src/scripts/init';
import * as link from '../../src/scripts/link';
import * as pull from '../../src/scripts/pull';
import * as push from '../../src/scripts/push';
import * as remove from '../../src/scripts/remove';
import * as session from '../../src/scripts/session';
import * as status from '../../src/scripts/status';
import * as update from '../../src/scripts/update';
import * as verify from '../../src/scripts/verify';

import * as runWithTruffle from '../../src/utils/runWithTruffle';
import Session from '../../src/models/network/Session';
import program from '../../src/bin/program';

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
    this.compare = sinon.stub(compare, 'default')
    this.create = sinon.stub(create, 'default')
    this.freeze = sinon.stub(freeze, 'default')
    this.initLib = sinon.stub(initLib, 'default')
    this.init = sinon.stub(init, 'default')
    this.link = sinon.stub(link, 'default')
    this.pull = sinon.stub(pull, 'default')
    this.push = sinon.stub(push, 'default')
    this.remove = sinon.stub(remove, 'default')
    this.session = sinon.stub(session, 'default')
    this.status = sinon.stub(status, 'default')
    this.update = sinon.stub(update, 'default')
    this.verify = sinon.stub(verify, 'default')

    this.runWithTruffle = sinon.stub(runWithTruffle, 'default').callsFake(function (script, options) {
      const { network, from, timeout } = Session.getOptions(options)
      const txParams = from ? { from } : {}
      if (!network) throw Error('A network name must be provided to execute the requested action.')
      script({ network, txParams })
    })
  })

  afterEach('restore', function () {
    this.addAll.restore()
    this.add.restore()
    this.bump.restore()
    this.compare.restore()
    this.create.restore()
    this.freeze.restore()
    this.initLib.restore()
    this.init.restore()
    this.link.restore()
    this.pull.restore()
    this.push.restore()
    this.remove.restore()
    this.session.restore()
    this.status.restore()
    this.update.restore()
    this.verify.restore()
    this.runWithTruffle.restore()
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