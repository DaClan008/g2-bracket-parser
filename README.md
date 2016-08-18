# g2-bracket-parser
[![Build Status](https://travis-ci.org/DaClan008/g2-bracket-parser.svg?branch=master)](https://travis-ci.org/DaClan008/g2-bracket-parser)
[![Coverage Status](https://coveralls.io/repos/github/DaClan008/g2-bracket-parser/badge.svg?branch=master;ts=2)](https://coveralls.io/github/DaClan008/g2-bracket-parser?branch=master;ts=2)
[![codecov](https://codecov.io/gh/DaClan008/g2-bracket-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/DaClan008/g2-bracket-parser)
[![Dependency Status](https://gemnasium.com/badges/github.com/DaClan008/g2-bracket-parser.svg)](https://gemnasium.com/github.com/DaClan008/g2-bracket-parser?)

## Bracket parser for node.js applications
------------------------------------------

Parse through a JavaScript string to find content in and around brackets ( "{ or [ or (" etc).
The idea is to provide an easy simplistic way to find content that is surrounded by brackets, or content that does not have sufficient closing brackets.

### Why do I need this?

The project started because of a lack in regex capabilities to find proper content within brackets.
(by bracket we mean: ( ) or { } or [ ] or `any other bracket set you specify`).
These brackets may sometimes:
* appear `inside comments`, in which case they should be ignored and not counted for as brackets.
* have an insufficient amount of `closing bracket`, which means the string being parsed is incomplete.  
* appear `inside` other `brackets`.

This module assists in finding these scenarios and return a workable object.
For more information on how to use this module, consult our [wiki](https://github.com/DaClan008/g2-bracket-parser/wiki) page.

### extra functionality

The result object will be an array of successfully closed brackets.  
It will give details of the following on each successful closing bracket.

| Property | Type    | Information 
| -------: | ------- | :-----------
| src      | string  | The source string for the given result.
| content  | string  | The content inside the brackets.
| start    | integer | The starting index for the src string.  This relate to the string provided to parse through.
| end      | integer | The index of the last character of the src string.
| lines    | integer | The total amount of "\n" characters found in the src string.
| closed   | boolean | Whether the current bracket has been sufficiently closed with a closing bracket (i.e. { -> needs } to be true).
| match    | object  | The matching data or data that is inside the brackets.
| length   | integer | The length of the src string.

The matched item will in addition also have more detail regarding the match.  i.e:

| Property     | Type    | Information
| -----------: | ------- | ---------- 
| startString  | string  | A string value that is directly in front of the bracket.
| endString    | string  | A string value of the content that followed the last closing bracket of a child element.  This will mostly be an empty string, unless content follows the closing bracket.  Once again this is only applicable to child elements and not the resultSet.  Content that follows the last closing bracket in a resultSet will be ignored.
| endStart     | integer | Index where the endString will start.
| contentStart | integer | The index where the content will start excluding the brackets.
| bracketStart | integer | The index where the opening bracket will start (thus if the bracket.length = 1 this will be contentStart - 1)
| start        | integer | Might be different to bracketstart depending whether or not an opening bracket should have a prefix (i.e. #{ );
| contentEnd   | integer | This will also differ from normal end by the total length of the closing bracket (usually 1).
| count        | integer | The total number of "children" or child bracket have been found in this item.
| children     | child[] | All the direct children objects (with same properties as this).  A child could be a closed bracket pair that is found inside the current item.
| bracket      | object  | Information of the bracket that caused the creation of this item.  i.e. what caused this item to be considered as opened or closed.
| isPrefixed   | boolean | Determine if this item used a prefix in front of an opening bracket (i.e. #{ ).
| prefixedChildren | boolean | Determine if any of the children used a prefix in front of an opening bracket.


## Install
----------

``` 
npm install g2-bracket-parser 
```

## Usage
--------

```js
// import the module
var brackets = require("g2-bracket-parser");
// get the result(s) by parsing through the string.
var results = brackets("some string {with some brackets}", options);
```

or

```js
// create a new Parser object
var object = new brackets.Parser("some string {with some brackets}", options);
// Parse through the string to get the result.
var results = object.parse();
```

## Options
----------

Options must be an object e.g:

Any of the following properties can be added as options:

### **_onlyFirst_**
**_Desc:_** If set to true this will only return the first completed bracket set.  

**_Example:_** e.g. in "a {b} c {d}" only "a {b}" will be returned if onlyFirst is set to ture, and c {d} will not be parsed through at all.

**_Default_** false [the entire provided string will be iterated over.]

### **start**
**_Desc:_** Provides an alternative starting position.<br />

**_Example:_** If "some string {with some brackets}" has been used for input string, and start = 6:
        The string used to parse through will consist of only "tring {with some brackets}".<br />

**_Default:_** 0

### **end**
**_Desc:_**  Similar to start, this value will provide an alternative ending position.<br />

**_Example:_**  If "some string {with some brackets}" has been used for input string, and end = 20:
        The string used to parse through will consist only of "some string {with som".<br />

**_Default:_** length of input -1


### **length**
**_Desc:_**  Similar to start and end this will affect the string that will be parsed. <br />

**_Example:_**  If "some string {with some brackets}" has been used for input string, and length = 20:
        The string used to parse through will consist only of "some string {with so".<br />

**_Please Note:_**  However take note that this value will differ if the start property has also been assigned.
        This means that if the start value is set to 1 the parse string will only be "ome string {with som".
        If end is also set and the difference between the start and the end does not correspond to the size of the length property,
        the end value will be adjusted first.  Also if the length is larger than the size of the string, the end value will be adjusted together with this length property.<br />

**_Default:_** length of the input.

### **bracketPrefix**
**_Desc:_** An optional property stipulating that a bracket could have a prefix value.<br />
**_Example:_**  If bracketPrefix is supplied with value of "#", the parser could take into account
        brackets that start with #.  For instance #{ will be used as opening bracket.<br />
**_Please Note:_**  The calculation could be affected by prefixOption below.
**_Default:_** ""

### **prefixOption**
**_Desc:_** An optional property to stipulate how a prefix should be dealt with.  This will only be applicable if a prefix (above) has been set. <br />

**_Options:_** 
    
| option   | explanation
| -------: | :-----------
| _none_   | it does not matter if the prefix is applied to top most element or children.  The parser will consider a opening bracket to be either #{ or { if prefix is #.  This means that #{top most #{children}} or {top most {children}} or #{top most{children}} or {top most #{children}} will all be considered as being successful opening brackets.
| _strict_ | Prefix must be available in all parent and child elements to be considered as being a successful opening bracket.  Therefore only #{top most #{children}} will be considered as brackets and not {top most {children}}.
| _parentStrict_ | The top most bracket must start with a prefix, but the children may or may not start with the prefix.  e.g. #{top most {children}} or #{top most #{children}}, will all be captured as brackets.
| _childStrict_ | Is the reverse of parentStrict.  All children must have a prefix to be calculated as separate brackets, but the top most element may or may not have the prefix.
| _normal_ | The prefix must only be applied to the first bracket but not to any of it's children.  i.e. only #{top most {children}} will all be acceptable brackets but not #{top most #{children}}.  Note that in the latter case children will be a child, but only from {children} and not #{children}.  i.e # is not considered as being part of the bracket for the children.
| _abnormal_ | The top most element will not have a prefix, but all children must.  Therefore {top most #{children}} will consider all as successful brackets, but not #{top most #{children}}.  Please note that in the latter case the top most will be considered as being a bracket but only from { character and not from #{.  Also note that a child will not be considered as a bracket at all if it does not have a prefix in front of it.

**_Default:_**  normal

### **ignoreMissMatch**
**_Desc:_** Indicates whether the result must throw an error if there is a bracket miss match (e.g. an opening bracket without a closing bracket). <br />

**_Options:_** 
* Could be `true`, and no errors will be thrown.  The object returned will be a hybrid result.
* Could be a `string` representing an opening bracket (i.e. "{" ).  In this case only { brackets may have unequal amount of closing brackets and will not throw an error.  Any other unequal (i.e. [) bracket will throw an error.
* Could be a `string array` with each element representing an opening bracket as specified in the point above.  All opening brackets mentioned in the list will not throw an error.

**_Default:_** false _[all unequal opening brackets will throw, i.e. ignore none]_

## **ignoreInside**
**_Desc:_** Ignores brackets that start within these items.

**_Options_**
* Can be a `string` value: i.e. "'" which means that brackets within ' ' will be ignored.
* Can be a `string array`: i.e. ["'", "\""] which means that brackets within ' ' and " " will be ignored.
* Can be an `object` (the structure is similar to brackets option below).  Any items within these object closing and opening tags will be ignored.
* Can be a `object` array which represent an array of the above objects.

**_Please Note:_** if the same key (prefix + bracket) is used here as in the bracket options, the bracket option will get a "isIgnore" property attached to it regardless of whether or not the closing brackets are the same.  
    At the moment there is no lookup to make sure closing brackets is unique for each key.

**_Default_** ["'", "\""]

## **brackets**
**_Desc:_** An optional list of brackets to take into consideration.

**_Options:_**
* Could be a `string`.  This will only be applicable if string value match one of the start properties in the current default object [see default below].
    Supplying a string value means that the search is restricted to only the values supplied.
    If the string is not already included in the default bracket list, the parser will assume the ending bracket is the same as the starting bracket.
* Could be a `string array`.  An array of strings that will be applicable in same fashion as the above string explanation.
* Could be an `object`.  Please look at structure of object for indication of how to build this object.
* Could be an `array of objects`.  Where the object as explained above applies

**_Structure of Object_** If a custom object is used (either in list or stand alone). The object must look as follows:
```json
{
    "key":{
            "start":"{", 
            "end":"}", 
            "length":"x", 
            "prefix":"?"
    },
    "key": {}
}
```
* key => must be combination of prefix + start.  if no prefix is applicable then this should only be the value of start.
* start => how the starting bracket should look like.
* end => what the ending bracket should look like.
* prefix => totally optional!!!
* length => is the size of the start value and prefix.

_If prefix = test in above situation, x should be 5 and key should be test{, else key should be { and length should be 1_

**_Default:_**
```json
{
    "[": {  "start": "[", "end": "]", "length": 1 },
    "{": {  "start": "{", "end":"}", "length": 1 },
    "(": {  "start": "(", "end": ")", "length": 1 },
    "\"": { "start": "\"", "end":"\"", "length": 1 },
    "'": {  "start": "'", "end": "'", "length": 1 },
    "<": {  "start": "<", "end": ">", "length": 1 }
}
```

## Contribute
-------------
Please feel free to submit a pull request.  We will review and get back to you.  We hope our [wiki](https://github.com/DaClan008/g2-bracket-parser/wiki) provide clearer guidance as to the future of this project.

Thank you