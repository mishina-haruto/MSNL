function onRunButtonClick(){
    let input = document.getElementById("inputText");
    let inputText = input.value;
    let output = document.getElementById("outputText");
    myConsole("program execute");
    variableList = [];
    let result = execRandom(inputText);
    if(!Boolean(result)){
        output.style.border = "solid 3px red";
        output.textContent = "";
        myConsole("failure finish");
    }else{
        output.style.border = "solid 0px red";
        output.textContent = outputData(result);
        myConsole("success finish");
    }
}

function onExampleButtonClick(exampleIndex){
    document.getElementById("inputText").value = examples[exampleIndex];
    myConsole("open example" + exampleIndex);
}

let consoleText = "";
function myConsole(text){
    consoleText = consoleText + getTimeText() + "  " + text + "\n";
    let log = document.getElementById("log");
    log.textContent = consoleText;
    log.scrollTop = log.scrollHeight;
}

function getTimeText() {
    let now = new Date();
    var Hour = ("0" + now.getHours()).slice(-2);
    var Min = ("0" + now.getMinutes()).slice(-2);
    var Sec = ("0" + now.getSeconds()).slice(-2);
    return "[" + Hour + ":" + Min + ":" + Sec + "]";
}

function flatText(text){
    let newText = "";
    let commentOutFlag = false;
    while(text.length>0){
        if(!text.indexOf("//")){
            commentOutFlag = true;
            text = text.slice(2);
        }else if(!text.indexOf("\n")){
            commentOutFlag = false;
            text = text.slice(1);
        }
        if(commentOutFlag){
            text = text.slice(1);
        }else{
            newText = newText + text.slice(0,1);
            text = text.slice(1);
        }
    }
    return newText.replace(/\s+/g, "");
}

function lexicalAnalys(text){
    let targetWards = ["->", "-*>", "||", "&&", "*(", "(", ")", "{", "}", "[", "]", ";", "@", "$", ",", ":", "+", "-", "*", "/", "%", "==", "!=", "<=", ">=", "<", ">", "&", "|", '"'];
    let textArray =[];
    let word = "";
    while("" != text){
        let hit = false;
        for(let i=0;i<targetWards.length;i++){
            if(text.startsWith(targetWards[i])){
                if(""!=word){
                    textArray.push([false, word]);
                    word = ""
                }
                textArray.push([true, text.slice(0, targetWards[i].length)]);
                text = text.slice(targetWards[i].length)
                hit = true;
                break;
            }
        }
        if(false==hit){
            word = word + text.slice(0,1);
            text = text.slice(1)
        }
    }
    if(""!=word)textArray.push([false, word]);
    return textArray;
}

function parse(text){
    text = parseVariableAndContext(text);
    text = parseArithmeticOperation(text);
    text = parseComparativeOperation(text);
    text = parseGuard(text);
    text = parseInstruction(text);
    text = parseHeadAndBody(text);
    let [instructionControl, instructionList] = separateControlAndInstruction(text);
    instructionList = parseWrapping(instructionList);
    instructionList = parseBracket(instructionList);
    return [instructionControl, instructionList];
}

function parseVariableAndContext(textArray){
    let newTextArray = [];
    let literalFlag = false;
    let literal = '"';
    for(let i=0;i<textArray.length;i++){
        if(true==literalFlag){
            if('"'==textArray[i][1]){
                literal = literal + '"';
                newTextArray.push([false, literal]);
                literal = '"';
                literalFlag = false;
            }else{
                literal = literal + textArray[i][1];
            }
        }else if("@"==textArray[i][1]){
            if(false==textArray[i+1][0]){
                newTextArray.push(["variable", textArray[i][1]+textArray[i+1][1]]);
                i++;
            }else{
                console.log("error: no variable name");
            }
        }else if("$"==textArray[i][1]){
            if(false==textArray[i+1][0]){
                newTextArray.push(["context", textArray[i][1]+textArray[i+1][1]]);
                i++;
            }else{
                console.log("error: no context name");
            }
        }else{
            if('"'==textArray[i][1]){
                literalFlag = true;
            }else if(false==textArray[i][0]){
                if(!isNaN(Number(textArray[i][1]))){
                    newTextArray.push(["literal", Number(textArray[i][1])]);
                }else if("true"==textArray[i][1]){
                    newTextArray.push(["literal", true]);
                }else if("false"==textArray[i][1]){
                    newTextArray.push(["literal", false]);
                }else{
                    newTextArray.push(["literal", textArray[i][1]]);
                }
            }else if(true==textArray[i][0]){
                newTextArray.push(textArray[i]);
            }else{
                console.log("error: unknown elment");
            }
        }
    }
    if('"'!=literal){
        console.log('error: " is not closed');
    }
    return newTextArray;
}

function parseArithmeticOperation(textArray){
    let newTextArray = [];
    let state = 0;
    let arithmeticOperation = [];
    let parenthesesNum = 0;
    for(let i=0;i<textArray.length;i++){
        if(0==state){
            if("("==textArray[i][1]){
                arithmeticOperation.push(textArray[i]);
                parenthesesNum++;
                state = 0;
            }else if(true==textArray[i][0]){
                newTextArray = newTextArray.concat(arithmeticOperation);
                arithmeticOperation = [];
                parenthesesNum = 0;
                newTextArray.push(textArray[i]);
                state = 0;
            }else{
                arithmeticOperation.push(textArray[i]);
                state = 1;
            }
        }else if(1==state){
            if(")"==textArray[i][1]){
                arithmeticOperation.push(textArray[i]);
                parenthesesNum--;
                state = 1;
            }else if("+"==textArray[i][1] || "-"==textArray[i][1] || "*"==textArray[i][1] || "/"==textArray[i][1] || "%"==textArray[i][1]){
                arithmeticOperation.push(textArray[i]);
                state = 2;
            }else{
                newTextArray = newTextArray.concat(arithmeticOperation);
                arithmeticOperation = [];
                parenthesesNum = 0;
                newTextArray.push(textArray[i]);
                state = 0;
            }
        }else if(2==state){
            if("("==textArray[i][1]){
                arithmeticOperation.push(textArray[i]);
                parenthesesNum++;
                state = 2;
            }else if(true==textArray[i][0]){
                console.log("error: arithmetic operation is not completed");
                newTextArray = newTextArray.concat(arithmeticOperation);
                arithmeticOperation = [];
                newTextArray.push(textArray[i]);
                state = 0;
            }else{
                arithmeticOperation.push(textArray[i]);
                state = 3;
            }
        }else if(3==state){
            if(")"==textArray[i][1]){
                arithmeticOperation.push(textArray[i]);
                parenthesesNum--;
                state = 3;
            }else if("+"==textArray[i][1] || "-"==textArray[i][1] || "*"==textArray[i][1] || "/"==textArray[i][1] || "%"==textArray[i][1]){
                arithmeticOperation.push(textArray[i]);
                state = 2;
            }else{
                if(1==parenthesesNum && "("==arithmeticOperation[0][1]){
                    newTextArray.push(arithmeticOperation.shift());
                    parenthesesNum = 0;
                }
                if(-1==parenthesesNum && ")"==arithmeticOperation[arithmeticOperation.length-1][1]){
                    newTextArray.push(arithmeticOperation.pop());
                    parenthesesNum = 0;
                }
                if(parenthesesNum!=0){
                    console.log("error: parentheses are not closed");
                }
                arithmeticOperation.unshift("arithmetic operation");
                newTextArray.push(arithmeticOperation);
                arithmeticOperation = [];
                parenthesesNum = 0;
                newTextArray.push(textArray[i]);
                state = 0;
            }
        }
    }
    if(3==state){
        arithmeticOperation.unshift("arithmetic operation");
        newTextArray.push(arithmeticOperation);
    }else{
        newTextArray = newTextArray.concat(arithmeticOperation);
    }
    return newTextArray;
}

function parseComparativeOperation(textArray){
    let newTextArray = [];
    let state = 0;
    let comparativeOperation = [];
    let parenthesesNum = 0;
    for(let i=0;i<textArray.length;i++){
        if(0==state){
            if("("==textArray[i][1]){
                comparativeOperation.push(textArray[i]);
                parenthesesNum++;
                state = 0;
            }else if(true==textArray[i][0]){
                newTextArray = newTextArray.concat(comparativeOperation);
                comparativeOperation = [];
                parenthesesNum = 0;
                newTextArray.push(textArray[i]);
                state = 0;
            }else{
                comparativeOperation.push(textArray[i]);
                state = 1;
            }
        }else if(1==state){
            if(")"==textArray[i][1]){
                comparativeOperation.push(textArray[i]);
                parenthesesNum--;
                state = 1;
            }else if("=="==textArray[i][1] || "!="==textArray[i][1] || ">"==textArray[i][1] || "<"==textArray[i][1] || "<="==textArray[i][1] || ">="==textArray[i][1] || "&"==textArray[i][1] || "|"==textArray[i][1]){
                comparativeOperation.push(textArray[i]);
                state = 2;
            }else{
                newTextArray = newTextArray.concat(comparativeOperation);
                comparativeOperation = [];
                parenthesesNum = 0;
                newTextArray.push(textArray[i]);
                state = 0;
            }
        }else if(2==state){
            if("("==textArray[i][1]){
                comparativeOperation.push(textArray[i]);
                parenthesesNum++;
                state = 2;
            }else if(true==textArray[i][0]){
                newTextArray = newTextArray.concat(comparativeOperation);
                comparativeOperation = [];
                newTextArray.push(textArray[i]);
                state = 0;
            }else{
                comparativeOperation.push(textArray[i]);
                state = 3;
            }
        }else if(3==state){
            if(")"==textArray[i][1]){
                comparativeOperation.push(textArray[i]);
                parenthesesNum--;
                state = 3;
            }else if("=="==textArray[i][1] || "!="==textArray[i][1] || ">"==textArray[i][1] || "<"==textArray[i][1] || "<="==textArray[i][1] || ">="==textArray[i][1] || "&"==textArray[i][1] || "|"==textArray[i][1]){
                comparativeOperation.push(textArray[i]);
                state = 2;
            }else{
                if(1==parenthesesNum && "("==comparativeOperation[0][1]){
                    newTextArray.push(comparativeOperation.shift());
                    parenthesesNum = 0;
                }
                if(-1==parenthesesNum && ")"==comparativeOperation[comparativeOperation.length-1][1]){
                    newTextArray.push(comparativeOperation.pop());
                    parenthesesNum = 0;
                }
                if(parenthesesNum!=0){
                    console.log("error: parentheses are not closed")
                }
                comparativeOperation.unshift("comparative operation");
                newTextArray.push(comparativeOperation);
                comparativeOperation = [];
                parenthesesNum = 0;
                newTextArray.push(textArray[i]);
                state = 0;
            }
        }
    }
    newTextArray = newTextArray.concat(comparativeOperation);
    return newTextArray;
}

function parseGuard(textArray){
    let newTextArray = [];
    let guardFlag = false;
    let guard = ["guard"];
    for(let i=0;i<textArray.length;i++){
        if("&&"==textArray[i][1]){
            guardFlag = true;
        }else if(true==guardFlag){
            if("->"==textArray[i][1] || "-*>"==textArray[i][1]){
                newTextArray.push(guard);
                guard = ["guard"];
                newTextArray.push(textArray[i]);
                guardFlag = false;
            }else if(";"==textArray[i][1] || "||"==textArray[i][1]){
                console.log("error: no body");
            }else{
                if(true==textArray[i][1] || false==textArray[i][1]){
                    guard.push(["comparative operation", textArray[i]]);
                }else{
                    guard.push(textArray[i]);
                }
            }
        }else{
            newTextArray.push(textArray[i]);
        }
    }
    return newTextArray;
}

function parseInstruction(textArray){
    newTextArray = [];
    instruction = ["instruction"];
    targetWards = [";", "||", "*(", ")"];
    for(let i=0;i<textArray.length;i++){
        let hit = false;
        for(let j=0;j<targetWards.length;j++){
            if(textArray[i][1]==targetWards[j]){
                hit = true;
                break;
            }
        }
        if(hit){
            if(instruction.length>1){
                newTextArray.push(instruction);
                instruction = ["instruction"];
                newTextArray.push(textArray[i]);
            }else{
                newTextArray.push(textArray[i]);
            }
        }else{
            instruction.push(textArray[i]);
        }
    }
    if(!array_equal(instruction, ["instruction"])){
        newTextArray.push(instruction);
    }
    return newTextArray;
}

function parseHeadAndBody(textArray){
    let newTextArray = [];
    for(let i=0;i<textArray.length;i++){
        if("instruction"==textArray[i][0]){
            let instruction = ["instruction", ["unordered set"], ["guard", ["comparative operation", ["literal", true]]], ["unordered set"]];
            let arrow = false;
            let state = 1;
            for(let j=1;j<textArray[i].length;j++){
                if(1==state){
                    if("guard" == textArray[i][j][0]){
                        instruction[2] = textArray[i][j];
                    }else if("-*>" == textArray[i][j][1]){
                        arrow = "loop";
                        state = 3;
                    }else if("->" == textArray[i][j][1]){
                        arrow = true;
                        state = 3;
                    }else{
                        instruction[1].push(textArray[i][j]);
                    }
                }else if(3==state){
                    instruction[3].push(textArray[i][j]);
                }
            }
            if(false==arrow){
                instruction[3] = instruction[1];
                instruction[1] = ["unordered set"];
            }
            if("loop"==arrow){
                newTextArray.push([true,"*("]);
            }
            newTextArray.push(instruction);
            if("loop"==arrow){
                newTextArray.push([true, ")"]);
            }
        }else{
            newTextArray.push(textArray[i]);
        }
    }
    return newTextArray;
}

function separateControlAndInstruction(textArray){
    let instructionControl = [];
    let instructionList = [];
    for(let i=0;i<textArray.length;i++){
        if("instruction"==textArray[i][0]){
            instructionControl.push(instructionList.length);
            let instructionTemp = textArray[i];
            instructionTemp[0] = "instruction: " + instructionList.length;
            instructionList.push(instructionTemp);
        }else{
            instructionControl.push(textArray[i][1]);
        }
    }
    return [instructionControl, instructionList];
}

function parseWrapping(instructionList){
    let newInstructionList = [];
    for(let i=0;i<instructionList.length;i++){
        let newInstruction = [];
        newInstruction.push(instructionList[i][0]);
        let head = findWrapping(instructionList[i][1]);
        let newHead = ["unordered set"];
        let wrappingHead = [];
        let wrappingFlag = false;
        for(let j=1;j<head.length;j++){
            if(false==wrappingFlag){
                if(array_equal(["wrapping", "<"], head[j])){
                    wrappingFlag = true;
                }else if(array_equal(["wrapping", ">"], head[j])){
                    console.log("error: wrapping is not closed");
                }else{
                    newHead.push(head[j]);
                }
            }else if(true==wrappingFlag){
                if(array_equal(["wrapping", ">"], head[j])){
                    wrappingFlag = false;
                }else if(array_equal(["wrapping", "<"], head[j])){
                    console.log("error: wrapping is not closed");
                }else{
                    newHead.push(head[j]);
                    wrappingHead.push(head[j]);
                }
            }
        }
        if(newHead.length>1){
            newHead.push([true, ","]);
        }
        newHead.push(["context", "$$context"]);
        newInstruction.push(newHead);
        newInstruction.push(instructionList[i][2]);
        let body = findWrapping(instructionList[i][3]);
        if(body.length>1 && wrappingHead.length>0){
            body.push([true, ","]);
        }
        body = body.concat(wrappingHead);
        if(body.length>1){
            body.push([true, ","]);
        }
        body.push(["context", "$$context"]);
        newInstruction.push(body);
        newInstructionList.push(newInstruction);
    }
    return newInstructionList;
}

function findWrapping(unorderedSet){
    let newUnorderedSet = ["unordered set"];
    if(unorderedSet.length>1){
        let wrappingNum = 0;
        if("<"==unorderedSet[1][1]){
            newUnorderedSet.push(["wrapping", "<"]);
            wrappingNum++;
        }else if(">"==unorderedSet[1][1]){
            console.log("error: wrapping is not closed");
            newUnorderedSet.push(unorderedSet[1]);
        }else{
            newUnorderedSet.push(unorderedSet[1]);
        }
        for(let j=2;j<unorderedSet.length-1;j++){
            let prev = unorderedSet[j-1];
            let target = unorderedSet[j];
            let next = unorderedSet[j+1];
            if(true==prev[0] && "<"==target[1]){
                newUnorderedSet.push(["wrapping", "<"]);
                wrappingNum++;
            }else if(true==next[0] && ">"==target[1]){
                newUnorderedSet.push(["wrapping", ">"]);
                wrappingNum--;
            }else{
                newUnorderedSet.push(unorderedSet[j]);
            }
        }
        if(unorderedSet.length>2){
            if(">"==unorderedSet[unorderedSet.length-1][1]){
                newUnorderedSet.push(["wrapping", ">"]);
                wrappingNum--;
            }else if("<"==unorderedSet[unorderedSet.length-1][1]){
                console.log("error: wrapping is not closed");
                newUnorderedSet.push(unorderedSet[unorderedSet.length-1]);
            }else{
                newUnorderedSet.push(unorderedSet[unorderedSet.length-1]);
            }
        }
        if(0!=wrappingNum){
            console.log("error: wrapping is not closed");
        }
    }
    return newUnorderedSet;
}

function parseBracket(instructionList){
    let newInstructionList = [];
    for(let i=0;i<instructionList.length;i++){
        let newInstruction = [];
        newInstruction.push(instructionList[i][0]);
        let head = findBracket(instructionList[i][1]);
        head = parseNest(head);
        head = removeCommaAndColon(head);
        newInstruction.push(head);
        newInstruction.push(instructionList[i][2]);
        let body = findBracket(instructionList[i][3]);
        body = parseNest(body);
        body = removeCommaAndColon(body);
        newInstruction.push(body);
        newInstructionList.push(newInstruction);
    }
    return newInstructionList;
}

function findBracket(unorderedSet){
    let newUnorderedSet = [];
    let squareBracketsIndex = 0;
    let curlyBracketsIndex = 0;
    let angleBracketsIndex = 0;
    let squareBracketsStack = [];
    let curlyBracketsStack = [];
    let angleBracketsStack = [];
    for(let i=0;i<unorderedSet.length;i++){
        if("["==unorderedSet[i][1]){
            unorderedSet[i][0] = "square brackets";
            squareBracketsStack.push(squareBracketsIndex);
            unorderedSet[i][1] = squareBracketsIndex;
            squareBracketsIndex++;
        }else if("{"==unorderedSet[i][1]){
            unorderedSet[i][0] = "curly brackets";
            curlyBracketsStack.push(curlyBracketsIndex);
            unorderedSet[i][1] = curlyBracketsIndex;
            curlyBracketsIndex++;
        }else if("<"==unorderedSet[i][1]){
            unorderedSet[i][0] = "angle brackets";
            angleBracketsStack.push(angleBracketsIndex);
            unorderedSet[i][1] = angleBracketsIndex;
            angleBracketsIndex++;
        }else if("]"==unorderedSet[i][1]){
            unorderedSet[i][0] = "square brackets";
            unorderedSet[i][1] = squareBracketsStack.pop();
        }else if("}"==unorderedSet[i][1]){
            unorderedSet[i][0] = "curly brackets";
            unorderedSet[i][1] = curlyBracketsStack.pop();
        }else if(">"==unorderedSet[i][1]){
            unorderedSet[i][0] = "angle brackets";
            unorderedSet[i][1] = angleBracketsStack.pop();
        }
        newUnorderedSet.push(unorderedSet[i]);
    }
    if(0!=squareBracketsStack.length){
        console.log("error: ordered set is not closed");
    }
    if(0!=curlyBracketsStack.length){
        console.log("error: unordered set is not closed");
    }
    if(0!=angleBracketsStack.length){
        console.log("wrapping is not closed");
    }
    return newUnorderedSet;
}

function parseNest(unorderedSet){
    let newUnorderedSet = [unorderedSet[0]];
    let targetBracket = false;
    let targetSet = [];
    for(let i=1;i<unorderedSet.length;i++){
        if(false==targetBracket){
            if("square brackets"==unorderedSet[i][0]){
                targetSet = ["ordered set"];
                targetBracket = unorderedSet[i];
            }else if("curly brackets"==unorderedSet[i][0]){
                targetSet = ["unordered set"];
                targetBracket = unorderedSet[i];
            }else if("angle brackets"==unorderedSet[i][0]){
                targetSet = ["wrapping"];
                targetBracket = unorderedSet[i];
            }else{
                newUnorderedSet.push(unorderedSet[i]);
            }
        }else{
            if(array_equal(targetBracket, unorderedSet[i])){
                newUnorderedSet.push(parseNest(targetSet));
                targetBracket = false;
            }else{
                targetSet.push(unorderedSet[i]);
            }
        }
    }
    return newUnorderedSet;
}

function removeCommaAndColon(unorderedSet){
    let newSet;
    if("unordered set"==unorderedSet[0]){
        newSet = ["unordered set"];
        let orderedSetFlag = false;
        let elements = [];
        for(let i=1;i<unorderedSet.length;i++){
            if(","==unorderedSet[i][1]){
                if(false==orderedSetFlag){
                    newSet = newSet.concat(elements);
                    elements = [];
                }else if(true==orderedSetFlag){
                    newSet.push(elements);
                    elements = [];
                    orderedSetFlag = false;
                }
            }else if(":"==unorderedSet[i][1]){
                if(false==orderedSetFlag){
                    elements.unshift("ordered set");
                    orderedSetFlag = true;
                }
            }else{
                elements.push(removeCommaAndColon(unorderedSet[i]));
            }
        }
        if(false==orderedSetFlag){
            newSet = newSet.concat(elements);
        }else if(true==orderedSetFlag){
            newSet.push(elements);
        }
    }else if("ordered set"==unorderedSet[0]){
        newSet = ["ordered set"];
        for(let i=1;i<unorderedSet.length;i++){
            if(":"!=unorderedSet[i][1]){
                newSet.push(removeCommaAndColon(unorderedSet[i]));
            }
        }
    }else if("wrapping"==unorderedSet[0]){
        newSet = ["wrapping"];
        if(unorderedSet.length==2){
            newSet.push(removeCommaAndColon(unorderedSet[1]));
        }else{
            let orderedSet = ["ordered set"];
            for(let i=1;i<unorderedSet.length;i++){
                orderedSet.push(unorderedSet[i]);
            }
            newSet.push(removeCommaAndColon(orderedSet));
        }
    }else{
        newSet = unorderedSet;
    }
    return newSet;
}

function matching(data, head){
    if("literal"==head[0]){
        if("literal"!=data[0]){
            return false;
        }
        if(data[1]==head[1]){
            return [[]];
        }else{
            return false;
        }
    }else if("arithmetic operation"==head[0]){
        if("literal"==data[0]){
            return [[["evaluation", ["comparative operation", head, [true, "=="], data]]]];
        }else{
            return false;
        }
    }else if("comparative operation"==head[0]){
        if(true==data[1]){
            let evaluation = ["evaluation"];
            for(let i=1;i<head.length;i++){
                evaluation.push(head[i]);
            }
            return [[evaluation]];
        }else if(false==data[1]){
            let evaluation = ["evaluation"];
            evaluation.push([true, "!"]);
            evaluation.push([true, "("]);
            for(let i=1;i<head.length;i++){
                evaluation.push(head[i]);
            }
            evaluation.push([true, ")"]);
            return [[evaluation]];
        }else{
            return false;
        }
    }else if("variable"==head[0]){
        if("wrapping"==data[0]){
            return false;
        }else{
            return [[["replace", head, data]]];
        }
    }else if("context"==head[0]){
        return [[["replace", head, data]]];
    }else if("ordered set"==head[0]){
        if("ordered set"!=data[0]){
            return false;
        }
        let dataNum = data.length-1;
        let contextNum = 0;
        let notContextNum = 0;
        for(let i=1;i<head.length;i++){
            if("context"==head[i][0]){
                contextNum++;
            }else{
                notContextNum++;
            }
        }
        if(dataNum<notContextNum){
            return false;
        }
        if(contextNum>2){
            console.log("error: contains 3 contexts");
        }
        let headPattarn;
        if(0==contextNum){
            if(dataNum!=notContextNum){
                return false;
            }
            headPattarn = [head];
        }else if(1==contextNum){
            let newHead = ["ordered set"];
            for(let i=1;i<head.length;i++){
                if("context"==head[i][0]){
                    newHead.push([dataNum-notContextNum, head[i][1]]);
                }else{
                    newHead.push(head[i]);
                }
            }
            headPattarn = [newHead];
        }else if(2==contextNum){
            headPattarn = [];
            for(let i=0;i<=dataNum-notContextNum;i++){
                let newHead = ["ordered set"];
                let contextCount = 0;
                for(let j=1;j<head.length;j++){
                    if("context"==head[j][0]){
                        if(0==contextCount){
                            newHead.push([i, head[j][1]]);
                            contextCount = 1;
                        }else if(1==contextCount){
                            newHead.push([dataNum-notContextNum-i, head[j][1]]);
                        }
                    }else{
                        newHead.push(head[j]);
                    }
                }
                headPattarn.push(newHead);
            }
        }
        let theta = [];
        for(let i=0;i<headPattarn.length;i++){            
            let thetaPattarn = [[]];
            let k = 1;
            for(let j=1;j<headPattarn[i].length;j++){
                if(!isNaN(headPattarn[i][j][0])){
                    let orderedSet = ["ordered set"];
                    for(let l=0;l<headPattarn[i][j][0];l++){
                        orderedSet.push(data[k]);
                        k++;
                    }
                    let addedThetaPattarn = matching(orderedSet, ["context", headPattarn[i][j][1]]);
                    thetaPattarn = addThetaPattarn(thetaPattarn, addedThetaPattarn);
                }else{
                    let addedThetaPattarn = matching(data[k], headPattarn[i][j]);
                    if(!Boolean(addedThetaPattarn)){
                        thetaPattarn = [];
                        break;
                    }else{
                        thetaPattarn = addThetaPattarn(thetaPattarn, addedThetaPattarn);
                    }
                    k++;
                }
            }
            theta = theta.concat(thetaPattarn);
        }
        if(theta.length>0){
            return theta;
        }
        return false;
    }else if("unordered set"==head[0]){
        if("unordered set"!=data[0]){
            return false;
        }
        let dataNum = data.length-1;
        let contextNum = 0;
        let notContextNum = 0;
        for(let i=1;i<head.length;i++){
            if("context"==head[i][0]){
                contextNum++;
            }else{
                notContextNum++;
            }
        }
        if(dataNum<notContextNum){
            return false;
        }
        if(contextNum>2){
            console.log("error: contains 3 contexts");
        }
        let headPattarn;
        if(0==contextNum){
            if(dataNum!=notContextNum){
                return false;
            }
            headPattarn = [head];
        }else if(1==contextNum){
            let newHead = ["unordered set"];
            for(let i=1;i<head.length;i++){
                if("context"==head[i][0]){
                    newHead.push([dataNum-notContextNum, head[i][1]]);
                }else{
                    newHead.push(head[i]);
                }
            }
            headPattarn = [newHead];
        }else if(2==contextNum){
            headPattarn = [];
            for(let i=0;i<=dataNum-notContextNum;i++){
                let newHead = ["ordered set"];
                let contextCount = 0;
                for(let j=1;j<head.length;j++){
                    if("context"==head[j][0]){
                        if(0==contextCount){
                            newHead.push([i, head[j][1]]);
                            contextCount = 1;
                        }else if(1==contextCount){
                            newHead.push([dataNum-notContextNum-i, head[j][1]]);
                        }
                    }else{
                        newHead.push(head[j]);
                    }
                }
                headPattarn.push(newHead);
            }
        }
        let dataPattarn = [];
        for(let i=1;i<data.length;i++){
            dataPattarn.push(data[i]);
        }
        dataPattarn = calculationPermutation(dataPattarn);
        for(let i=0;i<dataPattarn.length;i++){
            dataPattarn[i].unshift("unordered set");
        }
        let theta = [];
        for(let i=0;i<dataPattarn.length;i++){
            for(let j=0;j<headPattarn.length;j++){            
                let thetaPattarn = [[]];
                let l = 1;
                for(let k=1;k<headPattarn[j].length;k++){
                    if(!isNaN(headPattarn[j][k][0])){
                        let unorderedSet = ["unordered set"];
                        for(let m=0;m<headPattarn[j][k][0];m++){
                            unorderedSet.push(dataPattarn[i][l]);
                            l++;
                        }
                        let addedThetaPattarn = matching(unorderedSet, ["context", headPattarn[j][k][1]]);
                        thetaPattarn = addThetaPattarn(thetaPattarn, addedThetaPattarn);
                    }else{
                        let addedThetaPattarn = matching(dataPattarn[i][l], headPattarn[j][k]);
                        if(!Boolean(addedThetaPattarn)){
                            thetaPattarn = [];
                            break;
                        }else{
                            thetaPattarn = addThetaPattarn(thetaPattarn, addedThetaPattarn);
                        }
                        l++;
                    }
                }
                theta = theta.concat(thetaPattarn);
            }
        }
        if(theta.length>0){
            return theta;
        }
        return false;
    }
}

let variableList = [];
function checkEqual(data1, data2){
    if("literal"==data1[0]){
        if("literal"!=data2[0]){
            return false;
        }
        if(data1[1]==data2[1]){
            return true;
        }else{
            return false;
        }
    }else if("variable"==data1[0]){
        if("variable"!=data2[0]){
            return false;
        }
        let target = false;
        for(let i=0;i<variableList.length;i++){
            if(data1[1]==variableList[i][0]){
                target = variableList[i][1];
            }
        }
        if(false!=target){
            if(data2[1]==target){
                return true;
            }else{
                return false;
            }
        }
        for(let i=0;i<variableList.length;i++){
            if(data2[1]==variableList[i][1]){
                target = variableList[i][0];
            }
        }
        if(false!=target){
            if(data1[1]==target){
                return true;
            }else{
                return false;
            }
        }
        variableList.push([data1[1], data2[1]]);
        return true;
    }else if("ordered set"==data1[0]){
        if("ordered set"!=data2[0]){
            return false;
        }
        if(data1.length!=data2.length){
            return false;
        }
        for(let i=1;i<data1.length;i++){
            if(!checkEqual(data1[i], data2[i])){
                return false;
            }
        }
        return true;
    }else if("unordered set"==data1[0]){
        if("unordered set"!=data2[0]){
            return false;
        }
        if(data1.length!=data2.length){
            return false;
        }
        let data1Pattarn = [];
        for(let i=1;i<data1.length;i++){
            data1Pattarn.push(data1[i]);
        }
        data1Pattarn = calculationPermutation(data1Pattarn);
        for(let i=0;i<data1Pattarn.length;i++){
            data1Pattarn[i].unshift("unordered set");
        }
        for(let i=0;i<data1Pattarn.length;i++){
            let match = true;
            for(let j=1;j<data1Pattarn[i].length;j++){
                if(!checkEqual(data1Pattarn[i][j], data2[j])){
                    match = false;
                }
            }
            if(match){
                return true;
            }
        }
        return false;
    }
}

function addThetaPattarn(thetaPattarn, theta){
    let newThetaPattarn = [];
    for(let i=0;i<thetaPattarn.length;i++){
        let myThetaPattarn = thetaPattarn[i];
        for(let j=0;j<theta.length;j++){
            let myTheta = theta[j];
            newThetaPattarn.push(myThetaPattarn.concat(myTheta));
        }
    }
    return newThetaPattarn;
}

function applyInstructionRandom(data, instruction){
    let newDataPattarn = applyInstruction(data, instruction);
    if(!Boolean(newDataPattarn)){
        return false;
    }
    var randomSelect = Math.floor( Math.random() * newDataPattarn.length);
    return newDataPattarn[randomSelect];
}

function applyInstruction(data, instruction){
    let result = matching(data, instruction[1]);
    if(!Boolean(result)){
        return false;
    }
    for(let i=0;i<result.length;i++){
        let evaluation = ["evaluation"];
        for(let j=1;j<instruction[2].length;j++){
            evaluation.push(instruction[2][j])
        }
        result[i].push(evaluation);
    }
    let pattarn = [];
    for(let i=0;i<result.length;i++){
        let evaluation = [];
        let replace = [];
        for(let j=0;j<result[i].length;j++){
            if("evaluation"==result[i][j][0]){
                let myEvaluation = ["comparative operation"];
                for(let k=1;k<result[i][j].length;k++){
                    if("comparative operation"==result[i][j][k][0]){
                        for(let l=1;l<result[i][j][k].length;l++){
                            myEvaluation.push(result[i][j][k][l]);
                        }
                    }else{
                        myEvaluation.push(result[i][j][k]);
                    }
                }
                evaluation.push(myEvaluation);
            }else if("replace"==result[i][j][0]){
                replace.push([result[i][j][1], result[i][j][2]]);
            }
        }
        pattarn.push([evaluation, replace]);
    }
    let dataPattarn = [];
    for(let i=0;i<pattarn.length;i++){
        if(checkEvaluation(pattarn[i][0], pattarn[i][1])){
            dataPattarn.push(replaceBody(instruction[3], pattarn[i][1]));
        }
    }
    /*
    console.log("start check equal");
    dataPattarn = dataPattarn.reverse();
    let newDataPattarn = [];
    for(let i=0;i<dataPattarn.length;i++){
        let hit = false;
        for(let j=i+1;j<dataPattarn.length;j++){
            variableList = [];
            if(checkEqual(dataPattarn[i], dataPattarn[j])){
                hit = true;
            }
        }
        if(!hit){
            newDataPattarn.push(dataPattarn[i]);
        }
    }
    dataPattarn = newDataPattarn;
    console.log("finish check equal");
    */
    if(dataPattarn.length==0){
        return false;
    }else{
        return dataPattarn;
    }
}

function checkEvaluation(evaluation, replace){
    let newReplace = []
    for(let i=0;i<replace.length;i++){
        let hit = false;
        for(let j=0;j<newReplace.length;j++){
            if(array_equal(replace[i][0], newReplace[j][0])){
                if(array_equal(replace[i][1], newReplace[j][1])){
                    hit = true;
                    break;
                }else{
                    return false;
                }
            }
        }
        if(!hit){
            newReplace.push(replace[i]);
        }
    }
    replace = newReplace;
    for(let i=0;i<evaluation.length;i++){
        let comparativeOperation = [];
        for(let j=1;j<evaluation[i].length;j++){
            if("arithmetic operation"==evaluation[i][j][0]){
                let arithmeticOperation = "";
                for(let k=1;k<evaluation[i][j].length;k++){
                    let hit = false;
                    for(let l=0;l<replace.length;l++){
                        if(array_equal(evaluation[i][j][k], replace[l][0])){
                            arithmeticOperation = arithmeticOperation + replace[l][1][1];
                            hit = true;
                        }
                    }
                    if(!hit){
                        arithmeticOperation = arithmeticOperation + evaluation[i][j][k][1];
                    }
                }
                try{
                    arithmeticOperation = convertToCalcResult(arithmeticOperation);
                }catch(e){
                    return false;
                }
                comparativeOperation.push(["literal", arithmeticOperation]);
            }else{
                let hit = false;
                for(let k=0;k<replace.length;k++){
                    if(array_equal(evaluation[i][j], replace[k][0])){
                        comparativeOperation.push(replace[k][1]);
                        hit = true;
                        break;
                    }
                }
                if(!hit){
                    comparativeOperation.push(evaluation[i][j]);
                }
            }
        }
        if(!calcComparativeOperation(comparativeOperation)){
            return false;
        }
    }
    return true;
}

function calcComparativeOperation(comparativeOperation){
    let newComparativeOperation = [];
    let comparativeOperationType = false;
    let hasParentheses = false;
    let parenthesesNum = 0;
    let myComparativeOperation = [];
    for(let i=0;i<comparativeOperation.length;i++){
        if("&"==comparativeOperation[i][1]){
            if("|"==comparativeOperationType){
                console.log("error: & and | are mixed");
            }else{
                comparativeOperationType = "&";
            }
            newComparativeOperation.push(calcComparativeOperation(myComparativeOperation));
            myComparativeOperation = [];
        }else if("|"==comparativeOperation[i][1]){
            if("&"==comparativeOperationType){
                console.log("error: & and | are mixed");
            }else{
                comparativeOperationType = "|";
            }
            newComparativeOperation.push(calcComparativeOperation(myComparativeOperation));
            myComparativeOperation = [];
        }else if("("==comparativeOperation[i][1]){
            hasParentheses = true;
            if(parenthesesNum>0){
                myComparativeOperation.push(comparativeOperation[i]);
            }
            parenthesesNum++;
        }else if(")"==comparativeOperation[i][1]){
            parenthesesNum--;
            if(parenthesesNum>0){
                myComparativeOperation.push(comparativeOperation[i]);
            }else if(parenthesesNum<0){
                console.log("error: parentheses are not closed");
            }
        }else if("!"==comparativeOperation[i][1]){
            newComparativeOperation.push("!");
        }else{
            myComparativeOperation.push(comparativeOperation[i]);
        }
    }
    if("&"==comparativeOperationType || "|"==comparativeOperationType || hasParentheses){
        newComparativeOperation.push(calcComparativeOperation(myComparativeOperation));
        comparativeOperation = newComparativeOperation;
        newComparativeOperation = [];
        let inversionFlag = false;
        for(let i=0;i<comparativeOperation.length;i++){
            if("!"==comparativeOperation[i]){
                inversionFlag = true;
            }else if(true==comparativeOperation[i]){
                if(inversionFlag){
                    newComparativeOperation.push(false);
                    inversionFlag = false;
                }else{
                    newComparativeOperation.push(true);
                }
            }else if(false==comparativeOperation[i]){
                if(inversionFlag){
                    newComparativeOperation.push(true);
                    inversionFlag = false;
                }else{
                    newComparativeOperation.push(false);
                }
            }else{
                console.log("error: comparative operation is not completed");
                newComparativeOperation.push(comparativeOperation[i]);
            }
        }
        if("&"==comparativeOperationType){
            for(let i=0;i<newComparativeOperation.length;i++){
                if(false==newComparativeOperation[i]){
                    return false;
                }
            }
            return true;
        }else if("|"==comparativeOperationType){
            for(let i=0;i<newComparativeOperation.length;i++){
                if(true==newComparativeOperation[i]){
                    return true;
                }
            }
            return false;
        }else{
            if(inversionFlag){
                inversionFlag = false;
                return !newComparativeOperation[0];
            }else{
                return newComparativeOperation[0];
            }
        }
    }else{
        if(1==myComparativeOperation.length){
            if(true==myComparativeOperation[0][1]){
                return true;
            }else{
                return false;
            }
        }else if(3==myComparativeOperation.length){
            if("=="==myComparativeOperation[1][1]){
                variableList = [];
                if(checkEqual(myComparativeOperation[0], myComparativeOperation[2])){
                    return true;
                }else{
                    return false;
                }
            }else if("!="==myComparativeOperation[1][1]){
                variableList = [];
                if(checkEqual(myComparativeOperation[0], myComparativeOperation[2])){
                    return false;
                }else{
                    return true;
                }
            }else if(">"==myComparativeOperation[1][1]){
                if(!isNaN(myComparativeOperation[0][1]) && !isNaN(myComparativeOperation[2][1])){
                    if(myComparativeOperation[0][1]>myComparativeOperation[2][1]){
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }else if("<"==myComparativeOperation[1][1]){
                if(!isNaN(myComparativeOperation[0][1]) && !isNaN(myComparativeOperation[2][1])){
                    if(myComparativeOperation[0][1]<myComparativeOperation[2][1]){
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }else if(">="==myComparativeOperation[1][1]){
                if(!isNaN(myComparativeOperation[0][1]) && !isNaN(myComparativeOperation[2][1])){
                    if(myComparativeOperation[0][1]>=myComparativeOperation[2][1]){
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }else if("<="==myComparativeOperation[1][1]){
                if(!isNaN(myComparativeOperation[0][1]) && !isNaN(myComparativeOperation[2][1])){
                    if(myComparativeOperation[0][1]<=myComparativeOperation[2][1]){
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
            }else{
                console.log("error: comparative operation is not completed");
                return false;
            }
        }
    }
}

function replaceBody(body, replace){
    if("literal"==body[0]){
        return body;
    }else if("variable"==body[0]){
        for(let i=0;i<replace.length;i++){
            if(array_equal(body, replace[i][0])){
                return replace[i][1];
            }
        }
        return body;
    }else if("ordered set"==body[0] || "unordered set"==body[0]){
        let newBody = [body[0]];
        for(let i=1;i<body.length;i++){
            if("context"==body[i][0]){
                for(let j=0;j<replace.length;j++){
                    if(array_equal(body[i], replace[j][0])){
                        for(let k=1;k<replace[j][1].length;k++){
                            newBody.push(replace[j][1][k]);
                        }
                        break;
                    }
                }
            }else{
                newBody.push(replaceBody(body[i], replace));
            }
        }
        return newBody;
    }else if("wrapping"==body[0]){
        return ["wrapping", replaceBody(body[1], replace)];
    }else if("arithmetic operation"==body[0]){
        let arithmeticOperation = "";
        for(let i=1;i<body.length;i++){
            arithmeticOperation = arithmeticOperation + replaceBody(body[i], replace)[1];
        }
        try{
            arithmeticOperation = convertToCalcResult(arithmeticOperation);
        }catch(e){}
        return ["literal", arithmeticOperation];
    }else{
        return body;
    }
}

function wrap(data){
    if("wrapping"==data[0]){
        return ["wrapping", data];
    }else if("unordered set"==data[0] || "ordered set"==data[0]){
        let set = [data[0]];
        for(let i=1;i<data.length;i++){
            set.push(wrap(data[i]));
        }
        return set;
    }else{
        return data;
    }
}

function unwrap(data){
    if("wrapping"==data[0]){
        return data[1];
    }else if("unordered set"==data[0] || "ordered set"==data[0]){
        let set = [data[0]];
        for(let i=1;i<data.length;i++){
            set.push(unwrap(data[i]));
        }
        return set;
    }else{
        return data;
    }
}

function execRandom(inputText){
    let text = flatText(inputText);
    text = lexicalAnalys(text);
    let [instructionControl, instructionList] = parse(text);
    let data = ["unordered set"];
    let state = false;
    let count = 0;
    while(instructionControl.length>0){
        //console.log([state].concat(instructionControl));
        if(count>100){
            myConsole("error: maximum number exceeded");
            return false;
        }else{
            count++;
        }
        if(false==state){
            if(!isNaN(instructionControl[0])){
                let instructionNum = instructionControl.shift();
                let newData = applyInstructionRandom(data, instructionList[instructionNum]);
                if(!Boolean(newData)){
                    state = "next";
                }else{
                    data = newData;
                    state = "skip";
                }
            }else if("*("==instructionControl[0] || "loop("==instructionControl[0]){
                if("*("==instructionControl[0]){
                    data = wrap(data);
                }
                instructionControl.shift();
                instructionControl.unshift("loop(");
                let parenthesesNum = 1;
                let loop = [];
                for(let i=1;i<instructionControl.length;i++){
                    if("*("==instructionControl[i] || "("==instructionControl[i]){
                        parenthesesNum++;
                        loop.push(instructionControl[i]);
                    }else if(")"==instructionControl[i]){
                        parenthesesNum--;
                        if(parenthesesNum==0){
                            loop.push(";");
                            instructionControl = loop.concat(instructionControl);
                            break;
                        }else{
                            loop.push(instructionControl[i]);
                        }
                    }else{
                        loop.push(instructionControl[i]);
                    }
                }
            }else if(";"==instructionControl[0]){
                instructionControl.shift();
            }else if("||"==instructionControl[0]){
                instructionControl.shift();
                state = "skip";
            }else{
                console.log("error: "+instructionControl[0]);
            }
        }else if("skip"==state){
            if(";"==instructionControl[0]){
                instructionControl.shift();
                state = false;
            }else if("||"==instructionControl[0]){
                instructionControl.shift();
                if(!isNaN(instructionControl[0])){
                    instructionControl.shift();
                }
                state = "skip";
            }else{
                console.log("error: "+instructionControl[0]);
            }
        }else if("next"==state){
            if(";"==instructionControl[0]){
                instructionControl.shift();
                if(!isNaN(instructionControl[0])){
                    instructionControl.shift();
                    state = "break";
                }else if("*("==instructionControl[0] || "loop("==instructionControl[0]){
                    if("*("==instructionControl[0]){
                        state = "break";
                    }else if("loop("==instructionControl[0]){
                        state = "skip";
                        data = unwrap(data);
                    }
                    instructionControl.shift();
                    let parenthesesNum = 1;
                    let instructionControlLength = instructionControl.length;
                    for(let i=0;i<instructionControlLength;i++){
                        if("*("==instructionControl[0] || "("==instructionControl[0]){
                            parenthesesNum++;
                            instructionControl.shift();
                        }else if(")"==instructionControl[0]){
                            parenthesesNum--;
                            instructionControl.shift();
                            if(parenthesesNum==0){
                                break;
                            }
                        }else{
                            instructionControl.shift();
                        }
                    }
                }else{
                    state = "break";
                }
            }else if("||"==instructionControl[0]){
                instructionControl.shift();
                state = false;
            }else{
                console.log("error: "+instructionControl[0]);
            }
        }else if("break"==state){
            if(";"==instructionControl[0]){
                instructionControl.shift();
                if(!isNaN(instructionControl[0])){
                    instructionControl.shift();
                    state = "break";
                }else if("*("==instructionControl[0] || "loop("==instructionControl[0]){
                    if("*("==instructionControl[0]){
                        state = "break";
                    }else if("loop("==instructionControl[0]){
                        state = "skip";
                        data = unwrap(data);
                    }
                    instructionControl.shift();
                    let parenthesesNum = 1;
                    let instructionControlLength = instructionControl.length;
                    for(let i=1;i<instructionControlLength;i++){
                        if("*("==instructionControl[0] || "("==instructionControl[0]){
                            parenthesesNum++;
                            instructionControl.shift();
                        }else if(")"==instructionControl[0]){
                            parenthesesNum--;
                            instructionControl.shift();
                            if(parenthesesNum==0){
                                break;
                            }
                        }else{
                            instructionControl.shift();
                        }
                    }
                }else{
                    state = "break";
                }
            }else if("||"==instructionControl[0]){
                instructionControl.shift();
                if(!isNaN(instructionControl[0])){
                    instructionControl.shift();
                    state = "break";
                }else if("*("==instructionControl[0]){
                    state = "break";
                    instructionControl.shift();
                    let parenthesesNum = 1;
                    let instructionControlLength = instructionControl.length;
                    for(let i=1;i<instructionControlLength;i++){
                        if("*("==instructionControl[0] || "("==instructionControl[0]){
                            parenthesesNum++;
                            instructionControl.shift();
                        }else if(")"==instructionControl[0]){
                            parenthesesNum--;
                            instructionControl.shift();
                            if(parenthesesNum==0){
                                break;
                            }
                        }else{
                            instructionControl.shift();
                        }
                    }
                }
            }else{
                console.log("error: "+instructionControl[0]);
            }
        }
    }
    if(false==state || "skip"==state){
        return data;
    }else{
        return false;
    }
}

function array_equal(a, b) {
    if (!Array.isArray(a))    return false;
    if (!Array.isArray(b))    return false;
    if (a.length != b.length) return false;
    for (var i = 0, n = a.length; i < n; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
}

function calculationPermutation(array){
    let arrays = [[[], array]];
    for(let i=0;i<array.length;i++){
        let newArrays = [];
        let loopNum = arrays.length;
        for(let j=0;j<loopNum;j++){
            newArrays = newArrays.concat(subCalculationPermutation(arrays[j]));
        }
        arrays = newArrays;
    }
    newArrays = [];
    for(let i=0;i<arrays.length;i++){
        newArrays.push(arrays[i][0]);
    }
    return newArrays;
}

function subCalculationPermutation(twoArray){
    let myTwoArray = twoArray;
    let arrays = [];
    let loopNum = twoArray[1].length;
    for(let i=0;i<loopNum;i++){
        let array1 = myTwoArray[0];
        let array2 = myTwoArray[1];
        let target = array2[i];
        let newArray2 = [];
        for(let j=0;j<array2.length;j++){
            if(i!=j){
                newArray2.push(array2[j]);
            }
        }
        arrays.push([array1.concat([target]), newArray2]);
    }
    return arrays;
}

function convertToCalcResult(string){
    var answer = safeEval(string);
    return answer;
}

function safeEval(val){
    return Function('"use strict";return ('+val+')')();
}

let indent = 0;
function outputText(text, indent){
      let space = "";
      for(let i=0;i<indent;i++)space = space + "- ";
      space = space + " ";
    if(Array.isArray(text)){
        let newText = space + "[\n";
        for(let i=0;i<text.length;i++){
            newText = newText + outputText(text[i], indent+1);
        }
        newText = newText + space + "]\n";
        return newText;
    }else{
        return space + text + "\n";
    }
}

function outputInstructionList(instructionList){
    for(let i=0;i<instructionList.length;i++){
        let instruction = ""
        instruction = instruction + outputSet(instructionList[i][1]);
        instruction = instruction + "&&";
        for(let j=1;j<instructionList[i][2][1].length;j++){
            if("arithmetic operation"==instructionList[i][2][1][j][0]){
                let arithmeticOperation = "";
                for(let k=1;k<instructionList[i][2][1][j].length;k++){
                    arithmeticOperation = arithmeticOperation + instructionList[i][2][1][j][k][1];
                }
                instruction = instruction + arithmeticOperation;
            }else{
                instruction = instruction + instructionList[i][2][1][j][1];
            }
        }
        instruction = instruction + "->";
        instruction = instruction + outputSet(instructionList[i][3]);
    }
}

function outputSet(set){
    let text = "";
    let kind = "other";
    if("unordered set"==set[0]){
        kind = "unordered set";
        text = text + "{";
    }else if("ordered set"==set[0]){
        kind = "ordered set";
        text = text + "[";
    }
    for(let i=1;i<set.length;i++){
        if(i>1){
            if("unordered set"==kind){
                text = text + ",";
            }else if("ordered set"==kind){
                text = text + ":";
            }
        }
        if(Array.isArray(set[i])){
            text = text + outputSet(set[i]);
        }else{
            text = text + set[i];
        }
    }
    if("unordered set"==kind){
        text = text + "}";
    }else if("ordered set"==kind){
        text = text + "]";
    }
    return text;
}

function outputData(data){
    let outputText = "";
    if("unordered set"!=data[0]){
        console.log("error: data is not unordered set");
        return false;
    }
    let newLine = false;
    for(let i=1;i<data.length;i++){
        if("unordered set"==data[i][0] || "ordered set"==data[i][0]){
            newLine = true;
            break;
        }
    }
    for(let i=1;i<data.length;i++){
        if(1!=i){
            outputText = outputText + ",";
            if(newLine){
                outputText = outputText + "\n";
            }else{
                outputText = outputText + " ";
            }
        }
        if("unordered set"==data[i][0]){
            outputText = outputText + outputUnorderedSet(data[i]);
        }else if("ordered set"==data[i][0]){
            outputText = outputText + outputOrderedSet(data[i], false);
        }else if("wrapping"==data[i][0]){
            outputText = outputText + outputWrapping(data[i]);
        }else if("variable"==data[i][0]){
            let hit = false;
            for(let j=0;j<variableList.length;j++){
                if(data[i][1]==variableList[j]){
                    outputText = outputText + "@" + j;
                    hit = true;
                    break;
                }
            }
            if(!hit){
                outputText = outputText + "@" + variableList.length;
                variableList.push(data[i][1]);
            }
        }else{
            outputText = outputText + data[i][1];
        }
    }
    return outputText;
}

function outputUnorderedSet(data){
    let outputText = "";
    outputText = outputText + "{";
    for(let i=1;i<data.length;i++){
        if(1!=i){
            outputText = outputText + ",";
        }
        if("unordered set"==data[i][0]){
            outputText = outputText + outputUnorderedSet(data[i]);
        }else if("ordered set"==data[i][0]){
            outputText = outputText + outputOrderedSet(data[i], false);
        }else if("wrapping"==data[i][0]){
            outputText = outputText + outputWrapping(data[i]);
        }else if("variable"==data[i][0]){
            let hit = false;
            for(let j=0;j<variableList.length;j++){
                if(data[i][1]==variableList[j]){
                    outputText = outputText + "@" + j;
                    hit = true;
                    break;
                }
            }
            if(!hit){
                outputText = outputText + "@" + variableList.length;
                variableList.push(data[i][1]);
            }
        }else{
            outputText = outputText + data[i][1];
        }
    }
    outputText = outputText + "}";
    return outputText;
}

function outputOrderedSet(data, isOrderedSet){
    let outputText = "";
    let squareBrackets = isOrderedSet;
    if(!squareBrackets){
        if(data.length<3){
            squareBrackets = true;
        }
    }
    if(squareBrackets){
        outputText = outputText + "[";
    }
    for(let i=1;i<data.length;i++){
        if(1!=i){
            outputText = outputText + ":";
        }
        if("unordered set"==data[i][0]){
            outputText = outputText + outputUnorderedSet(data[i]);
        }else if("ordered set"==data[i][0]){
            outputText = outputText + outputOrderedSet(data[i], true);
        }else if("wrapping"==data[i][0]){
            outputText = outputText + outputWrapping(data[i]);
        }else if("variable"==data[i][0]){
            let hit = false;
            for(let j=0;j<variableList.length;j++){
                if(data[i][1]==variableList[j]){
                    outputText = outputText + "@" + j;
                    hit = true;
                    break;
                }
            }
            if(!hit){
                outputText = outputText + "@" + variableList.length;
                variableList.push(data[i][1]);
            }
        }else{
            outputText = outputText + data[i][1];
        }
    }
    if(squareBrackets){
        outputText = outputText + "]";
    }
    return outputText;
}

function outputWrapping(data){
    let outputText = "";
    outputText = outputText + "<";
    if("unordered set"==data[1][0]){
        outputText = outputText + outputUnorderedSet(data[1]);
    }else if("ordered set"==data[1][0]){
        outputText = outputText + outputOrderedSet(data[1], false);
    }else if("wrapping"==data[1][0]){
        outputText = outputText + outputWrapping(data[1]);
    }else if("variable"==data[1][0]){
        let hit = false;
        for(let i=0;i<variableList.length;i++){
            if(data[1][1]==variableList[i]){
                outputText = outputText + "@" + i;
                hit = true;
                break;
            }
        }
        if(!hit){
            outputText = outputText + "@" + variableList.length;
            variableList.push(data[1][1]);
        }
    }else{
        outputText = outputText + data[1][1];
    }
    outputText = outputText + ">";
    return outputText;
}