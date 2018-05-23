# ZeppelinOS documentation site

Centralized documentation site for ZeppelinOS.

To view this website locally, clone the repository with:

`git clone https://github.com/zeppelinos/zos-docs.git`

Install Docusaurus:

`npm install -g docusaurus-init`

Navigate to the `docs/website` directory and run:

`npm install`

And finally run:

`npm run start`

This will deploy the site locally in your computer at `http://localhost:3000/`.


## API Reference generation

At present, we need to generate the API reference for `zos-cli` and `zos-lib` using [`gen-docs`](https://github.com/zeppelinos/zos-cli/blob/master/docs/bin/docs.js) and [`solidity-docgen`](https://github.com/OpenZeppelin/solidity-docgen) respectively, and then merge the outcome manually by substituting the corresponding `.md` files in the `docs/docs/` directory. 