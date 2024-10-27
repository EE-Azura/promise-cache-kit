[简体中文](./README.md) | English

# promise-cache-kit

`promise-cache-kit` is a utility library for caching Promise results, supporting both CommonJS and ES modules. It provides two main functions:

- `createCachedPromise` for caching the result of an asynchronous function, with a `checkHandler` to customize cache validity checks.
- `createCachedRequest` for caching different asynchronous function results based on input parameters, with support for setting cache strategies.

## Features

- **Cache Promise results**: Avoid repeated asynchronous operations and improve performance.
- **Support cache clearing**: Manually clear the cache when needed.
- **Support CommonJS and ES modules**: Compatible with various module systems.
- **Easy to use**: Simple API, easy to integrate into existing projects.

## Installation

Install using npm:

```sh
npm install promise-cache-kit
```

## Usage

### createCachedPromise

`createCachedPromise` is used to create a Promise function with caching capabilities.

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

  console.log(result1); // Output: 42
  console.log(result2); // Output: 42
  console.log(callCount); // Output: 1

  cachedPromise.clearCache();
  const result3 = await cachedPromise();

  console.log(result3); // Output: 42
  console.log(callCount); // Output: 2
})();
```

### createCachedRequest

`createCachedRequest` is used to create a request function with caching capabilities.

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

  console.log(result1); // Output: 42
  console.log(result2); // Output: 42
  console.log(result3); // Output: 43
  console.log(callCount); // Output: 2

  cachedRequest.clearCache();
  const result4 = await cachedRequest({ value: 42 });

  console.log(result4); // Output: 42
  console.log(callCount); // Output: 3
})();
```

## API

### `createCachedPromise`

#### `createCachedPromise(target, checkHandler, retry)`

| Parameter      | Type                           | Default                                 | Description                                                                                                                          |
| -------------- | ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `target`       | Function                       | None                                    | The asynchronous function to be cached                                                                                               |
| `checkHandler` | Function (optional)            | [`defaultCheckHandler`](src/default.js) | Callback function to determine if the cache needs updating `({ prevUpdateTime, prevValue }) => {}`                                   |
| `retry`        | Function \| boolean (optional) | `true`                                  | Retry strategy configuration. `true` uses the [default retry strategy](src/default.js), `false` disables retry, or a custom function |

Returns a Promise function with caching capabilities, along with a `clearCache` method.

#### `cachedPromise(options)`

| Parameter | Type    | Default | Description                        |
| --------- | ------- | ------- | ---------------------------------- |
| `options` | Object  | None    | Call options                       |
| `fresh`   | boolean | `false` | Whether to force refresh the cache |

Returns the result of the target function.

#### `cachedPromise.clearCache()`

Clears the current cache.

### `createCachedRequest`

#### `createCachedRequest(target, options)`

| Parameter                   | Type                | Default          | Description                                                                                                                          |
| --------------------------- | ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `target`                    | Function            | None             | The asynchronous function to be cached                                                                                               |
| `options`                   | Object (optional)   | None             | Configuration options                                                                                                                |
| `options.max`               | Number              | `Infinity`       | Maximum cache size                                                                                                                   |
| `options.cacheKeyGenerator` | Function            | `JSON.stringify` | Custom cache key generator function                                                                                                  |
| `options.retry`             | Function \| boolean | `true`           | Retry strategy configuration. `true` uses the [default retry strategy](src/default.js), `false` disables retry, or a custom function |
| `options.ttl`               | Number              | None             | Time-to-live for the cache (in milliseconds)                                                                                         |

Returns a request function with caching capabilities, along with a `clearCache` method.

#### `cachedRequest(params, options)`

| Parameter | Type    | Default | Description                          |
| --------- | ------- | ------- | ------------------------------------ |
| `params`  | Object  | None    | Call parameters (passed to `target`) |
| `options` | Object  | None    | Call options                         |
| `fresh`   | boolean | `false` | Whether to force refresh the cache   |

Returns the result of the target function.

#### `cachedRequest.getStats()`

Returns cache statistics, including hit count, miss count, total request count, hit rate, and current cache size.

#### `cachedRequest.clearCache()`

Clears the current cache.

## License

[Mozilla Public License Version 2.0](LICENSE)
