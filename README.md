# ZeppelinOS _(zos)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.org/zeppelinos/zos.svg?branch=master)](https://travis-ci.org/zeppelinos/zos)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

> ZeppelinOS smart contract platform.

ZeppelinOS is a platform to develop, deploy and operate smart contract
projects on Ethereum and every other EVM and eWASM-powered blockchain.

This repository includes the ZeppelinOS
[Command-Line Interface](https://github.com/zeppelinos/zos/tree/master/packages/cli#readme),
[JavaScript Library](https://github.com/zeppelinos/zos/tree/master/packages/lib#readme),
[Vouching Smart Contracts](https://github.com/zeppelinos/zos/tree/master/packages/vouching#readme),
and [the sources for the Documentation Website](https://github.com/zeppelinos/zos/tree/master/packages/docs#readme).

## Install

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/).
Then, install ZeppelinOS running:

```sh
npm install --global zos
```

## Usage

We recommend to use ZeppelinOS through the `zos` command-line interface.

To start, create a directory for the project and access it:

```sh
mkdir my-project
cd my-project
```

Use `npm` to create a `package.json` file:

```sh
npm init
```

And initialize the ZeppelinOS project:

```sh
zos init my-project
```

Now it is possible to add contracts to the project with the `zos add` command,
push these contracts to a blockchain network with `zos push`, use
`zos create` to create instances for these contracts that later can be
upgraded, and many more things.

Run `zos --help` for more details about thes and all the other functions of
ZeppelinOS.

The
[ZeppelinOS documentation](https://docs.zeppelinos.org/)
explains how to build a project using our platform, how to upgrade contracts,
how to share packages for other projects to reuse, how to vouch for the quality
of a package, how to use the JavaScript libraries to operate the project, and
it explains details of the platform and some advanced topics.

## Security

If you find a security issue, please contact us at security@zeppelinos.org. We
give rewards for reported issues, according to impact and severity.

## Maintainers

* [@facuspagnuolo](https://github.com/facuspagnuolo/)
* [@spalladino](https://github.com/spalladino)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the ZeppelinOS developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.zeppelin.solutions/) and
[Twitter account](https://twitter.com/zeppelinorg).

## License

[MIT](LICENSE) © Zeppelin
