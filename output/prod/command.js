(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./column", "./create", "./util", "./expr", "./tables", "./sql", "./union"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./column"), require("./create"), require("./util"), require("./expr"), require("./tables"), require("./sql"), require("./union"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.column, global.create, global.util, global.expr, global.tables, global.sql, global.union);
    global.command = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _column, _create, _util, _expr, _tables, _sql, _union) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.callToSQL = callToSQL;
  _exports.commonCmdToSQL = commonCmdToSQL;
  _exports.deallocateToSQL = deallocateToSQL;
  _exports.declareToSQL = declareToSQL;
  _exports.descToSQL = descToSQL;
  _exports.executeToSQL = executeToSQL;
  _exports.forLoopToSQL = forLoopToSQL;
  _exports.grantAndRevokeToSQL = grantAndRevokeToSQL;
  _exports.grantUserOrRoleToSQL = grantUserOrRoleToSQL;
  _exports.ifToSQL = ifToSQL;
  _exports.lockUnlockToSQL = lockUnlockToSQL;
  _exports.raiseToSQL = raiseToSQL;
  _exports.renameToSQL = renameToSQL;
  _exports.setVarToSQL = setVarToSQL;
  _exports.useToSQL = useToSQL;
  _sql = _interopRequireDefault(_sql);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  function callToSQL(stmt) {
    const type = 'CALL';
    const storeProcessCall = (0, _expr.exprToSQL)(stmt.expr);
    return `${type} ${storeProcessCall}`;
  }
  function commonCmdToSQL(stmt) {
    const {
      type,
      keyword,
      name,
      prefix
    } = stmt;
    const clauses = [(0, _util.toUpper)(type), (0, _util.toUpper)(keyword), (0, _util.toUpper)(prefix)];
    switch (keyword) {
      case 'table':
        clauses.push((0, _tables.tablesToSQL)(name));
        break;
      case 'trigger':
        clauses.push([name[0].schema ? `${(0, _util.identifierToSql)(name[0].schema)}.` : '', (0, _util.identifierToSql)(name[0].trigger)].filter(_util.hasVal).join(''));
        break;
      case 'database':
      case 'schema':
      case 'procedure':
        clauses.push((0, _util.identifierToSql)(name));
        break;
      case 'view':
        clauses.push((0, _tables.tablesToSQL)(name), stmt.options && stmt.options.map(_expr.exprToSQL).filter(_util.hasVal).join(' '));
        break;
      case 'index':
        clauses.push((0, _column.columnRefToSQL)(name), ...(stmt.table ? ['ON', (0, _tables.tableToSQL)(stmt.table)] : []), stmt.options && stmt.options.map(_expr.exprToSQL).filter(_util.hasVal).join(' '));
        break;
      default:
        break;
    }
    return clauses.filter(_util.hasVal).join(' ');
  }
  function descToSQL(stmt) {
    const {
      type,
      table
    } = stmt;
    const action = (0, _util.toUpper)(type);
    return `${action} ${(0, _util.identifierToSql)(table)}`;
  }
  function executeToSQL(stmt) {
    const {
      type,
      name,
      args
    } = stmt;
    const sql = [(0, _util.toUpper)(type)];
    const nameWithArgs = [name];
    if (args) nameWithArgs.push(`(${(0, _expr.exprToSQL)(args).join(', ')})`);
    sql.push(nameWithArgs.join(''));
    return sql.filter(_util.hasVal).join(' ');
  }
  function forLoopToSQL(stmt) {
    const {
      type,
      label,
      target,
      query,
      stmts
    } = stmt;
    const sql = [label, (0, _util.toUpper)(type), target, 'IN', (0, _union.multipleToSQL)([query]), 'LOOP', (0, _union.multipleToSQL)(stmts), 'END LOOP', label];
    return sql.filter(_util.hasVal).join(' ');
  }
  function raiseToSQL(stmt) {
    const {
      type,
      level,
      raise,
      using
    } = stmt;
    const sql = [(0, _util.toUpper)(type), (0, _util.toUpper)(level)];
    if (raise) sql.push([(0, _util.literalToSQL)(raise.keyword), raise.type === 'format' && raise.expr.length > 0 && ','].filter(_util.hasVal).join(''), raise.expr.map(exprInfo => (0, _expr.exprToSQL)(exprInfo)).join(', '));
    if (using) sql.push((0, _util.toUpper)(using.type), (0, _util.toUpper)(using.option), using.symbol, using.expr.map(exprInfo => (0, _expr.exprToSQL)(exprInfo)).join(', '));
    return sql.filter(_util.hasVal).join(' ');
  }
  function renameToSQL(stmt) {
    const {
      type,
      table
    } = stmt;
    const clauses = [];
    const prefix = `${type && type.toUpperCase()} TABLE`;
    if (table) {
      for (const tables of table) {
        const renameInfo = tables.map(_tables.tableToSQL);
        clauses.push(renameInfo.join(' TO '));
      }
    }
    return `${prefix} ${clauses.join(', ')}`;
  }
  function useToSQL(stmt) {
    const {
      type,
      db
    } = stmt;
    const action = (0, _util.toUpper)(type);
    const database = (0, _util.identifierToSql)(db);
    return `${action} ${database}`;
  }
  function setVarToSQL(stmt) {
    const {
      expr
    } = stmt;
    const action = 'SET';
    const val = (0, _expr.exprToSQL)(expr);
    return `${action} ${val}`;
  }
  function pgLock(stmt) {
    const {
      lock_mode: lockMode,
      nowait
    } = stmt;
    const lockInfo = [];
    if (lockMode) {
      const {
        mode
      } = lockMode;
      lockInfo.push(mode.toUpperCase());
    }
    if (nowait) lockInfo.push(nowait.toUpperCase());
    return lockInfo;
  }
  function lockUnlockToSQL(stmt) {
    const {
      type,
      keyword,
      tables
    } = stmt;
    const result = [type.toUpperCase(), (0, _util.toUpper)(keyword)];
    if (type.toUpperCase() === 'UNLOCK') return result.join(' ');
    const tableStmt = [];
    for (const tableInfo of tables) {
      const {
        table,
        lock_type: lockType
      } = tableInfo;
      const tableInfoTemp = [(0, _tables.tableToSQL)(table)];
      if (lockType) {
        const lockKeyList = ['prefix', 'type', 'suffix'];
        tableInfoTemp.push(lockKeyList.map(key => (0, _util.toUpper)(lockType[key])).filter(_util.hasVal).join(' '));
      }
      tableStmt.push(tableInfoTemp.join(' '));
    }
    result.push(tableStmt.join(', '), ...pgLock(stmt));
    return result.filter(_util.hasVal).join(' ');
  }
  function deallocateToSQL(stmt) {
    const {
      type,
      keyword,
      expr
    } = stmt;
    return [(0, _util.toUpper)(type), (0, _util.toUpper)(keyword), (0, _expr.exprToSQL)(expr)].filter(_util.hasVal).join(' ');
  }
  function declareToSQL(stmt) {
    const {
      type,
      declare,
      symbol
    } = stmt;
    const result = [(0, _util.toUpper)(type)];
    const info = declare.map(dec => {
      const {
        at,
        name,
        as,
        constant,
        datatype,
        not_null,
        prefix,
        definition,
        keyword
      } = dec;
      const declareInfo = [[at, name].filter(_util.hasVal).join(''), (0, _util.toUpper)(as), (0, _util.toUpper)(constant)];
      switch (keyword) {
        case 'variable':
          declareInfo.push((0, _column.columnDataType)(datatype), ...(0, _util.commonTypeValue)(dec.collate), (0, _util.toUpper)(not_null));
          if (definition) declareInfo.push((0, _util.toUpper)(definition.keyword), (0, _expr.exprToSQL)(definition.value));
          break;
        case 'cursor':
          declareInfo.push((0, _util.toUpper)(prefix));
          break;
        case 'table':
          declareInfo.push((0, _util.toUpper)(prefix), `(${definition.map(_create.createDefinitionToSQL).join(', ')})`);
          break;
        default:
          break;
      }
      return declareInfo.filter(_util.hasVal).join(' ');
    }).join(`${symbol} `);
    result.push(info);
    return result.join(' ');
  }
  function ifToSQL(stmt) {
    const {
      boolean_expr: boolExpr,
      else_expr: elseExpr,
      elseif_expr: elseifExpr,
      if_expr: ifExpr,
      prefix,
      go,
      semicolons,
      suffix,
      type
    } = stmt;
    const result = [(0, _util.toUpper)(type), (0, _expr.exprToSQL)(boolExpr), (0, _util.literalToSQL)(prefix), `${(0, _sql.default)(ifExpr.ast || ifExpr)}${semicolons[0]}`, (0, _util.toUpper)(go)];
    if (elseifExpr) {
      result.push(elseifExpr.map(elseif => [(0, _util.toUpper)(elseif.type), (0, _expr.exprToSQL)(elseif.boolean_expr), 'THEN', (0, _sql.default)(elseif.then.ast || elseif.then), elseif.semicolon].filter(_util.hasVal).join(' ')).join(' '));
    }
    if (elseExpr) result.push('ELSE', `${(0, _sql.default)(elseExpr.ast || elseExpr)}${semicolons[1]}`);
    result.push((0, _util.literalToSQL)(suffix));
    return result.filter(_util.hasVal).join(' ');
  }
  function grantUserOrRoleToSQL(stmt) {
    const {
      name,
      host
    } = stmt;
    const result = [(0, _util.literalToSQL)(name)];
    if (host) result.push('@', (0, _util.literalToSQL)(host));
    return result.join('');
  }
  function grantAndRevokeToSQL(stmt) {
    const {
      type,
      grant_option_for,
      keyword,
      objects,
      on,
      to_from,
      user_or_roles,
      with: withOpt
    } = stmt;
    const result = [(0, _util.toUpper)(type), (0, _util.literalToSQL)(grant_option_for)];
    const objStr = objects.map(obj => {
      const {
        priv,
        columns
      } = obj;
      const privSQL = [(0, _expr.exprToSQL)(priv)];
      if (columns) privSQL.push(`(${columns.map(_column.columnRefToSQL).join(', ')})`);
      return privSQL.join(' ');
    }).join(', ');
    result.push(objStr);
    if (on) {
      result.push('ON');
      switch (keyword) {
        case 'priv':
          result.push((0, _util.literalToSQL)(on.object_type), on.priv_level.map(privLevel => [(0, _util.identifierToSql)(privLevel.prefix), (0, _util.identifierToSql)(privLevel.name)].filter(_util.hasVal).join('.')).join(', '));
          break;
        case 'proxy':
          result.push(grantUserOrRoleToSQL(on));
          break;
      }
    }
    result.push((0, _util.toUpper)(to_from), user_or_roles.map(grantUserOrRoleToSQL).join(', '));
    result.push((0, _util.literalToSQL)(withOpt));
    return result.filter(_util.hasVal).join(' ');
  }
});