# Overview

CSSX is a web UI framework with file-path routing. You've heard of CSS-in-JS, and CSS pre/post-processors like SASS, LESS, and Tailwind - but now get ready for a whole new world of CSS driven development, with CSSX!

## Why?

I built CSS because I thought it was an entertaining idea and would parallel the million JS frameworks that exist. It doesn't really have a purpose except to entertain and see if it was possible.

## Getting Started

From the terminal, run `npx create-cssx@latest` or `npm create cssx@latest`, and follow the prompts to set up a basic template. From there run `(npm | yarn | pnpm | bun) install` > `(npm | yarn | pnpm | bun) start` to spin up the local dev environment.

## Folder Structure

As CSSX is a file-path route based framework, the default template expects each page to be a `.cssx` file within a `./routes` directory. This can be updated by changing the directory path passed into the `generateRoutes()` function in the `app.js` file.

Any mixins or shared components that are setup can be stored however you like, and then referenced as imports (`@import '{relative_path_to_file}';`) relative to the calling file.

## Code Structure

### Overview

`.cssx` files have roughly the same format as a standard `.css` file, but with some additional functions like mixins in order to provide functionality for shared component styling.

To render elements on the page, simply write the CSS you require, but include the element tag in the specificity of the class (ie. `div.root` would render a `div` element with the class `root`). Any element attributes you wish to include can be added in the same format as CSS variables nested within the class definition.

In order to define nested elements, just nest the CSS class definitions under the appropriate parent, like you would structure regular CSS.

eg.

```css
div.root {
    color: red;
    --title: Div Title;
    --text: Some text;

    button {
        border-radius: 8px;
        color: blue;
        --onclick: alert('Button clicked!');
        --text: Click me;
        --type: button;
    }
}
```

would become =>

```html
<div class="root" title="Div Title">
    Some text
    <button onclick="alert('Button clicked!')" type="button">
        Click me
    </button>
</div>
```

with the stylesheet

```css
div.root {
    color: red;

    button {
        border-radius: 8px;
        color: blue;
    }
}
```

### Mixins / Shared Components

Mixins can be defined with the syntax below:

```css
@mixin mixinName($param1: defaultValue1, $param2: defaultValue2) {
    ...
}
```

and referenced as an `@include` statement: `@include mixinName();` (For brevity, the parentheses can be omitted if empty `@include mixinName;`)

Mixin parameters can be overridden when including in a component, but if defining overrides then all parameters must be defined - ie. either define all of them, or leave them empty. If not all parameters are to be overridden, then the value `default` can be used as a placeholder: `@include mixinName(default, overrideValue);`

A mixin can either be defined as a full component, with the element definition at the top level:

```css
@mixin standardButton($backgroundColor: lightgreen, $hoverColor: lightblue, $class: example, $borderRadius: 6px, $type: button) {
    button {
        background-color: $backgroundColor;
        --borderRadius: $borderRadius;
        --class: $class;
        --type: $type;

        &:hover {
            background-color: $hoverColor;
        }
    }
}

div.root {
    @include standardButton;
}
```

or just as the nested styles / attributes / children, depending how you wish to interact with them

```css
@mixin standardButton($backgroundColor: lightgreen, $hoverColor: lightblue, $class: example, $borderRadius: 6px, $type: button) {
    background-color: $backgroundColor;
    --borderRadius: $borderRadius;
    --class: $class;
    --type: $type;

    &:hover {
        background-color: $hoverColor;
    }
}

div.root {
    button {
        @include standardButton;
    }
}
```

### Event functions

Javascript functions can be defined inline for components, and will be transpiled to the appropriate element event attribute.

```css
button.aButton {
    --onclick: "console.log('test');";
    --type: "button";
    --text: "Click me";
}
```

=> 

```html
<button type="button" onclick="console.log('test');">
    Click me
</button>
```

Defining functions across multiple lines is also possible, however to maintain similarity with standard CSS formatting, the event attribute needs to be defined for every single line. This will then get transpiled into a single line concatenated string on the event attribute.

> Note: When doing multiline functions, don't forget your semi-colons to break separate functions up - CSSX just joins the strings with spaces and isn't smart enough to know where semi-colons should go!

```css
button.anotherButton {
    --onclick: "console.log('test');";
    --onclick: "setInterval(() => {";
    --onclick: "document.getElementById('picture-gallery').scrollBy({left: -25, behavior: 'smooth'})";
    --onclick: "}, 100)";
    --text: "Click me again";
}
```

=>

```html
<button class="anotherButton" onclick="console.log('test'); setInterval(() => { document.getElementById('picture-gallery').scrollBy({left: -25, behavior: 'smooth'}) }, 100)">
    Click me again
</button>
```

To make shared functions, simply pull your event attribute definitions out into a mixin, and `@include` them like a normal mixin.

> Note: Mixin params are determined at **compile time**, so ensure that your mixin functions cater for this.

```scss
@mixin testFunction() {
    --onclick: "console.log('test');";
    --onclick: "setInterval(() => {";
    --onclick: "document.getElementById('picture-gallery').scrollBy({left: -25, behavior: 'smooth'})";
    --onclick: "}, 100)";
}

button.anotherButton {
    @include testFunction;
    --text: "Click me again";
}
```

#### Built-in Function Variables

CSSX has some built-in function variables to simplify the code needed for event functions. They can be referenced for any event function and will be replaced via string replacement at compile time. The functionality of these built-in functions can be overidden by redefining a variable with the same name within your CSSX.

These are defined below:

```js
const BUILT_IN_FUNCTIONS = {
  '$setVariable': 'document.styleSheets[0].cssRules[0].style.setProperty',
  '$getVariable': 'document.styleSheets[0].cssRules[0].style.getPropertyValue',
  '$parseObject': 'JSON.parse',
  '$stringifyObject': 'JSON.stringify',
}
```

Example:

```scss
button {
    --onclick: $getVariable('--object');
    --text: "Click";
    --type: "button";
}
```

=>

```html
<button onclick="document.styleSheets[0].cssRules[0].style.getPropertyValue('--object')" type="button">
    Click
</button>
```

### Complex objects

All variables used to interact with the UI in CSSX are managed as CSS variables (ie `--variable: value;`), and need to be defined as **immediate children of the root object**. As CSSX is a line-by-line framework, and isn't smart enough to understand complex object variables, these need to be defined as single line string values as well (ie `--form: {"name": null, "email": null};`).

In order to perform any object manipulation, these variables will then need to be parsed to an object first.

An example for alerting an object might be:

```scss
div.page {
    --form: {"name": null, "email": null};

    button {
        --onclick: alert($parseObject($getVariable('--form')));
        --type: "button";
    }
}
```