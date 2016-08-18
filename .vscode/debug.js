var bracket = require("../");

 //var b = new bracket.Parser("a {b {c}", {ignoreMissMatch: "{"}); 

bracket("a {b \"{\" c}");
//bracket("a [b (c d {d]", {ignoreMissMatch: ["(", "{"]});
console.log("END");