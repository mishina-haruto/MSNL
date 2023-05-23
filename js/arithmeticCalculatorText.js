let arithmeticCalculatorText =
`
Expression
  = head:Term tail:(("+" / "-") Term)* {
      return tail.reduce(function(result, element) {
        if (element[0] === "+") { return result + element[1]; }
        if (element[0] === "-") { return result - element[1]; }
      }, head);
    }

Term
  = head:Factor tail:(("*" / "/") Factor)* {
      return tail.reduce(function(result, element) {
        if (element[0] === "*") { return result * element[1]; }
        if (element[0] === "/") { return result / element[1]; }
      }, head);
    }

Factor
  = "(" expr:Expression ")" { return expr; }
  / Integer

Integer "integer"
  = [0-9]+ { return parseInt(text(), 10); }
  / "-" [0-9]+ { return parseInt(text(), 10); }

`;