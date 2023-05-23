# A Prototype Language Processor of MSNL

**An online processing system of MSNL. This system was implemented for the demonstration of the poster presentation at PPL 2023.**

![the poster presentation at PPL 2023](img/mishina_ppl2023.png)

The programming language MSNL uses four elementary concepts (Mulitset, Sequence, Nest, Layer) to handle various data structures in a unified and concise manner. This makes it easy to combine different data structures and lowers the learning cost.

The name MSNL is derived from Mulitset, Sequence, Nest, Layer and Mishina Language.

## Getting Started

Try this at https://mishina-haruto.github.io/MSNL/.

## How to use

1. Write MSNL program in the program area. &emsp; or &emsp; Select an example.

2. Press RUN or STEP button.

## Directory Structures

[/](.) : root

| File                 | Description    |
| -------------------- | -------------- |
| [index.html](/index.html) | Format the GUI |

[/js](js) : Javascript files

| File                                                          | Description                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [main.js](js/main.js)                                         | The main program.                                                                 |
| [peg-0.10.0.js](js/peg-0.10.0.min.js)                         | Parsing Expression Grammar in Javascirpt.(MIT License)                            |
| [parserText.js](js/parserText.js)                             | Syntax of MSNL programs. (Give to [peg-0.10.0.js](js/peg-0.10.0.min.js).)         |
| [arithmeticCalculatorText.js](js/arithmeticCalculatorText.js) | Calculate arithmetic operations. (Give to [peg-0.10.0.js](js/peg-0.10.0.min.js).) |
| [examples.js](js/examples.js)                                 | Examples of MSNL programs.                                                        |

[/css](css) : css files

| File                 | Description                   |
| -------------------- | ----------------------------- |
| [style.css](css/style.css) | Decorate [index.html](/index.html) |


[/img](img) : images

| File                                           | Description                       |
| ---------------------------------------------- | --------------------------------- |
| [logo.png](img/logo.png)                       | Image of logo.                    |
| [mishina_ppl2023.png](img/mishina_ppl2023.png) | Image of the poster presentation. |