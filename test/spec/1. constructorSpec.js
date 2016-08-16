/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
'use strict';
require("jasmine");

describe("Testing Brackets Constructor options: ", function(){
    
    var constructor = {};
    describe("Testing argument types", function() {
        beforeEach(function(){
            constructor.args = require("../../");
        });
        afterEach(function(){
            constructor.args = undefined;
        });
        it("should throw an error if no string value is supplied", function() {
            expect(function(){constructor.args()}).toThrowError(TypeError, "Expected source code to be a string but got \"undefined\"");
        });
        it("testing error code", function(){
            try {
                var result = new constructor.args("a{b{c")
            } catch (error) {
                expect(error.code).toBe("UNMATCHED_CLOSING_BRACKETS");
                expect(error.hint).toBe("The next critical missing closing bracket required is } and is at depth 2.");
                expect(error.msg).toBe("There are 2 missing closing brackets.  The last closing bracket is }.");
                expect(error.lastBracket).toBe("}");
                expect(error.lastCriticalBracket).toBe("}");
                expect(error.depth).toEqual(2);
                expect(error.lastCriticalDepth).toEqual(2);
                expect(error.toJSON()).toEqual({
                    code: "UNMATCHED_CLOSING_BRACKETS",
                    msg: "There are 2 missing closing brackets.  The last closing bracket is }.",
                    hint: "The next critical missing closing bracket required is } and is at depth 2.",
                    lastBracket: "}",
                    lastCriticalBracket: "}",
                    depth: 2,
                    lastCriticalDepth: 2
                });
            }
        })
        it("should throw an error if options supplied is an array", function(){
            expect(function(){constructor.args("",[])}).toThrowError(TypeError,'Expected "options" to be an object but got "array"');
        });
        it("should throw an error if options supplied is a boolean", function(){
            expect(function(){constructor.args("",true)}).toThrowError(TypeError,'Expected "options" to be an object but got "boolean"');
        });
        it("should throw an error if options supplied is a number", function(){
            expect(function(){constructor.args("",5)}).toThrowError(TypeError,'Expected "options" to be an object but got "number"');
        });
        it("should throw an error if options supplied is a string", function(){
            expect(function(){constructor.args("","a")}).toThrowError(TypeError,'Expected "options" to be an object but got "string"');
        });
    });
    describe("Simple options: ", function(){
        beforeEach(function(){
            constructor.simple = require("../../");
            constructor.options = {};
        });
        afterEach(function(){
            constructor.simple = undefined;
        });
        it("end value should be 4 ", function(){
            var result = new constructor.simple.Parser("abcde");
            expect(result.end).toEqual(4);
        });
        it("should deal correclty with supplied end value", function(){
            constructor.options.end = 2;
            var result = new constructor.simple.Parser("abcde", constructor.options);
            expect(result.input).toBe("abc");
            expect(result.end).toEqual(2);
        });
        it("should deal correclty with supplied end value that is lower than 0", function(){
            constructor.options.end = -2;
            var result = new constructor.simple.Parser("abcde", constructor.options);
            expect(result.input).toBe("");
            expect(result.end).toEqual(-1);
            expect(result.length).toEqual(0);
        });
        it("should deal correclty with supplied start value that is lower than 0", function(){
            constructor.options.start = -2;
            var result = new constructor.simple.Parser("abcde", constructor.options);
            expect(result.input).toBe("abcde");
            expect(result.end).toEqual(4);
            expect(result.length).toEqual(5);
        });
        it("should correclty calculate and deal with length option", function(){
            constructor.options.length = 2;
            var result = new constructor.simple.Parser("abcde", constructor.options);
            expect(result.input).toBe("ab");
            expect(result.end).toEqual(1);
        });
        it("should correclty calculate and deal with length option greater than supplied length", function(){
            constructor.options.length = 6;
            var result = new constructor.simple.Parser("abcde", constructor.options);
            expect(result.input).toBe("abcde");
            expect(result.end).toEqual(4);
        });

    });
    describe("Bracket options: ", function() {
        beforeEach(function(){
            constructor.bracket = require("../../");
            constructor.options = {};
        });
        afterEach(function(){
            constructor.bracket = undefined;
        });
        it("should handle no option being supplied for brackets", function(){
            var result = new constructor.bracket.Parser("a");
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["("].start).toBe("(");
            expect(result.brackets["{"].start).toBe("{");
            expect(result.brackets["\""].start).toBe("\"");
            expect(result.brackets["'"].start).toBe("'");
            expect(result.brackets["<"].start).toBe("<");
        })
        it("should handle a string input for bracket options", function(){
            constructor.options.brackets = "[";
            var result = new constructor.bracket.Parser("a", constructor.options);
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["("]).toBeUndefined();
        });
        it("should handle a string array for bracket options", function(){
            constructor.options.brackets = ["[", "("];
            var result = new constructor.bracket.Parser("a", constructor.options);
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["("].start).toBe("(");
            expect(result.brackets["{"]).toBeUndefined();
        });
        it("should be able to add a string bracket if string does not exist in defaults", function(){
            constructor.options.brackets = "abc";
            var result = new constructor.bracket.Parser("a", constructor.options);
            expect(result.brackets["abc"]).not.toBeUndefined();
            expect(result.brackets["abc"].end).toBe("abc");
            expect(result.brackets["abc"].length).toEqual(3);
        });
        it("should handle a objects for bracket options", function(){
            constructor.options.brackets=  {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}};
            var result = new constructor.bracket.Parser("a", constructor.options);
            expect(result.brackets["bcd"].start).toBe("bcd");
            expect(result.brackets["<ab"].start).toBe("<ab");
            expect(result.brackets["{"]).toBeUndefined();
        });
        it("should handle an array of strings and objects for bracket options", function(){
            constructor.options.brackets = ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1}}];
            var result = new constructor.bracket.Parser("a", constructor.options);
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["<ab"].start).toBe("<ab");
            expect(result.brackets["{"]).toBeUndefined();
        });
        it("should handle an array of objects for bracket options", function(){
            constructor.options.brackets = ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}}];
            var result = new constructor.bracket.Parser("a", constructor.options);
            expect(result.brackets["bcd"].start).toBe("bcd");
            expect(result.brackets["<ab"].start).toBe("<ab");
            expect(result.brackets["{"]).toBeUndefined();
        });
    });
    describe("Ignores: ", function(){
        beforeEach(function(){
            constructor.ignore = require("../../");
            constructor.options = {};
        });
        afterEach(function(){
            constructor.ignore = undefined;
        });
        it("should handle no ignore options", function(){
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["["].isIgnore).toBeUndefined();
            expect(result.brackets["{"].isIgnore).toBeUndefined();
            expect(result.brackets["("].isIgnore).toBeUndefined();
            expect(result.brackets["'"].isIgnore).toBe(true);
            expect(result.brackets['"'].isIgnore).toBe(true);
        });
        it("should handle a string input for ignore options", function(){
            constructor.options.ignoreInside = "[";
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["["].isIgnore).toBe(true);
            expect(result.brackets["("].isIgnore).toBeUndefined();
        });
        it("should an array of string for ignore options", function(){
            constructor.options.ignoreInside = ["[", "("];
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["["].isIgnore).toBe(true);
            expect(result.brackets["("].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
        it("should handle ignores with custom bracket", function(){
            constructor.options.ignoreInside = "-";
            constructor.options.brackets = {"-":{start:"-", end: "-", length:1 }};
            var result = new constructor.ignore.Parser("a", constructor.options)
            expect(result.brackets["-"].isIgnore).toBe(true);
        });
        it("should be able to add a string that does not exist in defaults", function(){
            constructor.options.ignoreInside = "abc";
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["abc"].isIgnore).toBe(true);
            expect(result.brackets["abc"].end).toBe("abc");
            expect(result.brackets["abc"].start).toBe("abc");
            expect(result.brackets["abc"].length).toBe(3);
        });
        it("should handle objects for ignore options", function(){
            constructor.options.ignoreInside = {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}};
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["bcd"].isIgnore).toBe(true);
            expect(result.brackets["<ab"].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
        it("should handle an array of strings and objects for ignore options", function(){
            constructor.options.ignoreInside = ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1}}];
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["["].isIgnore).toBe(true);
            expect(result.brackets["<ab"].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
        it("should handle an array of objects for ignore options", function(){
            constructor.options.ignoreInside = ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}}];
            var result = new constructor.ignore.Parser("a", constructor.options);
            expect(result.brackets["bcd"].isIgnore).toBe(true);
            expect(result.brackets["<ab"].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
    });
    describe("Prefix: ", function(){
        beforeEach(function(){
            constructor.prefix = require("../../");
            constructor.options = {};
            constructor.options.prefix = "test";
        });
        afterEach(function(){
            constructor.prefix = undefined;
        });
        it("should be able to handle no prefix options", function(){
            constructor.options.prefix = undefined;
            var result = new constructor.prefix.Parser("a",constructor.options);
            expect(result.brackets["["].prefix).toBeUndefined();
            expect(result.bracketPrefix).toBe("");
            expect(result.prefixOption).toBe("normal");
        })
        it("should be able to add prefix options", function(){
            var result = new constructor.prefix.Parser("a",constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["]).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("normal");
        })
        it("should be able to handle prefixOption of none", function(){
            constructor.options.prefixOption = "none";
            var result = new constructor.prefix.Parser("a",constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["].prefix).toBe("test");
            expect(result.brackets["test<"].prefix).toBe("test");
            expect(result.bracketsChild["test<"].prefix).toBe("test");
            expect(result.brackets["["].prefix).toBeUndefined();
            expect(result.bracketsChild["["].prefix).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("none");
        })
        it("should be able to hande prefixOption of strict", function(){
            constructor.options.prefixOption = "strict";
            var result = new constructor.prefix.Parser("a",constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["].prefix).toBe("test");
            expect(result.brackets["test<"].prefix).toBe("test");
            expect(result.bracketsChild["test<"].prefix).toBe("test");
            expect(result.brackets["["]).toBeUndefined();
            expect(result.bracketsChild["["]).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("strict");
        })
         it("should be hande prefixOption in case insensitive manner", function(){
            constructor.options.prefixOption = "StRiCt";
            var result = new constructor.prefix.Parser("a", constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["].prefix).toBe("test");
            expect(result.brackets["test<"].prefix).toBe("test");
            expect(result.bracketsChild["test<"].prefix).toBe("test");
            expect(result.brackets["["]).toBeUndefined();
            expect(result.bracketsChild["["]).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("StRiCt");
        })
        it("should be able to hande prefixOption of parentStrict", function(){
            constructor.options.prefixOption = "parentStrict";
            var result = new constructor.prefix.Parser("a", constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["].prefix).toBe("test");
            expect(result.brackets["test<"].prefix).toBe("test");
            expect(result.bracketsChild["test<"].prefix).toBe("test");
            expect(result.brackets["["]).toBeUndefined();
            expect(result.bracketsChild["["].start).toBe("[");
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("parentStrict");
        })
        it("should be able to hande prefixOption of childStrict", function(){
            constructor.options.prefixOption = "childStrict";
            var result = new constructor.prefix.Parser("a", constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["].prefix).toBe("test");
            expect(result.brackets["test<"].prefix).toBe("test");
            expect(result.bracketsChild["test<"].prefix).toBe("test");
            expect(result.brackets["["].start).toBe("[");
            expect(result.bracketsChild["["]).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("childStrict");
        })
        it("should be able to hande prefixOption of normal", function(){
            constructor.options.prefixOption = "normal";
            var result = new constructor.prefix.Parser("a", constructor.options);
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["]).toBeUndefined();
            expect(result.brackets["test<"].prefix).toBe("test");
            expect(result.bracketsChild["test<"]).toBeUndefined();
            expect(result.brackets["["]).toBeUndefined();
            expect(result.bracketsChild["["].start).toBe("[");
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("normal");
        })
        it("should be able to hande prefixOption of abnormal", function(){
            constructor.options.prefixOption = "abnormal";
            var result = new constructor.prefix.Parser("a", constructor.options);
            expect(result.brackets["test["]).toBeUndefined();
            expect(result.bracketsChild["test["].prefix).toBe("test");
            expect(result.brackets["test<"]).toBeUndefined();
            expect(result.bracketsChild["test<"].prefix).toBe("test");
            expect(result.brackets["["].start).toBe("[");
            expect(result.bracketsChild["["]).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("abnormal");
        })
    })
});