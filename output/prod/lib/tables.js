(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./binary", "./column", "./expr", "./insert", "./interval", "./util"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./binary"), require("./column"), require("./expr"), require("./insert"), require("./interval"), require("./util"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.binary, global.column, global.expr, global.insert, global.interval, global.util);
    global.tables = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _binary, _column, _expr, _insert, _interval, _util) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.operatorToSQL = operatorToSQL;
  _exports.tableHintToSQL = tableHintToSQL;
  _exports.tableOptionToSQL = tableOptionToSQL;
  _exports.tableToSQL = tableToSQL;
  _exports.tableTumbleToSQL = tableTumbleToSQL;
  _exports.tablesToSQL = tablesToSQL;
  _exports.unnestToSQL = unnestToSQL;
  function unnestToSQL(unnestExpr) {
    const {
      type,
      as,
      expr,
      with_offset: withOffset
    } = unnestExpr;
    const result = [`${(0, _util.toUpper)(type)}(${expr && (0, _expr.exprToSQL)(expr) || ''})`, (0, _util.commonOptionConnector)('AS', _util.identifierToSql, as), (0, _util.commonOptionConnector)((0, _util.toUpper)(withOffset && withOffset.keyword), _util.identifierToSql, withOffset && withOffset.as)];
    return result.filter(_util.hasVal).join(' ');
  }
  function pivotOperatorToSQL(operator) {
    const {
      as,
      column,
      expr,
      in_expr,
      type
    } = operator;
    const result = [(0, _expr.exprToSQL)(expr), 'FOR', (0, _column.columnRefToSQL)(column), (0, _binary.binaryToSQL)(in_expr)];
    const sql = [`${(0, _util.toUpper)(type)}(${result.join(' ')})`];
    if (as) sql.push('AS', (0, _util.identifierToSql)(as));
    return sql.join(' ');
  }
  function operatorToSQL(operator) {
    if (!operator) return;
    const {
      type
    } = operator;
    switch (type) {
      case 'pivot':
      case 'unpivot':
        return pivotOperatorToSQL(operator);
      default:
        return '';
    }
  }
  function tableHintToSQL(tableHintExpr) {
    if (!tableHintExpr) return;
    const {
      keyword,
      expr,
      index,
      index_columns,
      parentheses,
      prefix
    } = tableHintExpr;
    const result = [];
    switch (keyword.toLowerCase()) {
      case 'forceseek':
        result.push((0, _util.toUpper)(keyword), `(${(0, _util.identifierToSql)(index)}`, `(${index_columns.map(_expr.exprToSQL).filter(_util.hasVal).join(', ')}))`);
        break;
      case 'spatial_window_max_cells':
        result.push((0, _util.toUpper)(keyword), '=', (0, _expr.exprToSQL)(expr));
        break;
      case 'index':
        result.push((0, _util.toUpper)(prefix), (0, _util.toUpper)(keyword), parentheses ? `(${expr.map(_util.identifierToSql).join(', ')})` : `= ${(0, _util.identifierToSql)(expr)}`);
        break;
      default:
        result.push((0, _expr.exprToSQL)(expr));
    }
    return result.filter(_util.hasVal).join(' ');
  }
  function tableTumbleToSQL(tumble) {
    if (!tumble) return '';
    const {
      data: tableInfo,
      timecol,
      size
    } = tumble;
    const fullTableName = [(0, _util.identifierToSql)(tableInfo.db), (0, _util.identifierToSql)(tableInfo.table)].filter(_util.hasVal).join('.');
    const result = ['TABLE(TUMBLE(TABLE', fullTableName, `DESCRIPTOR(${(0, _column.columnRefToSQL)(timecol)})`, `${(0, _interval.intervalToSQL)(size)}))`];
    return result.filter(_util.hasVal).join(' ');
  }
  function tableToSQL(tableInfo) {
    if ((0, _util.toUpper)(tableInfo.type) === 'UNNEST') return unnestToSQL(tableInfo);
    const {
      table,
      db,
      as,
      expr,
      operator,
      prefix: prefixStr,
      schema,
      server,
      tablesample,
      table_hint
    } = tableInfo;
    const serverName = (0, _util.identifierToSql)(server);
    const database = (0, _util.identifierToSql)(db);
    const schemaStr = (0, _util.identifierToSql)(schema);
    let tableName = table && (0, _util.identifierToSql)(table);
    if (expr) {
      const exprType = expr.type;
      switch (exprType) {
        case 'values':
          const {
            parentheses,
            values,
            prefix
          } = expr;
          const valueSQL = [parentheses && '(', '', parentheses && ')'];
          let valuesExpr = (0, _insert.valuesToSQL)(values);
          if (prefix) valuesExpr = valuesExpr.split('(').slice(1).map(val => `${(0, _util.toUpper)(prefix)}(${val}`).join('');
          valueSQL[1] = `VALUES ${valuesExpr}`;
          tableName = valueSQL.filter(_util.hasVal).join('');
          break;
        case 'tumble':
          tableName = tableTumbleToSQL(expr);
          break;
        default:
          tableName = (0, _expr.exprToSQL)(expr);
      }
    }
    tableName = [(0, _util.toUpper)(prefixStr), tableName].filter(_util.hasVal).join(' ');
    let str = [serverName, database, schemaStr, tableName].filter(_util.hasVal).join('.');
    if (tableInfo.parentheses) str = `(${str})`;
    const result = [str];
    if (tablesample) {
      const tableSampleSQL = ['TABLESAMPLE', (0, _expr.exprToSQL)(tablesample.expr), (0, _util.literalToSQL)(tablesample.repeatable)].filter(_util.hasVal).join(' ');
      result.push(tableSampleSQL);
    }
    result.push((0, _util.commonOptionConnector)('AS', _util.identifierToSql, as), operatorToSQL(operator));
    if (table_hint) result.push((0, _util.toUpper)(table_hint.keyword), `(${table_hint.expr.map(tableHintToSQL).filter(_util.hasVal).join(', ')})`);
    return result.filter(_util.hasVal).join(' ');
  }

  /**
   * @param {Array} tables
   * @return {string}
   */
  function tablesToSQL(tables) {
    if (!tables) return '';
    if (!Array.isArray(tables)) {
      const {
        expr,
        parentheses
      } = tables;
      const sql = tablesToSQL(expr);
      if (parentheses) return `(${sql})`;
      return sql;
    }
    const baseTable = tables[0];
    const clauses = [];
    if (baseTable.type === 'dual') return 'DUAL';
    clauses.push(tableToSQL(baseTable));
    for (let i = 1; i < tables.length; ++i) {
      const joinExpr = tables[i];
      const {
        on,
        using,
        join
      } = joinExpr;
      const str = [];
      str.push(join ? ` ${(0, _util.toUpper)(join)}` : ',');
      str.push(tableToSQL(joinExpr));
      str.push((0, _util.commonOptionConnector)('ON', _expr.exprToSQL, on));
      if (using) str.push(`USING (${using.map(_util.identifierToSql).join(', ')})`);
      clauses.push(str.filter(_util.hasVal).join(' '));
    }
    return clauses.filter(_util.hasVal).join('');
  }
  function tableOptionToSQL(tableOption) {
    const {
      keyword,
      symbol,
      value
    } = tableOption;
    const sql = [keyword.toUpperCase()];
    if (symbol) sql.push(symbol);
    let val = value;
    switch (keyword) {
      case 'partition by':
      case 'default collate':
        val = (0, _expr.exprToSQL)(value);
        break;
      case 'options':
        val = `(${value.map(tableOptionItem => [tableOptionItem.keyword, tableOptionItem.symbol, (0, _expr.exprToSQL)(tableOptionItem.value)].join(' ')).join(', ')})`;
        break;
      case 'cluster by':
        val = value.map(_expr.exprToSQL).join(', ');
        break;
    }
    sql.push(val);
    return sql.join(' ');
  }
});