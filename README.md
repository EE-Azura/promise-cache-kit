# promise-cache-kit

`promise-cache-kit` 是一个用于缓存 Promise 结果的实用工具库，支持 CommonJS 和 ES 模块。它提供了两个主要功能：

- `createCachedPromise` 用于缓存一个异步函数的结果，并提供 checkHandler 用于自定义缓存有效性判断。
- `createCachedRequest` 用于根据不同的输入参数缓存不同的异步函数结果，并支持设置缓存策略。

## 特性

- **缓存 Promise 结果**：避免重复的异步操作，提高性能。
- **支持缓存清除**：可以手动清除缓存。
- **支持 CommonJS 和 ES 模块**：兼容多种模块系统。
- **易于使用**：简单的 API，易于集成到现有项目中。

## 安装

使用 npm 安装：

```sh
npm install promise-cache-kit
```

## 使用方法

### createCachedPromise

`createCachedPromise` 用于创建一个带缓存功能的 Promise 函数。

```js
import { createCachedPromise } from 'promise-cache-kit';

let callCount = 0;
const target = async () => {
  callCount++;
  return 42;
};

const cachedPromise = createCachedPromise(target);

(async () => {
  const result1 = await cachedPromise();
  const result2 = await cachedPromise();

  console.log(result1); // 输出: 42
  console.log(result2); // 输出: 42
  console.log(callCount); // 输出: 1

  cachedPromise.clearCache();
  const result3 = await cachedPromise();

  console.log(result3); // 输出: 42
  console.log(callCount); // 输出: 2
})();
```

### createCachedRequest

`createCachedRequest` 用于创建一个带缓存功能的请求函数。

```js
import { createCachedRequest } from 'promise-cache-kit';

let callCount = 0;
const target = async params => {
  callCount++;
  return params.value;
};

const cachedRequest = createCachedRequest(target, { ttl: 1000 });

(async () => {
  const result1 = await cachedRequest({ value: 42 });
  const result2 = await cachedRequest({ value: 42 });
  const result3 = await cachedRequest({ value: 43 });

  console.log(result1); // 输出: 42
  console.log(result2); // 输出: 42
  console.log(result3); // 输出: 43
  console.log(callCount); // 输出: 2

  cachedRequest.clearCache();
  const result4 = await cachedRequest({ value: 42 });

  console.log(result4); // 输出: 42
  console.log(callCount); // 输出: 3
})();
```

## API

### `createCachedPromise`

#### `createCachedPromise(target, checkHandler, retry)`

| 参数           | 类型                       | 默认值                                  | 描述                                                                    |
| -------------- | -------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `target`       | Function                   | 无                                      | 需要缓存的异步函数                                                      |
| `checkHandler` | Function (可选)            | [`defaultCheckHandler`](src/default.js) | 判断值是否需要更新的回调函数 `({ prevUpdateTime, prevValue }) => {}`    |
| `retry`        | Function \| boolean (可选) | `true`                                  | 重试策略配置。`true` 使用默认重试策略，`false` 不启用重试，或自定义函数 |

返回一个带缓存功能的 Promise 函数，并附带一个 `clearCache` 方法。

#### `cachedPromise(options)`

| 参数      | 类型    | 默认值  | 描述             |
| --------- | ------- | ------- | ---------------- |
| `options` | Object  | 无      | 调用选项         |
| `fresh`   | boolean | `false` | 是否强制刷新缓存 |

返回目标函数的结果。

#### `cachedPromise.clearCache()`

清除当前缓存。

### `createCachedRequest`

#### `createCachedRequest(target, options)`

| 参数                        | 类型                | 默认值           | 描述                                                                                      |
| --------------------------- | ------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `target`                    | Function            | 无               | 需要缓存的异步函数                                                                        |
| `options`                   | Object (可选)       | 无               | 配置选项                                                                                  |
| `options.max`               | Number              | `Infinity`       | 最大缓存数                                                                                |
| `options.cacheKeyGenerator` | Function            | `JSON.stringify` | 自定义缓存键生成函数                                                                      |
| `options.retry`             | Function \| boolean | `true`           | 重试策略配置。`true` 使用[默认重试策略](src/default.js)，`false` 不启用重试，或自定义函数 |
| `options.ttl`               | Number              | 无               | 缓存的生存时间（毫秒）                                                                    |

返回一个带缓存功能的请求函数，并附带一个 `clearCache` 方法。

#### `cachedRequest(params, options)`

| 参数      | 类型    | 默认值  | 描述                        |
| --------- | ------- | ------- | --------------------------- |
| `params`  | Object  | 无      | 调用参数（传递给 `target`） |
| `options` | Object  | 无      | 调用选项                    |
| `fresh`   | boolean | `false` | 是否强制刷新缓存            |

返回目标函数的结果。

#### `cachedRequest.getStats()`

返回缓存统计信息，包括命中次数、未命中次数、总请求次数、命中率和当前缓存大小。

#### `cachedRequest.clearCache()`

清除当前缓存。

## 许可证

[Mozilla Public License Version 2.0](LICENSE)
