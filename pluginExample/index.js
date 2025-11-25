const path = require('path');
const { Worker } = require('worker_threads');

const worker = new Worker(path.join(__dirname, 'plugin-worker.js'), {
  workerData: {
    pluginId: 'obs-example',
    pluginPath: path.join(__dirname, 'test.js')
  }
});

worker.on('message', (msg) => {
  if (!msg) return;
  if (msg.type === 'plugin_log') {
    const { level, message } = msg;
    if (level === 'error') console.error(message);
    else if (level === 'warn') console.warn(message);
    else console.log(message);
    return;
  }
  if (msg.type === 'memory_usage') {
    console.log('memory_usage', msg.usage);
    return;
  }
  if (msg.type === 'result') {
    if (msg.error) console.error('result_error', msg.error);
    else console.log('result', msg.result);
    return;
  }
  if (msg.type === 'execution_complete') {
    console.log('execution_complete');
    return;
  }
});

worker.on('error', (err) => {
  console.error('worker_error', err && err.message ? err.message : String(err));
});

worker.on('exit', (code) => {
  console.log('worker_exit', code);
});

setTimeout(() => {
  worker.postMessage({ type: 'execute', method: 'init', args: [] });
}, 10);
