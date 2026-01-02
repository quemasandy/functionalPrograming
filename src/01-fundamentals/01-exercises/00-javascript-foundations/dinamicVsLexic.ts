"use strict";

function fooDinamico() {
  // @ts-ignore
  console.log(111, this);
}

const fooLexico = () => {
  // @ts-ignore
  console.log(222, this);
}

const fooDinamicoBound = fooDinamico.bind({a: 1});
const fooDinamicoResult = fooDinamicoBound();
console.log('[fooDinamicoResult]', fooDinamicoResult);

const fooLexicoBound = fooLexico.bind({b: 1});
const fooLexicoResult = fooLexicoBound();
console.log('[fooLexicoResult]', fooLexicoResult);