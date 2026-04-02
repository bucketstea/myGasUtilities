/**
 * utils.gs
 *
 * シートや業務に依存しない、汎用的小物関数群。
 *
 * 方針:
 * - 本当に汎用なものだけ置く
 * - sheetUtils や entities に入るべきものは入れない
 * - 何でも箱にしすぎない
 */


/* =========================
 * blank / null
 * ========================= */

/**
 * null / undefined / 空文字 / 空白文字のみ を空とみなす
 *
 * @param {*} value
 * @returns {boolean}
 */
function isBlank(value) {
  return value == null || String(value).trim() === '';
}

/**
 * blankでなければ true
 *
 * @param {*} value
 * @returns {boolean}
 */
function isNotBlank(value) {
  return !isBlank(value);
}

/**
 * null / undefined をデフォルト値に置き換える
 *
 * @param {*} value
 * @param {*} defaultValue
 * @returns {*}
 */
function nvl(value, defaultValue) {
  return value == null ? defaultValue : value;
}


/* =========================
 * string
 * ========================= */

/**
 * 安全に文字列化する
 * null / undefined は既定では空文字
 *
 * @param {*} value
 * @param {string=} defaultValue
 * @returns {string}
 */
function toStr(value, defaultValue) {
  const fallback = defaultValue || '';
  return value == null ? fallback : String(value);
}

/**
 * 前後空白除去のうえ文字列化する
 *
 * @param {*} value
 * @param {string=} defaultValue
 * @returns {string}
 */
function trimStr(value, defaultValue) {
  return toStr(value, defaultValue).trim();
}

/**
 * 指定長で左ゼロ埋め
 *
 * @param {*} value
 * @param {number} length
 * @returns {string}
 */
function padLeftZero(value, length) {
  return toStr(value).padStart(length, '0');
}


/* =========================
 * number / boolean
 * ========================= */

/**
 * 数値化する。失敗時は defaultValue を返す
 *
 * @param {*} value
 * @param {number=} defaultValue
 * @returns {number}
 */
function toNumber(value, defaultValue) {
  const fallback = defaultValue || 0;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

/**
 * 整数化する。失敗時は defaultValue を返す
 *
 * @param {*} value
 * @param {number=} defaultValue
 * @returns {number}
 */
function toInt(value, defaultValue) {
  return parseInt(toStr(value), 10) || (defaultValue || 0);
}

/**
 * 真偽値っぽい値を boolean 化する
 * true とみなす例: true, 'true', '1', 1, 'yes', 'on'
 *
 * @param {*} value
 * @returns {boolean}
 */
function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = trimStr(value).toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalized);
}


/* =========================
 * array
 * ========================= */

/**
 * 配列を指定サイズごとの配列に分割する
 *
 * @template T
 * @param {T[]} array
 * @param {number} size
 * @returns {T[][]}
 */
function chunk(array, size) {
  if (!Array.isArray(array) || array.length === 0) {
    return [];
  }

  if (size <= 0) {
    throw new Error(`chunk size must be greater than 0. size=${size}`);
  }

  const result = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }

  return result;
}

/**
 * 2次元配列を1次元化する
 *
 * @template T
 * @param {T[][]} twoDimArray
 * @returns {T[]}
 */
function flatten2D(twoDimArray) {
  if (!Array.isArray(twoDimArray) || twoDimArray.length === 0) {
    return [];
  }

  return [].concat(...twoDimArray);
}

/**
 * 重複除去
 *
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function unique(array) {
  return [...new Set(array || [])];
}

/**
 * 最初の一致要素を返す。なければ null
 *
 * @template T
 * @param {T[]} array
 * @param {function(T): boolean} predicate
 * @returns {T|null}
 */
function findOrNull(array, predicate) {
  if (!Array.isArray(array)) {
    return null;
  }

  const found = array.find(predicate);
  return found === undefined ? null : found;
}

/**
 * groupBy
 *
 * @template T
 * @param {T[]} array
 * @param {function(T): string} keySelector
 * @returns {Object<string, T[]>}
 */
function groupBy(array, keySelector) {
  const result = {};

  (array || []).forEach((item) => {
    const key = String(keySelector(item));
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  });

  return result;
}

/**
 * indexBy
 * キー重複時は後勝ち
 *
 * @template T
 * @param {T[]} array
 * @param {function(T): string} keySelector
 * @returns {Object<string, T>}
 */
function indexBy(array, keySelector) {
  const result = {};

  (array || []).forEach((item) => {
    const key = String(keySelector(item));
    result[key] = item;
  });

  return result;
}

/**
 * 配列の和
 *
 * @param {Array<*>} array
 * @returns {number}
 */
function sum(array) {
  return (array || []).reduce((acc, value) => acc + toNumber(value, 0), 0);
}


/* =========================
 * object
 * ========================= */

/**
 * 浅いコピー
 *
 * @param {Object} obj
 * @returns {Object}
 */
function shallowClone(obj) {
  return Object.assign({}, obj);
}

/**
 * 浅いマージ
 *
 * @param {Object} baseObj
 * @param {Object} overrideObj
 * @returns {Object}
 */
function merge(baseObj, overrideObj) {
  return Object.assign({}, baseObj || {}, overrideObj || {});
}

/**
 * 指定キーだけ抜き出す
 *
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
function pick(obj, keys) {
  const result = {};

  (keys || []).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });

  return result;
}

/**
 * 指定キーを除外する
 *
 * @param {Object} obj
 * @param {string[]} keys
 * @returns {Object}
 */
function omit(obj, keys) {
  const excluded = new Set(keys || []);
  const result = {};

  Object.keys(obj || {}).forEach((key) => {
    if (!excluded.has(key)) {
      result[key] = obj[key];
    }
  });

  return result;
}


/* =========================
 * compare / sort helper
 * ========================= */

/**
 * 昇順比較
 *
 * @param {*} a
 * @param {*} b
 * @returns {number}
 */
function compareAsc(a, b) {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? -1 : 1;
}

/**
 * 降順比較
 *
 * @param {*} a
 * @param {*} b
 * @returns {number}
 */
function compareDesc(a, b) {
  return compareAsc(b, a);
}


/* =========================
 * error
 * ========================= */

/**
 * 値チェック。blankなら例外
 *
 * @param {*} value
 * @param {string} message
 * @returns {*}
 */
function requireNotBlank(value, message) {
  if (isBlank(value)) {
    throw new Error(message || 'Required value is blank.');
  }
  return value;
}

/**
 * 条件チェック。falseなら例外
 *
 * @param {boolean} condition
 * @param {string} message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed.');
  }
}
