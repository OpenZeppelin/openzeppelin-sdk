'use strict'
require('../setup');

import { parseArgs } from '../../src/utils/input';

describe('input', function () {
  const testFn = (input, ... expected) => (
    () => parseArgs(input).should.deep.eq(expected)
  );

  it('should parse a number', testFn("42", "42"));
  it('should parse a quoted string', testFn('"foo"', 'foo'));
  it('should parse an array', testFn('[1, 2, 3]', ["1", "2", "3"]));
  it('should parse nested arrays', testFn("[1,[2,3],4]", ["1",["2","3"],"4"]));
  it('should parse multiple arguments', testFn('42,43,"foo",[1,2,"bar"]', '42', '43', 'foo', ['1', '2', 'bar']));
  it('should parse an address', testFn("0x1234", "0x1234"));
  it('should parse a quoted address', testFn('"0x1234"', "0x1234"));
  it('should parse multiple addresses', testFn('0x1234,0x1235', "0x1234", "0x1235"));
});