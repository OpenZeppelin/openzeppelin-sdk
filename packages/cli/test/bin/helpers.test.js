import sinon from 'sinon';
import fs from 'fs';
import lookForRootDirectory from '../../src/bin/helpers';

describe('bin helpers', function() {
  describe('lookForRootDirectory', function() {
    beforeEach('sets directory', function() {
      this.directory = '/home/user/some/zos-project/dir1/dir2';
    });

    afterEach(function() {
      sinon.restore();
    });

    context('when no package.json file or zos file found', function() {
      it('returns the original path', function() {
        sinon.stub(fs, 'readdirSync').returns(['foo', 'bar', 'buz'])
        const rootDirectory = lookForRootDirectory(this.directory);
        expect(rootDirectory).to.be.null;
      });
    });

    context('when package.json and package-lock.json or zos.json found', function() {
      context('when package.json or package-lock.json file found', function() {
        beforeEach('stubs calls', function() {
          sinon.stub(fs, 'readdirSync')
          .onCall(0).returns(['foo', 'bar', 'buz'])
          .onCall(1).returns(['foo', 'bar', 'buz'])
          .onCall(2).returns(['package.json', 'package-lock.json', 'buz']);
        });

        it('returns the correct directory', function() {
          const rootDirectory = lookForRootDirectory(this.directory);
          rootDirectory.should.eq('/home/user/some/zos-project');
        });
      });

      context('when zos.json file found', function() {
        beforeEach('stubs calls', function() {
          sinon.stub(fs, 'readdirSync')
          .onCall(0).returns(['foo', 'bar', 'buz'])
          .onCall(1).returns(['foo', 'bar', 'buz'])
          .onCall(2).returns(['zos.json', 'bar', 'buz']);
        });

        it('returns the correct directory', function() {
          const rootDirectory = lookForRootDirectory(this.directory);
          rootDirectory.should.eq('/home/user/some/zos-project');
        });
      });
    });
  });
});
