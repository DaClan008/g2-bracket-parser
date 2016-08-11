"use strict";

var defaultBrackets = require("./defaultBrackets.json");
module.exports = brackets;
module.exports.Parser = Brackets;

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
function ResultSet(parentBrackets, childBrackets, multiParentBrackets, multiChildBrackets, index, ignoreInside, multiCharIgnore){
	// RESULTS
	// The index of the starting element for this object
	this.start = index || 0;
	// The current or last character's index in this object
	this.end = this.start;
	// The length of the current src string
	this.length = 0;
	// The complete source string that has been computed
	this.src = "";
	// The number of new lines or \n occurences in the src string
	this.lines = 1;
	// An object that resemble and has information of the matched criteria
	this.match = false;
	// A boolean indicating whether any of the children (or children's children) was calculated starting with a prefix
	this.prefixedChildren = false;

	// INTERNAL usage
	this.brkts = parentBrackets || {};
	this.brktsChild = childBrackets || {};
	this.multiCharBrkts = multiParentBrackets || [];
	this.multiCharBrktsChild = multiChildBrackets || [];
	this.ignoreInside = ignoreInside || {};
	this.multiCharIgnore = multiCharIgnore || [];

	this.ignS = "";
	this.ignLen = 0;
	this.ignore = false;

	this.pref = "";
	this.prefLen = 0;
}

ResultSet.prototype = {
	/**
	 * Calculate all the needed variables if the Match has completely run through (from bracket start to end).
	 */
	endMatch: function(){
		this.content += this.match.content;
		this.src += this.match.src;
		this.end += this.match.length;
		this.length = this.src.length;
		this.lines += this.match.lines -1;
		this.prefixedChildren = this.match.prefixedChildren;
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
				if(this.prefLen > 0 || this.ignLen > 0) this.endTemp();
				this.src += this.temp + char;
				this.end++;
				return false;
			}
			// Dealing with IGNORES
			if(this.ignore){
				// we should just add a char until we get to end
				if(this.ignore.end[this.ignLen] === char){
					// we are still matching see if it is complete match
					if(this.ignore.end === this.ignS + char){
						this.ignore = false;
					}
				} else if(this.ignLen > 0){
					// we could not continue matching end of ignore clear vars
					this.ignS = "";
					this.ignLen = 0;
				}
				this.src += char;
				this.end++;
				return false;
			} else {
				// see if ignore section has started
				var ignr = this.ignoreInside[this.ignS + char];
				if(ignr){
					this.ignore = this.ignoreInside[this.ignS + char];

					// set main vars
					this.src += this.pref + char;
					this.end += this.prefLen + 1;
									
					// clear values
					this.pref = this.ignS = "";
					this.prefLen = this.ignLen = 0;
					return false;
				} else {
					var found = false;
					for(var i = 0; i < this.multiCharIgnore.length; i++){
						if(this.multiCharIgnore[i][this.ignLen] === char){
							// partially matched ignore.
							if(this.ignLen === 0 || this.multiCharIgnore[i].indexOf(this.ignS) === 0){
								// we are still matching
								this.ignS += char;
								this.ignLen++;
								found = true;
								break;
							}
						}
					}
					if(!found && this.ignLen > 0){
						this.ignLen = 0;
						this.ignS = "";
					}
				}
			}

			// Dealing with OPENING Brackets
			var brkt = this.brkts[this.pref + char];
			if(brkt){
				// we now found a match
				this.match = new BRKChild(this.pref + char, this.end, brkt, this.brktsChild, this.multiCharBrktsChild, this.ignoreInside, this.multiCharIgnore);
				this.pref = this.ignS = "";
				this.prefLen = this.ignLen = 0;
				return false;
			} else {
				// might be an incomplete match
				for(var i = 0; i < this.multiCharBrkts.length; i++){
					if(this.multiCharBrkts[i][this.prefLen] === char){
						// confirm match
						if(this.multiCharBrkts[i].substr(0, this.prefLen) === this.pref){
							this.pref += char;
							this.prefLen++;
							return false;
						}
					}
				}
				if(this.prefLen > 0){
					// we found a partial match in the past, which now failed
					this.src += this.pref + char;
					this.end += this.prefLen + 1;
					this.prefLen = 0;
					this.pref = "";
				} else {
					// we have never found any match just continue
					this.src += char;
					this.end++;
				}
			}
		} else {
			// let CHILD deal with it
			if(this.match.addChar(char)){
				// The child has reached its closing bracket
				this.endMatch();
				return true;
			}
		}
		return false;
	},
	/**
	 * Returns the bracket information for the next closing bracket
	 * @return {object} if a bracket is open it will return an object containing the amount of opening brackets and the last opening bracket information, else null.
	 */
	workingBracket: function(){
		if(match){
			return match.getLastBracket();
		}else {
			return null;
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
function BRKChild(prefixedBracket, index, bracket, brackets, multiCharBrkts, ignoreInside, multiCharIgnore){
	// result values
	this.prefixedBracket = prefixedBracket || "";	// this include the bracket also
	this.src = this.prefix;
	this.content = "";
	this.lines = 1;
	// positions
	this.start = index;
	this.bracketStart = index + (bracket ? bracket.prefix ? bracket.prefix.length : 0 : 0);
	this.contentStart = index + this.prefixedBracket.length;
	this.end = this.contentStart;
	this.contentEnd = this.contentStart;
	// info
	this.bracket = bracket;
	this.children = [];
	this.isPrefixed = bracket ? bracket.prefix ? true : false : false;
	this.prefixedChildren = false;

	// internal use
	this.brkts = brackets;
	this.multiCharBrkts = multiCharBrkts;
	this.ignoreInside = ignoreInside || {};
	this.multiCharIgnore = multiCharIgnore || [];

	this.ignS = "";
	this.ignLen = 0;
	this.ignore = false;
	this.child = false;
	this.state = NONE;

	// calc variables
	this.endLen = 0;
	this.endS = "";
	this.preS = "";
	this.prefLen = 0;
	this.temp = "";
	this.tempAdded = false;
	this.endTemp = false;
}

BRKChild.prototype = {
	/**
	 * If temp variable is no longer needed, this will close the temp and add the correct values to the content variable if needed
	 * @param  {string} val A value that should not be added to the content yet as it will form part of this objects child element.
	 * @return {string}     The value object.
	 */
	endTemp: function(val){
		var add = val.length > 0 ? this.temp.substr(0, this.temp.length - val.length) : this.temp;
		this.content += add;
		this.contentEnd += add.length;
		
		// clear variables
		this.temp = this.preS = this.endS = "";
		this.prefLen = this.endLen = 0;
		return val;
	},
	/**
	 * Is called when the last closing bracket for this item has been found.
	 * This function finalise all the variables that needs to be returned
	 * @return {void}
	 */
	finalise: function(){
		this.src += this.content + this.bracket.end;
		this.end = this.contentEnd + this.bracket.end.length;
		this.length = this.end - this.start;
	},
	/**
	 * When a child's addChild has returned true it means that the child has sufficient closing brackets vs opening brackets and can now be closed.
	 * This function makes sure the child is added to children and all relevant variables are correctly updated.
	 * @return {void}
	 */
	endChild: function(){
		this.content += this.child.src;
		this.contentEnd += this.child.length;
		this.children.push(this.child);
		this.lines += this.child.lines -1;
		this.prefixedChildren = this.prefixedChildren || (this.child.isPrefixed || this.child.prefixedChildren);
		this.child = false;
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
				this.content += char;
				this.contentEnd++;
				return false;
			}

			// Dealing with IGNORES
			if(this.ignore){
				// we should just add a char until we get to end
				if(this.ignore.end[this.ignLen] === char){
					// we are still matching see if it is complete match
					if(this.ignore.end === this.ignS + char){
						this.ignore = false;
					}
				} else if(this.ignLen > 0){
					// we could not continue matching end of ignore clear vars
					this.ignS = "";
					this.ignLen = 0;
				}
				this.src += char;
				this.end++;
				return false;
			} else {
				// see if ignore section has started
				var ignr = this.ignoreInside[this.ignS + char];
				if(ignr){
					this.ignore = this.ignoreInside[this.ignS + char];

					// set main vars
					this.endTemp("");
					this.src += char;
					this.end++;
									
					// clear values
					this.ignS = "";
					this.ignLen = 0;
					return false;
				} else {
					var found = false;
					for(var i = 0; i < this.multiCharIgnore.length; i++){
						if(this.multiCharIgnore[i][this.ignLen] === char){
							// partially matched ignore.
							if(this.ignLen === 0 || this.multiCharIgnore[i].indexOf(this.ignS) === 0){
								// we are still matching
								this.ignS += char;
								this.ignLen++;
								found = true;
								break;
							}
						}
					}
					if(!found && this.ignLen > 0){
						this.ignLen = 0;
						this.ignS = "";
					}
				}
			}
			

			// see if we have an ENDING bracket
			if(char === this.bracket.end[this.endLen]){
				// we have a match
				this.endS += char;
				this.endLen++;
				this.temp += char;
				if(this.endS === this.bracket.end){
					// we have a complete match
					this.endTemp(this.endS);
					this.finalise();
					return true;
				}
			} else if (this.endLen > 0) {
				// we have previously found a partial end, but now ending has failed
				this.endS = "";
				this.endLen = 0;
				// we should add to content here, but a pattern could be similar to an open bracket... 
				// Only delete if pref check is not also active.
				if(this.prefLen === 0) this.endTemp("");
			}

			// see if it is OPENING of another bracket
            var brkt;
			if(brkt = this.brkts[this.preS + char]) {
				// we vound a new Opening bracket
				var bpref = this.endTemp(preS + char);
				this.child = new BRKChild(bpref, this.contentEnd, brkt, this.brkts, this.multiCharBrkts);
				return false;
			} else {
				// see if we have a partial opening bracket
				for(var i = 0; i < this.multiCharBrkts.length; i++){
					if(this.multiCharBrkts[i].length > 1 && 
						this.multiCharBrkts[i][this.prefLen] === char){
						// we have a match... see if we have complete match
						if(this.multiCharBrkts[i].substr(0,this.prefLen) === this.preS){
							this.preS += char;
							this.prefLen++;
							// if char is match to ending pattern. char has already been added to temp
							if(this.endLen === 0){
								this.temp += char;
							}
							return false;
						}
					}
				}
				if(this.prefLen > 0){
					// we previously had a partial match of opening bracket, but pattern failed before commpletion
					this.preS = "";
					this.prefLen = 0;
					if(this.endLen === 0) this.endTemp("");
					return false;
				}
			}
			// we got here with no match to starting or ending bracket
			this.content += char;
			this.contentEnd++;
			return false;
		} else {
			// let the child deal with it
			if(this.child.addChar(char)){
				// child has ended
				this.endChild();
			}
		}
	},
	/**
	 * returns an object of currently required ending bracket together with the depth of brackets required.
	 * @return {object} depth and bracket information of currently required closing bracket.
	 */
	getLastBracket: function(){
		if(this.child){
			var r = this.child.getLastBracket();
			r.depth++;
			return r;
		}
		return {
			depth: 1,
			bracket: this.bracket
		}
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
	if (typeof str !== 'string') {
	    throw new Error('Expected source code to be a string but got "' + (typeof str) + '"')
	}
	if (typeof options !== 'object') {
	    throw new Error('Expected "options" to be an object but got "' + (typeof options) + '"')
	}

	//Strip any UTF-8 BOM off of the start of `str`, if it exists.
	this.original = str.replace(/^\uFEFF/, '');
	this.start = options.start || 0;
	this.end = options.end || this.input.length -1;
	this.input = this.original.substr(start,end - start + 1);
	this.index = 0;
	this.bracketPrefix = options.prefix || "";
	this.prefixOption = options.prefixOption.toLowerCase() || "normal";
	this.ignoreMissMatch = options.ignoreMissMatch || false;

	// Working variables

	var ignores = options.ignoreInside || ['"', "'"];
	var brckts = options.brackets || ['[','(','{','"',"'","<"];
	
	this.brackets = {};
	this.bracketsChild = {};
	this.multiCharBrkts = [];
	this.multiCharBrktsChild = [];
	this.ignoreInside = {};
	this.multiCharIgnore = [];

	// initialize
	this.confirmBrackets(brckts);
	this.getMultiChars();
	this.buildIgnores(ignores);
	this.result = [];

	this.working = new ResultSet(this.brackets,this.bracketsChild, this.multiCharBrkts, 
		this.multiCharBrktsChild, this.start, this.ignoreInside, this.multiCharIgnore);
}

Brackets.prototype = {
	/**
	 * add bracket information to the brackets object.  The brackets contains all the opening and closing bracket information.
	 * @param {string} key   The key of the bracket
	 * @param {object} value Object containing all the relevant information for the bracket (i.e. opening and closing bracket)
	 */
	addBracket: function(key, value){
		if(!value || (typeof value !== "object") || key === "" || (typeof key !== "string")) return;
		
		if(this.bracketPrefix != ""){
			var prefKey = this.bracketPrefix + key,
				prefValue = value;
			prefValue.prefix = this.bracketPrefix;
			prefValue.length = this.bracketPrefix.length + key.length;

			if(this.prefixOption !== "abnormal") this.brackets[prefKey] = prefValue;
			else { this.brackets[key] = value; }

			if(this.prefixOption === "none" ){
				this.brackets[key] = value;
				this.bracketChild[key] = value;
			}

			if(this.prefixOption !== "normal"){
				this.bracketsChild[prefKey] = prefValue;
			} else{
				this.bracketChild[key] = value;
			}

			if(this.prefixOption === "childStrict"){
				this.brackets[key] = value;
			}

			if(this.prefixOption === "parentStrict"){
				this.bracketChild[key] = value;
			}
			
		} else {
			this.brackets[key] = value;
			this.bracketsChild[key] = value;
		}
	},
	/**
	 * Ensure that all the brackets to search through are included correctly in the brackets object
	 * @param  {string / object / array} brackets Bracket information is explained above.
	 */
	confirmBrackets: function(brackets){
		var type = (typeof brackets).toLowerCase();
		if(Array.isArray(brackets)) type = "array";

		switch(type){
			case "array":
				for(var i = 0; i < brackets.length; i++){
					var t = typeof brackets[i].toLowerCase();
					if(t === "string" || t === "object"){
						this.confirmBrackets(brackets[i]);
					}
				}
				break;
			case "string":
				if(defaultBrackets[brackets]){
					this.addBracket(brackets,defaultBrackets[brackets]);
				}
				break;
			case "object":
				for(var key in brackets){
					this.addBracket(key, brackets[key]);
				}
				break;
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
					var t = typeof ignores[i].toLowerCase();
					if(t === "string" || t === "object"){
						this.buildIgnores(ignores[i]);
					}
				}
				break;
			case "string":
				if(defaultBrackets[ignores]) this.ignoreInside[ignores] = defaultBrackets[ignores];
				else if(this.brackets[ignores]) this.ignoreInside[ignores] = this.brackets[ignores];
				else if(this.bracketsChild[ignores]) this.ignoreInside[ignores] = this.bracketsChild[ignores];
				else{
					this.ignoreInside[ignores] = {
						start: ignores,
						end: ignores,
						length: 1
					}
				}
				break;
			case "object":
				for(var key in ignores){
					this.ignoreInside[key] = ignores[key];
				}
				break;
			default:
				break;
		}
	},
	/**
	 * parse a list of strings where the brackets keys are longer than 1 character in length
	 */
	getMultiChars: function(){
		for(var key in this.brackets){
			if(key.length > 1) this.multiCharBrkts.push(key);
		}

		for(var key in this.bracketsChild){
			if(key.length > 1) this.multiCharBrktsChild.push(key);
		}
		for(var key in this.ignoreInside){
			if(key.length > 1) this.multiCharIgnore.push(key);
		}
	},
	/**
	 * The main function that itterates through all the characters in the input string and returns a resulting array of objects
	 */
	parse: function() {
        var char;
		while(char = this.input[index]){
			if(this.working.addchar(char)){
				this.result.push(this.working);
				this.index += this.working.end;
				this.src += this.working.src;
				this.working = new ResultSet(this.brackets,this.bracketsChild, 
					this.multiCharBrkts, this.multiCharBrktsChild, 
					this.start + this.index, this.ignoreInside, 
					this.multiCharIgnore);
			}
		}
		// we have now come to the end of the line
		if(this.working.match && !this.ignoreMissMatch){
			// we found an opening bracket but did not find closing bracket
			var last = this.working.workingBracket();
			var msg = "", code = "UNMATCHED_CLOSING_BRACKETS", hint = false;
			if(last){
				msg = "There are " + last.depth + " missing closing brackets.\n";
				hint += "The next missing closing bracket required is " + last.bracket.end + ".";
			} else{
				msg = "\tThere is an insufficient amount of closing brackets in the provided string.";
			}
			var str = "code:" + code + "\nmsg:" + msg + (hint ?  "\nhint:" + hint : "") + "\n\n\n";
			var err = new Error(str);
			err.code = code;
			err.msg = msg;
			err.hint = hint;
			err.toJSON = function(){
				return{
					code: this.code,
					msg: this.msg,
					hint: this.hint
				}
			}
			throw err;
		}
		return result;
	}
}
