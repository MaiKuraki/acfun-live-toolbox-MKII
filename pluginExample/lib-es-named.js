(function(root){
  var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  function greetNamed() { return 'es-named-ok'; }
  g.libEsNamed = { greetNamed: greetNamed };
})(this);
