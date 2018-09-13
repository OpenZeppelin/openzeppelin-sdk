'use strict'
require('../../setup')

import LibProject from '../../../src/project/LibProject'
import shouldBehaveLikePackageProject from './PackageProject.behavior';

contract('LibProject', function (accounts) {
  const [_, owner] = accounts
  const version = '0.2.0'

  beforeEach('deploying', async function () {
    this.project = await LibProject.deploy(version, { from: owner })
  });

  shouldBehaveLikePackageProject({ 
    fetch: async function () {
      const thepackage = await this.project.getProjectPackage()
      this.project = await LibProject.fetch(thepackage.address, version, { from: owner })
    } 
  })
})