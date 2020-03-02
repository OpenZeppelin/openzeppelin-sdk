'use strict';
require('../../setup');

import { assert, expect } from 'chai';

import sinon from 'sinon';
import NetworkController from '../../../models/network/NetworkController';
import NetworkFile from '../../../models/files/NetworkFile';
import ProjectFile from '../../../models/files/ProjectFile';
import { AppProjectDeployer } from '../../../models/network/ProjectDeployer';

describe('NetworkController', function() {
  let projectFile, networkFile, controller;

  beforeEach(() => {
    sinon.createStubInstance(AppProjectDeployer);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAllSolidityLibNames()', () => {
    let controllerMock;
    beforeEach(() => {
      projectFile = new ProjectFile('mocks/mock-stdlib/zos.json');
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
       *  Y => Z
       *  Z => []
       *
       *  Expected ordering:
       *
       *  Note, that order is not exactly fixed.
       *  Some dependencies may swap positions without losing validity like (B, A) == (A, B)
       *  [Z, Y, D, E, G, F, C, B, A]
       *
       */

      controllerMock
        .expects('getContractDependencies')
        .withArgs('0')
        .returns(['A', 'B', 'C']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('A')
        .returns(['D', 'E', 'F']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('B')
        .returns(['C', 'E', 'F', 'G']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('C')
        .returns(['D', 'G']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('Y')
        .returns(['Z']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('Z')
        .returns([]);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('D')
        .returns([]);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('E')
        .returns(['D', 'Y']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('F')
        .returns(['G']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('G')
        .returns(['E']);

      const result = controller.getAllSolidityLibNames(['0']);

      assert.deepEqual(result, ['Z', 'Y', 'D', 'E', 'G', 'F', 'C', 'B', 'A']);
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
        .expects('getContractDependencies')
        .withArgs('0')
        .returns(['A']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('A')
        .returns(['B']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('B')
        .returns(['C']);

      controllerMock
        .expects('getContractDependencies')
        .withArgs('C')
        .returns(['A']);

      expect(() => {
        controller.getAllSolidityLibNames(['0']);
      }).to.throw(/Cyclic/);
    });
  });

  describe('solidityLibsForPush()', () => {
    describe('with one public library', () => {
      beforeEach(() => {
        projectFile = new ProjectFile('mocks/mock-stdlib/zos.json');
        networkFile = new NetworkFile(projectFile, 'test');
        controller = new NetworkController('test', {}, networkFile);
      });

      it('should retrieve the library', () => {
        const libs = controller.solidityLibsForPush();
        libs.length.should.eq(1);
      });
    });

    describe('with libraries depending on libs', () => {
      beforeEach(() => {
        projectFile = new ProjectFile('mocks/mock-stdlib-libdeps/zos.json');
        networkFile = new NetworkFile(projectFile, 'test');
        controller = new NetworkController('test', {}, networkFile);
      });

      it('should retrieve the library', () => {
        const libs = controller.solidityLibsForPush();

        libs.length.should.eq(2);
      });
    });
  });

  describe('uploadSolidityLibs()', () => {
    let networkFileMock;

    beforeEach(() => {
      projectFile = new ProjectFile('mocks/mock-stdlib-libdeps/zos.json');
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
      const libs = controller.solidityLibsForPush();

      networkFileMock.expects('addSolidityLib').withArgs('GreeterLibLib', '42');
      networkFileMock.expects('addSolidityLib').withArgs('GreeterLibWithLib', '42');

      controller.uploadSolidityLibs(libs);
    });
  });
});
