'use strict';
require('../../setup');

import sinon from 'sinon';
import NetworkController from '../../../src/models/network/NetworkController';
import NetworkFile from '../../../src/models/files/NetworkFile';
import ProjectFile from '../../../src/models/files/ProjectFile';
import { AppProjectDeployer } from '../../../src/models/network/ProjectDeployer';

contract('NetworkController', function() {
  let projectFile, networkFile, controller;

  beforeEach(() => {
    sinon.createStubInstance(AppProjectDeployer);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('_getAllSolidityLibNames()', () => {
    let controllerMock;
    beforeEach(() => {
      projectFile = new ProjectFile('test/mocks/mock-stdlib/zos.json');
      networkFile = new NetworkFile(projectFile, 'test');
      controller = new NetworkController('test', {}, networkFile);
      controllerMock = sinon.mock(controller);
    });

    it('should order dependencies correctly', () => {
      /**
       *
       *  A => D, E, F
       *  B => C, E, F, G
       *  C => D, G
       *  D => []
       *  E => D, Y
       *  F => G
       *  G => E
       *  Y => []
       *
       *  Expected ordering:
       *
       *  [Y, D, E, G, F, A, C, B]
       *
       */

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('0')
        .returns(['A', 'B', 'C']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('A')
        .returns(['D', 'E', 'F']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('B')
        .returns(['C', 'E', 'F', 'G']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('C')
        .returns(['D', 'G']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('Y')
        .returns(['Z']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('Z')
        .returns([]);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('D')
        .returns([]);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('E')
        .returns(['D', 'Y']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('F')
        .returns(['G']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('G')
        .returns(['E']);

      const result = controller._getAllSolidityLibNames(['0']);

      assert.deepEqual(result, ['D', 'Z', 'Y', 'E', 'G', 'F', 'A', 'C', 'B']);
    });

    it('should throw on cycles', () => {
      /**
       *
       *  A => B
       *  B => C
       *  C => A
       *
       */

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('0')
        .returns(['A']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('A')
        .returns(['B']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('B')
        .returns(['C']);

      controllerMock
        .expects('_getContractDependencies')
        .withArgs('C')
        .returns(['A']);

      expect(() => {
        controller._getAllSolidityLibNames(['0']);
      }).to.throw(/circular/);
    });
  });

  describe('_solidityLibsForPush()', () => {
    describe('with one public library', () => {
      beforeEach(() => {
        projectFile = new ProjectFile('test/mocks/mock-stdlib/zos.json');
        networkFile = new NetworkFile(projectFile, 'test');
        controller = new NetworkController('test', {}, networkFile);
      });

      it('should retrieve the library', () => {
        const libs = controller._solidityLibsForPush();
        libs.length.should.eq(1);
      });
    });

    describe('with libraries depending on libs', () => {
      beforeEach(() => {
        projectFile = new ProjectFile('test/mocks/mock-stdlib-libdeps/zos.json');
        networkFile = new NetworkFile(projectFile, 'test');
        controller = new NetworkController('test', {}, networkFile);
      });

      it('should retrieve the library', () => {
        const libs = controller._solidityLibsForPush();

        libs.length.should.eq(2);
      });
    });
  });

  describe('uploadSolidityLibs()', () => {
    let networkFileMock;

    beforeEach(() => {
      projectFile = new ProjectFile('test/mocks/mock-stdlib-libdeps/zos.json');
      networkFile = new NetworkFile(projectFile, 'test');
      controller = new NetworkController('test', {}, networkFile);
      controller.project = {
        setImplementation: function() {
          return '42';
        },
      };
      networkFileMock = sinon.mock(networkFile);
    });

    it('set dependencies', () => {
      const libs = controller._solidityLibsForPush();

      networkFileMock.expects('addSolidityLib').withArgs('GreeterLibLib', '42');
      networkFileMock.expects('addSolidityLib').withArgs('GreeterLibWithLib', '42');

      controller.uploadSolidityLibs(libs);
    });
  });
});
