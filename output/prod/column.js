(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./constrain", "./expr", "./func", "./tables", "./util"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./constrain"), require("./expr"), require("./func"), require("./tables"), require("./util"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.constrain, global.expr, global.func, global.tables, global.util);
    global.column = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _constrain, _expr, _func, _tables, _util) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.columnDataType = columnDataType;
  _exports.columnDefinitionToSQL = columnDefinitionToSQL;
  _exports.columnOrderToSQL = columnOrderToSQL;
  _exports.columnRefToSQL = columnRefToSQL;
  _exports.columnReferenceDefinitionToSQL = columnReferenceDefinitionToSQL;
  _exports.columnToSQL = columnToSQL;
  _exports.columnsToSQL = columnsToSQL;
  _exports.fullTextSearchToSQL = fullTextSearchToSQL;
  function columnOffsetToSQL(column, isDual) {
    if (typeof column === 'string') return (0, _util.identifierToSql)(column, isDual);
    const {
      expr,
      offset,
      suffix
    } = column;
    const offsetExpr = offset && offset.map(offsetItem => ['[', offsetItem.name, `${offsetItem.name ? '(' : ''}`, (0, _util.literalToSQL)(offsetItem.value), `${offsetItem.name ? ')' : ''}`, ']'].filter(_util.hasVal).join('')).join('');
    const result = [(0, _expr.exprToSQL)(expr), offsetExpr, suffix].filter(_util.hasVal).join('');
    return result;
  }
  function columnRefToSQL(expr) {
    const {
      array_index,
      arrows = [],
      as,
      collate,
      column,
      db,
      isDual,
      schema,
      table,
      parentheses,
      properties,
      suffix,
      order_by,
      subFields = []
    } = expr;
    let str = column === '*' ? '*' : columnOffsetToSQL(column, isDual);
    const prefix = [db, schema, table].filter(_util.hasVal).map(val => `${typeof val === 'string' ? (0, _util.identifierToSql)(val) : (0, _expr.exprToSQL)(val)}`).join('.');
    if (prefix) str = `${prefix}.${str}`;
    if (array_index) {
      str = `${str}[${(0, _util.literalToSQL)(array_index.index)}]`;
      if (array_index.property) str = `${str}.${(0, _util.literalToSQL)(array_index.property)}`;
    }
    str = [str, ...subFields].join('.');
    const result = [str, (0, _util.commonOptionConnector)('AS', _expr.exprToSQL, as), arrows.map((arrow, index) => (0, _util.commonOptionConnector)(arrow, _util.literalToSQL, properties[index])).join(' ')];
    if (collate) result.push((0, _util.commonTypeValue)(collate).join(' '));
    result.push((0, _util.toUpper)(suffix));
    result.push((0, _util.toUpper)(order_by));
    const sql = result.filter(_util.hasVal).join(' ');
    return parentheses ? `(${sql})` : sql;
  }
  function columnDataType(definition) {
    const {
      dataType,
      length,
      suffix,
      scale,
      expr
    } = definition || {};
    let result = dataType;
    if (length != null) result += `(${[length, scale].filter(val => val != null).join(', ')})`;
    if (suffix && suffix.length) result += ` ${suffix.join(' ')}`;
    if (expr) result += (0, _expr.exprToSQL)(expr);
    return result;
  }
  function columnReferenceDefinitionToSQL(referenceDefinition) {
    const reference = [];
    if (!referenceDefinition) return reference;
    const {
      definition,
      keyword,
      match,
      table,
      on_action: onAction
    } = referenceDefinition;
    reference.push((0, _util.toUpper)(keyword));
    reference.push((0, _tables.tablesToSQL)(table));
    reference.push(definition && `(${definition.map(col => (0, _expr.exprToSQL)(col)).join(', ')})`);
    reference.push((0, _util.toUpper)(match));
    onAction.map(onRef => reference.push((0, _util.toUpper)(onRef.type), (0, _expr.exprToSQL)(onRef.value)));
    return reference.filter(_util.hasVal);
  }
  function columnOption(definition) {
    const columnOpt = [];
    const {
      nullable,
      character_set: characterSet,
      check,
      comment,
      collate,
      storage,
      default_val: defaultOpt,
      auto_increment: autoIncrement,
      unique: uniqueKey,
      primary_key: primaryKey,
      column_format: columnFormat,
      reference_definition: referenceDefinition
    } = definition;
    columnOpt.push((0, _util.toUpper)(nullable && nullable.value));
    if (defaultOpt) {
      const {
        type,
        value
      } = defaultOpt;
      columnOpt.push(type.toUpperCase(), (0, _expr.exprToSQL)(value));
    }
    const {
      database
    } = (0, _util.getParserOpt)();
    columnOpt.push((0, _constrain.constraintDefinitionToSQL)(check));
    columnOpt.push((0, _util.autoIncrementToSQL)(autoIncrement), (0, _util.toUpper)(primaryKey), (0, _util.toUpper)(uniqueKey), (0, _util.commentToSQL)(comment));
    columnOpt.push(...(0, _util.commonTypeValue)(characterSet));
    if (database !== 'sqlite') columnOpt.push(...(0, _util.commonTypeValue)(collate));
    columnOpt.push(...(0, _util.commonTypeValue)(columnFormat));
    columnOpt.push(...(0, _util.commonTypeValue)(storage));
    columnOpt.push(...columnReferenceDefinitionToSQL(referenceDefinition));
    return columnOpt.filter(_util.hasVal).join(' ');
  }
  function columnOrderToSQL(columnOrder) {
    const {
      column,
      collate,
      nulls,
      opclass,
      order_by
    } = columnOrder;
    const columnExpr = typeof column === 'string' ? {
      type: 'column_ref',
      table: columnOrder.table,
      column
    } : columnOrder;
    columnExpr.collate = null;
    const result = [(0, _expr.exprToSQL)(columnExpr), (0, _util.commonOptionConnector)(collate && collate.type, _util.identifierToSql, collate && collate.value), opclass, (0, _util.toUpper)(order_by), (0, _util.toUpper)(nulls)];
    return result.filter(_util.hasVal).join(' ');
  }
  function generatedExpressionToSQL(generated) {
    if (!generated) return;
    const result = [(0, _util.toUpper)(generated.value), `(${(0, _expr.exprToSQL)(generated.expr)})`, (0, _util.toUpper)(generated.storage_type)];
    return result.filter(_util.hasVal).join(' ');
  }
  function columnDefinitionToSQL(columnDefinition) {
    const column = [];
    const name = columnRefToSQL(columnDefinition.column);
    const dataType = columnDataType(columnDefinition.definition);
    column.push(name);
    column.push(dataType);
    const columnOpt = columnOption(columnDefinition);
    column.push(columnOpt);
    const generated = generatedExpressionToSQL(columnDefinition.generated);
    column.push(generated);
    return column.filter(_util.hasVal).join(' ');
  }
  function asToSQL(asStr) {
    if (!asStr) return '';
    return ['AS', /^(`?)[a-z_][0-9a-z_]*(`?)$/i.test(asStr) ? (0, _util.identifierToSql)(asStr) : (0, _util.columnIdentifierToSql)(asStr)].join(' ');
  }
  function fullTextSearchToSQL(expr) {
    const {
      against,
      as,
      columns,
      match,
      mode
    } = expr;
    const matchExpr = [(0, _util.toUpper)(match), `(${columns.map(col => columnRefToSQL(col)).join(', ')})`].join(' ');
    const againstExpr = [(0, _util.toUpper)(against), ['(', (0, _expr.exprToSQL)(expr.expr), mode && ` ${(0, _util.literalToSQL)(mode)}`, ')'].filter(_util.hasVal).join('')].join(' ');
    return [matchExpr, againstExpr, asToSQL(as)].filter(_util.hasVal).join(' ');
  }
  function columnToSQL(column, isDual) {
    const {
      expr,
      type
    } = column;
    if (type === 'cast') return (0, _func.castToSQL)(column);
    if (isDual) expr.isDual = isDual;
    let str = (0, _expr.exprToSQL)(expr);
    const {
      expr_list: exprList
    } = column;
    if (exprList) {
      const result = [str];
      const columnsStr = exprList.map(col => columnToSQL(col, isDual)).join(', ');
      result.push([(0, _util.toUpper)(type), type && '(', columnsStr, type && ')'].filter(_util.hasVal).join(''));
      return result.filter(_util.hasVal).join(' ');
    }
    if (expr.parentheses && Reflect.has(expr, 'array_index')) str = `(${str})`;
    if (expr.array_index && expr.type !== 'column_ref') str = `${str}[${(0, _util.literalToSQL)(expr.array_index.index)}]`;
    return [str, asToSQL(column.as)].filter(_util.hasVal).join(' ');
  }
  function getDual(tables) {
    const baseTable = Array.isArray(tables) && tables[0];
    if (baseTable && baseTable.type === 'dual') return true;
    return false;
  }
  /**
   * Stringify column expressions
   *
   * @param {Array} columns
   * @return {string}
   */
  function columnsToSQL(columns, tables) {
    if (!columns || columns === '*') return columns;
    const isDual = getDual(tables);
    return columns.map(col => columnToSQL(col, isDual)).join(', ');
  }
});