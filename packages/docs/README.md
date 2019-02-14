# ZeppelinOS documentation website

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)

> Documentation for the ZeppelinOS smart contract platform.

## Development setup

First, install [Node.js](http://nodejs.org/), [npm](https://npmjs.com/) and
[git](https://git-scm.com/).

Then, clone the repository and navigate to the docs package:

```sh
git clone https://github.com/zeppelinos/zos.git
cd zos/packages/docs
```

Install Docusaurus:

```sh
npm install --global docusaurus-init
```

Navigate to the `docs/website` directory and install the dependencies:

```sh
cd docs/website
npm install
```

And finally run:

```sh
npm run start
```

This will serve the wesite locally in your computer at `http://localhost:3000/`.

## API Reference generation

At present, we need to generate the API reference for `zos-cli` and `zos-lib`
using
[`gen-docs`](https://github.com/zeppelinos/zos/blob/master/packages/cli/docs/bin/docs.js)
and [`solidity-docgen`](https://github.com/OpenZeppelin/solidity-docgen)
respectively, and then merge the outcome manually by substituting the
corresponding `.md` files in the `docs/docs/` directory.

## Bump version

The `bump-version` script is provided in order to bump to a particular version.

### Usage:

Specifying an already released version:

```sh

foo@bar:~$: npm run bump-docs 1.2.0

```

Specifying a version and a branch:

```sh

foo@bar:~$: npm run bump-docs 1.2.0 a_remote_branch

```

## Maintainers

* [@jcarpanelli](https://github.com/jcarpanelli/)
* [@ajsantander](https://github.com/ajsantander/)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the ZeppelinOS developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.zeppelin.solutions/) and
[Twitter account](https://twitter.com/zeppelinorg).

## License

[MIT](LICENSE.md) © Zeppelin
