/// <reference path="../../typings/jasmine/jasmine.d.ts"/>
'use strict';
require("jasmine");
var bracket = require("../../");

describe("Testing complex string queries", function(){
    describe("- newLines: ", function(){
        it("should be able to calculate new line symbols", function(){
            var result = new bracket("ab \n c\n {d}")[0];
            expect(result.lines).toEqual(3);
        });
        it("should be able to calculate new line symbols in child elements", function(){
            var result = new bracket("{a\nb\nc}")[0];
            expect(result.match.lines).toEqual(3);
            expect(result.lines).toEqual(3);

            result = new bracket("a\n{b\n{c\n}}")[0];
            expect(result.lines).toEqual(4);
            expect(result.match.lines).toEqual(3);
            expect(result.match.children[0].lines).toEqual(2);
        });
        it("should stop closing brackets testing if new line symbol is found", function(){
            var result = new bracket("a {b test\n}test}", {brackets:{"{":{start:"{", end:"test}", length: 1}}})[0];
            expect(result.lines).toEqual(2);
            expect(result.content).toBe("{b test\n}test}");

            result = new bracket("a {b test}test", {brackets:{"{":{start:"{", end:"test}", length: 1}}})[0];
            expect(result.src).toBe("a {b test}");
            expect(result.content).toBe("{b test}");            

        });
        it("should stop opening brackets testing if new line symbol is found", function(){
            var result = new bracket("a test\n{b test{inside}", {brackets:{"test{":{ prefix: "test", start:"{", end:"}", length: 5}}})[0];
            expect(function(){
                new bracket("a test\n{b test{inside}", {brackets:{"test{":{ prefix: "test", start:"{", end:"}", length: 5}}});
            }).not.toThrowError();
            expect(result.lines).toEqual(2);
            expect(result.src).toBe("a test\n{b test{inside}");
            expect(result.content).toBe("test{inside}");

            expect(function(){
                new bracket("a test{\nb test{inside}", {brackets:{"test{":{ prefix: "test", start:"{", end:"}", length: 5}}});
            }).toThrowError();

            var result = new bracket("a test{b test\n{inside}", {brackets:{"test{":{ prefix: "test", start:"{", end:"}", length: 5}}})[0];
            expect(function(){
                new bracket("a test{b test\n{inside}", {brackets:{"test{":{ prefix: "test", start:"{", end:"}", length: 5}}});
            }).not.toThrowError();
            expect(result.lines).toEqual(2);
            expect(result.src).toBe("a test{b test\n{inside}");
            expect(result.content).toBe("test{b test\n{inside}");
            expect(result.match.count).toEqual(0);
        })
    });  
    describe("- complex groups: ", function(){
        it("should be able to deal with multiple opening brackets with same starting letter", function(){
            var results = new bracket("t[e te[first tes{ teb2{second}] tes1{last}", {brackets:{
                "tes1{":{ prefix: "tes1", start:"{", end:"}", length: 5},
                "teb2{":{ prefix: "teb2", start:"{", end:"}", length: 5},
                "te[": {prefix:"te", start:"[", end: "]", length: 5}}});
            expect(function(){
                new bracket("t[e te[first tes{ teb2{second}] tes1{last}", {brackets:{
                "tes1{":{ prefix: "tes1", start:"{", end:"}", length: 5},
                "teb2{":{ prefix: "teb2", start:"{", end:"}", length: 5},
                "te[": {prefix:"te", start:"[", end: "]", length: 5}}})
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
            var results = new bracket("t}e [first tes { <seco teteb2}tes1} tttte]", {brackets:{
                "{":{ start:"{", end:"tes1}", length: 5},
                "<":{ start:"<", end:"teb2}", length: 5},
                "[":{ start:"[", end: "te]", length: 5}}});
            expect(function(){
                new bracket("t}e [first tes { <seco teteb2}tes1} tttte]", {brackets:{
                "{":{ start:"{", end:"tes1}", length: 5},
                "<":{ start:"<", end:"teb2}", length: 5},
                "[":{ start:"[", end: "te]", length: 5}}});
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
            var results = new bracket("tt{t t<Tt> tt[t]t}", {brackets:{
                "t{":{ prefix: "t", start:"{", end:"t}", length: 2},
                "t[":{ prefix: "t", start:"[", end:"t]", length: 2},
                "t<":{ prefix: "t", start:"<", end:"t>", length: 2}}});
            expect(function(){
                new bracket("tt{t t<Tt> tt[t]t}", {brackets:{
                "t{":{ prefix: "t", start:"{", end:"t}", length: 2},
                "t[":{ prefix: "t", start:"[", end:"t]", length: 2},
                "t<":{ prefix: "t", start:"<", end:"t>", length: 2}}});
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
    })

})