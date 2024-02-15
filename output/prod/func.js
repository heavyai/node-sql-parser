(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./expr", "./util", "./over"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./expr"), require("./util"), require("./over"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.expr, global.util, global.over);
    global.func = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _expr, _util, _over) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.anyValueFuncToSQL = anyValueFuncToSQL;
  _exports.castToSQL = castToSQL;
  _exports.extractFunToSQL = extractFunToSQL;
  _exports.flattenFunToSQL = flattenFunToSQL;
  _exports.funcToSQL = funcToSQL;
  _exports.tablefuncFunToSQL = tablefuncFunToSQL;
  function anyValueFuncToSQL(stmt) {
    const {
      args,
      type,
      over
    } = stmt;
    const {
      expr,
      having
    } = args;
    let sql = `${(0, _util.toUpper)(type)}(${(0, _expr.exprToSQL)(expr)}`;
    if (having) sql = `${sql} HAVING ${(0, _util.toUpper)(having.prefix)} ${(0, _expr.exprToSQL)(having.expr)}`;
    sql = `${sql})`;
    const overStr = (0, _over.overToSQL)(over);
    return [sql, overStr].filter(_util.hasVal).join(' ');
  }
  function arrayDimensionToSymbol(target) {
    if (!target || !target.array) return '';
    switch (target.array) {
      case 'one':
        return '[]';
      case 'two':
        return '[][]';
    }
  }
  function castToSQL(expr) {
    const {
      arrows = [],
      collate,
      target,
      expr: expression,
      keyword,
      symbol,
      as: alias,
      properties = []
    } = expr;
    const {
      length,
      dataType,
      parentheses,
      quoted,
      scale,
      suffix: dataTypeSuffix
    } = target;
    let str = '';
    if (length != null) str = scale ? `${length}, ${scale}` : length;
    if (parentheses) str = `(${str})`;
    if (dataTypeSuffix && dataTypeSuffix.length) str += ` ${dataTypeSuffix.join(' ')}`;
    let prefix = (0, _expr.exprToSQL)(expression);
    let symbolChar = '::';
    let suffix = '';
    if (symbol === 'as') {
      prefix = `${(0, _util.toUpper)(keyword)}(${prefix}`;
      suffix = ')';
      symbolChar = ` ${symbol.toUpperCase()} `;
    }
    suffix += arrows.map((arrow, index) => (0, _util.commonOptionConnector)(arrow, _util.literalToSQL, properties[index])).join(' ');
    if (alias) suffix += ` AS ${(0, _util.identifierToSql)(alias)}`;
    if (collate) suffix += ` ${(0, _util.commonTypeValue)(collate).join(' ')}`;
    const arrayDimension = arrayDimensionToSymbol(target);
    const result = [prefix, symbolChar, quoted, dataType, quoted, arrayDimension, str, suffix];
    return result.filter(_util.hasVal).join('');
  }
  function extractFunToSQL(stmt) {
    const {
      args,
      type
    } = stmt;
    const {
      field,
      cast_type: castType,
      source
    } = args;
    const result = [`${(0, _util.toUpper)(type)}(${(0, _util.toUpper)(field)}`, 'FROM', (0, _util.toUpper)(castType), (0, _expr.exprToSQL)(source)];
    return `${result.filter(_util.hasVal).join(' ')})`;
  }
  function flattenArgToSQL(arg) {
    if (!arg) return '';
    const {
      type,
      symbol,
      value
    } = arg;
    const result = [(0, _util.toUpper)(type), symbol, (0, _expr.exprToSQL)(value)];
    return result.filter(_util.hasVal).join(' ');
  }
  function flattenFunToSQL(stmt) {
    const {
      args,
      type
    } = stmt;
    const keys = ['input', 'path', 'outer', 'recursive', 'mode'];
    const argsStr = keys.map(key => flattenArgToSQL(args[key])).filter(_util.hasVal).join(', ');
    return `${(0, _util.toUpper)(type)}(${argsStr})`;
  }
  function funcToSQL(expr) {
    const {
      args,
      name,
      args_parentheses,
      parentheses,
      over,
      collate,
      suffix
    } = expr;
    const collateStr = (0, _util.commonTypeValue)(collate).join(' ');
    const overStr = (0, _over.overToSQL)(over);
    const suffixStr = (0, _expr.exprToSQL)(suffix);
    const funcName = typeof name === 'string' ? name : [name.schema, name.name].map(_util.literalToSQL).filter(_util.hasVal).join('.');
    if (!args) return [funcName, overStr].filter(_util.hasVal).join(' ');
    let separator = expr.separator || ', ';
    if ((0, _util.toUpper)(funcName) === 'TRIM') separator = ' ';
    let str = [funcName];
    str.push(args_parentheses === false ? ' ' : '(');
    str.push((0, _expr.exprToSQL)(args).join(separator));
    if (args_parentheses !== false) str.push(')');
    str = [str.join(''), suffixStr].filter(_util.hasVal).join(' ');
    return [parentheses ? `(${str})` : str, collateStr, overStr].filter(_util.hasVal).join(' ');
  }
  function tablefuncFunToSQL(expr) {
    const {
      as,
      name,
      args
    } = expr;
    const funcName = typeof name === 'string' ? name : [name.schema, name.name].map(_util.literalToSQL).filter(_util.hasVal).join('.');
    const result = [`${funcName}(${(0, _expr.exprToSQL)(args).join(', ')})`, 'AS', funcToSQL(as)];
    return result.join(' ');
  }
});