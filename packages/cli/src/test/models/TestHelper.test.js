'use strict';

require('../setup');

import { Contracts } from '@openzeppelin/upgrades';
import { accounts } from '@openzeppelin/test-environment';

import TestHelper from '../../models/TestHelper';
import ProjectFile from '../../models/files/ProjectFile';
import NetworkFile from '../../models/files/NetworkFile';

const ImplV1 = Contracts.getFromLocal('ImplV1');
const WithLibraryImpl = Contracts.getFromLocal('WithLibraryImplV1');

describe('TestHelper', function() {
  const [owner] = accounts;
  const txParams = { from: owner };
  const projectName = 'Herbs';
  const initialVersion = '1.1.0';

  describe('for app project', function() {
    beforeEach(async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-contracts-and-multiple-stdlibs.zos.json');
      this.networkFile = new NetworkFile(this.projectFile, 'test');
      this.project = await TestHelper(txParams, this.networkFile);
    });

    it('deploys all contracts', async function() {
      const { app, directory, package: thePackage } = this.project;

      app.address.should.not.be.null;
      directory.address.should.not.be.null;
      thePackage.address.should.not.be.null;
    });

    it('sets app at initial version', async function() {
      (await this.project.getCurrentVersion()).should.eq(initialVersion);
    });

    it('registers initial version in package', async function() {
      (await this.project.package.hasVersion(initialVersion)).should.be.true;
    });

    it('initializes all app properties', async function() {
      const { version, name } = this.project;

      version.should.eq(initialVersion);
      name.should.eq(projectName);
    });

    it('returns the current directory', async function() {
      (await this.project.getCurrentDirectory()).address.should.not.be.null;
    });

    it('has dependencies deployed', async function() {
      const dep1 = await this.project.getDependencyPackage('mock-stdlib-undeployed');
      const dep2 = await this.project.getDependencyPackage('mock-stdlib-undeployed-2');

      dep1.should.not.be.null;
      dep2.should.not.be.null;
    });

    it('retrieves a mock from app', async function() {
      const proxy = await this.project.createProxy(ImplV1, {
        contractName: 'Impl',
      });
      const say = await proxy.methods.say().call();

      say.should.eq('V1');
    });
  });

  describe('for an unpublished project', function() {
    beforeEach(async function() {
      this.projectFile = new ProjectFile('mocks/packages/package-with-contracts.zos.json');
      this.projectFile.publish = false;
      this.networkFile = new NetworkFile(this.projectFile, 'test');
      this.project = await TestHelper(txParams, this.networkFile);
    });

    it('retrieves a mock from app', async function() {
      const proxy = await this.project.createProxy(ImplV1, {
        contractName: 'Impl',
      });
      const say = await proxy.methods.say().call();
      say.should.eq('V1');
    });

    it('creates two different proxies', async function() {
      const proxy1 = await this.project.createProxy(ImplV1, {
        contractName: 'Impl',
      });
      const proxy2 = await this.project.createProxy(ImplV1, {
        contractName: 'Impl',
      });
      proxy1.address.should.not.be.eq(proxy2.address);
    });
  });
});
