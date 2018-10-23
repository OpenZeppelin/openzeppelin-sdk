---
id: publishing
title: Publishing an EVM package
---

On the previous guides we have explored how to initilize a ZeppelinOS project,
how to add contracts to it, how to upgrade those contracts and how to link to
existing EVM packages. At this point we have a simple project that uses various
ZeppelinOS functionalities. On this guide we will instead add new
functionalities to the platform, nicely wrapped as an EVM package ready for
others to use.

Let's first remember some of the things we've learned so far.

In the directory of our project, we initialize it:

```sh
npm init
zos init <project-name>
cd <project-name>
```

Then, we can add to our project all the contracts that we have in the
`contracts` directory:

```sh
zos add <contract-name-1> <contract-name-2> ... <contract-name-n>
```

Next, we push the project to the network:

```sh
zos push --network <network>
```

Note that for the EVM package to be used by others, you need to use a real
network instead of your local development one. We have a guide about
[Deploying to mainnet](mainnet) which can be useful.

All known commands so far. Here comes what's new. If you want to share your
package in ZeppelinOS, do it running the `publish` command:

```sh
zos publish --network <network>
```

It's that simple! Now you are the developer of an EVM package that lives in
the blockchain ready to help building the next revolution. But this is only
half of the story, because for the package to be discovered and linked by
other projects, you will also need to publish it to
[npm](https://www.npmjs.com).

If you haven't publish a package before, you will need to
[sign up for an npm account](https://www.npmjs.com/signup).

The npm package should include all the source and compiled contracts and the
ZeppelinOS configuration files, so add the following top-level field to the
`package.json` file:

```json
{
  ...,
  "files": [
    "build",
    "contracts",
    "test",
    "zos.json",
    "zos.*.json"
  ]
}
```

Make sure to check that the rest of the fields describe your package
accurately. It could be a good idea to remove the `main` field, if present,
because it doesn't make sense for EVM packages. Also, if you have a
`zos.local.json` file, you can remove it now because it is specific for your
local test environment.

With that, we should be ready. Log in to npm with:

```sh
npm login
```

And finally, publish to npm:

```sh
npm publish
```

Now we are done for real. Other developers will be able to link to your
package by using:

```sh
zos link <your-project-name>
```

Spread the word! Tell others to reuse your work, and to help you improving it
with more crazy ideas of how a decentralized society should be.
