
const OBSWebSocket = window.require('obs-websocket-js');
const cjsLib = window.require('lib-cjs');
const esNamedLib = window.require('lib-es-named');
const esDefaultLib = window.require('lib-es-default');
const _ = window.require('lodash');
const timeago = window.require('timeago.min.js');


window.afterLoaded = async () => {
  console.log('plugin_afterLoaded');
};

window.handleMessage = async (type, payload) => {
  if (type === 'ping') {
    return { ok: true, pong: true };
  }
  return { ok: true };
};

window.cleanup = async () => {
  console.log('plugin_cleanup');
};

window.init = async () => {
  console.log('OBSWebSocket:', OBSWebSocket);
  console.log('lodash:', _);
  console.log('timeago:', timeago);

  try {
    let r1 = 'cjs-missing';
    if (cjsLib && typeof cjsLib.greetCjs === 'function') {
      r1 = cjsLib.greetCjs();
    } else if (cjsLib && typeof cjsLib === 'function') {
      r1 = cjsLib();
    } else if (cjsLib && cjsLib.exports && typeof cjsLib.exports.greetCjs === 'function') {
      r1 = cjsLib.exports.greetCjs();
    }
    console.log('cjsLib:', r1);
  } catch (e) { console.error('cjsLib error', e && e.message ? e.message : String(e)); }

  try {
    let r2 = 'es-named-missing';
    if (esNamedLib && typeof esNamedLib.greetNamed === 'function') {
      r2 = esNamedLib.greetNamed();
    } else if (typeof esNamedLib === 'function') {
      r2 = esNamedLib();
    }
    console.log('esNamedLib:', r2);
  } catch (e) { console.error('esNamedLib error', e && e.message ? e.message : String(e)); }

  try {
    const r3 = typeof esDefaultLib === 'function' ? esDefaultLib() : 'es-default-missing';
    console.log('esDefaultLib:', r3);
  } catch (e) { console.error('esDefaultLib error', e && e.message ? e.message : String(e)); }

  return { ok: true };
};
