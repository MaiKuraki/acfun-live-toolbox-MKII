import { parentPort as r, workerData as a } from "node:worker_threads";
function e(t) {
  return t * 2 + 1;
}
function o() {
  const t = e(123);
  r?.postMessage({
    workerData: a,
    result: t,
    message: "Worker started with calculation"
  });
}
o();
