'use strict'
require('../../setup')

import LibProject from '../../../src/project/LibProject'
import shouldBehaveLikeProject from './Project.behavior';

contract('LibProject', function (accounts) {
  const [_, owner] = accounts
  const version = '0.2.0'

  const deploy = async function () {
    this.project = await LibProject.deploy(version, { from: owner })
  }

  const fetch = async function () {
    const thepackage = await this.project.getProjectPackage()
    this.project = await LibProject.fetch(thepackage.address, version, { from: owner })
  }

  shouldBehaveLikeProject(deploy, fetch)
})