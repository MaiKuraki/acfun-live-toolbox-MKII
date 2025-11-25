(function(root){
  var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  function greetDefault() { return 'es-default-ok'; }
  g.libEsDefault = greetDefault;
})(this);
