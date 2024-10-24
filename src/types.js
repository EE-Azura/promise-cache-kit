/**
 * 检查处理器函数，用于判断是否需要更新缓存值。
 * 
 * @async
 * @callback CheckHandler
 * @param {Object} [options] - 检查选项
 * @param {number} options.prevUpdateTime - 上次更新时间的时间戳
 * @param {*} options.prevValue - 上次缓存的值
 * @returns {Promise<boolean>} 如果返回 true，则使用缓存值；如果返回 false，则获取新值
 */

/**
 * 重试处理器函数，用于控制重试策略。
 *
 * @async
 * @callback RetryHandler
 * @param {Object} [options] - 重试选项
 * @param {number} options.errorCount - 当前失败次数
 * @param {number} options.delay - 上次重试的延迟时间（毫秒）
 * @returns {Promise<boolean>} 如果返回 true，则继续重试；如果返回 false，则停止重试
 */