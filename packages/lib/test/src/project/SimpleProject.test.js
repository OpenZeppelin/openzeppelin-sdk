'use strict'
require('../../setup')

import SimpleProject from '../../../src/project/SimpleProject'
import shouldManageProxies from './ProxyProject.behaviour';
import { noop } from 'lodash';

contract('SimpleProject', function (accounts) {
  const [_, owner, another, initializer] = accounts
  const name = 'MyProject'
  
  beforeEach('initializing', async function () {
    this.project = new SimpleProject(name, { from: owner }, { from: initializer })
    this.adminAddress = owner
  });
  
  shouldManageProxies({
    supportsNames: false,
    otherAdmin: another,
    setImplementations: noop
  })
})