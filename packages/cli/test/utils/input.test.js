'use strict';
require('../setup');

const expect = require('chai').expect;

import { parseArgs, parseMethodParams, parseArray, parseArg, getSampleInput } from '../../src/utils/input';

describe('input', function() {
  describe('parseArgs', function() {
    const testFn = (input, ...expected) => () => parseArgs(input).should.deep.eq(expected);

    it('should parse a false boolean', testFn('false', false));
    it('should parse a true boolean', testFn('true', true));
    it('should parse a FALSE boolean', testFn('FALSE', false));
    it('should parse a TRUE boolean', testFn('TRUE', true));
    it('should parse a number', testFn('42', '42'));
    it('should parse a positive scientific notation number', testFn('1e2', '100'));
    it('should parse a negative scientific notation number', testFn('-1e2', '-100'));
    it('should parse a consecutive scientific notation numbers', testFn('1e2,2e2', '100', '200'));
    it(
      'should not parse a scientific notation number followed by non numeric chars as a number',
      testFn('1e2lala', '1e2lala'),
    );
    it('should parse another scientific notation number', testFn('1.5e20', '150000000000000000000'));
    it('should parse a string', testFn('foo', 'foo'));
    it('should parse a number+string', testFn('42pepe', '42pepe'));
    it('should parse a quoted string', testFn('"foo"', 'foo'));
    it('should parse a quoted multiword string', testFn('"foo bar baz"', 'foo bar baz'));
    it('should parse multiple quoted words', testFn('"foo","bar","baz"', 'foo', 'bar', 'baz'));
    it('should parse a quoted number+string', testFn('"42foo"', '42foo'));
    it('should parse an array', testFn('[1, 2, 3]', ['1', '2', '3']));
    it('should parse nested arrays', testFn('[1,[2,3],4]', ['1', ['2', '3'], '4']));
    it('should parse a hex string', testFn('0x1234', '0x1234'));
    it(
      'should parse an address',
      testFn('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e'),
    );
    it(
      'should not parse something that looks like an address but is followed by non hex chars as an address',
      testFn('0x39af68cF04Abb0eF8f9d8191E1blalala', '0x39af68cF04Abb0eF8f9d8191E1blalala'),
    );
    it(
      'should parse a quoted address',
      testFn('"0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e"', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e'),
    );
    it(
      'should parse multiple addresses',
      testFn(
        '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e,0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
        '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
        '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
      ),
    );
    it(
      'should parse an array of non quoted addresses',
      testFn('[0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e,0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e]', [
        '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
        '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
      ]),
    );
    it(
      'should parse multiple arguments',
      testFn(
        '1e2,42,0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e,43,1.5e20,"foo",[1e2,1,2,"bar",1e3]',
        '100',
        '42',
        '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
        '43',
        '150000000000000000000',
        'foo',
        ['100', '1', '2', 'bar', '1000'],
      ),
    );
  });

  describe('parseArg', function() {
    const itParses = (input, type, expected) => {
      return it(`parses ${input} as ${type}`, () => {
        parseArg(input, { type }).should.deep.eq(expected, `Parsing: '${input}'`);
      });
    };

    const itParsesTuple = (input, components, expected) => {
      return it(`parses ${input} as ${components.join(',')}`, () => {
        parseArg(input, { type: 'tuple', components: components.map(c => ({ type: c })) }).should.deep.eq(
          expected,
          `Parsing: '${input}'`,
        );
      });
    };

    const itFailsToParse = (input, type, failure) => {
      return it(`parsing ${input} as ${type} fails`, () => {
        expect(() => parseArg(input, { type })).to.throw(failure);
      });
    };

    itParses('42', 'uint256', '42');
    itParses('42000000000000000000', 'uint256', '42000000000000000000');
    itParses('42', 'uint8', '42');
    itParses('2.4e18', 'uint256', '2400000000000000000');
    itParses('-42', 'int8', '-42');

    itFailsToParse('foo', 'uint256', /could not parse/i);

    itParses('true', 'bool', true);
    itParses('TRUE', 'bool', true);
    itParses('t', 'bool', true);
    itParses('y', 'bool', true);
    itParses('yes', 'bool', true);
    itParses('1', 'bool', true);

    itParses('false', 'bool', false);
    itParses('FALSE', 'bool', false);
    itParses('f', 'bool', false);
    itParses('n', 'bool', false);
    itParses('no', 'bool', false);
    itParses('0', 'bool', false);

    itFailsToParse('2', 'bool', /could not parse/i);
    itFailsToParse('foo', 'bool', /could not parse/i);

    itParses('0x123456', 'bytes', '0x123456');
    itParses('0x12345678', 'bytes4', '0x12345678');
    itParses('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', 'address', '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e');
    itParses('foobar', 'string', 'foobar');
    itParses('1e18', 'string', '1e18');
    itParses('true', 'string', 'true');
    itParses('f', 'string', 'f');

    itParses('1,2,3', 'uint256[]', ['1', '2', '3']);
    itParses('1,-2,3e6', 'int256[]', ['1', '-2', '3000000']);
    itParses('[1,2,3]', 'uint256[]', ['1', '2', '3']);
    itParses('[[1,2,3]]', 'uint256[][]', [['1', '2', '3']]);
    itParses('[[1,2],[3,4]]', 'uint256[][]', [
      ['1', '2'],
      ['3', '4'],
    ]);
    itParses('foo,bar,baz', 'string[]', ['foo', 'bar', 'baz']);
    itParses('["foo","bar","baz"]', 'string[]', ['foo', 'bar', 'baz']);
    itParses("['foo','bar','baz']", 'string[]', ['foo', 'bar', 'baz']);
    itParses('t,t,f', 'bool[]', [true, true, false]);
    itParses('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', 'address[]', ['0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e']);
    itParses('0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e, 0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e', 'address[]', [
      '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
      '0x39af68cF04Abb0eF8f9d8191E1bD9c041E80e18e',
    ]);

    itParses('foo', 'unknown', 'foo');

    itParsesTuple('42, foo', ['uint256', 'string'], ['42', 'foo']);
    itParsesTuple('(42, foo)', ['uint256', 'string'], ['42', 'foo']);
    itParsesTuple('(-1e3, foo)', ['uint256', 'string'], ['-1000', 'foo']);
    itParsesTuple('(42, "foo, bar")', ['uint256', 'string'], ['42', 'foo, bar']);
    itParsesTuple('42', ['uint256'], ['42']);
    itParsesTuple('foo', ['string'], ['foo']);

    context.skip('pending', function() {
      itParses('[1,2,3]', 'uint256[][]', [['1', '2', '3']]);
      itParses('[1,2],[3,4]', 'uint256[][]', [
        ['1', '2'],
        ['3', '4'],
      ]);
    });
  });

  describe('parseArray', function() {
    const itParses = (description, input, ...expected) => {
      return it(description, () => {
        parseArray(input).should.deep.eq(expected, `Parsing: '${input}'`);
      });
    };

    const itFailsToParse = (description, input, failure) => {
      return it(description, () => {
        expect(() => parseArray(input)).to.throw(failure);
      });
    };

    itParses('a string', 'foo', 'foo');
    itParses('a number', '20', '20');
    itParses('many strings', 'foo,bar,baz', 'foo', 'bar', 'baz');
    itParses('many strings with spaces', 'foo bar,baz baq', 'foo bar', 'baz baq');
    itParses('many strings trimming spaces', ' foo bar , baz baq ', 'foo bar', 'baz baq');
    itParses('a quoted string', '"foo"', 'foo');
    itParses('many quoted strings', '"foo","bar"', 'foo', 'bar');
    itParses('many quoted strings with commas', '"foo,bar", "baz,baq"', 'foo,bar', 'baz,baq');
    itParses('a double quoted string with simple quotes', '"foo: \'bar\'"', "foo: 'bar'");
    itParses('a simple quoted string', "'foo'", 'foo');
    itParses('many simple quoted strings with commas', "'foo,bar','baz,baq'", 'foo,bar', 'baz,baq');
    itParses('an array', '[foo,bar]', ['foo', 'bar']);
    itParses('many arrays', '[foo,bar],["baz","baq"]', ['foo', 'bar'], ['baz', 'baq']);
    itParses('nested arrays', '[foo,[bar,baz],baq]', ['foo', ['bar', 'baz'], 'baq']);

    itParses('mixed stuff 1', '1 2,[foo,["bar,baz"],baq],3', '1 2', ['foo', ['bar,baz'], 'baq'], '3');
    itParses('mixed stuff 2', '"0x20","0x30","foo,bar"', '0x20', '0x30', 'foo,bar');
    itParses('mixed stuff 3', '[foo, [bar]]', ['foo', ['bar']]);
    itParses('mixed stuff 4', 'foo, bar, [foo, "[bar]"]', 'foo', 'bar', ['foo', '[bar]']);

    itFailsToParse('unterminated quoted string', '"foo', /unterminated/i);
    itFailsToParse('unexpected quote', 'foo "bar"', /unexpected/i);
    itFailsToParse('unclosed array', 'foo,[bar', /unclosed/i);
    itFailsToParse('missing comma after quote', '"foo" "bar"', /expected a comma/i);
    itFailsToParse('missing comma after array', '[foo] "bar"', /expected a comma/i);
    itFailsToParse('missing comma before array', '[foo [bar]]', /unexpected/i);
  });

  describe('parseMethodParams', function() {
    const defaulMethodName = 'INITIALIZE';
    const testFn = (options, expectedMethodName, expectedArgs) => () =>
      parseMethodParams(options, defaulMethodName).should.deep.eq({
        methodName: expectedMethodName,
        methodArgs: expectedArgs,
      });

    it('should not init', testFn({}, undefined, []));
    it('should init with default when init is set', testFn({ init: true }, defaulMethodName, []));
    it('should init when args is set', testFn({ args: '20' }, defaulMethodName, ['20']));
    it('should init with specific function', testFn({ init: 'foo' }, 'foo', []));
    it('should init with specific function and args', testFn({ init: 'foo', args: '20' }, 'foo', ['20']));
  });

  describe('getSampleInput', function() {
    const testType = (type, expected) => () => getSampleInput({ type }).should.eq(expected);
    const testTuple = (components, expected) => () =>
      getSampleInput({ type: 'tuple', components: components.map(c => ({ type: c })) }).should.eq(expected);

    it('handles dynamic arrays', testType('uint256[]', '[42, 42]'));
    it('handles static arrays', testType('uint256[3]', '[42, 42]'));
    it('handles dynamic string arrays', testType('string[]', '[Hello world, Hello world]'));
    it('handles tuples of primitive types', testTuple(['uint256', 'string'], '(42, Hello world)'));
    it('handles tuples of unknown components', testType('tuple', '(Hello world, 42)'));
  });
});
