(function(root, factory) {
  var g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this);
  if (typeof module === 'object' && module && module.exports) {
    module.exports = factory();
  } else {
    g.libCjs = factory();
  }
})(this, function() {
  function greetCjs() { return 'cjs-ok'; }
  return { greetCjs: greetCjs };
});
