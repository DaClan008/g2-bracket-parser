/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
'use strict';
require("jasmine");
var bracket = require("../../");

describe("A simplistic string tester", function(){
    it("should deal with string with no brackets and return an empty array", function(){
        var result = bracket("this is ordinary string");
        expect(result.length).toEqual(0);
    });
    it("should deal with a string inside brackets", function(){
        var results = bracket("this is {inside brackets}");
        var result = results[0];

        expect(results.length).toEqual(1);
        expect(result.src).toBe("this is {inside brackets}");
        expect(result.content).toBe("{inside brackets}");
        expect(result.start).toEqual(0);
        expect(result.end).toEqual(24);
        expect(result.length).toEqual(25);
        expect(result.lines).toEqual(1);
        expect(result.ignore).toBeUndefined();
        expect(result.prefixedChildren).toBe(false);
        expect(result.match.src).toBe("{inside brackets}");
        expect(result.match.content).toBe("inside brackets");
        expect(result.match.prefixedBracket).toBe("{");
        expect(result.match.start).toEqual(8);
        expect(result.match.bracketStart).toEqual(8);
        expect(result.match.contentStart).toEqual(9);
        expect(result.match.contentEnd).toEqual(23);
        expect(result.match.end).toEqual(24);
        expect(result.match.lines).toEqual(1);
        expect(result.match.length).toEqual(17);
        expect(result.match.count).toEqual(0);
        expect(result.match.isPrefixed).toBe(false);
        expect(result.match.prefixedChildren).toBe(false);
        expect(result.match.children.length).toEqual(result.match.count);
    });
    it("should deal with a string inside brackets inside brackets", function(){
        var results = bracket("this is {inside brackets{inside brackets}}");
        var result = results[0];

        expect(results.length).toEqual(1);
        expect(result.src).toBe("this is {inside brackets{inside brackets}}");
        expect(result.content).toBe("{inside brackets{inside brackets}}");
        expect(result.start).toEqual(0);
        expect(result.end).toEqual(41);
        expect(result.length).toEqual(42);
        expect(result.lines).toEqual(1);
        expect(result.ignore).toBeUndefined();
        expect(result.prefixedChildren).toBe(false);
        expect(result.match.src).toBe("{inside brackets{inside brackets}}");
        expect(result.match.content).toBe("inside brackets{inside brackets}");
        expect(result.match.prefixedBracket).toBe("{");
        expect(result.match.start).toEqual(8);
        expect(result.match.bracketStart).toEqual(8);
        expect(result.match.contentStart).toEqual(9);
        expect(result.match.contentEnd).toEqual(40);
        expect(result.match.end).toEqual(41);
        expect(result.match.lines).toEqual(1);
        expect(result.match.length).toEqual(34);
        expect(result.match.isPrefixed).toBe(false);
        expect(result.match.prefixedChildren).toBe(false);
        expect(result.match.children.length).toEqual(result.match.count);

        var result = result.match.children[0];
        expect(result.src).toBe("{inside brackets}");
        expect(result.content).toBe("inside brackets");
        expect(result.prefixedBracket).toBe("{");
        expect(result.start).toEqual(24);
        expect(result.bracketStart).toEqual(24);
        expect(result.contentStart).toEqual(25);
        expect(result.contentEnd).toEqual(39);
        expect(result.end).toEqual(40);
        expect(result.lines).toEqual(1);
        expect(result.length).toEqual(17);
        expect(result.count).toEqual(0);
        expect(result.isPrefixed).toBe(false);
        expect(result.prefixedChildren).toBe(false);
    });
    it("should deal with a string inside brackets inside brackets inside brackets", function(){
        var results = bracket("a {b {c {d}}}");
        var result = results[0];

        expect(results.length).toEqual(1);
        expect(result.src).toBe("a {b {c {d}}}");
        expect(result.content).toBe("{b {c {d}}}");
        expect(result.start).toEqual(0);
        expect(result.end).toEqual(12);
        expect(result.length).toEqual(13);
        expect(result.lines).toEqual(1);
        expect(result.match.src).toBe("{b {c {d}}}");
        expect(result.match.content).toBe("b {c {d}}");
        expect(result.match.start).toEqual(2);
        expect(result.match.bracketStart).toEqual(2);
        expect(result.match.contentStart).toEqual(3);
        expect(result.match.contentEnd).toEqual(11);
        expect(result.match.end).toEqual(12);
        expect(result.match.length).toEqual(11);

        var result = result.match.children[0];
        expect(result.src).toBe("{c {d}}");
        expect(result.content).toBe("c {d}");
        expect(result.start).toEqual(5);
        expect(result.bracketStart).toEqual(5);
        expect(result.contentStart).toEqual(6);
        expect(result.contentEnd).toEqual(10);
        expect(result.end).toEqual(11);
        expect(result.length).toEqual(7);

        var result = result.children[0];
        expect(result.src).toBe("{d}");
        expect(result.content).toBe("d");
        expect(result.start).toEqual(8);
        expect(result.bracketStart).toEqual(8);
        expect(result.contentStart).toEqual(9);
        expect(result.contentEnd).toEqual(9);
        expect(result.end).toEqual(10);
        expect(result.lines).toEqual(1);
        expect(result.length).toEqual(3);
    });
    it("should deal with a string with 2 main brackets", function(){
        var results = bracket("a {b {c} d} e {f} g");
        var result = results[0];

        expect(results.length).toEqual(2);
        expect(result.src).toBe("a {b {c} d}");
        expect(result.content).toBe("{b {c} d}");
        expect(result.start).toEqual(0);
        expect(result.end).toEqual(10);
        expect(result.length).toEqual(11);

        expect(result.match.src).toBe("{b {c} d}");
        expect(result.match.content).toBe("b {c} d");
        expect(result.match.start).toEqual(2);
        expect(result.match.bracketStart).toEqual(2);
        expect(result.match.contentStart).toEqual(3);
        expect(result.match.contentEnd).toEqual(9);
        expect(result.match.end).toEqual(10);
        expect(result.match.length).toEqual(9);

        var result = result.match.children[0];
        expect(result.src).toBe("{c}");
        expect(result.content).toBe("c");
        expect(result.start).toEqual(5);
        expect(result.bracketStart).toEqual(5);
        expect(result.contentStart).toEqual(6);
        expect(result.contentEnd).toEqual(6);
        expect(result.end).toEqual(7);
        expect(result.length).toEqual(3);

        var result = results[1];
        expect(results.length).toEqual(2);
        expect(result.src).toBe(" e {f}");
        expect(result.content).toBe("{f}");
        expect(result.start).toEqual(11);
        expect(result.end).toEqual(16);
        expect(result.length).toEqual(6);
    });
    it("should deal with a string inside 2 brackets", function(){
        var results = bracket("a {b {c} d {e} f}");
        var result = results[0];

        expect(results.length).toEqual(1);
        expect(result.src).toBe("a {b {c} d {e} f}");
        expect(result.content).toBe("{b {c} d {e} f}");
        expect(result.start).toEqual(0);
        expect(result.end).toEqual(16);
        expect(result.length).toEqual(17);

        expect(result.match.src).toBe("{b {c} d {e} f}");
        expect(result.match.content).toBe("b {c} d {e} f");
        expect(result.match.start).toEqual(2);
        expect(result.match.bracketStart).toEqual(2);
        expect(result.match.contentStart).toEqual(3);
        expect(result.match.contentEnd).toEqual(15);
        expect(result.match.end).toEqual(16);
        expect(result.match.length).toEqual(15);
        expect(result.match.count).toEqual(2);

        var result = result.match.children[0];
        expect(result.src).toBe("{c}");
        expect(result.content).toBe("c");
        expect(result.start).toEqual(5);
        expect(result.bracketStart).toEqual(5);
        expect(result.contentStart).toEqual(6);
        expect(result.contentEnd).toEqual(6);
        expect(result.end).toEqual(7);
        expect(result.length).toEqual(3);

        var result = results[0].match.children[1];
        expect(result.src).toBe("{e}");
        expect(result.content).toBe("e");
        expect(result.start).toEqual(11);
        expect(result.bracketStart).toEqual(11);
        expect(result.contentStart).toEqual(12);
        expect(result.contentEnd).toEqual(12);
        expect(result.end).toEqual(13);
        expect(result.length).toEqual(3);
    });
    it("should throw error in case of bracket missmatch", function(){
        
        var str = "\ncode: UNMATCHED_CLOSING_BRACKETS";
        str += "\nmsg: There is 1 missing closing brackets.";
        str += "\nhint: The next missing closing bracket required is }.";
        str += "\n\n";
        expect(function(){ bracket("a {b"); }).toThrow(new Error(str));
    });
    it("should not throw error in case of a bracket missmatch if ignoreMissMatch is set to true", function(){
        expect(function(){ bracket("a {b", {ignoreMissMatch: true}); }).not.toThrowError();
    });
    it("should ignore by default any brackets inside of single or double quotes", function(){
        var result = bracket("a '{' b");
        expect(function(){ bracket("a '{' c"); }).not.toThrowError();
        expect(result.length).toEqual(0);
        result = bracket("a {b '{' c}");
        expect(function(){bracket("a {b '{' c}")}).not.toThrowError();
        expect(result.length).toEqual(1);
        expect(result[0].match.count).toEqual(0);

        var result = bracket("a \"{\" b");
        expect(function(){ bracket("a \"{\" c"); }).not.toThrowError();
        expect(result.length).toEqual(0);
        result = bracket("a {b \"{\" c}");
        expect(function(){bracket("a {b \"{\" c}")}).not.toThrowError();
        expect(result.length).toEqual(1);
        expect(result[0].match.count).toEqual(0);

    });
});