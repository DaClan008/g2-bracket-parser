/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
'use strict';
require("jasmine");
var bracket = require("../../");

describe("Testing Brackets Constructor options: ", function(){
    describe("Testing argument types", function() {
        it("should throw an error if no string value is supplied", function() {
            expect(function(){bracket()}).toThrowError(TypeError, "Expected source code to be a string but got \"undefined\"");
        });
        it("should throw an error if options supplied is an array", function(){
            expect(function(){bracket("",[])}).toThrowError(TypeError,'Expected "options" to be an object but got "array"');
        });
        it("should throw an error if options supplied is a boolean", function(){
            expect(function(){bracket("",true)}).toThrowError(TypeError,'Expected "options" to be an object but got "boolean"');
        });
        it("should throw an error if options supplied is a number", function(){
            expect(function(){bracket("",5)}).toThrowError(TypeError,'Expected "options" to be an object but got "number"');
        });
        it("should throw an error if options supplied is a string", function(){
            expect(function(){bracket("","a")}).toThrowError(TypeError,'Expected "options" to be an object but got "string"');
        });
    });
    describe("Simple options: ", function(){
        it("end value should be 4 ", function(){
            var result = new bracket.Parser("abcde");
            expect(result.end).toEqual(4);
        });
        it("should deal correclty with supplied end value", function(){
            var result = new bracket.Parser("abcde", {end:2});
            expect(result.input).toBe("abc");
            expect(result.end).toEqual(2);
        });
        it("should deal correclty with supplied end value that is lower than 0", function(){
            var result = new bracket.Parser("abcde", { end:-2 });
            expect(result.input).toBe("");
            expect(result.end).toEqual(-1);
            expect(result.length).toEqual(0);
        });
        it("should deal correclty with supplied start value that is lower than 0", function(){
            var result = new bracket.Parser("abcde", { start:-2 });
            expect(result.input).toBe("abcde");
            expect(result.end).toEqual(4);
            expect(result.length).toEqual(5);
        });
        it("should correclty calculate and deal with length option", function(){
            var result = new bracket.Parser("abcde", { length:2 });
            expect(result.input).toBe("ab");
            expect(result.end).toEqual(1);
        });
        it("should correclty calculate and deal with length option greater than supplied length", function(){
            var result = new bracket.Parser("abcde", { length:6 });
            expect(result.input).toBe("abcde");
            expect(result.end).toEqual(4);
        });

    });
    describe("Bracket options: ", function() {
        it("should handle no option being supplied for brackets", function(){
            var result = new bracket.Parser("a");
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["("].start).toBe("(");
            expect(result.brackets["{"].start).toBe("{");
            expect(result.brackets["\""].start).toBe("\"");
            expect(result.brackets["'"].start).toBe("'");
            expect(result.brackets["<"].start).toBe("<");
        })
        it("should handle a string input for bracket options", function(){
            var result = new bracket.Parser("a", {brackets: "["});
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["("]).toBeUndefined();
        });
        it("should handle a string array for bracket options", function(){
            var result = new bracket.Parser("a", {brackets: ["[", "("]});
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["("].start).toBe("(");
            expect(result.brackets["{"]).toBeUndefined();
        });
        it("should not be able to add a string bracket if string does not exist in defaults", function(){
            var result = new bracket.Parser("a", {brackets: "abc" });
            expect(result.brackets["abc"]).toBeUndefined();    
        });
        it("should handle a objects for bracket options", function(){
            var result = new bracket.Parser("a", {brackets:  {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}}
            });
            expect(result.brackets["bcd"].start).toBe("bcd");
            expect(result.brackets["<ab"].start).toBe("<ab");
            expect(result.brackets["{"]).toBeUndefined();
        });
        it("should handle an array of strings and objects for bracket options", function(){
            var result = new bracket.Parser("a", {brackets: ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1}}]});
            expect(result.brackets["["].start).toBe("[");
            expect(result.brackets["<ab"].start).toBe("<ab");
            expect(result.brackets["{"]).toBeUndefined();
        });
        it("should handle an array of objects for bracket options", function(){
            var result = new bracket.Parser("a", {brackets: ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}}]
            });
            expect(result.brackets["bcd"].start).toBe("bcd");
            expect(result.brackets["<ab"].start).toBe("<ab");
            expect(result.brackets["{"]).toBeUndefined();
        });
    });
    describe("Ignores: ", function(){
        it("should handle no ignore options", function(){
            var result = new bracket.Parser("a", {});
            expect(result.brackets["["].isIgnore).toBeUndefined();
            expect(result.brackets["{"].isIgnore).toBeUndefined();
            expect(result.brackets["("].isIgnore).toBeUndefined();
            expect(result.brackets["'"].isIgnore).toBe(true);
            expect(result.brackets['"'].isIgnore).toBe(true);
        });
        it("should handle a string input for ignore options", function(){
            var result = new bracket.Parser("a", { ignoreInside: "["});
            expect(result.brackets["["].isIgnore).toBe(true);
            expect(result.brackets["("].isIgnore).toBeUndefined();
        });
        it("should an array of string for ignore options", function(){
            var result = new bracket.Parser("a", { ignoreInside: ["[", "("]});
            expect(result.brackets["["].isIgnore).toBe(true);
            expect(result.brackets["("].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
        it("should be able to add a string that does not exist in defaults", function(){
            var result = new bracket.Parser("a", {ignoreInside: "abc" });
            expect(result.brackets["abc"].isIgnore).toBe(true);
            expect(result.brackets["abc"].end).toBe("abc");
            expect(result.brackets["abc"].start).toBe("abc");
            expect(result.brackets["abc"].length).toBe(3);
        });
        it("should handle objects for ignore options", function(){
            var result = new bracket.Parser("a", {ignoreInside:  {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}}
            });
            expect(result.brackets["bcd"].isIgnore).toBe(true);
            expect(result.brackets["<ab"].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
        it("should handle an array of strings and objects for ignore options", function(){
            var result = new bracket.Parser("a", {ignoreInside: ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1}}]});
            expect(result.brackets["["].isIgnore).toBe(true);
            expect(result.brackets["<ab"].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
        it("should handle an array of objects for ignore options", function(){
            var result = new bracket.Parser("a", {ignoreInside: ["[", {
                "<ab": {  "start": "<ab", "end": ">", "length": 1},
                "bcd": { "start": "bcd", "end": "efg", "length": 3}}]
            });
            expect(result.brackets["bcd"].isIgnore).toBe(true);
            expect(result.brackets["<ab"].isIgnore).toBe(true);
            expect(result.brackets["{"].isIgnore).toBeUndefined();
        });
    });
    describe("Prefix: ", function(){
        it("should be able to handle no prefix options", function(){
            var result = new bracket.Parser("a",{});
            expect(result.brackets["["].prefix).toBeUndefined();
            expect(result.bracketPrefix).toBe("");
            expect(result.prefixOption).toBe("normal");
        })
        it("should be able to add prefix options", function(){
            var result = new bracket.Parser("a",{prefix:"test"});
            expect(result.brackets["test["].prefix).toBe("test");
            expect(result.bracketsChild["test["]).toBeUndefined();
            expect(result.bracketPrefix).toBe("test");
            expect(result.prefixOption).toBe("normal");
        })
        it("should be able to hande prefixOption of none", function(){
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"none"});
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
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"strict"});
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
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"StRiCt"});
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
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"parentStrict"});
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
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"childStrict"});
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
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"normal"});
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
            var result = new bracket.Parser("a",{prefix:"test", prefixOption:"abnormal"});
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