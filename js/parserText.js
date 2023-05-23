let parserText=
`
{
  function arrayToString(array, integer){
    let text = "";
    for(let i=0;i<array.length;i++){
      text += array[i];
    }
    return text;
  }
  
  function removeCommaAndColon(head, tail){
    let returnArray = [head];
    for(let i=0;i<tail.length;i++){
      returnArray.push(tail[i][1]);
    }
    return returnArray;
  }
  
  function makeFlatInstructionArray(head, tail){
    let returnArray = [head];
    for(let i=0;i<tail.length;i++){
      returnArray.push(tail[i][0]);
      returnArray.push(tail[i][1]);
    }
    return returnArray;
  }
  
  function parseBoolOperation(head, tail){
    let flatArray = [head];
    for(let i=0;i<tail.length;i++){
      flatArray.push(tail[i][0]);
      flatArray.push(tail[i][1]);
    }
    if(flatArray.length==1){
      return flatArray[0];
    }
    let returnArray = [];
    for(let i=0;i<3;i++){
      returnArray.push(flatArray[i]);
    }
    for(let i=3;i<flatArray.length;i=i+2){
      returnArray = [{"kind":"bool_operation", "value":returnArray}];
      returnArray.push(flatArray[i]);
      returnArray.push(flatArray[i+1]);
    }
    return {"kind":"bool_operation", "value":returnArray};
  }
  
  function parseArithmeticOperation(head, tail){
    let returnArray = head;
    for(let i=0;i<tail.length;i++){
      returnArray.push(tail[i][0]);
      returnArray = returnArray.concat(tail[i][1]);
    }
    return {"kind":"arithmetic_operation", "value":returnArray};
  }
}

InstructionArray
  = head:Instruction tail:((";"/"||") Instruction)* { return makeFlatInstructionArray(head, tail); }

Instruction
  = "*(" instructionArray:InstructionArray ")" { return {"kind":"loop_instruction", "instruction_array":instructionArray}; }
  / head:Head "&&" guard:BoolOperation "->" body:Body { return {"kind":"instruction", "head":head, "guard":guard, "body":body}; }
  / head:Head "->" body:Body { return {"kind":"instruction", "head":head, guard:{"kind": "bool_operation", "value": true}, "body":body}; }
  / head:Head "&&" guard:BoolOperation "-*>" body:Body { return {"kind":"loop_instruction", "instruction_array":[{"kind":"instruction", "head":head, "guard":guard, "body":body}]}; }
  / head:Head "-*>" body:Body { return {"kind":"loop_instruction", "instruction_array":[{"kind":"instruction", "head":head, guard:{"kind": "bool_operation", "value": true}, "body":body}]}; }
  / body:Body { return {"kind":"instruction", "head":{"kind":"unordered_set", "value":[]}, guard:{"kind": "bool_operation", "value": true}, "body":body}; }
  
Head
  = head:Element tail:("," Element)* { return {"kind":"unordered_set", "value":removeCommaAndColon(head, tail)}; }
  / "" { return {"kind":"unordered_set", "value":[]}; }
  
Body
  = head:Element tail:("," Element)* { return {"kind":"unordered_set", "value":removeCommaAndColon(head, tail)}; }
  / "" { return {"kind":"unordered_set", "value":[]}; }

Element
  = UnorderedSet
  / OrderedSet
  / AbbreviationOrderedSet
  / Wrapping
  / BoolOperation
  / ArithmeticOperation
  / Literal
  / Variable
  / Context

NotAbbreviationElement
  = UnorderedSet
  / OrderedSet
  / Wrapping
  / ArithmeticOperation
  / BoolOperation
  / Literal
  / Variable
  / Context

UnorderedSet
  = "{}" {return {"kind":"unordered_set", "value":[]}; }
  / "{" head:Element tail:("," Element)* "}" { return {"kind":"unordered_set", "value":removeCommaAndColon(head, tail)}; }
  
OrderedSet
  = "[]" {return {"kind":"ordered_set", "value":[]}; }
  / "[" head:NotAbbreviationElement tail:(":" NotAbbreviationElement)* "]" { return {"kind":"ordered_set", "value":removeCommaAndColon(head, tail)}; }

AbbreviationOrderedSet
  = head:NotAbbreviationElement tail:(":" NotAbbreviationElement)+ { return {"kind":"ordered_set", "value":removeCommaAndColon(head, tail)}; }

Wrapping
  = "<" element:Element ">" { return {"kind":"wrapping", "value":element}; }

Literal
  = literal:Integer { return {"kind":"literal", "value":literal}; }
  / literal:String { return {"kind":"literal", "value":literal}; }

Variable
  = "@" string:String { return {"kind":"variable", "value":"@"+string} }
  
Context
  = "$" string:String { return {"kind":"context", "value":"$"+string} }

ArithmeticOperation
  = head:ArithmeticTerm tail:(("+"/"-"/"*"/"/") ArithmeticTerm)+ { return parseArithmeticOperation(head, tail); }
  / "(" head:ArithmeticTerm tail:(("+"/"-"/"*"/"/") ArithmeticTerm)+ ")" { return parseArithmeticOperation(head, tail); }

ArithmeticTerm
  = "(" arithmeticOperation:ArithmeticOperation ")" { return ["("].concat(arithmeticOperation.value.concat([")"])); }
  / integer:Integer { return [{"kind":"literal", "value":integer}]}
  / "(" integer:Integer ")" { return [{"kind":"literal", "value":integer}]}
  / variable:Variable { return [variable]; }
  / "(" variable:Variable ")" { return [variable]; }

ComparisionOperation
  =  comparisionTerm1:ComparisionTerm operator:("=="/"!="/">"/"<"/">="/"<=") comparisionTerm2:ComparisionTerm { return {"kind":"comparision_operation", "value":[comparisionTerm1, operator, comparisionTerm2]}; }

ComparisionTerm
  = ArithmeticOperation
  / Literal
  / Variable
  
BoolOperation
  = head:BoolFactor tail:(("&"/"|") BoolFactor)* { return parseBoolOperation(head, tail); }

BoolFactor
  = "(" boolOperation:BoolOperation ")" { return boolOperation; }
  / comparisonOperation:ComparisionOperation { return {"kind":"bool_operation", "value":comparisonOperation}; }
  / "true" { return {"kind":"bool_operation", "value":true}; }
  / "false" { return {"kind":"bool_operation", "value":false}; }

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }
  / "-" [0-9]+ { return parseInt(text(), 10); }

String
  = string:[a-z]i+ integer:[0-9]* {return arrayToString(string.concat(integer));}
  / string:[a-z]i* integer:[0-9]+ {return arrayToString(string.concat(integer));}
`;