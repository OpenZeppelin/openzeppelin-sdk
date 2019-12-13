# OpenZeppelin SDK Documentation

> Documentation for the OpenZeppelin smart contract platform.

The content in this package is published in https://docs.openzeppelin.com/sdk/.

Additionally, some of the content in that site is automatically generated from
the source code comments in this repository, in the smart contracts and in the CLI.

## Development setup

To get a local preview of the site, run `yarn docs:watch`, and navigate to `http://localhost:8080`.

## Updating the site

Each version that is published on the site corresponds to a branch in this repository with a name like `release-docs/*`, for example `release-docs/2.6`. In order to update the site we have to update those branches. Avoid commiting directly to those branches; instead, commit the fixes to `master` and then `git cherry-pick` the commits over to the appropriate branch.

## Maintainers

* [@frangio](https://github.com/frangio/)
* [@jcarpanelli](https://github.com/jcarpanelli/)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the OpenZeppelin developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.openzeppelin.com/) and
[Twitter account](https://twitter.com/openzeppelin).

## License

[MIT](LICENSE.md) © OpenZeppelin
