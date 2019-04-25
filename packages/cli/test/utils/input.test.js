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
    it('should parse a FALSE boolean', testFn("FALSE", false));
    it('should parse a TRUE boolean', testFn("TRUE", true));
    it('should parse a number', testFn("42", "42"));
    it('should parse a positive scientific notation number', testFn("1e2", "100"));
    it('should parse a negative scientific notation number', testFn("-1e2", "-100"));
    it('should parse a consecutive scientific notation numbers', testFn("1e2,2e2", "100", "200"));
    it('should not parse a scientific notation number followed by non numeric chars as a number', testFn("1e2lala", "1e2lala"));
    it('should parse another scientific notation number', testFn("1.5e20", "150000000000000000000"));
    it('should parse a string', testFn("foo", 'foo'));
    it('should parse a number+string', testFn("42pepe", "42pepe"));
    it('should parse a quoted string', testFn('"foo"', 'foo'));
    it('should parse a quoted multiword string', testFn('"foo bar baz"', 'foo bar baz'));
    it('should parse multiple quoted words', testFn('"foo","bar","baz"', 'foo', 'bar', 'baz'));
    it('should parse a quoted number+string', testFn('"42foo"', '42foo'));
    it('should parse an array', testFn('[1, 2, 3]', ["1", "2", "3"]));
    it('should parse nested arrays', testFn("[1,[2,3],4]", ["1",["2","3"],"4"]));
    it('should parse a hex string', testFn("0x1234", "0x1234"));
    it('should parse an address', testFn("0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e", "0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e"));
    it('should not parse something that looks like an address but is followed by non hex chars as an address', testFn("0x39af68cF04Abb0eF8f9d8191E1blalala", "0x39af68cF04Abb0eF8f9d8191E1blalala"));
    it('should parse a quoted address', testFn('"0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e"', "0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e"));
    it('should parse multiple addresses', testFn('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e,0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', "0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e", "0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e"));
    it('should parse an array of non quoted addresses', testFn('[0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e,0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e]', ["0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e", "0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e"]));
    it('should parse multiple arguments', testFn('1e2,42,0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e,43,1.5e20,"foo",[1e2,1,2,"bar",1e3]', '100', '42', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', '43', '150000000000000000000', 'foo', ['100', '1', '2', 'bar', '1000']));
  });

  describe('parseInit', function () {
    const defaultInit = 'INITIALIZE';
    const testFn = (options, expectedInit, expectedArgs) => (
      () => parseInit(options, defaultInit).should.deep.eq({ initMethod: expectedInit, initArgs: expectedArgs })
    );

    it('should not init', testFn({}, undefined, []));
    it('should init with default when init is set', testFn({ init: true }, defaultInit, []));
    it('should init when args is set', testFn({ args: '20' }, defaultInit, ["20"]));
    it('should init with specific function', testFn({ init: 'foo' }, 'foo', []));
    it('should init with specific function and args', testFn({ init: 'foo', args: '20' }, 'foo', ['20']));
  });
});
