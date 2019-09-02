'use strict';

const findUp = require('find-up');
require('chai').should();
const _ = require('lodash');

const { getNetwork, run } = require('../../../util/share')(__dirname);

function cleanup() {
  // haha, famous line
  run('cd .. && rm -rf workdir && mkdir workdir');
}

const network = getNetwork();

function runIntegrationTest({ kit }, action) {
  before('cleaning up project folder', cleanup);

  it('unpack kit', function() {
    // have to replace oz with local version so we test current build
    run(`node ../../../packages/cli/lib/bin/oz-cli.js unpack ${kit}`);
  });

  // have to replace zos with local version so we test current build
  it('replace zos with local version', function() {
    run(`${findUp.sync('node_modules/.bin/lerna')} bootstrap --scope=tests-cli-kits --scope="@openzeppelin/*"`);
  });

  it('init zos project', function() {
    run(`npx zos init ${kit} 1.0.0 --no-interactive`);
  });

  action();

  it('build project', function() {
    run(`cd client && CI="" npm run build`);
  });

  after('cleaning up project folder', cleanup);
}

// TODO-v3: Remove legacy support
describe(`Unpacks a ZepKit on ${network}`, function() {
  runIntegrationTest({ kit: 'zepkit' }, function() {});
});

describe(`Unpack a Starter kit on ${network}`, function() {
  runIntegrationTest({ kit: 'starter' }, function() {});
});

describe(`Unpack a Tutorial kit on ${network}`, function() {
  runIntegrationTest({ kit: 'tutorial' }, function() {
    it('Add Counter contract', function() {
      run(`npx zos add Counter`);
    });

    it(`Push contracts on a ${network}`, function() {
      run(`npx zos push --network ${network}`);
    });

    it(`Create a Counter proxy on a ${network}`, function() {
      run(`npx zos create Counter --init initialize --args 2 --network ${network}`);
    });
  });
});
