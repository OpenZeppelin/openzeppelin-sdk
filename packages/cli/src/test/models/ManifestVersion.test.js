'use strict';

import { checkVersion, isMigratableManifestVersion } from '../../models/files/ManifestVersion';

const projectFileName = 'project.json';

describe('ManifestVersion', function() {
  describe('functions', function() {
    describe('checkVersion', function() {
      context('when latest version', function() {
        it('returns true', function() {
          (() => checkVersion('2.2', projectFileName)).should.not.throw();
        });
      });

      context('when version is undefined', function() {
        it('throws error', function() {
          (() => checkVersion(undefined, projectFileName)).should.throw(/Manifest version identifier not found in/);
        });
      });

      context('when version does not exact major and minor', function() {
        it('throws error on different major', function() {
          (() => checkVersion('3.2', projectFileName)).should.throw(/Unrecognized manifest version identifier/);
        });

        it('throws error on different minor', function() {
          (() => checkVersion('2.3', projectFileName)).should.throw(/Unrecognized manifest version identifier/);
        });
      });

      context('when version is not the latest one, but a valid one', function() {
        it('does not fail nor returns true', function() {
          (() => checkVersion('2', projectFileName)).should.not.throw(/Unrecognized manifest version identifier/);
          (() => checkVersion('2', projectFileName)).should.not.throw(/manifest version identifier not found in/);
        });
      });
    });

    describe('isMigratableManifestVersion', function() {
      context('when version is migratable', function() {
        it('returns false', function() {
          isMigratableManifestVersion('2').should.be.true;
        });
      });

      context('when version is the latest one', function() {
        it('returns true', function() {
          isMigratableManifestVersion('2.2').should.be.false;
        });
      });

      context('when version is null or undefined', function() {
        it('returns true', function() {
          isMigratableManifestVersion(undefined).should.be.false;
          isMigratableManifestVersion(null).should.be.false;
        });
      });
    });
  });
});
