'use strict';

require('chai').should();

const { getNetwork, run } = require('../../../util/share')(__dirname);

function cleanup() {
  // haha, famous line
  run('cd .. && rm -rf workdir && mkdir workdir');
}

const network = getNetwork();

// TODO: Review warning by react-scripts about eslint versions.
process.env.SKIP_PREFLIGHT_CHECK = true;

function runIntegrationTest({ kit }, action) {
  before('cleaning up project folder', cleanup);

  it('unpack kit', function() {
    run(`node ../../../packages/cli/lib/bin/oz-cli.js unpack ${kit}`);
  });

  // have to replace oz with local version so we test current build
  it('replace oz with local version', function() {
    const version = require('../package.json').version;
    run(`yarn add @openzeppelin/upgrades@${version}`);
    run(`yarn add -D @openzeppelin/cli@${version}`);
  });

  it('init oz project', function() {
    run(`npx oz init ${kit} 1.0.0 --no-interactive`);
  });

  action();

  it('build project', function() {
    run(`cd client && CI="" npm run build`);
  });

  after('cleaning up project folder', cleanup);
}

describe(`Unpack a Starter Kit on the ${network}`, function() {
  runIntegrationTest({ kit: 'starter' }, function() {});
});

describe(`Unpack a Tutorial Kit on the ${network}`, function() {
  runIntegrationTest({ kit: 'tutorial' }, function() {
    it('Patch counter contract', function() {
      run(`patch ./contracts/Counter.sol ../test/counter.patch`);
    });

    it('Add Counter contract', function() {
      run(`npx oz add Counter`);
    });

    it(`Create a Counter proxy on the ${network}`, function() {
      run(`npx oz deploy Counter 42 --network ${network} --kind upgradeable`);
    });
  });
});

describe(`Unpack a GSN Kit on the ${network}`, function() {
  runIntegrationTest({ kit: 'gsn' }, function() {
    it('Patch counter contract', function() {
      run(`patch ./contracts/Counter.sol ../test/gsn.patch`);
    });

    it('Install @openzeppelin/contracs dependency', function() {
      run(`npm i @openzeppelin/contracts@latest`);
    });

    it('Add Counter contract', function() {
      run(`npx oz add Counter`);
    });

    it(`Create a Counter proxy on the ${network}`, function() {
      run(`npx oz deploy Counter 42 --network ${network} --kind upgradeable`);
    });
  });
});
