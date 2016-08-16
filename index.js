"use strict";


module.exports = brackets;
module.exports.Parser = Brackets;

function getDefaultBrackets(){ 
	return {
		"[": {  "start": "[", "end": "]", "length": 1 },
		"{": {  "start": "{", "end":"}", "length": 1 },
		"(": {  "start": "(", "end": ")", "length": 1 },
		"\"": { "start": "\"", "end":"\"", "length":1 },
		"'": {  "start": "'", "end": "'", "length": 1 },
		"<": {  "start": "<", "end": ">", "length": 1}
	}
}

var pBrackets = {};
var cBrackets = {};
var missM = {};

function brackets(str, options){
    var brk = new Brackets(str, options);
    var result = brk.parse();
    return result;
}

/**
 * A Parent result type.  Returns a value until a bracket option has been completely ended
 * e.g. abcd....[abcd .... [abcd ... ]] 
 * @param {object} parentBrackets      		An object containing all the opening and closing brackets that should be applied to the parent (or this object).
 * @param {object} childBrackets       		An object containing all the opening and closing brackets that should be applied to any of the child elements of this object.
 * @param {string[]} multiParentBrackets 	A string array of all the parentBrackets objects opening tags that has a length of more than one.
 * @param {string[]} multiChildBrackets  	A string array of all the childBrackets objects opening tags that has a length of more than one.
 * @param {integer} index               	An indication of where this object starts
 * @param {object} ignoreComments			will not take into account any brackets inside single or double quotes
 */
function ResultSet(parentBrackets, childBrackets, index){
	// RESULTS
	// The complete source string that has been computed
	this.src = "";
	this.content = "";
	// The index of the starting element for this object
	this.start = index || 0;
	// The current or last character's index in this object
	this.end = this.start-1;
	// The length of the current src string
	this.length = this.end - this.start + 1;
	// The number of new lines or \n occurences in the src string
	this.lines = 1;
	// A boolean indicating whether any of the children (or children's children) was calculated starting with a prefix
	this.prefixedChildren = false;
	// An object that resemble and has information of the matched criteria
	this.match = false;
	this.closed = false;

	// INTERNAL usage
	pBrackets = parentBrackets || {};
	cBrackets = childBrackets || {};

	this.endString = "";
	this.endLen = 0;

	this.temp = "";
}

ResultSet.prototype = {
	/**
	 * If temp variable is no longer needed, this will close the temp and add the correct values to the content variable if needed
	 * @param  {string} val A value that should not be added to the content yet as it will form part of this objects child element.
	 * @return {string}     The value object.
	 */
	endTemp: function(val){
		val = val || "";
		var add = val.length > 0 ? this.temp.substr(0, this.temp.length - val.length) : this.temp;
		this.src += add;
		this.end += add.length;
		
		// clear variables
		if(this.endings) this.endings.removeCurrentAll();
		pBrackets.removeCurrentAll();
		this.temp = "";
		return val;
	},
	/**
	 * Add one character to the source after calculations has been done to assertain if character forms part of a bracket or not.
	 * @param {char} char A character to add calculate and add to the src variable.
	 * @return {boolean} True if the Resultset is complete (open and sufficient closing bracket has been found) for this result object, else false.
	 */
	addChar: function(char){
		if(!this.match){
			// see if NEW LINES char
			if(char === "\n"){
				this.lines++;
			}

			// Dealing with IGNORES
			if(this.ignore){
				var end = this.endings.confirm(char, true);
				// we should just add a char until we get to end
				if(end){
					this.ignore = undefined;
					this.endings.removeCurrentAll();
				}
				this.src += char;
				this.end++;
				return false;
			}
			
			// finding OPENING BRACKETS
			var brkt = pBrackets.confirm(char);
			if(brkt){
				// we have totally matched an opening bracket
				if (brkt.isIgnore){
					// the opening bracket is the start of an ignore string
					this.ignore = brkt;
					if (!this.endings) this.endings = new bracketInfo();
					this.endings.add(brkt.end, brkt);
					this.endTemp();
					this.src += char;
					this.end++;
					return false;
				} else {
					// remove prefix + brts
					this.temp+=char;
					this.endTemp(brkt.prefix + brkt.start);
					this.match = new BRKChild((brkt.prefix ||"")+ brkt.start, this.end + 1, brkt);
					return false;
				}
			} else {
				if(pBrackets.count > 0 || (this.endings && this.endings.count > 0)){
					this.temp += char;
					return false;
				}
				if (this.temp !== ""){
					this.endTemp();
				}
				this.src += char;
				this.end++;
				return false;
			}
		} else {
			// let CHILD deal with it
			if(this.match.addChar(char)){
				// The child has reached its closing bracket
				this.match.endings = undefined;
				this.closed = true;
				this.finalize();
				return true;
			}
		}
		return false;
	},
	/**
	 * Returns the bracket information for the next closing bracket
	 * @return {object} if a bracket is open it will return an object containing the amount of opening brackets and the last opening bracket information, else null.
	 */
	workingOpenBracket: function(){
		if(this.match){
			return this.match.getLastOpenBracket();
		}else {
			return;
		}
	},
	finalize: function(finalize){
		if(this.match){
			if(finalize) this.match.finalize(true);
			this.match.temp = undefined;

			this.content += this.match.src;
			this.src += this.match.src;
			this.end += this.match.length;
			this.length = this.src.length;
			this.lines += this.match.lines -1;
			this.prefixedChildren = this.match.prefixedChildren;
		}
	}
}
/**
 * If ResultSet is the parent object for the result, these are child result sets containing a grouped bracket (or completed bracket information).
 * Thus if the object is finalised addChar returned a true value, there are an even amount of opening and closing brackets.
 * @param {string} prefixedBracket The prefix and or bracket that was responsible for opening this object. [if prefix was involved the value should be prefix + open bracket]
 * @param {integer} index          The index where the prefixedBracket was found
 * @param {object} bracket         The bracket object containing the end bracket and other information for this object.
 * @param {object} brackets        The total number of brackets that needs to be search through (in case there are more opening brackets within this object).
 * @param {string[]} multiCharBrkts  String array containing the key's of the brackets object that is longer than 2 chars in length.
 */
function BRKChild(prefixedBracket, index, bracket, parentBracket){
	// result values
	this.prefixedBracket = prefixedBracket || "";	// this include the bracket also
	this.src = this.prefixedBracket;
	this.content = "";

	// positions
	this.start = index  ||  0;
	this.bracketStart = this.start + (bracket ? bracket.prefix ? bracket.prefix.length : 0 : 0);
	this.contentStart = this.start + this.prefixedBracket.length;
	this.end = this.contentStart -1;
	this.contentEnd = this.contentStart-1;
	
	this.lines = 1;
	this.length = 0;
	this.count = 0;

	// info
	this.bracket = bracket;
	var parents = parentBracket || [];
	this.parentBracket = [];
	this.closed = false;

	this.isPrefixed = bracket ? bracket.prefix ? true : false : false;
	this.prefixedChildren = false;
	this.canMissMatch = missM && this.bracket ? missM[this.bracket.start] : false;

	this.children = [];

	// internal use
	this.endings = new bracketInfo();
	this.endings.add(bracket.end, bracket);
	if(this.canMissMatch  && parents){
		this.parentBracket = parents;
		for(var i = 0; i< this.parentBracket.length; i++){
			this.endings.add(this.parentBracket[i].end, this.parentBracket[i]);
		}
	}
	this.parentBracket.push(this.bracket);

	this.temp = "";
}

BRKChild.prototype = {
	/**
	 * If temp variable is no longer needed, this will close the temp and add the correct values to the content variable if needed
	 * @param  {string} val A value that should not be added to the content yet as it will form part of this objects child element.
	 * @return {string}     The value object.
	 */
	endTemp: function(val){
		val = val || "";
		var add = val.length > 0 ? this.temp.substr(0, this.temp.length - val.length) : this.temp;
		this.content += add;
		this.contentEnd += add.length;
		
		// clear variables
		this.endings.removeCurrentAll();
		cBrackets.removeCurrentAll();
		this.temp = "";
		return val;
	},
	/*
	 * Add a character to the bracket object and return false if we have not yet reached the end bracket
	 */
	addChar: function(char,isPrefix, Bracket){
		// this.content += char;
		if(!this.child){
			// see if NEW LINES char
			if(char === "\n"){
				this.lines++;
			}

			// Dealing with IGNORES
			var end = this.endings.confirm(char, this.ignore);
			if(this.ignore){
				if(end){
					// we are at end of ignore
					this.ignore = undefined;
					this.endings.removeCurrentAll();
				}
				this.content += char;
				this.contentEnd++;
				return false;
			}
			
			// dealing with CLOSING BRACKETS
			if(end){
				// we have reached the main ending tag
				this.temp += char;
				this.endTemp(end.end);
				this.closed = this.bracket.end === end.end;
				if(!this.closed) this.matched = end;
				this.finalize();
				return true;
			}

			// finding OPENING BRACKETS
			var brkt = cBrackets.confirm(char);
			if(brkt) {
				// we have totally matched an opening bracket
				if (brkt.isIgnore){
					// the opening bracket is the start of an ignore string
					this.ignore = brkt;
					// make sure the bracket is included in the search of endings
					this.endings.add(brkt.end, brkt);

					this.endTemp();
					this.content += char;
					this.contentEnd++;
					return false;
				} else {
					// remove prefix + brts
					this.temp += char;
					this.endTemp(brkt.prefix + brkt.start);
					this.child = new BRKChild((brkt.prefix ? brkt.prefix : "") + brkt.start, this.contentEnd + 1, brkt, this.parentBracket);
					return false;
				}
			} else {
				if(cBrackets.count > 0 || this.endings.count > 0){
					// add to temp until both opening and closing brackets count is 0
					this.temp += char;
					return false;
				}
				if(this.temp !== ""){
					// both's count = 0 therefore characters are no longer being dealt with brkts / endings
					this.endTemp();
				}
				this.content += char;
				this.contentEnd++;
				return false;
			}
		} else {
			// let CHILD deal with it
			if(this.child.addChar(char)){
				// The child has reached its closing bracket
				if(this.child.canMissMatch) this.parentBracket.pop();

				this.child.endings = undefined;
				this.child.temp = undefined;
				if(this.child.canMissMatch && !this.child.closed){
					// it is not child that closed but maybe this item or this item's parent
					if(this.child.matched.end === this.bracket.end || !this.canMissMatch){
						// This item closed
						this.closed = true;
					} else if(this.canMissMatch) {
						// if the child's end bracket does not match this end and we can missmatch, it means it might be this item's parent that ended
						this.matched = this.child.matched;
					}
					this.finalize();
					// close this item
					this.child.matched = undefined;
					this.child.parentBracket = undefined;
					this.children.push(this.child);
					this.child = undefined;
					this.count++;
					// this.count = this.children.length;
					// this.length = this.end - this.start +1;
					return true;
				}
				this.childClose();
				this.children.push(this.child);
				this.child = undefined;
			}
			return false;
		}
	},
	/**
	 * returns an object of currently required ending bracket together with the depth of brackets required.
	 * @return {object} depth and bracket information of currently required closing bracket.
	 */
	getLastOpenBracket: function(){
		if(this.child){
			var r = this.child.getLastOpenBracket();
			r.depth++;
			if (r.bracketDepth) {
				r.bracketDepth++;
			} else if(!this.canMissMatch){
				r.bracketDepth = 1;
				r.bracket = this.bracket;
			}
			return r;
		}
		return {
			depth: 1,
			bracket: this.bracket,
			bracketMissMatch: this.bracket,
			bracketDepth: this.canMissMatch ? undefined : 1
		}
	},
	childClose(finalize){
		if(this.child){
			if(finalize) this.child.finalize(true);
			this.lines += this.child.lines -1;
			this.content += this.child.src;
			this.contentEnd += this.child.length;
			this.prefixedChildren = this.prefixedChildren || (this.child.isPrefixed || this.child.prefixedChildren);
		}
	},
	finalize: function(finalize) {
		this.childClose(finalize);

		this.src += this.content + (this.closed ? this.bracket.end : "");
		this.end = this.contentEnd + (this.closed ? this.bracket.end.length : 0);
		this.length = this.end - this.start +1;
		if(finalize && this.child) this.children.push(this.child);
		this.count = this.children.length;
	}
}

function bracketInfo(Brackets){
	this.count = 0;
	this.singles = {};
	this.current = [];
	if(Brackets){
		for(key in Brackets){
			this.add(key, Brackets[key]);
		}
	}
}
bracketInfo.prototype = {
	add: function(key, obj){
		if(!this[key]){
			this[key] = obj;
			if(!this.singles[key[0]]) this.singles[key[0]] = [];
			this.singles[key[0]].push(key);
		}
	},
	addIgnore: function(key, obj){
		if(!this[key]){
			this.add(key,obj);
		}
		this[key].isIgnore = true;
	},
	removeCurrent: function(index){
		if(index >=0 && index < this.current.length){
			this.current.splice(index,1);
			this.count--;
		}
	},
	removeCurrentAll: function(){
		this.current = [];
		this.count = 0;
	},
	addCurrent: function(key, char){
		this.current.push({ key: key, length: 1, last: key.length -1});
		this.count++;
	},
	confirm: function(char, onlyIgnores){
		if(this[char]){
			// single character starting bracket;
			if(this[char].isIgnore && onlyIgnores){
				return this[char]
			} else if(!onlyIgnores){
				return this[char];
			}
		}
		
		// see if old brackets still apply
		var i = this.count;
		while(i--) {
			if(this.current[i].key[this.current[i].length] === char){
				// we still have a match
				if(this.current[i].last === this.current[i].length){
					// we have total match
					return this[this.current[i].key];
				}
				// partial key match
				this.current[i].length++;
			} else {
				// no match
				this.removeCurrent(i);
			}
		}
		// see if any new bracket is applicable
		var list;
		if(list = this.singles[char]){
			for(var i = 0; i<list.length; i++){
				if((onlyIgnores && list[i].isIgnore) || !onlyIgnores){
					this.addCurrent(list[i], char);
				}
			}
		}
		// add char to temp if needed.
		if(this.count > 0){
			this.temp += char;
		}
		return false;
	}
}

/**
 * The Brackets function constructor
 * @param {string} str     the string to search through for bracket components.
 * @param {object} options The options that needs to be passed to run through:
 *
 * 		OPTIONS:
 * 			start -> the starting index to start searching through in the supplied str
 * 			end -> the index of the last character that needs to be searched in str
 * 			prefix -> a given prefix that needs to occur before the bracket to be included in the search.
 * 			prefixOption -> Options are (if prefix is provided!! e.g. #):
 *              - none -> it's not necesary for prefix to be available anywhere in search.  i.e. will return (if bracket = {):
 *              	[ first #{ -> child {  AND { -> #{ AND #{ -> #{ 
 *              - strict -> prefix must be available in all parent and child elements e.g. will return:
 *              	#{ -> #{ but not #{ -> {
 *              - parentStrict -> parent must have prefix, but children may or may not have prefix.
 *              - childStrict -> parent may or may not have prefix, but alll children should have prefix
 *              - normal -> prefix must only be applied to parent but not to children
 *              - abnormal -> parent must not have prefix only children must have
 * 			brackets -> 
 * 				string -> must be a key value of defaultBrackets.json object i.e. [ or { or ( etc [ONLY ONE]
 * 				Array[strings] -> multiple brackets will be searched for (same rule apply for each string in array as mentioned above).
 * 				object -> object must be { key: { prefix: (optional), start:(starting bracket), end: (closing bracket), length: (length of key) }}
 * 					key -> is the prefix + start
 * 				Array[object] -> An array of the above objects
 * 				null / undefined -> defaultBrackets.json will be used.
 * 			ignoreMissMatch -> if true and there is an unequal amount of opening vs closing brackets, this will not throw an error during parse, 
 * 				if false an error will be thrown if mismatch occur.  Default is false
 */
function Brackets(str, options){
	// Sort out INPUT options
	options = options || {};
	this.defaultBrackets;
	
	if (typeof str !== 'string') {
	    throw new TypeError('Expected source code to be a string but got "' + (typeof str) + '"')
	}
	if (Array.isArray(options) || typeof options !== 'object') {
	    throw new TypeError('Expected "options" to be an object but got "' + (Array.isArray(options) ? 'array' : (typeof options)) + '"')
	}

	//Strip any UTF-8 BOM off of the start of `str`, if it exists.
	this.original = str.replace(/^\uFEFF/, '');
	this.start = options.start || 0;
	if(this.start < 0) this.start = 0;
	this.end = options.end || this.original.length - 1;
	this.length = options.length || this.end - this.start + 1;
	this.length = this.length < 0 ? 0 : this.length;

	if(this.length !== this.end - this.start + 1){
		this.end = this.start + this.length - 1;
		if(this.end > this.original.length -1){
			this.end = this.original.length -1;
			this.length = this.end - this.start + 1;
		}
	}
	this.input = this.original.substr(this.start,this.end - this.start + 1);
	this.index = 0;
	this.bracketPrefix = options.prefix || "";
	this.prefixOption = options.prefixOption || "normal"
	this.prefixOptionInternal = this.prefixOption.toLowerCase();
	// TODO: test for ignores
	this.ignoreMissMatch = options.ignoreMissMatch || false;
	this.autoComplete = options.autoComplete === undefined || options.autoComplete === null ? true : options.autoComplete;

	if((typeof this.ignoreMissMatch).toLowerCase() !== "boolean"){
		missM = {};
		this.buildMissMatch(this.ignoreMissMatch);
		this.ignoreMissMatch = false;
	}

	// Working variables
	var ignores = options.ignoreInside || ['"', "'"];
	var brckts = options.brackets || ['[','(','{','"',"'","<"];
	
	this.brackets = new bracketInfo();
	this.bracketsChild = new bracketInfo();
	this.ignoreInside = {};

	// initialize
	this.confirmBrackets(brckts);

	//this.getMultiChars();
	this.buildIgnores(ignores);
	
	this.result = [];
	this.working = new ResultSet(this.brackets,this.bracketsChild, this.start);

	//this.DEB = options.debug;
}

Brackets.prototype = {
	buildMissMatch: function(missm){
		if(Array.isArray(missm)){
			for(var i = 0; i < missm.length; i++){
				this.buildMissMatch(missm[i]);
			}
		}else if((typeof missm).toLowerCase() === "string"){
			missM[missm] = true;
		}
	},
	clone: function(obj){
		var r = {};

		if(obj && typeof obj === "object"){
			for(var key in obj){
				r[key] = obj[key];
			}
		}
		return r;
	},
	/**
	 * add bracket information to the brackets object.  The brackets contains all the opening and closing bracket information.
	 * @param {string} key   The key of the bracket
	 * @param {object} value Object containing all the relevant information for the bracket (i.e. opening and closing bracket)
	 */
	addBracket: function(key, value){
		if(!value || (typeof value !== "object") || key === "" || (typeof key !== "string")) return;
		
		if(this.bracketPrefix != ""){
			var prefKey = this.bracketPrefix + key,
				prefValue = this.clone(value);
			
			prefValue.prefix = this.bracketPrefix;
			prefValue.length = this.bracketPrefix.length + key.length;


			if(this.prefixOptionInternal !== "abnormal") this.brackets.add(prefKey, prefValue);
			else { this.brackets.add(key, value); }

			if(this.prefixOptionInternal === "none" ){
				this.brackets.add(key, value);
				this.bracketsChild.add(key, value);
			}

			if(this.prefixOptionInternal !== "normal"){
				this.bracketsChild.add(prefKey, prefValue);
			} else{
				this.bracketsChild.add(key, value);
			}

			if(this.prefixOptionInternal === "childstrict"){
				this.brackets.add(key, value);
			}

			if(this.prefixOptionInternal === "parentstrict"){
				this.bracketsChild.add(key, value);
			}
			
		} else {
			this.brackets.add(key, value);
			this.bracketsChild.add(key, value);
		}
	},
	/**
	 * Ensure that all the brackets to search through are included correctly in the brackets object
	 * @param  {string / object / array} brackets Bracket information is explained above.
	 */
	confirmBrackets: function(brackets){
		var type = (typeof brackets).toLowerCase(), obj;
		if(Array.isArray(brackets)) type = "array";

		switch(type){
			case "array":
				for(var i = 0; i < brackets.length; i++){
					var t = (typeof brackets[i]).toLowerCase();
					if(t === "string" || t === "object"){
						this.confirmBrackets(brackets[i]);
					}
				}
				break;
			case "object":
				for(var key in brackets){
					this.addBracket(key, brackets[key]);
				}
				break;
			case "string":
				if(!this.defaultBrackets) this.defaultBrackets = getDefaultBrackets();
				if(this.defaultBrackets[brackets]){
					this.addBracket(brackets, this.defaultBrackets[brackets]);
				} else{
					var obj = {start: brackets, end: brackets, length: brackets.length};
					this.addBracket(brackets,obj);
				}
			default:
				break;
		}
	},
	buildIgnores: function(ignores){
		var type = (typeof ignores).toLowerCase();
		if(Array.isArray(ignores)) type = "array";

		switch(type){
			case "array":
				for(var i = 0; i < ignores.length; i++){
					var t = (typeof ignores[i]).toLowerCase();
					if(t === "string" || t === "object"){
						this.buildIgnores(ignores[i]);
					}
				}
				break;
			case "string":
				if(!this.defaultBrackets) this.defaultBrackets = getDefaultBrackets();
				if(this.defaultBrackets[ignores]) {
					this.brackets.addIgnore(ignores, this.defaultBrackets[ignores]);
					this.bracketsChild.addIgnore(ignores, this.defaultBrackets[ignores])
				} 
				else if(this.brackets[ignores] || this.bracketsChild[ignores]) {
					this.brackets.addIgnore(ignores);
					this.bracketsChild.addIgnore(ignores);
				} else {
					var obj = { start: ignores, end: ignores, isIgnore: true, length:ignores.length }
					this.brackets.addIgnore(ignores, obj);
					this.bracketsChild.addIgnore(ignores, obj);
				}
				break;
			case "object":
				for(var key in ignores){
					this.brackets.addIgnore(key, ignores[key]);
					this.bracketsChild.addIgnore(key, ignores[key]);
				}
			default:
				break;
		}
	},
	/**
	 * The main function that itterates through all the characters in the input string and returns a resulting array of objects
	 */
	parse: function() {
        var char;
		while(char = this.input[this.index++]){
			if(this.working.addChar(char)){
				this.working.temp = undefined;
				this.working.endString = undefined;
				this.working.endLen = undefined;
				this.result.push(this.working);
				this.src += this.working.src;
				this.working = new ResultSet(this.brackets,this.bracketsChild, this.index);
			}
		}
		// we have now come to the end of the line
		if(this.working.match && !this.ignoreMissMatch){
			// we found an opening bracket but did not find closing bracket
			var last = this.working.workingOpenBracket();

			if(last.bracketDepth > 0){
				var msg = "", code = "UNMATCHED_CLOSING_BRACKETS", hint = "";
				if(last){
					msg = "There " + (last.depth === 1 ? "is " : "are ") + last.depth + " missing closing brackets.  ";
					msg += "The last closing bracket is " + last.bracketMissMatch.end + ".";
					hint += "The next critical missing closing bracket required is " + last.bracket.end + " and is at depth " + last.bracketDepth + ".";
				} else{
					msg = "There is an insufficient amount of closing brackets in the provided string.";
				}
				var str = "\ncode: " + code + "\nmsg: " + msg + (hint != "" ?  "\nhint: " + hint : "") + "\n\n";
				var err = new Error(str);
				err.code = code;
				err.msg = msg;
				err.hint = hint;
				err.lastBracket = last.bracketMissMatch.end;
				err.lastCriticalBracket = last.bracket.end;
				err.depth = last.depth;
				err.lastCriticalDepth = last.bracketDepth;
				err.toJSON = function(){
					last.code = this.code;
					last.msg = this.msg;
					last.hint = this.hint;
					return {
						code: this.code,
						msg: this.msg,
						hint: this.hint,
						lastBracket: this.lastBracket,
						lastCriticalBracket: this.lastCriticalBracket,
						depth: this.depth,
						lastCriticalDepth: this.lastCriticalDepth
					}
				}
				this.brackets = this.parentBrackets = pBrackets = cBrackets = undefined;
				this.clean();
				throw err;
			} else {
				this.working.unClosed = last;
				// we can effectively close the item off as it ignores closing
				if(this.autoComplete) this.working.finalize(true);
				this.result.push(this.working);
			}
		} else if (this.working.match){
			this.result.push(this.working);
		}
		this.brackets = this.parentBrackets = pBrackets = cBrackets = undefined;
		this.clean();
		return this.result;
	},
	clean(){
		pBrackets = cBrackets = missM = undefined;
	}
}
