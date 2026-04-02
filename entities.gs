/**
 * entities.gs
 *
 * 汎用的なデータラップ系クラスの骨組み。
 * 最終的には業務クラスへ寄せて継承・流用する前提。
 *
 * 方針:
 * - API依存を持たせない
 * - 配列 / オブジェクトとの相互変換をしやすくする
 * - 必要最小限のバリデーション拡張ポイントだけ用意する
 */


/**
 * 全レコードの基底クラス
 */
class BaseRecord {
  constructor() {
    if (new.target === BaseRecord) {
      throw new Error('BaseRecord is abstract and cannot be instantiated directly.');
    }
  }

  /**
   * バリデーション
   * 子クラス側で必要に応じて上書きする
   *
   * @returns {string[]} エラーメッセージ配列
   */
  validate() {
    return [];
  }

  /**
   * バリデーション結果が正常か
   *
   * @returns {boolean}
   */
  isValid() {
    return this.validate().length === 0;
  }

  /**
   * プレーンオブジェクト化
   * 子クラスで必要に応じて上書き可
   *
   * @returns {Object}
   */
  toObject() {
    const obj = {};

    Object.keys(this).forEach((key) => {
      obj[key] = this[key];
    });

    return obj;
  }

  /**
   * デバッグ用文字列表現
   *
   * @returns {string}
   */
  toString() {
    return JSON.stringify(this.toObject());
  }
}


/**
 * 1行配列ベースのレコード基底クラス
 *
 * 使い方:
 * - 子クラスで static columns を定義する
 * - static fromRow(row) で生成できる
 * - toRow() で配列に戻せる
 *
 * columns 例:
 * [
 *   'id',
 *   'name',
 *   'amount'
 * ]
 */
class RowRecord extends BaseRecord {
  constructor(data) {
    super();

    const source = data || {};
    const columns = this.constructor.columns || [];

    columns.forEach((columnName) => {
      this[columnName] = source[columnName];
    });
  }

  /**
   * 行配列からインスタンス生成
   *
   * @param {Array<*>} row
   * @returns {RowRecord}
   */
  static fromRow(row) {
    const columns = this.columns || [];
    const data = {};

    columns.forEach((columnName, index) => {
      data[columnName] = row[index];
    });

    return new this(data);
  }

  /**
   * 複数行から複数インスタンス生成
   *
   * @param {Array<Array<*>>} rows
   * @returns {RowRecord[]}
   */
  static fromRows(rows) {
    return (rows || []).map((row) => this.fromRow(row));
  }

  /**
   * プレーンオブジェクトから生成
   *
   * @param {Object} obj
   * @returns {RowRecord}
   */
  static fromObject(obj) {
    return new this(obj);
  }

  /**
   * 1行配列へ変換
   *
   * @returns {Array<*>}
   */
  toRow() {
    const columns = this.constructor.columns || [];
    return columns.map((columnName) => this[columnName]);
  }

  /**
   * 複数インスタンスを複数行へ変換
   *
   * @param {RowRecord[]} records
   * @returns {Array<Array<*>>}
   */
  static toRows(records) {
    return (records || []).map((record) => record.toRow());
  }

  /**
   * 列定義を返す
   *
   * @returns {string[]}
   */
  static getColumns() {
    return [...(this.columns || [])];
  }
}


/**
 * 単純な key-value 保持用の軽量レコード
 * 配列ベースではなく、純粋にオブジェクトを包みたい時向け
 */
class KeyValueRecord extends BaseRecord {
  constructor(data) {
    super();

    const source = data || {};
    Object.keys(source).forEach((key) => {
      this[key] = source[key];
    });
  }

  /**
   * オブジェクトから生成
   *
   * @param {Object} obj
   * @returns {KeyValueRecord}
   */
  static fromObject(obj) {
    return new this(obj);
  }

  /**
   * 値取得
   *
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this[key];
  }

  /**
   * 値設定
   *
   * @param {string} key
   * @param {*} value
   * @returns {KeyValueRecord}
   */
  set(key, value) {
    this[key] = value;
    return this;
  }

  /**
   * キー存在判定
   *
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return Object.prototype.hasOwnProperty.call(this, key);
  }
}
