# ZeppelinOS Command-Line Interface _(zos)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![NPM Package](https://img.shields.io/npm/v/zos.svg?style=flat-square)](https://www.npmjs.org/package/zos)
[![Build Status](https://travis-ci.com/zeppelinos/zos.svg?branch=master)](https://travis-ci.com/zeppelinos/zos)

> Command-line interface for the ZeppelinOS smart contract platform.

ZeppelinOS is a platform to develop, deploy and operate smart contract
projects on Ethereum and every other EVM and eWASM-powered blockchain.

This is the repository for the ZeppelinOS commmand-line interface, the
recommended way to use ZeppelinOS.

## Install

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/).
Then, install ZeppelinOS running:

```sh
npm install --global zos
```

## Usage

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

Run `zos --help` for more details about this and all the other functions of
ZeppelinOS.

The
[ZeppelinOS documentation](https://docs.zeppelinos.org/)
explains how to use the `zos` command-line interface to build a project, to
upgrade contracts and to share packages for other projects to reuse. It also
explains how to operate the project with the ZeppelinOS JavaScript libraries
instead of this `zos` command.

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

[MIT](LICENSE.md) © Zeppelin
