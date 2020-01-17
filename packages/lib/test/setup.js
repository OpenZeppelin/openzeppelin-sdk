'use strict';
process.env.NODE_ENV = 'test';

import { provider } from '@openzeppelin/test-environment';

import ZWeb3 from '../src/artifacts/ZWeb3';
import Contracts from '../src/artifacts/Contracts';
import { helpers } from '../src/test';
import { Loggy } from '../src/utils/Logger';

import chaiAsPromised from 'chai-as-promised';
import chaiString from 'chai-string';
import sinonChai from 'sinon-chai';

Loggy.silent(false);
Loggy.testing(true);
ZWeb3.initialize(provider);

Contracts.setArtifactsDefaults({ gas: 6721975, gasPrice: 100000000000 });

require('chai')
  .use(chaiAsPromised) // TODO: Remove this dependency
  .use(chaiString)
  .use(helpers.assertions)
  .use(sinonChai)
  .should();
