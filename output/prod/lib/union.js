(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "./alter", "./analyze", "./create", "./select", "./delete", "./update", "./insert", "./command", "./exec", "./expr", "./limit", "./proc", "./transaction", "./show", "./util"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("./alter"), require("./analyze"), require("./create"), require("./select"), require("./delete"), require("./update"), require("./insert"), require("./command"), require("./exec"), require("./expr"), require("./limit"), require("./proc"), require("./transaction"), require("./show"), require("./util"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.alter, global.analyze, global.create, global.select, global._delete, global.update, global.insert, global.command, global.exec, global.expr, global.limit, global.proc, global.transaction, global.show, global.util);
    global.union = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _alter, _analyze, _create, _select, _delete, _update, _insert, _command, _exec, _expr, _limit2, _proc, _transaction, _show, _util) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.multipleToSQL = multipleToSQL;
  _exports.unionToSQL = unionToSQL;
  const typeToSQLFn = {
    alter: _alter.alterToSQL,
    analyze: _analyze.analyzeToSQL,
    attach: _analyze.attachToSQL,
    create: _create.createToSQL,
    select: _select.selectToSQL,
    deallocate: _command.deallocateToSQL,
    delete: _delete.deleteToSQL,
    exec: _exec.execToSQL,
    execute: _command.executeToSQL,
    for: _command.forLoopToSQL,
    update: _update.updateToSQL,
    if: _command.ifToSQL,
    insert: _insert.insertToSQL,
    drop: _command.commonCmdToSQL,
    truncate: _command.commonCmdToSQL,
    replace: _insert.insertToSQL,
    declare: _command.declareToSQL,
    use: _command.useToSQL,
    rename: _command.renameToSQL,
    call: _command.callToSQL,
    desc: _command.descToSQL,
    set: _command.setVarToSQL,
    lock: _command.lockUnlockToSQL,
    unlock: _command.lockUnlockToSQL,
    show: _show.showToSQL,
    grant: _command.grantAndRevokeToSQL,
    revoke: _command.grantAndRevokeToSQL,
    proc: _proc.procToSQL,
    raise: _command.raiseToSQL,
    transaction: _transaction.transactionToSQL
  };
  function unionToSQL(stmt) {
    if (!stmt) return '';
    const fun = typeToSQLFn[stmt.type];
    const {
      _parentheses,
      _orderby,
      _limit
    } = stmt;
    const res = [_parentheses && '(', fun(stmt)];
    while (stmt._next) {
      const nextFun = typeToSQLFn[stmt._next.type];
      const unionKeyword = (0, _util.toUpper)(stmt.set_op);
      res.push(unionKeyword, nextFun(stmt._next));
      stmt = stmt._next;
    }
    res.push(_parentheses && ')', (0, _expr.orderOrPartitionByToSQL)(_orderby, 'order by'), (0, _limit2.limitToSQL)(_limit));
    return res.filter(_util.hasVal).join(' ');
  }
  function multipleToSQL(stmt) {
    const res = [];
    for (let i = 0, len = stmt.length; i < len; ++i) {
      const astInfo = stmt[i] && stmt[i].ast ? stmt[i].ast : stmt[i];
      let sql = unionToSQL(astInfo);
      if (i === len - 1 && astInfo.type === 'transaction') sql = `${sql} ;`;
      res.push(sql);
    }
    return res.join(' ; ');
  }
});