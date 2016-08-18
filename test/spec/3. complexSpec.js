/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
'use strict';
require("jasmine");

var complex = {};
describe("Testing complex string queries", function(){
    describe("- newLines: ", function(){
        beforeEach(function(){
            complex.newLines = require("../../");
            complex.options = {};
        });
        afterEach(function(){
            complex.newLines = undefined;
        })
        it("should be able to calculate new line symbols", function(){
            var result = complex.newLines("ab \n c\n {d}", complex.options)[0];
            expect(result.lines).toEqual(3);
        });
        it("should be able to calculate new line symbols in child elements", function(){
            var result = complex.newLines("{a\nb\nc}", complex.options)[0];
            expect(result.match.lines).toEqual(3);
            expect(result.lines).toEqual(3);

            result = complex.newLines("a\n{b\n{c\n}}")[0];
            expect(result.lines).toEqual(4);
            expect(result.match.lines).toEqual(3);
            expect(result.match.children[0].lines).toEqual(2);
        });
        it("should stop closing brackets testing if new line symbol is found", function(){
            complex.options.brackets = {"{":{start:"{", end:"test}", length: 1}};
            var result = complex.newLines("a {b test\n}test}", complex.options)[0];

            expect(result.lines).toEqual(2);
            expect(result.content).toBe("{b test\n}test}");

            result = complex.newLines("a {b test}test", {brackets:{"{":{start:"{", end:"test}", length: 1}}})[0];
            expect(result.src).toBe("a {b test}");
            expect(result.content).toBe("{b test}");            

        });
        it("should stop opening brackets testing if new line symbol is found", function(){
            complex.options.brackets = {"test{":{ prefix: "test", start:"{", end:"}", length: 5}};
            var result = complex.newLines("a test\n{b test{inside}", complex.options)[0];
            expect(function(){
                complex.newLines("a test\n{b test{inside}", {brackets:{"test{":{ prefix: "test", start:"{", end:"}", length: 5}}});
            }).not.toThrowError();
            expect(result.lines).toEqual(2);
            expect(result.src).toBe("a test\n{b test{inside}");
            expect(result.content).toBe("test{inside}");

            expect(function(){
                complex.newLines("a test{\nb test{inside}", complex.options);
            }).toThrowError();

            var result = complex.newLines("a test{b test\n{inside}", complex.options)[0];
            expect(function(){
                complex.newLines("a test{b test\n{inside}", complex.options);
            }).not.toThrowError();
            expect(result.lines).toEqual(2);
            expect(result.src).toBe("a test{b test\n{inside}");
            expect(result.content).toBe("test{b test\n{inside}");
            expect(result.match.count).toEqual(0);
        })
    });  
    describe("- complex groups: ", function(){
        beforeEach(function(){
            complex.group = require("../../");
            complex.options = {};
        });
        afterEach(function(){
            //complex.group = undefined;
        })
        it("should be able to deal with multiple opening brackets with same starting letter", function(){
            complex.options.brackets = {
                "tes1{":{ prefix: "tes1", start:"{", end:"}", length: 5},
                "teb2{":{ prefix: "teb2", start:"{", end:"}", length: 5},
                "te[": {prefix:"te", start:"[", end: "]", length: 5}};
            var results = complex.group("t[e te[first tes{ teb2{second}] tes1{last}", complex.options);
            expect(function(){
                complex.group("t[e te[first tes{ teb2{second}] tes1{last}", complex.options);
            }).not.toThrowError();
            expect(results.length).toEqual(2);
            var result = results[0];
            expect(result.src).toBe("t[e te[first tes{ teb2{second}]");
            expect(result.content).toBe("te[first tes{ teb2{second}]");
            expect(result.match.src).toBe("te[first tes{ teb2{second}]");
            expect(result.match.content).toBe("first tes{ teb2{second}");
            expect(result.match.count).toEqual(1);
            expect(result.match.children[0].content).toBe("second");
            result = results[1];
            expect(result.src).toBe(" tes1{last}");
            expect(result.content).toBe("tes1{last}");
        });
        it("should be able to deal with multiple closing brackets with same starting values", function(){
            complex.options.brackets = {
                "{":{ start:"{", end:"tes1}", length: 5},
                "<":{ start:"<", end:"teb2}", length: 5},
                "[":{ start:"[", end: "te]", length: 5}};
            var results = complex.group("t}e [first tes { <seco teteb2}tes1} tttte]", complex.options);
            expect(function(){
                complex.group("t}e [first tes { <seco teteb2}tes1} tttte]", complex.options);
            }).not.toThrowError();
            expect(results.length).toEqual(1);
            var result = results[0];
            expect(result.src).toBe("t}e [first tes { <seco teteb2}tes1} tttte]");
            expect(result.content).toBe("[first tes { <seco teteb2}tes1} tttte]");
            expect(result.match.src).toBe("[first tes { <seco teteb2}tes1} tttte]");
            expect(result.match.content).toBe("first tes { <seco teteb2}tes1} ttt");
            expect(result.match.count).toEqual(1);
            expect(result.match.children[0].content).toBe(" <seco teteb2}");
            expect(result.match.children[0].children[0].content).toBe("seco te");
        });
        it("should be able to deal with multiple opening and closing brackets with similar starting values", function(){
            complex.options.brackets = {
                "t{":{ prefix: "t", start:"{", end:"t}", length: 2},
                "t[":{ prefix: "t", start:"[", end:"t]", length: 2},
                "t<":{ prefix: "t", start:"<", end:"t>", length: 2}}
            
            var results = new complex.group("tt{t t<Tt> tt[t]t}", complex.options);
            
            expect(function(){
                complex.group("tt{t t<Tt> tt[t]t}", complex.options);
            }).not.toThrowError();
            expect(results.length).toEqual(1);
            var result = results[0];
            expect(result.src).toBe("tt{t t<Tt> tt[t]t}");
            expect(result.content).toBe("t{t t<Tt> tt[t]t}");
            expect(result.match.src).toBe("t{t t<Tt> tt[t]t}");
            expect(result.match.content).toBe("t t<Tt> tt[t]");
            expect(result.match.count).toEqual(2);
            expect(result.match.children[0].content).toBe("T");
            expect(result.match.children[1].content).toBe("");
        });
    });
    describe("- miss matches: ", function(){
        beforeEach(function(){
            complex.miss = require("../../");
            complex.options = {copy:true};
        });
        afterEach(function(){
            complex.options = {};
            complex.miss = undefined;
        })

        it("should throw error in case of bracket missmatch", function(){
            var str = "\ncode: UNMATCHED_CLOSING_BRACKETS";
            str += "\nmsg: There is 1 missing closing brackets.  The last closing bracket is }.";
            str += "\nhint: The next critical missing closing bracket required is } and is at depth 1.";
            str += "\n\n";

            expect(function(){ new complex.miss("a {b", complex.options); }).toThrow(new Error(str));
        });
        it("should not throw error in case of a bracket missmatch if ignoreMissMatch is set to true", function(){
            complex.options.ignoreMissMatch = true;
            expect(function(){ new complex.miss("a {b", complex.options); }).not.toThrowError();
        });
        it("should accept a string value for miss match type", function(){
            complex.options.ignoreMissMatch = "{";
            expect(function(){ complex.miss("a {b {c}", complex.options); }).not.toThrowError();
        });
        it("should throw an error if string missmatch is not the bracket that has been miss matched", function(){
            complex.options.ignoreMissMatch = "{";
            complex.options.debug = true;
            expect(function() { complex.miss("a [b {c}", complex.options); }).toThrow();
            
            expect(function() { complex.miss("a {b [c}", complex.options); }).toThrow();
        });
        it("should accept an array of string values for miss match type", function(){
            complex.options.ignoreMissMatch = ["{", "["];
            expect(function(){ complex.miss("a [b {c", complex.options); } ).not.toThrow();
            var results = complex.miss("a [b {c", complex.options);

            expect(results.length).toEqual(1);
            expect(results[0].match.content).toBe("b {c");
            expect(results[0].match.child.content).toBe("c");
        });
        it("should throw an error with different depths if miss match is higher than required bracket at end of string", function(){
            complex.options.ignoreMissMatch = ["{", "["];
            expect(function(){ complex.miss("a [b {c d (", complex.options); } ).toThrow();
            try {
                complex.miss("a [b {c d (", complex.options)
            } catch (error) {
                expect(error.lastCriticalDepth).toEqual(3);
                expect(error.depth).toEqual(3);
                expect(error.lastBracket).toBe(")");
                expect(error.lastCriticalBracket).toBe(")");
            }

            try {
                complex.miss("a [b (c d {", complex.options)
            } catch (error) {
                expect(error.lastCriticalDepth).toEqual(2);
                expect(error.depth).toEqual(3);
                expect(error.lastBracket).toBe("}");
                expect(error.lastCriticalBracket).toBe(")");
            }
        });
        it("should traferse down the stack if another miss match closing bracket has been found.", function(){
            complex.options.ignoreMissMatch = ["{", "("];
            var results = complex.miss("a [b (c d {d]", complex.options);
            expect(results[0].src).toBe("a [b (c d {d]");
            expect(results[0].match.src).toBe("[b (c d {d]");
            expect(results[0].match.children.length).toEqual(1);
            expect(results[0].match.child).toBeUndefined();
        });
        it("should close required bracket if found inside a miss match type", function(){
            complex.options.ignoreMissMatch = ["{", "("];
            var results = complex.miss("a [b (c d] {d {e", complex.options);

            expect(results[0].src).toBe("a [b (c d]");
            expect(results[0].content).toBe("[b (c d]")
            expect(results[0].match.src).toBe("[b (c d]");
            expect(results[0].match.children.length).toEqual(1);
            expect(results[0].match.child).toBeUndefined();
            expect(results[0].closed).toBeTruthy();
            expect(results[0].match.count).toEqual(1);

            expect(results.length).toEqual(2);
            expect(results[1].match.count).toEqual(1);
            expect(results[1].match.children.length).toEqual(1);
            expect(results[1].src).toBe(" {d {e");
            expect(results[1].content).toBe("{d {e")
            expect(results[1].match.src).toBe("{d {e");
            expect(results[1].match.content).toBe("d {e");

            expect(results[1].match.child.count).toEqual(0);
            expect(results[1].match.child.startString).toBe("d ")
            expect(results[1].match.child.src).toBe("d {e");
            expect(results[1].match.child.content).toBe("e");
    
            expect(results[1].closed).toBeFalsy();
            expect(results[1].match.closed).toBeFalsy();
        });
        it("should not auto complete if autoComplete is set to false", function(){
            
            complex.options.ignoreMissMatch = ["{", "("];
            complex.options.autoComplete = false;

            var results = complex.miss("a [b (c d] {d {e ", complex.options);

            expect(results[0].src).toBe("a [b (c d]");
            expect(results[0].match.src).toBe("[b (c d]");
            expect(results[0].match.children.length).toEqual(1);
            expect(results[0].match.child).toBeUndefined();
            expect(results[0].closed).toBeTruthy();
            expect(results[0].match.count).toEqual(1);

            expect(results.length).toEqual(2);
            expect(results[1].src).toBe(" ");
            expect(results[1].content).toBe("");
            expect(results[1].match.count).toEqual(0);
            expect(results[1].match.children.length).toEqual(0);
            expect(results[1].match.src).toBe("{");
            expect(results[1].match.content).toBe("");
            expect(results[1].closed).toBeFalsy();
            expect(results[1].match.closed).toBeFalsy();
            expect(results[1].match.child.startString).toBe("d ");
            expect(results[1].match.child.endString).toBe("e ");
            expect(results[1].match.child.content).toBe("");
            expect(results[1].match.child.src).toBe("d {")
            expect(results[1].match.child.count).toEqual(0);
        });

    })
})