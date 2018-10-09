import deploy from '../../src/scripts/deploy';
import create from '../../src/scripts/create';
import configure from '../../src/scripts/configure';
import validate from '../../src/scripts/validate';

contract.only('deploy', function([_, owner]) {

  const options = {
    network: 'test',
    txParams: {
      from: owner
    }
  }

  it('runs the deploy script correctly', async function() {
    await deploy(options);
  });

  it('runs the create script correctly', async function() {
    await create(options);
  });

  it('runs the configure script correctly', async function() {
    await configure(options);
  });

  it('runs the validate script correctly', async function() {
    await validate(options);
  });
});
