import { expect } from 'chai';
import findRootDirectory from '../../bin/helpers';

describe('bin helpers', function() {
  describe('findRootDirectory', function() {
    context('when no package.json file and zos file found', function() {
      it('returns the original path', function() {
        const rootDirectory = findRootDirectory('/unexistent-directory');
        expect(rootDirectory).to.be.null;
      });
    });

    context('when package.json or zos.json found', function() {
      it('returns the correct directory', function() {
        const path = 'mocks/mock-stdlib-2/build/contracts';
        findRootDirectory(path).should.match(/\/mocks\/mock-stdlib-2/g);
      });
    });
  });
});
