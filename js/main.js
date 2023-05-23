// ----- HTML要素を取得 -----
let outputDiv = document.getElementById("output");
let stepDiv = document.getElementById("step");
let dataDiv = document.getElementsByClassName("data");
let examplesButton = document.getElementById("examples");
let programTextarea = document.getElementById("program_textarea");
let outputTextarea = document.getElementById("output_textarea");
let prevDataTextarea = document.getElementById("prev_data_textarea");
let nextDataTextarea = document.getElementById("next_data_textarea");
let instructionParagraph = document.getElementById("instruction_paragraph");
let programConsole = document.getElementById("program_console");
let outputConsole = document.getElementById("output_console");
let stepConsole = document.getElementById("step_console");
let runButton = document.getElementById("run_button");
let stepButton = document.getElementById("step_button");
let backButton = document.getElementById("back_button");
let goButton = document.getElementById("go_button");

// ----- パーサを生成 -----
let parser = peg.generate(parserText);
let arithmeticCalculator = peg.generate(arithmeticCalculatorText);

// ----- グローバル変数 -----
let globalProgram;
let globalProgramIndex = 1;

// プログラムが変更されたときにメソッドを実行するイベントリスナー
programTextarea.addEventListener('input', programChanged);

// プログラムが変更されたときに実行する
function programChanged(){
    outputDiv.style.display = "block";
    stepDiv.style.display ="none";
    let inputText = programTextarea.value;
    if(""==inputText){
        programConsole.textContent = "";
        programConsole.style.backgroundColor = "#D9E5FF";
        outputTextarea.textContent = "";
        outputConsole.textContent = "";
        outputConsole.style.backgroundColor = "#D9E5FF"
        stepButton.style.visibility = "hidden";
        runButton.style.visibility = "hidden";
        return
    }else{
        globalProgram = parseProgram(inputText);
        if("parse_success"==globalProgram.state){
            programConsole.textContent = "Program parsed successfully.";
            programConsole.style.backgroundColor = "#98fb98";
            outputTextarea.textContent = "";
            outputConsole.textContent = "";
            outputConsole.style.backgroundColor = "#D9E5FF";
            stepButton.style.visibility = "visible";
            runButton.style.visibility = "visible";
        }else if("parse_failure"==globalProgram.state){
            programConsole.textContent = globalProgram.error_message;
            programConsole.style.backgroundColor = "#ffb6c1"
            outputTextarea.textContent = "";
            outputConsole.textContent = "";
            outputConsole.style.backgroundColor = "#D9E5FF";
            stepButton.style.visibility = "hidden";
            runButton.style.visibility = "hidden";
        }
    }
}

// ----- ボタンが押されたときに実行する -----
function onExampleButtonClick(exampleIndex){
    programTextarea.value = exampleArray[exampleIndex];
    programChanged();
}

function onRunButtonClick(){
    if("execute_success"==globalProgram.state){
        programChanged();
    }else if("execute_failure"==globalProgram.state){
        return;
    }
    globalProgram = execProgram(globalProgram.parsed_program);
    globalProgramIndex = 1;
    if("execute_success"==globalProgram.state){
        outputTextarea.textContent = convertDataToText(globalProgram.history[globalProgram.history.length-1].data);
        outputConsole.textContent = "Program executed successfully.";
        outputConsole.style.backgroundColor = "#98fb98";
    }else if("execute_failure"==globalProgram.state){
        outputTextarea.textContent = convertDataToText(globalProgram.history[globalProgram.history.length-1].data);
        outputConsole.textContent = 'Instruction"' + convertInstructionToText(globalProgram.history[globalProgram.history.length-1].instruction) + '" is failed.';
        outputConsole.style.backgroundColor = "#ffb6c1";
    }else if("not_finish"==globalProgram.state){
        outputTextarea.textContent = convertDataToText(globalProgram.history[globalProgram.history.length-1].data);
        outputConsole.textContent = "Maximum number of instruction executions exceeded.";
        outputConsole.style.backgroundColor = "#ffb6c1";
    }
}

function onStepButtonClick(){
    if("parse_success"==globalProgram.state){
        onRunButtonClick();
    }
    outputDiv.style.display = "none";
    stepDiv.style.display ="block";
    prevDataTextarea.textContent = convertDataToText(globalProgram.history[globalProgramIndex-1].data);
    instructionParagraph.textContent = convertInstructionToText(globalProgram.history[globalProgramIndex].instruction);
    nextDataTextarea.textContent = convertDataToText(globalProgram.history[globalProgramIndex].data);
    let instructionParagrapHeight = window.getComputedStyle(instructionParagraph).getPropertyValue("height");
    dataDiv[0].style.height = "calc((100% - " + instructionParagrapHeight + ")/2)";
    dataDiv[1].style.height = "calc((100% - " + instructionParagrapHeight + ")/2)";
    if(true===globalProgram.history[globalProgramIndex].match){
        stepConsole.textContent = "Instruction succeeded.";
        stepConsole.style.backgroundColor = "#98fb98";
    }else{
        stepConsole.textContent = "Instruction failed.";
        stepConsole.style.backgroundColor = "#ffb6c1";
    }
}

function onBackButtonClick(){
    if(globalProgramIndex<=1){
        outputDiv.style.display = "block";
        stepDiv.style.display ="none";
    }else{
        globalProgramIndex--;
        onStepButtonClick();
    }
}

function onGoButtonClick(){
    if(globalProgramIndex>=globalProgram.history.length-1){
        outputDiv.style.display = "block";
        stepDiv.style.display ="none";
    }else{
        globalProgramIndex++;
        onStepButtonClick();
    }
}

// プログラムをパースする
function parseProgram(program){
    program = flattenText(program);
    try{
        return {"state":"parse_success", "parsed_program":parser.parse(program)};
    }catch(e){
        return {"state":"parse_failure", "error_message":e.message};
    }
}

// プログラムを実行する
function execProgram(program){
    let history = [{"instruction":undefined, "data":{"kind":"unordered_set", "value":[]}}];
    let count = 0;
    while(program.length!=1 || (program[0]!="skip" && program!="next" && program!="break")){
        // ループを100回までに制限
        if(count>100){
            return {"state":"not_finish", "history":history};
        }
        if("skip"==program[0]){
            program.shift();
            if(";"==program[0]){
                program.shift();
            }else if("||"==program[0]){
                program.shift();
                program[0] = "skip";
            }
        }else if("next"==program[0]){
            program.shift();
            if(";"==program[0]){
                if("break_point"==program[1].kind){
                    program.unshift("break");
                }else{
                    program.shift();
                    program[0] = "break";
                }
            }else if("||"==program[0]){
                program.shift();
            }
        }else if("break"==program[0]){
            program.shift();
            if(";"==program[0]){
                if("break_point"==program[1].kind){
                    program.shift();
                    program[0] = "skip";
                    history[history.length-1].data = unwrapping(history[history.length-1].data);
                }else{
                    program.shift();
                    program[0] = "break";
                }
            }else if("||"==program[0]){
                program.shift();
                program[0] = "break";
            }
        }else if("instruction"==program[0].kind){
            let data = execInstruction(history[history.length-1].data, program[0]);
            if(false===data){
                history.push({"instruction":program[0], "data":history[history.length-1].data, "match":false});
                program[0] = "next";
            }else{
                history.push({"instruction":program[0], "data":data, "match":true});
                program[0] = "skip";
            }
            count++;
        }else if("loop_instruction"==program[0].kind){
            let instructionArray = program[0].instruction_array;
            program[0] = {"kind":"break_point", "instruction_array":program[0].instruction_array};
            program.unshift(";");
            program = instructionArray.concat(program);
            history[history.length-1].data = wrapping(history[history.length-1].data);
        }else if("break_point"==program[0].kind){
            let instructionArray = program[0].instruction_array;
            program.unshift(";");
            program = instructionArray.concat(program);
        }
    }
    if(1==program.length && "skip"==program[0]){
        return {"state":"execute_success", "history":history};
    }else{
        return {"state":"execute_failure", "history":history};
    }
}

// ----- 命令を実行する -----
function execInstruction(data, instruction){
    let head = {"kind":"unordered_set", "value":[]};
    let body = {"kind":"unordered_set", "value":[]};
    for(let i=0;i<instruction.head.value.length;i++){
        if("wrapping"==instruction.head.value[i].kind){
            head.value.push(instruction.head.value[i].value);
            body.value.push(instruction.head.value[i].value);
        }else{
            head.value.push(instruction.head.value[i]);
        }
    }
    body.value = body.value.concat(instruction.body.value);
    head.value.push({"kind":"context", "value":"$$"});
    body.value.unshift({"kind":"context", "value":"$$"});
    let guard = instruction.guard;
    let thetaPattern = matching(data, head, guard);
    let theta;
    if(false===thetaPattern){
        return false;
    }else{
        theta = thetaPattern[Math.floor( Math.random() * thetaPattern.length)];
    }
    let newData = applyReplace(body, theta);
    variableList = [];
    newData = numberingVariables(newData);
    return newData;
}

function numberingVariables(data){
    if("literal"==data.kind){
        return data;
    }else if("variable"==data.kind){
        let hitNumber = false;
        for(let i=0;i<variableList.length;i++){
            if(data.value==variableList[i]){
                hitNumber = i;
                break;
            }
        }
        if(false===hitNumber){
            variableList.push(data.value);
            return {"kind":"variable", "value":"@"+(variableList.length-1)};
        }else{
            return {"kind":"variable", "value":"@"+hitNumber};
        }
    }else if("bool_operation"==data.kind){
        return data;
    }else if("wrapping"==data.kind){
        return {"kind":"wrapping", "value":numberingVariables(data.value)};
    }else if("unordered_set"==data.kind){
        let unorderedSet = {"kind":"unordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            unorderedSet.value.push(numberingVariables(data.value[i]));
        }
        return unorderedSet;
    }else if("ordered_set"==data.kind){
        let orderedSet = {"kind":"ordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            orderedSet.value.push(numberingVariables(data.value[i]));
        }
        return orderedSet;
    }
}

// ----- マッチングする -----
function matching(data, head, guard){
    let thetaPattern = subMatching(data, head);
    if(false===thetaPattern){
        return false;
    }
    for(let i=0;i<thetaPattern.length;i++){
        thetaPattern[i].push({"kind":"evaluation", "data1":{"kind":"bool_operation", "value": true}, "data2":guard});
    }
    let newThetaPattern = [];
    for(let i=0;i<thetaPattern.length;i++){
        let replaceList = [];
        let evaluationList = [];
        for(let j=0;j<thetaPattern[i].length;j++){
            if("replace"==thetaPattern[i][j].kind){
                replaceList.push({"replaced":thetaPattern[i][j].replaced, "replace":thetaPattern[i][j].replace});
            }else if("evaluation"==thetaPattern[i][j].kind){
                evaluationList.push({"data1":thetaPattern[i][j].data1, "data2":thetaPattern[i][j].data2});
            }
        }
        newThetaPattern.push({"replaceList":replaceList, "evaluationList":evaluationList});
    }
    thetaPattern = newThetaPattern;
    newThetaPattern = [];
    for(let i=0;i<thetaPattern.length;i++){
        let replaceList = [];
        let isValid = true;
        for(let j=0;j<thetaPattern[i].replaceList.length;j++){
            let replace1 = thetaPattern[i].replaceList[j];
            let hit = false;
            for(let k=j+1;k<thetaPattern[i].replaceList.length;k++){
                let replace2 = thetaPattern[i].replaceList[k];
                if(checkEqual(replace1.replace, replace2.replace)){
                    if(checkEqual(replace1.replaced, replace2.replaced)){
                        hit = true;
                    }else{
                        isValid = false;
                    }
                }
            }
            if(false==hit){
                replaceList.push(replace1);
            }
        }
        if(isValid){
            newThetaPattern.push({"replaceList":replaceList, "evaluation":thetaPattern[i].evaluationList});
        }
    }
    thetaPattern = newThetaPattern;
    newThetaPattern = [];
    for(let i=0;i<thetaPattern.length;i++){
        let replaceList = thetaPattern[i].replaceList;
        let evaluationList = thetaPattern[i].evaluation;
        let hit = false;
        for(let j=0;j<evaluationList.length;j++){
            let evaluationAppliedReplace = {"data1":applyReplace(evaluationList[j].data1, replaceList), "data2":applyReplace(evaluationList[j].data2, replaceList)};
            if(calcOperation(evaluationAppliedReplace.data1)!==calcOperation(evaluationAppliedReplace.data2)){
                hit = true;
                break;
            }
        }
        if(!hit){
            newThetaPattern.push(replaceList);
        }
    }
    thetaPattern = newThetaPattern;
    if(thetaPattern.length>0){
        return thetaPattern;
    }else{
        return false;
    }
}

function subMatching(data1, data2){
    if("literal"==data2.kind){
        if(data1.kind==data2.kind && data1.value==data2.value){
            return [[]];
        }else{
            return false;
        }
    }else if("variable"==data2.kind){
        if("wrapping"!=data1.kind){
            return [[{"kind":"replace", "replaced":data1, "replace":data2}]];
        }else{
            return false;
        }
    }else if("context"==data2.kind){
        return [[{"kind":"replace", "replaced":data1, "replace":data2}]];
    }else if(data2.kind=="bool_operation"){
        if(data1.kind=="bool_operation"){
            return [[{"kind":"evaluation", "data1":data1, "data2":data2}]];
        }else{
            return false;
        }
    }else if(data2.kind=="arithmetic_operation"){
        if(data1.kind=="literal"){
            return [[{"kind":"evaluation", "data1":data1, "data2":data2}]];
        }else{
            return false;
        }
    }else if("unordered_set"==data2.kind){
        if(data1.kind=="unordered_set"){
            let dataNum = data1.value.length;
            let contextNum = 0;
            let notContextNum = 0;
            for(let i=0;i<data2.value.length;i++){
                if("context"==data2.value[i].kind){
                    contextNum++;
                }else{
                    notContextNum++;
                }
            }
            // 文脈は2つまでに制限して実装
            let data2Pattern;
            if(0==contextNum){
                if(dataNum==notContextNum){
                    data2Pattern = [data2];
                }else{
                    return false;
                }
            }else if(1==contextNum){
                if(dataNum>=notContextNum){
                    let newData2 = {"kind":"unordered_set", "value":[]};
                    for(let i=0;i<data2.value.length;i++){
                        if("context"==data2.value[i].kind){
                            newData2.value.push({"kind":"context", "value":data2.value[i].value, "replaceNum":dataNum-notContextNum});
                        }else{
                            newData2.value.push(data2.value[i]);
                        }
                    }
                    data2Pattern = [newData2];
                }else{
                    return false;
                }
            }else if(2==contextNum){
                data2Pattern = [];
                if(dataNum>=notContextNum){
                    for(let i=0;i<=dataNum-notContextNum;i++){
                        let newData2 = {"kind":"unordered_set", "value":[]};
                        let contextReplaceNum = [i,dataNum-notContextNum-i];
                        for(let j=0;j<data2.value.length;j++){
                            if("context"==data2.value[j].kind){
                                newData2.value.push({"kind":"context", "value":data2.value[j].value, "replaceNum":contextReplaceNum.shift()});
                            }else{
                                newData2.value.push(data2.value[j]);
                            }
                        }
                        data2Pattern.push(newData2);
                    }
                }else{
                    return false;
                }
            }else{
                return false;
            }
            let data1ValuePattern = calculationPermutation(data1.value);
            let data1Pattern = [];
            for(let i=0;i<data1ValuePattern.length;i++){
                data1Pattern.push({"kind":"unordered_set", "value":data1ValuePattern[i]});
            }
            let theta = [];
            for(let i=0;i<data1Pattern.length;i++){
                for(let j=0;j<data2Pattern.length;j++){           
                    let thetaPattern = [[]];
                    let l = 0;
                    for(let k=0;k<data2Pattern[j].value.length;k++){
                        if("context"==data2Pattern[j].value[k].kind){
                            let unorderedSet = {"kind":"unordered_set", "value":[]};
                            for(let m=0;m<data2Pattern[j].value[k].replaceNum;m++){
                                unorderedSet.value.push(data1Pattern[i].value[l]);
                                l++;
                            }
                            let addedThetaPattern = subMatching(unorderedSet, {"kind":"context", "value":data2Pattern[j].value[k].value});
                            thetaPattern = addThetaPattern(thetaPattern, addedThetaPattern);
                        }else{
                            let addedThetaPattern = subMatching(data1Pattern[i].value[l], data2Pattern[j].value[k]);
                            if(!Boolean(addedThetaPattern)){
                                thetaPattern = [];
                                break;
                            }else{
                                thetaPattern = addThetaPattern(thetaPattern, addedThetaPattern);
                            }
                            l++;
                        }
                    }
                    theta = theta.concat(thetaPattern);
                }
            }
            if(theta.length>0){
                return theta;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }else if("ordered_set"==data2.kind){
        if(data1.kind=="ordered_set"){
            let dataNum = data1.value.length;
            let contextNum = 0;
            let notContextNum = 0;
            for(let i=0;i<data2.value.length;i++){
                if("context"==data2.value[i].kind){
                    contextNum++;
                }else{
                    notContextNum++;
                }
            }
            // 文脈は2つまでに制限して実装
            let data2Pattern;
            if(0==contextNum){
                if(dataNum==notContextNum){
                    data2Pattern = [data2];
                }else{
                    return false;
                }
            }else if(1==contextNum){
                if(dataNum>=notContextNum){
                    let newData2 = {"kind":"ordered_set", "value":[]};
                    for(let i=0;i<data2.value.length;i++){
                        if("context"==data2.value[i].kind){
                            newData2.value.push({"kind":"context", "value":data2.value[i].value, "replaceNum":dataNum-notContextNum});
                        }else{
                            newData2.value.push(data2.value[i]);
                        }
                    }
                    data2Pattern = [newData2];
                }else{
                    return false;
                }
            }else if(2==contextNum){
                data2Pattern = [];
                if(dataNum>=notContextNum){
                    for(let i=0;i<=dataNum-notContextNum;i++){
                        let newData2 = {"kind":"ordered_set", "value":[]};
                        let contextReplaceNum = [i,dataNum-notContextNum-i];
                        for(let j=0;j<data2.value.length;j++){
                            if("context"==data2.value[j].kind){
                                newData2.value.push({"kind":"context", "value":data2.value[j].value, "replaceNum":contextReplaceNum.shift()});
                            }else{
                                newData2.value.push(data2.value[j]);
                            }
                        }
                        data2Pattern.push(newData2);
                    }
                }else{
                    return false;
                }
            }else{
                return false;
            }
            let theta = [];
            for(let i=0;i<data2Pattern.length;i++){           
                let thetaPattern = [[]];
                let k = 0;
                for(let j=0;j<data2Pattern[i].value.length;j++){
                    if("context"==data2Pattern[i].value[j].kind){
                        let orderedSet = {"kind":"ordered_set", "value":[]};
                        for(let l=0;l<data2Pattern[i].value[j].replaceNum;l++){
                            orderedSet.value.push(data1.value[k]);
                            k++;
                        }
                        let addedThetaPattern = subMatching(orderedSet, {"kind":"context", "value":data2Pattern[i].value[j].value});
                        thetaPattern = addThetaPattern(thetaPattern, addedThetaPattern);
                    }else{
                        let addedThetaPattern = subMatching(data1.value[k], data2Pattern[i].value[j]);
                        if(!Boolean(addedThetaPattern)){
                            thetaPattern = [];
                            break;
                        }else{
                            thetaPattern = addThetaPattern(thetaPattern, addedThetaPattern);
                        }
                        k++;
                    }
                }
                theta = theta.concat(thetaPattern);
            }
            if(theta.length>0){
                return theta;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }
}

function addThetaPattern(thetaPattern, addedThetaPattern){
    let newThetaPattern = [];
    for(let i=0;i<thetaPattern.length;i++){
        let myThetaPattern = thetaPattern[i];
        for(let j=0;j<addedThetaPattern.length;j++){
            let myTheta = addedThetaPattern[j];
            newThetaPattern.push(myThetaPattern.concat(myTheta));
        }
    }
    return newThetaPattern;
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

// データをシータで置換する
function applyReplace(data, theta){
    if("literal"==data.kind){
        return data;
    }else if("variable"==data.kind){
        for(let i=0;i<theta.length;i++){
            if(checkEqual(theta[i].replace, data)){
                return theta[i].replaced;
            }
        }
        return data;
    }else if("context"==data.kind){
        for(let i=0;i<theta.length;i++){
            if(checkEqual(theta[i].replace, data)){
                return theta[i].replaced;
            }
        }
    }else if("wrapping"==data.kind){
        return {"kind":"wrapping", "value":applyReplace(data.value, theta)};
    }else if("bool_operation"==data.kind){
        if(true==data.value || false==data.value){
            return data;
        }else if("comparision_operation"==data.value.kind){
            return {"kind":"bool_operation", "value":applyReplace(data.value, theta)};
        }else{
            let boolOperation = {"kind":"bool_operation", "value":[]};
            for(let i=0;i<data.value.length;i++){
                if("&"==data.value[i] || "|"==data.value[i]){
                    boolOperation.value.push(data.value[i]);
                }else{
                    boolOperation.value.push(applyReplace(data.value[i], theta));
                }
            }
            return boolOperation;
        }
    }else if("comparision_operation"==data.kind){
        let comparisionOperation = {"kind":"comparision_operation", "value":[]};
        for(let i=0;i<data.value.length;i++){
            if(
                "=="==data.value[i] ||
                "!="==data.value[i] ||
                ">"==data.value[i] ||
                "<"==data.value[i] ||
                ">="==data.value[i] ||
                "<="==data.value[i]
            ){
                comparisionOperation.value.push(data.value[i]);
            }else{
                comparisionOperation.value.push(applyReplace(data.value[i], theta));
            }
        }
        return comparisionOperation;
    }else if("arithmetic_operation"==data.kind){
        let arithmeticOperation = {"kind":"arithmetic_operation", "value":""};
        for(let i=0;i<data.value.length;i++){
            if(
                "+"==data.value[i] ||
                "-"==data.value[i] ||
                "*"==data.value[i] ||
                "/"==data.value[i] ||
                "("==data.value[i] ||
                ")"==data.value[i]
            ){
                arithmeticOperation.value += data.value[i];
            }else{
                let elementAppliedReplace = applyReplace(data.value[i], theta);
                if("literal"==elementAppliedReplace.kind || "literal"==elementAppliedReplace.kind){
                    arithmeticOperation.value += elementAppliedReplace.value;
                }else{
                    return {"kind":"bool_operation", "value":false};
                }
            }
        }
        return {"kind":"literal", "value":calcOperation(arithmeticOperation)};
    }else if("unordered_set"==data.kind){
        let unorderedSet = {"kind":"unordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            if("context"==data.value[i].kind){
                unorderedSet.value = unorderedSet.value.concat(applyReplace(data.value[i], theta).value);
            }else{
                unorderedSet.value.push(applyReplace(data.value[i], theta));
            }
        }
        return unorderedSet;
    }else if("ordered_set"==data.kind){
        let orderedSet = {"kind":"ordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            if("context"==data.value[i].kind){
                orderedSet.value = orderedSet.value.concat(applyReplace(data.value[i], theta).value);
            }else{
                orderedSet.value.push(applyReplace(data.value[i], theta));
            }
        }
        return orderedSet;
    }
}

// 演算を計算する
function calcOperation(operation){
    if("bool_operation"==operation.kind){
        if(true==operation.value || false==operation.value){
            return operation.value;
        }else if("comparision_operation"==operation.value.kind){
            return calcOperation(operation.value);
        }else{
            let bool1 = calcOperation(operation.value[0]);
            let bool2 = calcOperation(operation.value[2]);
            if("&"==operation.value[1]){
                return (bool1 && bool2);
            }else if("|"==operation.value[1]){
                return (bool1 || bool2);
            }
        }
    }else if("comparision_operation"==operation.kind){
        if("=="==operation.value[1]){
            return checkEqual(operation.value[0], operation.value[2]);
        }else if("!="==operation.value[1]){
            return !checkEqual(operation.value[0], operation.value[2]);
        }else{
            let numValue1 = calcOperation(operation.value[0]);
            let numValue2 = calcOperation(operation.value[2]);
            // ここの条件式怪しい
            if(false===numValue1 || false===numValue2){
                return false;
            }else{
                if(">"==operation.value[1]){
                    return (numValue1 > numValue2);
                }else if("<"==operation.value[1]){
                    return (numValue1 < numValue2);
                }else if(">="==operation.value[1]){
                    return (numValue1 >= numValue2);
                }else if("<="==operation.value[1]){
                    return (numValue1 <= numValue2);
                }
            }
        }
    }else if("arithmetic_operation"==operation.kind){
        try{
            let arithmeticCalculatorResult = arithmeticCalculator.parse(operation.value);
            return arithmeticCalculatorResult;
        }catch(e){
            return false;
        }
    }else if("literal"==operation.kind){
        return operation.value;
    }else{
        return operation;
    }
}

// ラッピングされた要素をラッピングする
function wrapping(data){
    if("literal"==data.kind){
        return data;
    }else if("variable"==data.kind){
        return data;
    }else if("wrapping"==data.kind){
        return {"kind":"wrapping", "value":data};
    }else if("unordered_set"==data.kind){
        let unorderedSet = {"kind":"unordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            unorderedSet.value.push(wrapping(data.value[i]));
        }
        return unorderedSet;
    }else if("ordered_set"==data.kind){
        let orderedSet = {"kind":"ordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            orderedSet.value.push(wrapping(data.value[i]));
        }
        return orderedSet;
    }
}

// ラッピングされた要素のラッピングを取り除く
function unwrapping(data){
    if("literal"==data.kind){
        return data;
    }else if("variable"==data.kind){
        return data;
    }else if("wrapping"==data.kind){
        return data.value;
    }else if("unordered_set"==data.kind){
        let unorderedSet = {"kind":"unordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            unorderedSet.value.push(unwrapping(data.value[i]));
        }
        return unorderedSet;
    }else if("ordered_set"==data.kind){
        let orderedSet = {"kind":"ordered_set", "value":[]};
        for(let i=0;i<data.value.length;i++){
            orderedSet.value.push(unwrapping(data.value[i]));
        }
        return orderedSet;
    }
}

// データが合同か調べる
// 今のところ，unordered set，ordered setには使えない
function checkEqual(data1, data2){
    if(data1.kind==data1.kind && data1.value==data2.value){
        return true;
    }else{
        return false;
    }
}

// テキストからコメントアウト，改行，空白を削除する
function flattenText(text){
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

// ----- データをテキストに変換 -----
function convertDataToText(data){
    let newLineFlag = false;
    for(let i=0;i<data.value.length;i++){
        if("unordered_set"==data.value[i].kind || "ordered_set"==data.value[i].kind){
            newLineFlag = true;
            break;
        }
    }
    let text = "";
    for(let i=0;i<data.value.length;i++){
        if(0!=i){
            if(newLineFlag){
                text += ",\n";
            }else{
                text += ", ";
            }
        }
        text += subConvertDataToText(data.value[i]);
    }
    return text;
}

function subConvertDataToText(data){
    let text = "";
    if("literal"==data.kind){
        text += data.value;
    }else if("variable"==data.kind){
        text += data.value;
    }else if("context"==data.kind){
        text += data.value;
    }else if("bool_operation"==data.kind){
        if(Array.isArray(data.value)){
            text += subConvertDataToText(data.value[0]);
            text += data.value[1];
            if("bool_operation"==data.value[2].kind && Array.isArray(data.value[2].value)){
                text += "(" + subConvertDataToText(data.value[2]) + ")";
            }else{
                text += subConvertDataToText(data.value[2]);
            }
        }else if(true===data.value || false===data.value){
            text += data.value;
        }else if("comparision_operation"==data.value.kind){
            text += subConvertDataToText(data.value);
        }
    }else if("comparision_operation"==data.kind){
        text += subConvertDataToText(data.value[0]);
        text += data.value[1];
        text += subConvertDataToText(data.value[2]);
    }else if("arithmetic_operation"==data.kind){
        text += subConvertDataToText(data.value[0]);
        text += data.value[1];
        if("arithmetic_operation"==data.value[2].kind && Array.isArray(data.value[2].value)){
            text += "(" + subConvertDataToText(data.value[2]) + ")";
        }else{
            text += subConvertDataToText(data.value[2]);
        }
    }else if("wrapping"==data.kind){
        text += "<" + subConvertDataToText(data.value) + ">";
    }else if("unordered_set"==data.kind){
        text += "{";
        for(let i=0;i<data.value.length;i++){
            if(0!=i){
                text += ",";
            }
            text += subConvertDataToText(data.value[i]);
        }
        text += "}";
    }else if("ordered_set"==data.kind){
        if(data.value.length<2){
            text += "[";
        }
        for(let i=0;i<data.value.length;i++){
            if(0!=i){
                text += ":";
            }
            if("ordered_set"==data.value[i].kind && data.value[i].value.length>=2){
                text += "[" + subConvertDataToText(data.value[i]) + "]";
            }else{
                text += subConvertDataToText(data.value[i]);
            }
        }
        if(data.value.length<2){
            text += "]";
        }
    }
    return text;
}

// インストラクションをテキストに変換
function convertInstructionToText(instruction){
    let text = "";
    text += flattenText(convertDataToText(instruction.head));
    let guardText = subConvertDataToText(instruction.guard);
    if("true"!=guardText){
        text += " && " + flattenText(guardText);
    }
    if(""==text){
        text = flattenText(convertDataToText(instruction.body));
    }else{
        text += " -> " + flattenText(convertDataToText(instruction.body));
    }
    return text;
}