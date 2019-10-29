'use strict';
require('../../setup');

import sinon from 'sinon';
import NetworkController from '../../../src/models/network/NetworkController';
import NetworkFile from '../../../src/models/files/NetworkFile';
import ProjectFile from '../../../src/models/files/ProjectFile';
import { AppProjectDeployer, ProxyAdminProjectDeployer } from '../../../src/models/network/ProjectDeployer';

contract('NetworkController', function() {

  let deployer, projectFile, networkFile, controller

  beforeEach(()=> {
    deployer = sinon.createStubInstance(AppProjectDeployer)
  })

  afterEach(() => {
    sinon.restore();
  })

  describe('_solidityLibsForPush()', () => {
    describe('with one public library', () => {
      beforeEach(() => {
        projectFile = new ProjectFile('test/mocks/mock-stdlib/zos.json');
        networkFile = new NetworkFile(projectFile, 'test');
        controller = new NetworkController('test', {}, networkFile);
      })

      it('should retrieve the library', () => {
        const libs = controller._solidityLibsForPush()
        libs.length.should.eq(1)
      })
    })

    describe('with libraries depending on libs', () => {
      beforeEach(() => {
        projectFile = new ProjectFile('test/mocks/mock-stdlib-libdeps/zos.json');
        networkFile = new NetworkFile(projectFile, 'test');
        controller = new NetworkController('test', {}, networkFile);
      })

      it('should retrieve the library', () => {
        const libs = controller._solidityLibsForPush()

        libs.length.should.eq(2)
      })
    })
  })

  describe('uploadSolidityLibs()', () => {
    let projectMock, networkFileMock

    beforeEach(() => {
      projectFile = new ProjectFile('test/mocks/mock-stdlib-libdeps/zos.json');
      networkFile = new NetworkFile(projectFile, 'test');
      controller = new NetworkController('test', {}, networkFile);
      controller.project = {
        setImplementation: function () {
          return '42'
        }
      }
      networkFileMock = sinon.mock(networkFile)
    })

    it('set dependencies', () => {
      const libs = controller._solidityLibsForPush()

      networkFileMock.expects('addSolidityLib').withArgs('GreeterLibLib', '42')
      networkFileMock.expects('addSolidityLib').withArgs('GreeterLibWithLib', '42')

      controller.uploadSolidityLibs(libs)
    })
  })
});
