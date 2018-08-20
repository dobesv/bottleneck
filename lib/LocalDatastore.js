"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

// Generated by CoffeeScript 2.2.4
(function () {
  var BottleneckError, DLList, LocalDatastore, parser;

  parser = require("./parser");

  DLList = require("./DLList");

  BottleneckError = require("./BottleneckError");

  LocalDatastore = class LocalDatastore {
    constructor(options) {
      parser.load(options, options, this);
      this._nextRequest = Date.now();
      this._running = 0;
      this._executing = {};
      this._unblockTime = 0;
      this.ready = this.yieldLoop();
      this.clients = {};
    }

    __disconnect__(flush) {
      return this.Promise.resolve();
    }

    yieldLoop(t = 0) {
      return new this.Promise(function (resolve, reject) {
        return setTimeout(resolve, t);
      });
    }

    computePenalty() {
      var ref;
      return (ref = this.penalty) != null ? ref : 15 * this.minTime || 5000;
    }

    __updateSettings__(options) {
      var _this = this;

      return _asyncToGenerator(function* () {
        yield _this.yieldLoop();
        parser.overwrite(options, options, _this);
        return true;
      })();
    }

    __running__() {
      var _this2 = this;

      return _asyncToGenerator(function* () {
        yield _this2.yieldLoop();
        return _this2._running;
      })();
    }

    __groupCheck__(time) {
      var _this3 = this;

      return _asyncToGenerator(function* () {
        yield _this3.yieldLoop();
        return _this3._nextRequest + _this3.timeout < time;
      })();
    }

    conditionsCheck(weight) {
      return (this.maxConcurrent == null || this._running + weight <= this.maxConcurrent) && (this.reservoir == null || this.reservoir - weight >= 0);
    }

    __incrementReservoir__(incr) {
      var _this4 = this;

      return _asyncToGenerator(function* () {
        yield _this4.yieldLoop();
        return _this4.reservoir += incr;
      })();
    }

    __currentReservoir__() {
      var _this5 = this;

      return _asyncToGenerator(function* () {
        yield _this5.yieldLoop();
        return _this5.reservoir;
      })();
    }

    isBlocked(now) {
      return this._unblockTime >= now;
    }

    check(weight, now) {
      return this.conditionsCheck(weight) && this._nextRequest - now <= 0;
    }

    __check__(weight) {
      var _this6 = this;

      return _asyncToGenerator(function* () {
        var now;
        yield _this6.yieldLoop();
        now = Date.now();
        return _this6.check(weight, now);
      })();
    }

    __register__(index, weight, expiration) {
      var _this7 = this;

      return _asyncToGenerator(function* () {
        var now, wait;
        yield _this7.yieldLoop();
        now = Date.now();
        if (_this7.conditionsCheck(weight)) {
          _this7._running += weight;
          _this7._executing[index] = {
            timeout: expiration != null ? setTimeout(function () {
              if (!_this7._executing[index].freed) {
                _this7._executing[index].freed = true;
                return _this7._running -= weight;
              }
            }, expiration) : void 0,
            freed: false
          };
          if (_this7.reservoir != null) {
            _this7.reservoir -= weight;
          }
          wait = Math.max(_this7._nextRequest - now, 0);
          _this7._nextRequest = now + wait + _this7.minTime;
          return {
            success: true,
            wait,
            reservoir: _this7.reservoir
          };
        } else {
          return {
            success: false
          };
        }
      })();
    }

    strategyIsBlock() {
      return this.strategy === 3;
    }

    __submit__(queueLength, weight) {
      var _this8 = this;

      return _asyncToGenerator(function* () {
        var blocked, now, reachedHWM;
        yield _this8.yieldLoop();
        if (_this8.maxConcurrent != null && weight > _this8.maxConcurrent) {
          throw new BottleneckError(`Impossible to add a job having a weight of ${weight} to a limiter having a maxConcurrent setting of ${_this8.maxConcurrent}`);
        }
        now = Date.now();
        reachedHWM = _this8.highWater != null && queueLength === _this8.highWater && !_this8.check(weight, now);
        blocked = _this8.strategyIsBlock() && (reachedHWM || _this8.isBlocked(now));
        if (blocked) {
          _this8._unblockTime = now + _this8.computePenalty();
          _this8._nextRequest = _this8._unblockTime + _this8.minTime;
        }
        return {
          reachedHWM,
          blocked,
          strategy: _this8.strategy
        };
      })();
    }

    __free__(index, weight) {
      var _this9 = this;

      return _asyncToGenerator(function* () {
        yield _this9.yieldLoop();
        clearTimeout(_this9._executing[index].timeout);
        if (!_this9._executing[index].freed) {
          _this9._executing[index].freed = true;
          _this9._running -= weight;
        }
        return {
          running: _this9._running
        };
      })();
    }

  };

  module.exports = LocalDatastore;
}).call(undefined);