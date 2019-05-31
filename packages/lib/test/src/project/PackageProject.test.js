'use strict';
require('../../setup');

import PackageProject from '../../../src/project/PackageProject';
import shouldBehaveLikePackageProject from './PackageProject.behavior';

contract('PackageProject', function(accounts) {
  const [_, owner] = accounts;
  const version = '0.2.0';

  beforeEach('deploying', async function() {
    this.project = await PackageProject.fetchOrDeploy(
      version,
      { from: owner },
      {},
    );
  });

  shouldBehaveLikePackageProject({
    fetch: async function() {
      const thepackage = await this.project.getProjectPackage();
      this.project = await PackageProject.fetchOrDeploy(
        version,
        { from: owner },
        { packageAddress: thepackage.address },
      );
    },
  });
});
