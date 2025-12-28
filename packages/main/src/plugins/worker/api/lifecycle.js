/**
 * Lifecycle API 模块
 */
function createLifecycleApi(subscribeSse) {
  return {
    on: (hookName, callback) => {
      return subscribeSse(
        ['lifecycle'],
        (kind, env) => kind === 'lifecycle' && (env.event === hookName || env.payload?.hook === hookName),
        (env) => callback(env.payload)
      );
    },
  };
}

module.exports = { createLifecycleApi };

