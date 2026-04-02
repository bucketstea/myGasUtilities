/**
 * sheetUtils.gs
 *
 * Spreadsheet / Sheet 操作のうち、
 * 毎回ベタ書きすると煩雑になりやすい定型だけを切り出す。
 *
 * 方針:
 * - GAS生APIの可読性は残す
 * - 1対1の無意味なラップはしない
 * - 行数計算、空判定、存在保証などを補助する
 */


/**
 * 必須シート取得
 * 存在しなければ例外を投げる。
 *
 * @param {string} sheetName
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet=} spreadsheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getRequiredSheet(sheetName, spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet not found: ${sheetName}`);
  }

  return sheet;
}


/**
 * シート取得。存在しなければ作成。
 *
 * @param {string} sheetName
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet=} spreadsheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(sheetName, spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}


/**
 * シート全体の値を取得する。
 * 空シートなら [] を返す。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Array<Array<*>>}
 */
function getAllValuesSafe(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    return [];
  }

  return sheet.getRange(1, 1, lastRow, lastCol).getValues();
}


/**
 * ヘッダ行を除いたデータ部を取得する。
 * 既定では1行目をヘッダとみなし、2行目以降を返す。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number=} headerRow
 * @returns {Array<Array<*>>}
 */
function getBodyValues(sheet, headerRow) {
  const hdrRow = headerRow || 1;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastCol === 0 || lastRow <= hdrRow) {
    return [];
  }

  return sheet.getRange(hdrRow + 1, 1, lastRow - hdrRow, lastCol).getValues();
}


/**
 * 指定列数だけ、ヘッダ除外で取得する。
 * 右側の余計な列を読まない用途向け。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnCount
 * @param {number=} headerRow
 * @param {number=} startColumn
 * @returns {Array<Array<*>>}
 */
function getBodyValuesByColumns(sheet, columnCount, headerRow, startColumn) {
  const hdrRow = headerRow || 1;
  const startCol = startColumn || 1;
  const lastRow = sheet.getLastRow();

  if (columnCount <= 0 || lastRow <= hdrRow) {
    return [];
  }

  return sheet.getRange(hdrRow + 1, startCol, lastRow - hdrRow, columnCount).getValues();
}


/**
 * 2次元配列を書き込む。
 * values が空なら何もしない。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} startRow
 * @param {number} startColumn
 * @param {Array<Array<*>>} values
 */
function writeValues(sheet, startRow, startColumn, values) {
  if (!values || values.length === 0) {
    return;
  }

  const rowCount = values.length;
  const colCount = values[0].length;

  sheet.getRange(startRow, startColumn, rowCount, colCount).setValues(values);
}


/**
 * ヘッダ1行を書き込む。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array<*>} headers
 * @param {number=} rowIndex
 * @param {number=} startColumn
 */
function writeHeader(sheet, headers, rowIndex, startColumn) {
  const row = rowIndex || 1;
  const col = startColumn || 1;

  if (!headers || headers.length === 0) {
    return;
  }

  sheet.getRange(row, col, 1, headers.length).setValues([headers]);
}


/**
 * 複数行を末尾へまとめて追記する。
 * appendRow の連打より効率がよい。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Array<Array<*>>} rows
 */
function appendRows(sheet, rows) {
  if (!rows || rows.length === 0) {
    return;
  }

  const startRow = sheet.getLastRow() + 1;
  const colCount = rows[0].length;

  sheet.getRange(startRow, 1, rows.length, colCount).setValues(rows);
}


/**
 * 指定開始行から下をクリアする。
 * 既定では内容のみクリア。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} startRow
 * @param {number=} startColumn
 * @param {boolean=} clearFormats trueなら書式も含めてクリア
 */
function clearFromRow(sheet, startRow, startColumn, clearFormats) {
  const startCol = startColumn || 1;
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < startRow || lastCol < startCol) {
    return;
  }

  const targetRange = sheet.getRange(
    startRow,
    startCol,
    lastRow - startRow + 1,
    lastCol - startCol + 1
  );

  if (clearFormats) {
    targetRange.clear();
  } else {
    targetRange.clearContent();
  }
}


/**
 * 指定列を基準にした最終データ行を返す。
 * getLastRow() が他列のゴミデータに引っ張られる場合に使う。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnIndex 1始まり
 * @returns {number}
 */
function findLastDataRowByColumn(sheet, columnIndex) {
  const lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    return 0;
  }

  const values = sheet.getRange(1, columnIndex, lastRow, 1).getValues();

  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]).trim() !== '') {
      return i + 1;
    }
  }

  return 0;
}


/**
 * 指定列の値が targetValue と一致する最初の行番号を返す。
 * 見つからなければ 0 を返す。
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} columnIndex 1始まり
 * @param {*} targetValue
 * @param {number=} startRow
 * @returns {number}
 */
function findRowByColumnValue(sheet, columnIndex, targetValue, startRow) {
  const fromRow = startRow || 1;
  const lastRow = sheet.getLastRow();

  if (lastRow < fromRow) {
    return 0;
  }

  const values = sheet.getRange(fromRow, columnIndex, lastRow - fromRow + 1, 1).getValues();
  const target = String(targetValue);

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === target) {
      return fromRow + i;
    }
  }

  return 0;
}

/**
 * Drive フォルダIDが有効かどうかを判定する
 *
 * @param {string} folderId
 * @returns {boolean}
 */
function isValidDriveFolderId(folderId) {
  if (!folderId || String(folderId).trim() === '') {
    return false;
  }

  try {
    const folder = DriveApp.getFolderById(String(folderId).trim());
    // 取得できた時点で有効
    return !!folder;
  } catch (e) {
    return false;
  }
}
