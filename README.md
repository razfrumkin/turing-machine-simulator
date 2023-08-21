# turing-machine-simulator

A website that allows the simulation of a Turing machine. The website comes with a text editor in which the user writes a script for the behavior of the turing machine. The turing machine is later simulated via a tape which is visualized in the DOM.

## Getting Started

This guide will walk you through the steps to set up and run the website using Vite. By following these steps, you'll be able to to run the simulator locally on your machine.

### Requirements

In order to run the website, ensure you have installed the following requirements:

- **[Node.js](https://nodejs.org/)**: Make sure you have Node.js installed on your machine. If you're not familiar with Node.js, it's a runtime environment that allows you to run JavaScript on the server side.

### Installation

1. **Clone the Repository**: Start by cloning this repository to your local machine:
```bash
git clone https://github.com/razfrumkin/turing-machine-simulator.git
```

2. **Navigate to the Directory**: Change your working directory to the cloned repository:
```bash
cd turing-machine-simulator
```

3. **Install Dependencies**: Use npm or yarn to install the project's dependencies:
```bash
npm install
# or
yarn install
```
The following dependencies will be installed:
- [typescript](https://www.npmjs.com/package/typescript): TypeScript programming language
- [ts-node](https://www.npmjs.com/package/ts-node): TypeScript execution environment for development and testing
- [vite](https://www.npmjs.com/package/vite): Vite build tool for fast development

### Running the Website

Execute the following command to start the Vite development server:
```bash
npm run dev
# or
yarn dev
```

### Building the Website

Execute the following command to build the website:
```bash
npm run build
# or
yarn build
```
This command will compile TypeScript code and generate a build of the website. After the build process completes, you'll find the generated artifacts in a `dist` directory within the project's root directory.
The `dist` directory will contain the `index.html` file, which serves as the entry point for the website. This directory will also contain other assets, such as JavaScript files, CSS styles, and any other essential resources.

## Language

This language is designed to define the behavior of a Turing machine. Below, you'll find a guide to the syntax and usage of the scripting language.

### Structure

#### States

The script is composed of of various states, each of which defines the behavior of the Turing machine when it encounters specific symbols on the tape.
```
state <state-id> {
    <case> / <replacement>, <direction> -> <target-state-id>
}
```
- `state-id`: The name of the state.
- `case`: The scanned character.
- `replacement`: The inserted character.
- `direction`: The direction in which the head moves. (`L` and `R` for left and right respectively)
- `target-state-id`: The name of the state to enter.

In this example, whenever the machine encounters `1` it replaces it with `0`, moves the head one unit to the right, and switches to state `q2`.
```
state q1 {
    '1' / '0', R -> q2
}
```

Every turing machine has exactly one start state. To define such a state we insert the `initial` keyword before defining the state as such:
```
initial state q0 {
    '0' / '1', R -> q0
}
```

In the previous example, we can see that the state and the target state match. In that case we can use the `self` keyword as such:
```
initial state q0 {
    '0' / '1', R -> self
}
```

#### Constants

We can also define constants that represent characters instead of writing a character expression every time. We can define constants only at the top level.
```
define <name> <character>
```
- `name`: The name of the constant.
- `character`: The represented character.

```
define blank ' '
define seperator '$'

state q2 {
    blank / seperator, R -> q3
}
```
This is the equivalent of writing the following code:
```
state q2 {
    ' ' / '$', R -> q3
}
```

#### Comments

Comments are indicated using the `#` symbol. Comments are enclosed by `#` symbols at both the beginning and the end of the comment text.
```
# This is a comment #
```
The language also supports multiline comments:
```
#
the following state works as such:
everytime '0' is countered replace it with '1' and move the head to the left.
if '1' is encountered move the head to the left and switch to state q4
#

state q3 {
    '0' / '1', L -> self
    '1' / '1', L -> q4
}
```

---

Here is a script of a turing machine that adds one to a number represented in binary:
```
# define constants #
define blank ' '

# start state #
initial state right {
    # move right and scan symbols #
    '1' / '1', R -> self
    '0' / '0', R -> self
    blank / blank, L -> carry
}

# carry state #
state carry {
    '1' / '0', L -> self
    '0' / '1', L -> done
    blank / '1', L -> done
}

# done state #
state done {
    # halt state #
}
```

### Notes

- The language is not whitespace sensitive.
- State names and constant names can only start with an alphabetical letter or underscore. For the rest of the name they can also contain numbers.
- Escape sequences are not supported for character expressions.
