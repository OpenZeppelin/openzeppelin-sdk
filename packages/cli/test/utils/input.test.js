'use strict'
require('../setup');

import { parseArgs, parseInit } from '../../src/utils/input';

describe('input', function () {
  describe('parseArgs', function () {
    const testFn = (input, ... expected) => (
      () => parseArgs(input).should.deep.eq(expected)
    );

    it('should parse a false boolean', testFn("false", false));
    it('should parse a true boolean', testFn("true", true));
    it('should parse a number', testFn("42", "42"));
    it('should parse a string', testFn("foo", 'foo'));
    it('should parse a number+string', testFn("42pepe", "42pepe"));
    it('should parse a quoted string', testFn('"foo"', 'foo'));
    it('should parse a quoted multiword string', testFn('"foo bar baz"', 'foo bar baz'));
    it('should parse multiple quoted words', testFn('"foo","bar","baz"', 'foo', 'bar', 'baz'));
    it('should parse a quoted number+string', testFn('"42foo"', '42foo'));
    it('should parse an array', testFn('[1, 2, 3]', ["1", "2", "3"]));
    it('should parse nested arrays', testFn("[1,[2,3],4]", ["1",["2","3"],"4"]));
    it('should parse multiple arguments', testFn('42,43,"foo",[1,2,"bar"]', '42', '43', 'foo', ['1', '2', 'bar']));
    it('should parse an address', testFn("0x1234", "0x1234"));
    it('should parse a quoted address', testFn('"0x1234"', "0x1234"));
    it('should parse multiple addresses', testFn('0x1234,0x1235', "0x1234", "0x1235"));
  });

  describe('parseInit', function () {
    const defaultInit = 'INITIALIZE';
    const testFn = (options, expectedInit, expectedArgs) => (
      () => parseInit(options, defaultInit).should.deep.eq({ initMethod: expectedInit, initArgs: expectedArgs })
    );

    it('should not init', testFn({}, undefined, undefined));
    it('should init with default when init is set', testFn({ init: true }, defaultInit, []));
    it('should init when args is set', testFn({ args: '20' }, defaultInit, ["20"]));
    it('should init with specific function', testFn({ init: 'foo' }, 'foo', []));
    it('should init with specific function and args', testFn({ init: 'foo', args: '20' }, 'foo', ['20']));
  });
});
