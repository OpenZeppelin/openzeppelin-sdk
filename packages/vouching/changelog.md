# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v2.0.0 - 2018-10-25

Initial version of the `vouching` package. 

### Added

- Initial contracts `ZEPToken` and `Vouching` for token and vouching mechanics ([#115](https://github.com/zeppelinos/zos/issues/115))
- Integrate TPL on ZEP token contract ([#141](https://github.com/zeppelinos/zos/issues/141))
- Index names in `Vouching` events using name hash ([#133](https://github.com/zeppelinos/zos/issues/133))
- Add TPL integration tests ([#145](https://github.com/zeppelinos/zos/issues/145))
- Flag vouching package as public in npm ([#183](https://github.com/zeppelinos/zos/issues/183))
- Full deployment of vouching app in ropsten and new required scripts ([#186](https://github.com/zeppelinos/zos/issues/186))
- Ensure that removed dependency names can no longer be reused ([#217](https://github.com/zeppelinos/zos/issues/217))
- Require that dependencies registered in `Vouching` are contracts and not external addresses ([#225](https://github.com/zeppelinos/zos/issues/225))
- Tests for the vouching app deploy scripts ([#212](https://github.com/zeppelinos/zos/issues/212))
- Improve ZEP-TPL interaction documentation and tests ([#236](https://github.com/zeppelinos/zos/issues/236))
