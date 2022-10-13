import Gun from 'gun';
import 'gun/sea';
import 'gun/lib/yson';
import 'gun/lib/radix';
import 'gun/lib/radisk';
import 'gun/lib/store';
import 'gun/lib/rindexed';
import localForage from 'localforage';
import Fuse from 'fuse.js';

function _regeneratorRuntime() {
  _regeneratorRuntime = function () {
    return exports;
  };
  var exports = {},
    Op = Object.prototype,
    hasOwn = Op.hasOwnProperty,
    $Symbol = "function" == typeof Symbol ? Symbol : {},
    iteratorSymbol = $Symbol.iterator || "@@iterator",
    asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator",
    toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  function define(obj, key, value) {
    return Object.defineProperty(obj, key, {
      value: value,
      enumerable: !0,
      configurable: !0,
      writable: !0
    }), obj[key];
  }
  try {
    define({}, "");
  } catch (err) {
    define = function (obj, key, value) {
      return obj[key] = value;
    };
  }
  function wrap(innerFn, outerFn, self, tryLocsList) {
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator,
      generator = Object.create(protoGenerator.prototype),
      context = new Context(tryLocsList || []);
    return generator._invoke = function (innerFn, self, context) {
      var state = "suspendedStart";
      return function (method, arg) {
        if ("executing" === state) throw new Error("Generator is already running");
        if ("completed" === state) {
          if ("throw" === method) throw arg;
          return doneResult();
        }
        for (context.method = method, context.arg = arg;;) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }
          if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) {
            if ("suspendedStart" === state) throw state = "completed", context.arg;
            context.dispatchException(context.arg);
          } else "return" === context.method && context.abrupt("return", context.arg);
          state = "executing";
          var record = tryCatch(innerFn, self, context);
          if ("normal" === record.type) {
            if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue;
            return {
              value: record.arg,
              done: context.done
            };
          }
          "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg);
        }
      };
    }(innerFn, self, context), generator;
  }
  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }
  exports.wrap = wrap;
  var ContinueSentinel = {};
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });
  var getProto = Object.getPrototypeOf,
    NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype);
  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function (method) {
      define(prototype, method, function (arg) {
        return this._invoke(method, arg);
      });
    });
  }
  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if ("throw" !== record.type) {
        var result = record.arg,
          value = result.value;
        return value && "object" == typeof value && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) {
          invoke("next", value, resolve, reject);
        }, function (err) {
          invoke("throw", err, resolve, reject);
        }) : PromiseImpl.resolve(value).then(function (unwrapped) {
          result.value = unwrapped, resolve(result);
        }, function (error) {
          return invoke("throw", error, resolve, reject);
        });
      }
      reject(record.arg);
    }
    var previousPromise;
    this._invoke = function (method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function (resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }
      return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
    };
  }
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (undefined === method) {
      if (context.delegate = null, "throw" === context.method) {
        if (delegate.iterator.return && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel;
        context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method");
      }
      return ContinueSentinel;
    }
    var record = tryCatch(method, delegate.iterator, context.arg);
    if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel;
    var info = record.arg;
    return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel);
  }
  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };
    1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry);
  }
  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal", delete record.arg, entry.completion = record;
  }
  function Context(tryLocsList) {
    this.tryEntries = [{
      tryLoc: "root"
    }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0);
  }
  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) return iteratorMethod.call(iterable);
      if ("function" == typeof iterable.next) return iterable;
      if (!isNaN(iterable.length)) {
        var i = -1,
          next = function next() {
            for (; ++i < iterable.length;) if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next;
            return next.value = undefined, next.done = !0, next;
          };
        return next.next = next;
      }
    }
    return {
      next: doneResult
    };
  }
  function doneResult() {
    return {
      value: undefined,
      done: !0
    };
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, define(Gp, "constructor", GeneratorFunctionPrototype), define(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) {
    var ctor = "function" == typeof genFun && genFun.constructor;
    return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name));
  }, exports.mark = function (genFun) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun;
  }, exports.awrap = function (arg) {
    return {
      __await: arg
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    void 0 === PromiseImpl && (PromiseImpl = Promise);
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
    return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) {
      return result.done ? result.value : iter.next();
    });
  }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () {
    return this;
  }), define(Gp, "toString", function () {
    return "[object Generator]";
  }), exports.keys = function (object) {
    var keys = [];
    for (var key in object) keys.push(key);
    return keys.reverse(), function next() {
      for (; keys.length;) {
        var key = keys.pop();
        if (key in object) return next.value = key, next.done = !1, next;
      }
      return next.done = !0, next;
    };
  }, exports.values = values, Context.prototype = {
    constructor: Context,
    reset: function (skipTempReset) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined);
    },
    stop: function () {
      this.done = !0;
      var rootRecord = this.tryEntries[0].completion;
      if ("throw" === rootRecord.type) throw rootRecord.arg;
      return this.rval;
    },
    dispatchException: function (exception) {
      if (this.done) throw exception;
      var context = this;
      function handle(loc, caught) {
        return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught;
      }
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i],
          record = entry.completion;
        if ("root" === entry.tryLoc) return handle("end");
        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc"),
            hasFinally = hasOwn.call(entry, "finallyLoc");
          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
            if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0);
          } else {
            if (!hasFinally) throw new Error("try statement without catch or finally");
            if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc);
          }
        }
      }
    },
    abrupt: function (type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }
      finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null);
      var record = finallyEntry ? finallyEntry.completion : {};
      return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record);
    },
    complete: function (record, afterLoc) {
      if ("throw" === record.type) throw record.arg;
      return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel;
    },
    finish: function (finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel;
      }
    },
    catch: function (tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if ("throw" === record.type) {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }
      throw new Error("illegal catch attempt");
    },
    delegateYield: function (iterable, resultName, nextLoc) {
      return this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      }, "next" === this.method && (this.arg = undefined), ContinueSentinel;
    }
  }, exports;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;
  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;
    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };
  return _wrapNativeSuper(Class);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
    if (it) o = it;
    var i = 0;
    return function () {
      if (i >= o.length) return {
        done: true
      };
      return {
        done: false,
        value: o[i++]
      };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

// @ts-nocheck
var _ = {
  throttle: function throttle(func, limit) {
    var inThrottle;
    return function () {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          return inThrottle = false;
        }, limit);
      }
    };
  },
  debounce: function debounce(func, limit) {
    var inDebounce;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(inDebounce);
      inDebounce = setTimeout(function () {
        return func.apply(context, args);
      }, limit);
    };
  },
  sample: function sample(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  sampleSize: function sampleSize(arr, size) {
    var shuffled = arr.slice(0);
    var i = arr.length;
    var min = i - size;
    var temp;
    var index;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
    }
    return shuffled.slice(min);
  },
  defer: function defer(func) {
    return setTimeout(func, 0);
  },
  once: function once(func) {
    var called = false;
    return function () {
      if (called) {
        return;
      }
      called = true;
      func.apply(this, arguments);
    };
  },
  omit: function omit(obj, keys) {
    var newObj = {};
    Object.keys(obj).forEach(function (key) {
      if (!keys.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  },
  defaults: function defaults(obj, _defaults) {
    Object.keys(_defaults).forEach(function (key) {
      if (obj[key] === undefined) {
        obj[key] = _defaults[key];
      }
    });
    return obj;
  },
  pickBy: function pickBy(obj, predicate) {
    var newObj = {};
    Object.keys(obj).forEach(function (key) {
      if (predicate(obj[key])) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
};

// eslint-disable-line no-unused-vars
var isNode = false;
try {
  isNode = /*#__PURE__*/Object.prototype.toString.call(global.process) === "[object process]";
} catch (e) {
}
var userAgent = !isNode && navigator && navigator.userAgent && /*#__PURE__*/navigator.userAgent.toLowerCase();
var isElectron = userAgent && /*#__PURE__*/userAgent.indexOf(' electron/') > -1;
var isMobile = !isNode && /*#__PURE__*/function () {
  if (isElectron) {
    return false;
  }
  var check = false;
  (function (a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
  })(navigator.userAgent || navigator.vendor || '');
  return check;
}();
function gunAsAnotherUser(gun, key, f) {
  var gun2 = new Gun({
    radisk: false,
    peers: Object.keys(gun._.opt.peers)
  }); // TODO: copy other options too
  var user = gun2.user();
  user.auth(key);
  setTimeout(function () {
    // @ts-ignore
    var peers = Object.values(gun2.back('opt.peers'));
    peers.forEach(function (peer) {
      // @ts-ignore
      gun2.on('bye', peer);
    });
  }, 20000);
  return f(user);
}
function gunOnceDefined(node) {
  return new Promise(function (resolve) {
    node.on(function (val, _k, _a, eve) {
      if (val !== undefined) {
        eve.off();
        resolve(val);
      }
    });
  });
}
var animals = ['canidae', 'felidae', 'cat', 'cattle', 'dog', 'donkey', 'goat', 'horse', 'pig', 'rabbit', 'aardvark', 'aardwolf', 'albatross', 'alligator', 'alpaca', 'amphibian', 'anaconda', 'angelfish', 'anglerfish', 'ant', 'anteater', 'antelope', 'antlion', 'ape', 'aphid', 'armadillo', 'asp', 'baboon', 'badger', 'bandicoot', 'barnacle', 'barracuda', 'basilisk', 'bass', 'bat', 'bear', 'beaver', 'bedbug', 'bee', 'beetle', 'bird', 'bison', 'blackbird', 'boa', 'boar', 'bobcat', 'bobolink', 'bonobo', 'booby', 'bovid', 'bug', 'butterfly', 'buzzard', 'camel', 'canid', 'capybara', 'cardinal', 'caribou', 'carp', 'cat', 'catshark', 'caterpillar', 'catfish', 'cattle', 'centipede', 'cephalopod', 'chameleon', 'cheetah', 'chickadee', 'chicken', 'chimpanzee', 'chinchilla', 'chipmunk', 'clam', 'clownfish', 'cobra', 'cockroach', 'cod', 'condor', 'constrictor', 'coral', 'cougar', 'cow', 'coyote', 'crab', 'crane', 'crawdad', 'crayfish', 'cricket', 'crocodile', 'crow', 'cuckoo', 'cicada', 'damselfly', 'deer', 'dingo', 'dinosaur', 'dog', 'dolphin', 'donkey', 'dormouse', 'dove', 'dragonfly', 'dragon', 'duck', 'eagle', 'earthworm', 'earwig', 'echidna', 'eel', 'egret', 'elephant', 'elk', 'emu', 'ermine', 'falcon', 'ferret', 'finch', 'firefly', 'fish', 'flamingo', 'flea', 'fly', 'flyingfish', 'fowl', 'fox', 'frog', 'gamefowl', 'galliform', 'gazelle', 'gecko', 'gerbil', 'gibbon', 'giraffe', 'goat', 'goldfish', 'goose', 'gopher', 'gorilla', 'grasshopper', 'grouse', 'guan', 'guanaco', 'guineafowl', 'gull', 'guppy', 'haddock', 'halibut', 'hamster', 'hare', 'harrier', 'hawk', 'hedgehog', 'heron', 'herring', 'hippopotamus', 'hookworm', 'hornet', 'horse', 'hoverfly', 'hummingbird', 'hyena', 'iguana', 'impala', 'jackal', 'jaguar', 'jay', 'jellyfish', 'junglefowl', 'kangaroo', 'kingfisher', 'kite', 'kiwi', 'koala', 'koi', 'krill', 'ladybug', 'lamprey', 'landfowl', 'lark', 'leech', 'lemming', 'lemur', 'leopard', 'leopon', 'limpet', 'lion', 'lizard', 'llama', 'lobster', 'locust', 'loon', 'louse', 'lungfish', 'lynx', 'macaw', 'mackerel', 'magpie', 'mammal', 'manatee', 'mandrill', 'marlin', 'marmoset', 'marmot', 'marsupial', 'marten', 'mastodon', 'meadowlark', 'meerkat', 'mink', 'minnow', 'mite', 'mockingbird', 'mole', 'mollusk', 'mongoose', 'monkey', 'moose', 'mosquito', 'moth', 'mouse', 'mule', 'muskox', 'narwhal', 'newt', 'nightingale', 'ocelot', 'octopus', 'opossum', 'orangutan', 'orca', 'ostrich', 'otter', 'owl', 'ox', 'panda', 'panther', 'parakeet', 'parrot', 'parrotfish', 'partridge', 'peacock', 'peafowl', 'pelican', 'penguin', 'perch', 'pheasant', 'pig', 'pigeon', 'pike', 'pinniped', 'piranha', 'planarian', 'platypus', 'pony', 'porcupine', 'porpoise', 'possum', 'prawn', 'primate', 'ptarmigan', 'puffin', 'puma', 'python', 'quail', 'quelea', 'quokka', 'rabbit', 'raccoon', 'rat', 'rattlesnake', 'raven', 'reindeer', 'reptile', 'rhinoceros', 'roadrunner', 'rodent', 'rook', 'rooster', 'roundworm', 'sailfish', 'salamander', 'salmon', 'sawfish', 'scallop', 'scorpion', 'seahorse', 'shark', 'sheep', 'shrew', 'shrimp', 'silkworm', 'silverfish', 'skink', 'skunk', 'sloth', 'slug', 'smelt', 'snail', 'snake', 'snipe', 'sole', 'sparrow', 'spider', 'spoonbill', 'squid', 'squirrel', 'starfish', 'stingray', 'stoat', 'stork', 'sturgeon', 'swallow', 'swan', 'swift', 'swordfish', 'swordtail', 'tahr', 'takin', 'tapir', 'tarantula', 'tarsier', 'termite', 'tern', 'thrush', 'tick', 'tiger', 'tiglon', 'toad', 'tortoise', 'toucan', 'trout', 'tuna', 'turkey', 'turtle', 'tyrannosaurus', 'urial', 'vicuna', 'viper', 'vole', 'vulture', 'wallaby', 'walrus', 'wasp', 'warbler', 'weasel', 'whale', 'whippet', 'whitefish', 'wildcat', 'wildebeest', 'wildfowl', 'wolf', 'wolverine', 'wombat', 'woodpecker', 'worm', 'wren', 'xerinae', 'yak', 'zebra', 'alpaca', 'cat', 'cattle', 'chicken', 'dog', 'donkey', 'ferret', 'gayal', 'goldfish', 'guppy', 'horse', 'koi', 'llama', 'sheep', 'yak', 'unicorn'];
var adjectives = ['average', 'big', 'colossal', 'fat', 'giant', 'gigantic', 'great', 'huge', 'immense', 'large', 'little', 'long', 'mammoth', 'massive', 'miniature', 'petite', 'puny', 'short', 'small', 'tall', 'tiny', 'boiling', 'breezy', 'broken', 'bumpy', 'chilly', 'cold', 'cool', 'creepy', 'crooked', 'cuddly', 'curly', 'damaged', 'damp', 'dirty', 'dry', 'dusty', 'filthy', 'flaky', 'fluffy', 'wet', 'broad', 'chubby', 'crooked', 'curved', 'deep', 'flat', 'high', 'hollow', 'low', 'narrow', 'round', 'shallow', 'skinny', 'square', 'steep', 'straight', 'wide', 'ancient', 'brief', 'early', 'fast', 'late', 'long', 'modern', 'old', 'quick', 'rapid', 'short', 'slow', 'swift', 'young', 'abundant', 'empty', 'few', 'heavy', 'light', 'many', 'numerous', 'Sound', 'cooing', 'deafening', 'faint', 'harsh', 'hissing', 'hushed', 'husky', 'loud', 'melodic', 'moaning', 'mute', 'noisy', 'purring', 'quiet', 'raspy', 'resonant', 'screeching', 'shrill', 'silent', 'soft', 'squealing', 'thundering', 'voiceless', 'whispering', 'bitter', 'delicious', 'fresh', 'juicy', 'ripe', 'rotten', 'salty', 'sour', 'spicy', 'stale', 'sticky', 'strong', 'sweet', 'tasteless', 'tasty', 'thirsty', 'fluttering', 'fuzzy', 'greasy', 'grubby', 'hard', 'hot', 'icy', 'loose', 'melted', 'plastic', 'prickly', 'rainy', 'rough', 'scattered', 'shaggy', 'shaky', 'sharp', 'shivering', 'silky', 'slimy', 'slippery', 'smooth', 'soft', 'solid', 'steady', 'sticky', 'tender', 'tight', 'uneven', 'weak', 'wet', 'wooden', 'afraid', 'angry', 'annoyed', 'anxious', 'arrogant', 'ashamed', 'awful', 'bad', 'bewildered', 'bored', 'combative', 'condemned', 'confused', 'creepy', 'cruel', 'dangerous', 'defeated', 'defiant', 'depressed', 'disgusted', 'disturbed', 'eerie', 'embarrassed', 'envious', 'evil', 'fierce', 'foolish', 'frantic', 'frightened', 'grieving', 'helpless', 'homeless', 'hungry', 'hurt', 'ill', 'jealous', 'lonely', 'mysterious', 'naughty', 'nervous', 'obnoxious', 'outrageous', 'panicky', 'repulsive', 'scary', 'scornful', 'selfish', 'sore', 'tense', 'terrible', 'thoughtless', 'tired', 'troubled', 'upset', 'uptight', 'weary', 'wicked', 'worried', 'agreeable', 'amused', 'brave', 'calm', 'charming', 'cheerful', 'comfortable', 'cooperative', 'courageous', 'delightful', 'determined', 'eager', 'elated', 'enchanting', 'encouraging', 'energetic', 'enthusiastic', 'excited', 'exuberant', 'fair', 'faithful', 'fantastic', 'fine', 'friendly', 'funny', 'gentle', 'glorious', 'good', 'happy', 'healthy', 'helpful', 'hilarious', 'jolly', 'joyous', 'kind', 'lively', 'lovely', 'lucky', 'obedient', 'perfect', 'pleasant', 'proud', 'relieved', 'silly', 'smiling', 'splendid', 'successful', 'thoughtful', 'victorious', 'vivacious', 'witty', 'wonderful', 'zealous', 'zany', 'other', 'good', 'new', 'old', 'great', 'high', 'small', 'different', 'large', 'local', 'social', 'important', 'long', 'young', 'national', 'british', 'right', 'early', 'possible', 'big', 'little', 'political', 'able', 'late', 'general', 'full', 'far', 'low', 'public', 'available', 'bad', 'main', 'sure', 'clear', 'major', 'economic', 'only', 'likely', 'real', 'black', 'particular', 'international', 'special', 'difficult', 'certain', 'open', 'whole', 'white', 'free', 'short', 'easy', 'strong', 'european', 'central', 'similar', 'human', 'common', 'necessary', 'single', 'personal', 'hard', 'private', 'poor', 'financial', 'wide', 'foreign', 'simple', 'recent', 'concerned', 'american', 'various', 'close', 'fine', 'english', 'wrong', 'present', 'royal', 'natural', 'individual', 'nice', 'french', 'nihilist', 'solipsist', 'materialist', 'surrealist', 'heroic', 'awesome', 'hedonist', 'absurd', 'current', 'modern', 'labour', 'legal', 'happy', 'final', 'red', 'normal', 'serious', 'previous', 'total', 'prime', 'significant', 'industrial', 'sorry', 'dead', 'specific', 'appropriate', 'top', 'soviet', 'basic', 'military', 'original', 'successful', 'aware', 'hon', 'popular', 'heavy', 'professional', 'direct', 'dark', 'cold', 'ready', 'green', 'useful', 'effective', 'western', 'traditional', 'scottish', 'german', 'independent', 'deep', 'interesting', 'considerable', 'involved', 'physical', 'hot', 'existing', 'responsible', 'complete', 'medical', 'blue', 'extra', 'past', 'male', 'interested', 'fair', 'essential', 'beautiful', 'civil', 'primary', 'obvious', 'future', 'environmental', 'positive', 'senior', 'nuclear', 'annual', 'relevant', 'huge', 'rich', 'commercial', 'safe', 'regional', 'practical', 'official', 'separate', 'key', 'chief', 'regular', 'due', 'additional', 'active', 'powerful', 'complex', 'standard', 'impossible', 'light', 'warm', 'middle', 'fresh', 'sexual', 'front', 'domestic', 'actual', 'united', 'technical', 'ordinary', 'cheap', 'strange', 'internal', 'excellent', 'quiet', 'soft', 'potential', 'northern', 'religious', 'quick', 'very', 'famous', 'cultural', 'proper', 'broad', 'joint', 'formal', 'limited', 'conservative', 'lovely', 'usual', 'ltd', 'unable', 'rural', 'initial', 'substantial', 'bright', 'average', 'leading', 'reasonable', 'immediate', 'suitable', 'equal', 'detailed', 'working', 'overall', 'female', 'afraid', 'democratic', 'growing', 'sufficient', 'scientific', 'eastern', 'correct', 'inc', 'irish', 'expensive', 'educational', 'mental', 'dangerous', 'critical', 'increased', 'familiar', 'unlikely', 'double', 'perfect', 'slow', 'tiny', 'dry', 'historical', 'thin', 'daily', 'southern', 'increasing', 'wild', 'alone', 'urban', 'empty', 'married', 'narrow', 'liberal', 'supposed', 'upper', 'apparent', 'tall', 'busy', 'bloody', 'prepared', 'russian', 'moral', 'careful', 'clean', 'attractive', 'japanese', 'vital', 'thick', 'alternative', 'fast', 'ancient', 'elderly', 'rare', 'external', 'capable', 'brief', 'wonderful', 'grand', 'typical', 'entire', 'grey', 'constant', 'vast', 'surprised', 'ideal', 'terrible', 'academic', 'funny', 'minor', 'pleased', 'severe', 'ill', 'corporate', 'negative', 'permanent', 'weak', 'brown', 'fundamental', 'odd', 'crucial', 'inner', 'used', 'criminal', 'contemporary', 'sharp', 'sick', 'near', 'roman', 'massive', 'unique', 'secondary', 'parliamentary', 'african', 'unknown', 'subsequent', 'angry', 'alive', 'guilty', 'lucky', 'enormous', 'well', 'yellow', 'unusual', 'net', 'tough', 'dear', 'extensive', 'glad', 'remaining', 'agricultural', 'alright', 'healthy', 'italian', 'principal', 'tired', 'efficient', 'comfortable', 'chinese', 'relative', 'friendly', 'conventional', 'willing', 'sudden', 'proposed', 'voluntary', 'slight', 'valuable', 'dramatic', 'golden', 'temporary', 'federal', 'keen', 'flat', 'silent', 'indian', 'worried', 'pale', 'statutory', 'welsh', 'dependent', 'firm', 'wet', 'competitive', 'armed', 'radical', 'outside', 'acceptable', 'sensitive', 'living', 'pure', 'global', 'emotional', 'sad', 'secret', 'rapid', 'adequate', 'fixed', 'sweet', 'administrative', 'wooden', 'remarkable', 'comprehensive', 'surprising', 'solid', 'rough', 'mere', 'mass', 'brilliant', 'maximum', 'absolute', 'electronic', 'visual', 'electric', 'cool', 'spanish', 'literary', 'continuing', 'supreme', 'chemical', 'genuine', 'exciting', 'written', 'advanced', 'extreme', 'classical', 'fit', 'favourite', 'widespread', 'confident', 'straight', 'proud', 'numerous', 'opposite', 'distinct', 'mad', 'helpful', 'given', 'disabled', 'consistent', 'anxious', 'nervous', 'awful', 'stable', 'constitutional', 'satisfied', 'conscious', 'developing', 'strategic', 'holy', 'smooth', 'dominant', 'remote', 'theoretical', 'outstanding', 'pink', 'pretty', 'clinical', 'minimum', 'honest', 'impressive', 'related', 'residential', 'extraordinary', 'plain', 'visible', 'accurate', 'distant', 'still', 'greek', 'complicated', 'musical', 'precise', 'gentle', 'broken', 'live', 'silly', 'fat', 'tight', 'monetary', 'round', 'psychological', 'violent', 'unemployed', 'inevitable', 'junior', 'sensible', 'grateful', 'pleasant', 'dirty', 'structural', 'welcome', 'deaf', 'above', 'continuous', 'blind', 'overseas', 'mean', 'entitled', 'delighted', 'loose', 'occasional', 'evident', 'desperate', 'fellow', 'universal', 'square', 'steady', 'classic', 'equivalent', 'intellectual', 'victorian', 'level', 'ultimate', 'creative', 'lost', 'medieval', 'clever', 'linguistic', 'convinced', 'judicial', 'raw', 'sophisticated', 'asleep', 'vulnerable', 'illegal', 'outer', 'revolutionary', 'bitter', 'changing', 'australian', 'native', 'imperial', 'strict', 'wise', 'informal', 'flexible', 'collective', 'frequent', 'experimental', 'spiritual', 'intense', 'rational', 'generous', 'inadequate', 'prominent', 'logical', 'bare', 'historic', 'modest', 'dutch', 'acute', 'electrical', 'valid', 'weekly', 'gross', 'automatic', 'loud', 'reliable', 'mutual', 'liable', 'multiple', 'ruling', 'curious', 'sole', 'managing', 'pregnant', 'latin', 'nearby', 'exact', 'underlying', 'identical', 'satisfactory', 'marginal', 'distinctive', 'electoral', 'urgent', 'presidential', 'controversial', 'everyday', 'encouraging', 'organic', 'continued', 'expected', 'statistical', 'desirable', 'innocent', 'improved', 'exclusive', 'marked', 'experienced', 'unexpected', 'superb', 'sheer', 'disappointed', 'frightened', 'gastric', 'romantic', 'naked', 'reluctant', 'magnificent', 'convenient', 'established', 'closed', 'uncertain', 'artificial', 'diplomatic', 'tremendous', 'marine', 'mechanical', 'retail', 'institutional', 'mixed', 'required', 'biological', 'known', 'functional', 'straightforward', 'superior', 'digital', 'spectacular', 'unhappy', 'confused', 'unfair', 'aggressive', 'spare', 'painful', 'abstract', 'asian', 'associated', 'legislative', 'monthly', 'intelligent', 'hungry', 'explicit', 'nasty', 'just', 'faint', 'coloured', 'ridiculous', 'amazing', 'comparable', 'successive', 'realistic', 'back', 'decent', 'decentralized', 'bitcoin', 'cypherpunk', 'unnecessary', 'flying', 'random', 'influential', 'dull', 'genetic', 'neat', 'marvellous', 'crazy', 'damp', 'giant', 'secure', 'bottom', 'skilled', 'subtle', 'elegant', 'brave', 'lesser', 'parallel', 'steep', 'intensive', 'casual', 'tropical', 'lonely', 'partial', 'preliminary', 'concrete', 'alleged', 'assistant', 'vertical', 'upset', 'delicate', 'mild', 'occupational', 'excessive', 'progressive', 'exceptional', 'integrated', 'striking', 'continental', 'okay', 'harsh', 'combined', 'fierce', 'handsome', 'characteristic', 'chronic', 'compulsory', 'interim', 'objective', 'splendid', 'magic', 'systematic', 'obliged', 'payable', 'fun', 'horrible', 'primitive', 'fascinating', 'ideological', 'metropolitan', 'surrounding', 'estimated', 'peaceful', 'premier', 'operational', 'technological', 'kind', 'advisory', 'hostile', 'precious', 'accessible', 'determined', 'excited', 'impressed', 'provincial', 'smart', 'endless', 'isolated', 'drunk', 'geographical', 'like', 'dynamic', 'boring', 'forthcoming', 'unfortunate', 'definite', 'super', 'notable', 'indirect', 'stiff', 'wealthy', 'awkward', 'lively', 'neutral', 'artistic', 'content', 'mature', 'colonial', 'ambitious', 'evil', 'magnetic', 'verbal', 'legitimate', 'sympathetic', 'empirical', 'head', 'shallow', 'vague', 'naval', 'depressed', 'shared', 'added', 'shocked', 'mid', 'worthwhile', 'qualified', 'missing', 'blank', 'absent', 'favourable', 'polish', 'israeli', 'developed', 'profound', 'representative', 'enthusiastic', 'dreadful', 'rigid', 'reduced', 'cruel', 'coastal', 'peculiar', 'swiss', 'crude', 'extended', 'selected', 'eager', 'canadian', 'bold', 'relaxed', 'corresponding', 'running', 'planned', 'applicable', 'immense', 'allied', 'comparative', 'uncomfortable', 'conservation', 'productive', 'beneficial', 'bored', 'charming', 'minimal', 'mobile', 'turkish', 'orange', 'rear', 'passive', 'suspicious', 'overwhelming', 'fatal', 'resulting', 'symbolic', 'registered', 'neighbouring', 'calm', 'irrelevant', 'patient', 'compact', 'profitable', 'rival', 'loyal', 'moderate', 'distinguished', 'interior', 'noble', 'insufficient', 'eligible', 'mysterious', 'varying', 'managerial', 'molecular', 'olympic', 'linear', 'prospective', 'printed', 'parental', 'diverse', 'elaborate', 'furious', 'fiscal', 'burning', 'useless', 'semantic', 'embarrassed', 'inherent', 'philosophical', 'deliberate', 'awake', 'variable', 'promising', 'unpleasant', 'varied', 'sacred', 'selective', 'inclined', 'tender', 'hidden', 'worthy', 'intermediate', 'sound', 'protective', 'fortunate', 'slim', 'defensive', 'divine', 'stuck', 'driving', 'invisible', 'misleading', 'circular', 'mathematical', 'inappropriate', 'liquid', 'persistent', 'solar', 'doubtful', 'manual', 'architectural', 'intact', 'incredible', 'devoted', 'prior', 'tragic', 'respectable', 'optimistic', 'convincing', 'unacceptable', 'decisive', 'competent', 'spatial', 'respective', 'binding', 'relieved', 'nursing', 'toxic', 'select', 'redundant', 'integral', 'then', 'probable', 'amateur', 'fond', 'passing', 'specified', 'territorial', 'horizontal', 'inland', 'cognitive', 'regulatory', 'miserable', 'resident', 'polite', 'scared', 'gothic', 'civilian', 'instant', 'lengthy', 'adverse', 'korean', 'unconscious', 'anonymous', 'aesthetic', 'orthodox', 'static', 'unaware', 'costly', 'fantastic', 'foolish', 'fashionable', 'causal', 'compatible', 'wee', 'implicit', 'dual', 'ok', 'cheerful', 'subjective', 'forward', 'surviving', 'exotic', 'purple', 'cautious', 'visiting', 'aggregate', 'ethical', 'teenage', 'dying', 'disastrous', 'delicious', 'confidential', 'underground', 'thorough', 'grim', 'autonomous', 'atomic', 'frozen', 'colourful', 'injured', 'uniform', 'ashamed', 'glorious', 'wicked', 'coherent', 'rising', 'shy', 'novel', 'balanced', 'delightful', 'arbitrary', 'adjacent', 'worrying', 'weird', 'unchanged', 'rolling', 'evolutionary', 'intimate', 'sporting', 'disciplinary', 'formidable', 'lexical', 'noisy', 'gradual', 'accused', 'homeless', 'supporting', 'coming', 'renewed', 'excess', 'retired', 'rubber', 'chosen', 'outdoor', 'embarrassing', 'preferred', 'bizarre', 'appalling', 'agreed', 'imaginative', 'governing', 'accepted', 'vocational', 'mighty', 'puzzled', 'worldwide', 'organisational', 'sunny', 'eldest', 'eventual', 'spontaneous', 'vivid', 'rude', 'faithful', 'ministerial', 'innovative', 'controlled', 'conceptual', 'unwilling', 'civic', 'meaningful', 'alive', 'brainy', 'breakable', 'busy', 'careful', 'cautious', 'clever', 'concerned', 'crazy', 'curious', 'dead', 'different', 'difficult', 'doubtful', 'easy', 'famous', 'fragile', 'helpful', 'helpless', 'important', 'impossible', 'innocent', 'inquisitive', 'modern', 'open', 'outstanding', 'poor', 'powerful', 'puzzled', 'real', 'rich', 'shy', 'sleepy', 'super', 'tame', 'uninterested', 'wandering', 'wild', 'wrong', 'adorable', 'alert', 'average', 'beautiful', 'blonde', 'bloody', 'blushing', 'bright', 'clean', 'clear', 'cloudy', 'colorful', 'crowded', 'cute', 'dark', 'drab', 'distinct', 'dull', 'elegant', 'fancy', 'filthy', 'glamorous', 'gleaming', 'graceful', 'grotesque', 'homely', 'light', 'misty', 'motionless', 'muddy', 'plain', 'poised', 'quaint', 'shiny', 'smoggy', 'sparkling', 'spotless', 'stormy', 'strange', 'ugly', 'unsightly', 'unusual', 'bad', 'better', 'beautiful', 'big', 'black', 'blue', 'bright', 'clumsy', 'crazy', 'dizzy', 'dull', 'fat', 'frail', 'friendly', 'funny', 'great', 'green', 'gigantic', 'gorgeous', 'grumpy', 'handsome', 'happy', 'horrible', 'itchy', 'jittery', 'jolly', 'kind', 'long', 'lazy', 'magnificent', 'magenta', 'many', 'mighty', 'mushy', 'nasty', 'new', 'nice', 'nosy', 'nutty', 'nutritious', 'odd', 'orange', 'ordinary', 'pretty', 'precious', 'prickly', 'purple', 'quaint', 'quiet', 'quick', 'quickest', 'rainy', 'rare', 'ratty', 'red', 'roasted', 'robust', 'round', 'sad', 'scary', 'scrawny', 'short', 'silly', 'stingy', 'strange', 'striped', 'spotty', 'tart', 'tall', 'tame', 'tan', 'tender', 'testy', 'tricky', 'tough', 'ugly', 'ugliest', 'vast', 'watery', 'wasteful', 'wonderful', 'yellow', 'yummy', 'zany'];
var util = {
  gunOnceDefined: gunOnceDefined,
  gunAsAnotherUser: gunAsAnotherUser,
  getHash: function getHash(str, format) {
    var _this = this;
    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var hash;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (format === void 0) {
                format = "base64";
              }
              if (str) {
                _context.next = 3;
                break;
              }
              return _context.abrupt("return", undefined);
            case 3:
              _context.next = 5;
              return Gun.SEA.work(str, undefined, undefined, {
                name: "SHA-256"
              });
            case 5:
              hash = _context.sent;
              if (hash) {
                _context.next = 8;
                break;
              }
              throw new Error("Gun.SEA.work failed for " + str);
            case 8:
              if (!(hash.length > 44)) {
                _context.next = 10;
                break;
              }
              throw new Error("Gun.SEA.work returned an invalid SHA-256 hash longer than 44 chars: " + hash + ". This is probably due to a sea.js bug on Safari.");
            case 10:
              if (!(format === "hex")) {
                _context.next = 12;
                break;
              }
              return _context.abrupt("return", _this.base64ToHex(hash));
            case 12:
              return _context.abrupt("return", hash);
            case 13:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },
  capitalize: function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  },
  generateName: function generateName() {
    return this.capitalize(_.sample(adjectives)) + " " + this.capitalize(_.sample(animals));
  },
  base64ToHex: function base64ToHex(str) {
    var raw = atob(str);
    var result = '';
    for (var i = 0; i < raw.length; i++) {
      var hex = raw.charCodeAt(i).toString(16);
      result += hex.length === 2 ? hex : "0" + hex;
    }
    return result;
  },
  getCaret: function getCaret(el) {
    if (el.selectionStart) {
      return el.selectionStart;
    } else {
      // @ts-ignore
      if (document.selection) {
        el.focus();
        // @ts-ignore
        var r = document.selection.createRange();
        if (r === null) {
          return 0;
        }
        // @ts-ignore
        var re = el.createTextRange(),
          rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
      }
    }
    return 0;
  },
  injectCss: function injectCss() {
    var elementId = "irisStyle";
    if (document.getElementById(elementId)) {
      return;
    }
    var sheet = document.createElement("style");
    sheet.id = elementId;
    sheet.innerHTML = "\n      .iris-follow-button .hover {\n        display: none;\n      }\n\n      .iris-follow-button.following:hover .hover {\n        display: inline;\n      }\n\n      .iris-follow-button.following:hover .nonhover {\n        display: none;\n      }\n\n      .iris-identicon * {\n        box-sizing: border-box;\n      }\n\n      .iris-identicon {\n        vertical-align: middle;\n        border-radius: 50%;\n        text-align: center;\n        display: inline-block;\n        position: relative;\n        max-width: 100%;\n      }\n\n      .iris-distance {\n        z-index: 2;\n        position: absolute;\n        left:0%;\n        top:2px;\n        width: 100%;\n        text-align: right;\n        color: #fff;\n        text-shadow: 0 0 1px #000;\n        font-size: 75%;\n        line-height: 75%;\n        font-weight: bold;\n      }\n\n      .iris-pie {\n        border-radius: 50%;\n        position: absolute;\n        top: 0;\n        left: 0;\n        box-shadow: 0px 0px 0px 0px #82FF84;\n        padding-bottom: 100%;\n        max-width: 100%;\n        -webkit-transition: all 0.2s ease-in-out;\n        -moz-transition: all 0.2s ease-in-out;\n        transition: all 0.2s ease-in-out;\n      }\n\n      .iris-card {\n        padding: 10px;\n        background-color: #f7f7f7;\n        color: #777;\n        border: 1px solid #ddd;\n        display: flex;\n        flex-direction: row;\n        overflow: hidden;\n      }\n\n      .iris-card a {\n        -webkit-transition: color 150ms;\n        transition: color 150ms;\n        text-decoration: none;\n        color: #337ab7;\n      }\n\n      .iris-card a:hover, .iris-card a:active {\n        text-decoration: underline;\n        color: #23527c;\n      }\n\n      .iris-pos {\n        color: #3c763d;\n      }\n\n      .iris-neg {\n        color: #a94442;\n      }\n\n      .iris-identicon img {\n        position: absolute;\n        top: 0;\n        left: 0;\n        max-width: 100%;\n        border-radius: 50%;\n        border-color: transparent;\n        border-style: solid;\n      }\n\n      .iris-chat-open-button {\n        background-color: #1e1e1e;\n        color: #fff;\n        padding: 15px;\n        cursor: pointer;\n        user-select: none;\n      }\n\n      .iris-chat-open-button svg {\n        width: 1em;\n      }\n\n      .iris-chat-open-button, .iris-chat-box {\n        position: fixed;\n        bottom: 0.5rem;\n        right: 0.5rem;\n        border-radius: 8px;\n        font-family: system-ui;\n        font-size: 15px;\n      }\n\n      .iris-chat-box {\n        background-color: #fff;\n        max-height: 25rem;\n        box-shadow: 2px 2px 20px rgba(0, 0, 0, 0.2);\n        height: calc(100% - 44px);\n        display: flex;\n        flex-direction: column;\n        width: 320px;\n        color: rgb(38, 38, 38);\n      }\n\n      .iris-chat-box.minimized {\n        height: auto;\n      }\n\n      .iris-chat-box.minimized .iris-chat-header {\n        border-radius: 8px;\n        cursor: pointer;\n      }\n\n      .iris-chat-box.minimized .iris-chat-messages, .iris-chat-box.minimized .iris-typing-indicator, .iris-chat-box.minimized .iris-chat-input-wrapper, .iris-chat-box.minimized .iris-chat-minimize, .iris-chat-box.minimized .iris-chat-close {\n        display: none;\n      }\n\n      .iris-chat-header {\n        background-color: #1e1e1e;\n        height: 44px;\n        color: #fff;\n        border-radius: 8px 8px 0 0;\n        text-align: center;\n        display: flex;\n        flex-direction: row;\n        justify-content: center;\n        align-items: center;\n        flex: none;\n        white-space: nowrap;\n        text-overflow: ellipsis;\n        overflow: hidden;\n      }\n\n      .iris-chat-header-text {\n        flex: 1;\n      }\n\n      .iris-online-indicator {\n        color: #bfbfbf;\n        margin-right: 5px;\n        font-size: 12px;\n        user-select: none;\n        flex: none;\n      }\n\n      .iris-online-indicator.yes {\n        color: #80bf5f;\n      }\n\n      .iris-typing-indicator {\n        display: none;\n        background-color: rgba(255, 255, 255, 0.5);\n        font-size: 12px;\n        padding: 2px;\n        color: #777;\n      }\n\n      .iris-typing-indicator.yes {\n        display: block;\n      }\n\n      .iris-chat-messages {\n        flex: 1;\n        padding: 15px;\n        overflow-y: scroll;\n      }\n\n      .iris-chat-input-wrapper {\n        flex: none;\n        padding: 15px;\n        background-color: #efefef;\n        display: flex;\n        flex-direction: row;\n        border-radius: 0 0 8px 8px;\n      }\n\n      .iris-chat-input-wrapper textarea {\n        padding: 15px 8px;\n        border-radius: 4px;\n        border: 1px solid rgba(0,0,0,0);\n        width: auto;\n        font-size: 15px;\n        resize: none;\n        flex: 1;\n      }\n\n      .iris-chat-input-wrapper textarea:focus {\n        outline: none;\n        border: 1px solid #6dd0ed;\n      }\n\n      .iris-chat-input-wrapper button svg {\n        display: inline-block;\n        font-size: inherit;\n        height: 1em;\n        width: 1em;\n        overflow: visible;\n        vertical-align: -0.125em;\n      }\n\n      .iris-chat-input-wrapper button, .iris-chat-input-wrapper button:hover, .iris-chat-input-wrapper button:active, .iris-chat-input-wrapper button:focus {\n        flex: none;\n        color: #999;\n        background-color: transparent;\n        font-size: 30px;\n        padding: 5px;\n        border: 1px solid rgba(0,0,0,0);\n        border-radius: 4px;\n        margin-left: 5px;\n      }\n\n      .iris-chat-input-wrapper button:active, .iris-chat-input-wrapper button:focus {\n        outline: none;\n        border: 1px solid #6dd0ed;\n      }\n\n      .iris-chat-message {\n        display: flex;\n        flex-direction: column;\n        margin-bottom: 2px;\n        overflow-wrap: break-word;\n      }\n\n      .iris-msg-content {\n        background-color: #efefef;\n        padding: 6px 10px;\n        border-radius: 8px;\n        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);\n        flex: none;\n        max-width: 75%;\n      }\n\n      .emoji {\n        font-size: 1.3em;\n        line-height: 1em;\n      }\n\n      .iris-chat-message .emoji-only {\n        font-size: 3em;\n        text-align: center;\n      }\n\n      .iris-seen {\n        color: rgba(0, 0, 0, 0.45);\n        user-select: none;\n      }\n\n      .iris-seen.yes {\n        color: #4fc3f7;\n      }\n\n      .iris-seen svg {\n        width: 18px;\n      }\n\n      .iris-delivered-checkmark {\n        display: none;\n      }\n\n      .delivered .iris-delivered-checkmark {\n        display: initial;\n      }\n\n      .iris-chat-minimize, .iris-chat-close {\n        user-select: none;\n        cursor: pointer;\n        width: 45px;\n        line-height: 44px;\n      }\n\n      .iris-chat-message.their {\n        align-items: flex-start;\n      }\n\n      .iris-chat-message.their + .iris-chat-message.our .iris-msg-content, .day-separator + .iris-chat-message.our .iris-msg-content {\n        margin-top: 15px;\n        border-radius: 8px 0px 8px 8px;\n      }\n\n      .iris-chat-message.their:first-of-type .iris-msg-content {\n        border-radius: 0px 8px 8px 8px;\n      }\n\n      .iris-chat-message.our:first-of-type .iris-msg-content {\n        border-radius: 8px 0px 8px 8px;\n      }\n\n      .iris-chat-message.our + .iris-chat-message.their .iris-msg-content, .day-separator + .iris-chat-message.their .iris-msg-content {\n        margin-top: 15px;\n        border-radius: 0px 8px 8px 8px;\n      }\n\n      .iris-chat-message.our {\n        align-items: flex-end;\n      }\n\n      .iris-chat-message.our .iris-msg-content {\n        background-color: #c5ecf7;\n      }\n\n      .iris-chat-message .time {\n        text-align: right;\n        font-size: 12px;\n        color: rgba(0, 0, 0, 0.45);\n      }\n\n      .iris-non-string {\n        color: blue;\n      }\n\n      .day-separator {\n        display: inline-block;\n        border-radius: 8px;\n        background-color: rgba(227, 249, 255, 0.91);\n        padding: 6px 10px;\n        margin-top: 15px;\n        margin-left: auto;\n        margin-right: auto;\n        text-transform: uppercase;\n        font-size: 13px;\n        color: rgba(74, 74, 74, 0.88);\n        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);\n        user-select: none;\n      }\n\n      .day-separator:first-of-type {\n        margin-top: 0;\n      }\n\n      *[contenteditable=\"true\"]:not(:focus) {\n        cursor: pointer;\n      }\n\n      *[contenteditable=\"true\"] {\n        outline: none;\n      }\n\n      [placeholder]:empty:before {\n        content: attr(placeholder);\n        color: #999;\n      }\n\n      [placeholder]:empty:focus {\n        cursor: text;\n      }\n      ";
    document.head.prepend(sheet);
  },
  getUrlParameter: function getUrlParameter(sParam, sParams) {
    var sPageURL = sParams || window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    var sParameterName, i;
    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
      }
    }
    return;
  },
  formatTime: function formatTime(date) {
    // @ts-ignore
    var t = date.toLocaleTimeString(undefined, {
      timeStyle: 'short'
    });
    var s = t.split(':');
    if (s.length === 3) {
      // safari tries to display seconds
      return s[0] + ":" + s[1] + s[2].slice(2);
    }
    return t;
  },
  formatDate: function formatDate(date) {
    var t = date.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short'
    });
    var s = t.split(':');
    if (s.length === 3) {
      // safari tries to display seconds
      return s[0] + ":" + s[1] + s[2].slice(2);
    }
    return t;
  },
  getDaySeparatorText: function getDaySeparatorText(date, dateStr, now, nowStr) {
    if (!now) {
      now = new Date();
      // @ts-ignore
      nowStr = now.toLocaleDateString({
        dateStyle: 'short'
      });
    }
    if (dateStr === nowStr) {
      return 'today';
    }
    var dayDifference = Math.round((now - date) / (1000 * 60 * 60 * 24));
    if (dayDifference === 0) {
      return 'today';
    }
    if (dayDifference === 1) {
      return 'yesterday';
    }
    if (dayDifference <= 5) {
      return date.toLocaleDateString(undefined, {
        weekday: 'long'
      });
    }
    return dateStr;
  },
  getProfileLink: function getProfileLink(pub) {
    return window.location.origin + "/#/profile/" + encodeURIComponent(pub);
  },
  truncateString: function truncateString(s, length) {
    if (length === void 0) {
      length = 30;
    }
    return s.length > length ? s.slice(0, length) + "..." : s;
  },
  createElement: function createElement(type, cls, parent) {
    var el = document.createElement(type);
    if (cls) {
      el.setAttribute('class', cls);
    }
    if (parent) {
      parent.appendChild(el);
    }
    return el;
  },
  isNode: isNode,
  isElectron: isElectron,
  isMobile: isMobile,
  throttle: function throttle(func, limit) {
    var inThrottle;
    return function () {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          return inThrottle = false;
        }, limit);
      }
    };
  },
  debounce: function debounce(func, delay) {
    var inDebounce;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(inDebounce);
      inDebounce = setTimeout(function () {
        return func.apply(context, args);
      }, delay);
    };
  },
  sample: function sample(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },
  sampleSize: function sampleSize(arr, size) {
    var shuffled = arr.slice(0);
    var i = arr.length;
    var min = i - size;
    var temp;
    var index;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
    }
    return shuffled.slice(min);
  },
  defer: function defer(func) {
    return setTimeout(func, 0);
  },
  once: function once(func) {
    var called = false;
    return function () {
      if (called) {
        return;
      }
      called = true;
      func.apply(this, arguments);
    };
  },
  omit: function omit(obj, keys) {
    var newObj = {};
    Object.keys(obj).forEach(function (key) {
      if (!keys.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
};

var ELECTRON_GUN_URL = 'http://localhost:8767/gun';
var maxConnectedPeers = 1;
var DEFAULT_PEERS = {
  'https://gun-rs.iris.to/gun': {},
  'https://gun-us.herokuapp.com/gun': {}
};
var loc = window.location;
var host = loc.host;
var is_localhost_but_not_dev = /*#__PURE__*/host.startsWith('localhost') && host !== 'localhost:8080';
if (loc.hostname.endsWith('herokuapp.com') || is_localhost_but_not_dev) {
  Object.keys(DEFAULT_PEERS).forEach(function (url) {
    return DEFAULT_PEERS[url].enabled = false;
  });
  DEFAULT_PEERS[loc.origin + "/gun"] = {
    enabled: true
  };
}
var urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
/**
 * Networking and peer management utilities
 */
var peers = {
  known: {},
  /** */add: function add(peer) {
    var _this = this;
    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var url, secret, encryptedUrl, encryptedUrlHash;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(peer.url && !urlRegex.test(peer.url))) {
                _context.next = 2;
                break;
              }
              throw new Error("Invalid url " + peer.url);
            case 2:
              if (peer.from) {
                Object.keys(_this.known).forEach(function (k) {
                  if (_this.known[k].from === peer.from) {
                    // remove previous peer url from the same user
                    delete _this.known[k];
                  }
                });
              }
              url = peer.url || '';
              _this.known[url] = _this.known[url] || _.omit(peer, ['url']);
              if (!(peer.visibility === 'public')) {
                _context.next = 19;
                break;
              }
              _context.next = 8;
              return Gun.SEA.secret(session.getKey().epub, session.getKey());
            case 8:
              _context.t0 = _context.sent;
              if (_context.t0) {
                _context.next = 11;
                break;
              }
              _context.t0 = '';
            case 11:
              secret = _context.t0;
              _context.next = 14;
              return Gun.SEA.encrypt(peer.url, secret);
            case 14:
              encryptedUrl = _context.sent;
              _context.next = 17;
              return Gun.SEA.work(encryptedUrl, null, null, {
                name: 'SHA-256'
              });
            case 17:
              encryptedUrlHash = _context.sent;
              global$2().user().get('peers').get(encryptedUrlHash).put({
                url: peer.url,
                lastSeen: new Date().toISOString()
              });
            case 19:
              if (peer.enabled !== false) {
                peer.url && _this.connect(peer.url); // this calls savePeers()
              } else {
                _this.save();
              }
            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },
  /** */remove: function remove(url) {
    delete this.known[url];
    this.save();
  },
  /** */disconnect: function disconnect(peerFromGun) {
    global$2().on('bye', peerFromGun);
    peerFromGun.url = '';
  },
  save: function save() {
    localStorage.setItem('gunPeers', JSON.stringify(this.known));
  },
  getSaved: function getSaved() {
    var p = localStorage.getItem('gunPeers');
    if (p && p !== 'undefined') {
      p = JSON.parse(p);
    } else {
      p = DEFAULT_PEERS;
    }
    if (util.isElectron) {
      p[ELECTRON_GUN_URL] = {};
    }
    Object.keys(p).forEach(function (k) {
      return _.defaults(p[k], {
        enabled: true
      });
    });
    return p;
  },
  /** */reset: function reset() {
    localStorage.setItem('gunPeers', '');
    this.known = this.getSaved();
  },
  /** */connect: function connect(url) {
    if (this.isMixedContent(url)) {
      return;
    }
    if (this.known[url]) {
      this.known[url].enabled = true;
      global$2().opt({
        peers: [url]
      });
      this.save();
    } else {
      this.add({
        url: url
      });
    }
  },
  /** */disable: function disable(url, peerFromGun) {
    this.known[url].enabled = false;
    if (peerFromGun) {
      this.disconnect(peerFromGun);
    }
    this.save();
  },
  isMixedContent: function isMixedContent(url) {
    return window.location.protocol === 'https:' && url.indexOf('http:') === 0;
  },
  random: function random() {
    var _this2 = this;
    var connectToLocalElectron = util.isElectron && this.known[ELECTRON_GUN_URL] && this.known[ELECTRON_GUN_URL].enabled !== false;
    var sampleSize = connectToLocalElectron ? Math.max(maxConnectedPeers - 1, 1) : maxConnectedPeers;
    var sample = _.sampleSize(Object.keys(_.pickBy(this.known, function (peer, url) {
      return !_this2.isMixedContent(url) && peer.enabled && !(util.isElectron && url === ELECTRON_GUN_URL);
    })), sampleSize);
    if (sample && connectToLocalElectron) {
      sample.push(ELECTRON_GUN_URL);
    }
    return sample;
  },
  checkGunPeerCount: function checkGunPeerCount() {
    var _this3 = this;
    var peersFromGun = global$2().back('opt.peers');
    var connectedPeers = Object.values(peersFromGun).filter(function (peer) {
      if (peer && peer.wire && peer.wire.constructor.name !== 'WebSocket') {
        console.log('WebRTC peer', peer);
      }
      return peer && peer.wire && peer.wire.readyState === 1 && peer.wire.bufferedAmount === 0 && peer.wire.constructor.name === 'WebSocket';
    });
    if (connectedPeers.length < maxConnectedPeers) {
      var unconnectedPeers = Object.keys(this.known).filter(function (url) {
        var addedToGun = Object.values(peersFromGun).map(function (peer) {
          return peer.url;
        }).indexOf(url) > -1;
        var enabled = _this3.known[url].enabled;
        var mixedContent = window.location.protocol === 'https:' && url.indexOf('http:') === 0;
        return !mixedContent && enabled && !addedToGun;
      });
      if (unconnectedPeers.length) {
        var sample = String(_.sample(unconnectedPeers));
        this.connect(sample);
      }
    }
    if (connectedPeers.length > maxConnectedPeers) {
      this.disconnect(_.sample(connectedPeers));
    }
  },
  init: function init() {
    var _this4 = this;
    this.known = this.getSaved();
    /* use the default value of 1 for now because of memory issue
    local().get('settings').get('maxConnectedPeers').on(n => {
      if (n !== undefined) maxConnectedPeers = n;
    });
     */
    setInterval(function () {
      return _this4.checkGunPeerCount();
    }, 1000);
  }
};

var global$1;
function global$2 (opts) {
  if (opts === void 0) {
    opts = {};
  }
  if (!global$1) {
    var myOpts = Object.assign({
      peers: opts.peers || peers.random(),
      localStorage: false,
      retry: Infinity
    }, opts);
    if (opts.peers) {
      opts.peers.forEach(function (url) {
        return peers.add({
          url: url
        });
      });
    }
    peers.init();
    global$1 = new Gun(myOpts);
  }
  return global$1;
}

// @ts-nocheck
/*eslint no-useless-escape: "off", camelcase: "off" */
var UNIQUE_ID_VALIDATORS = {
  email: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
  bitcoin: /^[13][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
  bitcoin_address: /^[13][a-km-zA-HJ-NP-Z0-9]{26,33}$/,
  ip: /^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/,
  ipv6: /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/,
  gpg_fingerprint: null,
  gpg_keyid: null,
  google_oauth2: null,
  tel: /^\d{7,}$/,
  phone: /^\d{7,}$/,
  keyID: null,
  url: /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi,
  account: /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i,
  uuid: /[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}/
};
// TODO this class could perhaps be removed
var Attribute = /*#__PURE__*/function () {
  function Attribute(a, b) {
    if (typeof a === "object") {
      if (typeof a.value !== "string") {
        throw new Error("param1.value must be a string, got " + typeof a.value + ": " + JSON.stringify(a.value));
      }
      if (typeof a.type !== "string") {
        throw new Error("param1.type must be a string, got " + typeof a.type + ": " + JSON.stringify(a.type));
      }
      b = a.value;
      a = a.type;
    }
    if (typeof a !== "string") {
      throw new Error("First param must be a string, got " + typeof a + ": " + JSON.stringify(a));
    }
    if (!a.length) {
      throw new Error("First param string is empty");
    }
    if (b) {
      if (typeof b !== "string") {
        throw new Error("Second parameter must be a string, got " + typeof b + ": " + JSON.stringify(b));
      }
      if (!b.length) {
        throw new Error("Second param string is empty");
      }
      this.type = a;
      this.value = b;
    } else {
      this.value = a;
      var t = Attribute.guessTypeOf(this.value);
      if (t) {
        this.type = t;
      } else {
        throw new Error("Type of attribute was omitted and could not be guessed");
      }
    }
  }
  Attribute.getUuid = function getUuid() {
    var b = function b(a) {
      return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
    };
    return new Attribute("uuid", b());
  };
  Attribute.getUniqueIdValidators = function getUniqueIdValidators() {
    return UNIQUE_ID_VALIDATORS;
  };
  Attribute.isUniqueType = function isUniqueType(type) {
    return Object.keys(UNIQUE_ID_VALIDATORS).indexOf(type) > -1;
  };
  var _proto = Attribute.prototype;
  _proto.isUniqueType = function isUniqueType() {
    return Attribute.isUniqueType(this.type);
  };
  Attribute.guessTypeOf = function guessTypeOf(value) {
    for (var key in UNIQUE_ID_VALIDATORS) {
      if (value.match(UNIQUE_ID_VALIDATORS[key])) {
        return key;
      }
    }
  };
  Attribute.equals = function equals(a, b) {
    return a.equals(b);
  };
  _proto.equals = function equals(a) {
    return a && this.type === a.type && this.value === a.value;
  };
  _proto.uri = function uri() {
    return encodeURIComponent(this.value) + ":" + encodeURIComponent(this.type);
  };
  return Attribute;
}();

var currentUser;
/**
 * Get a public space where only the specified user (public key) can write. Others can read.
 * @param pub The public key of the user. Defaults to the current user from session.
 * @returns {Node} The user space.
 */
function publicState (pub) {
  if (!currentUser) {
    currentUser = global$2().user();
    currentUser.auth(session.getKey());
  }
  return pub ? global$2().user(pub) : currentUser;
}

// TODO: extract Group channels into their own class
var DEFAULT_PERMISSIONS = {
  read: true,
  write: true,
  admin: false
};
/**
* Private communication channel between two or more participants ([Gun](https://github.com/amark/gun) public keys). Can be used independently of other Iris stuff.
*
* Used as a core element of [iris-messenger](https://github.com/irislib/iris-messenger).
*
* You can use iris.private(pub) to always use the same Channel object for a given pub.
*
* ---
*
* #### Key-value API
* `channel.put(key, value)` and `channel.on(key, callback)`.
*
* Note that each participant has their own versions of each key-value — they don't overwrite each other. `channel.on()` callback returns them all by default and has a parameter that indicates whose value you got.
*
* While values are encrypted, encryption of keys is not implemented yet.
*
* #### Message API
* `channel.send()` and `channel.getMessages()` for timestamp-indexed chat-style messaging.
*
* Message data is encrypted, but timestamps are public so that peers can return your messages in a sequential order.
*
* ---
*
* You can open a channel with yourself for a private key-value space or a "note to self" type chat with yourself.
*
* **Privacy disclaimer:** Channel ids, data values and messages are encrypted, but message timestamps are unencrypted so that peers can return them to you in a sequential order. By looking at the unencrypted timestamps (or Gun subscriptions), it is possible to guess who are communicating with each other. This could be improved by indexing messages by *day* only, so making the guess would be more difficult, while you could still return them in a semi-sequential order.
*
* @param {Object} options
* @param {string} options.key your keypair
* @param {Object} options.gun [gun](https://github.com/amark/gun) instance
* @param options.participants (optional) string or string array or permissions object ({'pub1':{read:true,write:true,admin:false},'pub2'...}) of participant public keys (your own key is included by default)
* @param {string} options.chatLink (optional) chat link instead of participants list
* @param {string} options.uuid (group channels only) unique channel identifier. Leave out for new channel.
* @param {string} options.name (group channels only) channel name
* @example
* // Copy & paste this to console at https://iris.to or other page that has gun, sea and iris-lib
* // Due to an unsolved bug, someoneElse's messages only start showing up after a reload
*
* var gun1 = new Gun('https://gun-us.herokuapp.com/gun');
* var gun2 = new Gun('https://gun-us.herokuapp.com/gun');
* var myKey = await iris.Key.getDefault();
* var someoneElse = localStorage.getItem('someoneElsesKey');
* if (someoneElse) {
*  someoneElse = JSON.parse(someoneElse);
* } else {
*  someoneElse = await iris.Key.generate();
*  localStorage.setItem('someoneElsesKey', JSON.stringify(someoneElse));
* }
*
* iris.Channel.initUser(gun1, myKey); // saves myKey.epub to gun.user().get('epub')
* iris.Channel.initUser(gun2, someoneElse);
*
* var ourChannel = new iris.Channel({key: myKey, gun: gun1, participants: someoneElse.pub});
* var theirChannel = new iris.Channel({key: someoneElse, gun: gun2, participants: myKey.pub});
*
* var myChannels = {}; // you can list them in a user interface
* function printMessage(msg, info) {
*  console.log(`[${new Date(msg.time).toLocaleString()}] ${info.from.slice(0,8)}: ${msg.text}`)
* }
* iris.Channel.getChannels(gun1, myKey, channel => {
*  var pub = channel.getCurrentParticipants()[0];
*  gun1.user(pub).get('profile').get('name').on(name => channel.name = name);
*  myChannels[pub] = channel;
*  channel.getMessages(printMessage);
*  channel.on('mood', (mood, from) => console.log(from.slice(0,8) + ' is feeling ' + mood));
* });
*
* // you can play with these in the console:
* ourChannel.send('message from myKey');
* theirChannel.send('message from someoneElse');
*
* ourChannel.put('mood', 'blessed');
* theirChannel.put('mood', 'happy');
*
* @example https://github.com/irislib/iris-lib/blob/master/__tests__/Channel.js
*/
var Channel = /*#__PURE__*/function () {
  function Channel(options) {
    var _this = this;
    this.theirSecretUuids = {};
    this.theirGroupSecrets = {};
    this.secrets = {};
    this.ourSecretChannelIds = {};
    this.theirSecretChannelIds = {};
    this.messages = {};
    this.chatLinks = {};
    this.groupSubscriptions = {};
    this.directSubscriptions = {};
    this.getParticipantsCallbacks = {};
    this.myGroupSecret = options.myGroupSecret;
    if (options.chatLink) {
      this.useChatLink(options);
    }
    if (typeof options.participants === "string") {
      this.addParticipant(options.participants, options.save);
    } else if (Array.isArray(options.participants)) {
      var o = {};
      options.participants.forEach(function (p) {
        return o[p] = Object.assign({}, DEFAULT_PERMISSIONS);
      });
      options.participants = o;
    }
    if (typeof options.participants === "object") {
      // it's a group channel
      var keys = Object.keys(options.participants);
      keys.forEach(function (k) {
        if (k !== session.getKey().pub) {
          _this.addParticipant(k, options.save, Object.assign({}, DEFAULT_PERMISSIONS, options.participants[k]));
        }
      });
      options.participants[session.getKey().pub] = options.participants[session.getKey().pub] || Object.assign({}, DEFAULT_PERMISSIONS);
      if (options.uuid) {
        this.uuid = options.uuid;
        this.name = options.name;
      } else {
        options.uuid = Attribute.getUuid().value;
        this.uuid = options.uuid;
        options.participants[session.getKey().pub].admin = true;
        options.participants[session.getKey().pub].founder = true;
      }
      this.getChatLinks({
        subscribe: true
      });
    }
    this.participants = options.participants;
    if (options.uuid) {
      // It's a group channel
      // share secret uuid with other participants. since secret is already non-deterministic, maybe uuid could also be?
      // generate channel-specific secret and share it with other participants
      // put() keys should be encrypted first? so you could do put(uuid, secret)
      // what if you join the channel with 2 unconnected devices? on reconnect, the older secret would be overwritten and messages unreadable. maybe participants should store each others' old keys? or maybe you should store them and re-encrypt old stuff when key changes? return them with map() instead?
      this.putDirect("S" + this.uuid, this.getMyGroupSecret());
      this.getMySecretUuid().then(function (s) {
        _this.putDirect(_this.uuid, s); // TODO: encrypt keys in put()
      });

      this.onTheirDirect(this.uuid, function (s, k, from) {
        _this.theirSecretUuids[from] = s;
      });
      this.onTheirDirect("S" + this.uuid, function (s, k, from) {
        _this.theirGroupSecrets[from] = s;
      });
      // need to make put(), on(), send() and getMessages() behave differently when it's a group and retain the old versions for mutual signaling
    }

    this.onTheir("participants", function (participants, k, from) {
      var hasAdmin = false;
      var keys = Object.keys(_this.participants);
      for (var i = 0; i < keys.length; i++) {
        if (_this.participants[keys[i]].admin || _this.participants[keys[i]].inviter) {
          hasAdmin = true;
          break;
        }
      }
      if (!hasAdmin) {
        keys.forEach(function (k) {
          return _this.participants[k].admin = true;
        }); // if no admins, make everyone admin
      }

      if (_this.participants[from] && (_this.participants[from].admin || _this.participants[from].inviter)) {
        if (typeof participants === "object") {
          if (JSON.stringify(_this.participants) === JSON.stringify(participants)) {
            return;
          }
          _this.participants = participants;
          delete _this.participants[from].inviter;
          Object.keys(participants).forEach(function (k) {
            if (k !== session.getKey().pub) {
              _this.addParticipant(k, true, Object.assign({}, DEFAULT_PERMISSIONS, participants[k]), true);
            }
          });
          _this.participantsChanged();
          options.saved = true;
        }
      }
    });
    if (!options.saved && (options.save === undefined || options.save === true)) {
      this.save();
    }
  }
  var _proto = Channel.prototype;
  _proto.useChatLink = function useChatLink(options) {
    var s = options.chatLink.split('?');
    if (s.length === 2) {
      var chatWith = util.getUrlParameter('chatWith', s[1]);
      var channelId = util.getUrlParameter('channelId', s[1]);
      var inviter = util.getUrlParameter('inviter', s[1]);
      var pub = inviter || chatWith;
      if (chatWith) {
        options.participants = pub;
      } else if (channelId && inviter && inviter !== session.getKey().pub) {
        // TODO! initializing it twice breaks things - new secret is generated
        options.uuid = channelId;
        options.participants = {};
        options.participants[inviter] = Object.assign({
          inviter: true
        }, DEFAULT_PERMISSIONS);
      }
      if (pub !== session.getKey().pub) {
        var sharedSecret = util.getUrlParameter('s', s[1]);
        var linkId = util.getUrlParameter('k', s[1]);
        if (sharedSecret && linkId) {
          this.save(); // save the channel first so it's there before inviter subscribes to it
          options.saved = true;
          global$2().user(pub).get('chatLinks').get(linkId).get('encryptedSharedKey').on( /*#__PURE__*/function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(encrypted) {
              var sharedKey, encryptedChatRequest, channelRequestId;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return Gun.SEA.decrypt(encrypted, sharedSecret);
                    case 2:
                      sharedKey = _context.sent;
                      _context.next = 5;
                      return Gun.SEA.encrypt(session.getKey().pub, sharedSecret);
                    case 5:
                      encryptedChatRequest = _context.sent;
                      _context.next = 8;
                      return util.getHash(encryptedChatRequest);
                    case 8:
                      channelRequestId = _context.sent;
                      util.gunAsAnotherUser(global$2(), sharedKey, function (user) {
                        user.get('chatRequests').get(channelRequestId.slice(0, 12)).put(encryptedChatRequest);
                      });
                    case 10:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee);
            }));
            return function (_x) {
              return _ref.apply(this, arguments);
            };
          }());
        }
      }
    }
  };
  _proto.getTheirSecretUuid = function getTheirSecretUuid(pub) {
    var _this2 = this;
    return new Promise(function (resolve) {
      if (!_this2.theirSecretUuids[pub]) {
        _this2.onTheirDirect(_this2.uuid, function (s) {
          _this2.theirSecretUuids[pub] = s;
          resolve(_this2.theirSecretUuids[pub]);
        }, pub);
      } else {
        resolve(_this2.theirSecretUuids[pub]);
      }
    });
  };
  _proto.getTheirGroupSecret = function getTheirGroupSecret(pub) {
    var _this3 = this;
    if (pub === session.getKey().pub) {
      return this.getMyGroupSecret();
    }
    return new Promise(function (resolve) {
      if (!_this3.theirGroupSecrets[pub]) {
        _this3.onTheirDirect("S" + _this3.uuid, function (s) {
          _this3.theirGroupSecrets[pub] = s;
          resolve(_this3.theirGroupSecrets[pub]);
        }, pub);
      } else {
        resolve(_this3.theirGroupSecrets[pub]);
      }
    });
  };
  _proto.changeMyGroupSecret = function changeMyGroupSecret() {
    this.myGroupSecret = Gun.SEA.random(32).toString('base64');
    // TODO: secret should be archived and probably messages should include the encryption key id so past messages don't become unreadable
    this.putDirect("S" + this.uuid, this.myGroupSecret);
  }
  /**
  * Unsubscribe messages from a channel participants
  *
  * @param {string} participant public key
  */;
  _proto.mute =
  /*#__PURE__*/
  function () {
    var _mute = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(participant) {
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              global$2().user(participant).get(this.theirSecretUuids[participant]).off();
              // TODO: persist
            case 1:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));
    function mute(_x2) {
      return _mute.apply(this, arguments);
    }
    return mute;
  }() /**
      * Mute user and prevent them from seeing your further (and maybe past) messages
      *
      * @param {string} participant public key
      */;
  _proto.block =
  /*#__PURE__*/
  function () {
    var _block = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(participant) {
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              this.mute(participant);
              this.putDirect(this.uuid, null);
              this.putDirect("S" + this.uuid, null);
              delete this.secrets[participant];
              delete this.ourSecretChannelIds[participant];
              delete this.theirSecretChannelIds[participant];
              this.changeMyGroupSecret();
            case 7:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));
    function block(_x3) {
      return _block.apply(this, arguments);
    }
    return block;
  }();
  _proto.getMySecretUuid = /*#__PURE__*/function () {
    var _getMySecretUuid = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
      var mySecret, mySecretHash;
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (this.mySecretUuid) {
                _context4.next = 10;
                break;
              }
              _context4.next = 3;
              return Gun.SEA.secret(session.getKey().epub, session.getKey());
            case 3:
              mySecret = _context4.sent;
              _context4.next = 6;
              return util.getHash(mySecret);
            case 6:
              mySecretHash = _context4.sent;
              _context4.next = 9;
              return util.getHash(mySecretHash + this.uuid);
            case 9:
              this.mySecretUuid = _context4.sent;
            case 10:
              return _context4.abrupt("return", this.mySecretUuid);
            case 11:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));
    function getMySecretUuid() {
      return _getMySecretUuid.apply(this, arguments);
    }
    return getMySecretUuid;
  }() /**
      * List participants of the channel (other than you)
      */;
  _proto.getCurrentParticipants = function getCurrentParticipants() {
    return Object.keys(this.secrets);
  }
  /**
  * Subscribe to the changing list of participants by channel admins
  */;
  _proto.getParticipants = function getParticipants(callback) {
    if (this.getParticipantsCallbackId) {
      this.getParticipantsCallbackId++;
    } else {
      this.getParticipantsCallbackId = 1;
    }
    this.getParticipantsCallbacks[this.getParticipantsCallbackId] = callback;
    if (this.participants) {
      callback(this.participants);
    }
  };
  _proto.participantsChanged = function participantsChanged() {
    var _this4 = this;
    Object.keys(this.getParticipantsCallbacks).forEach(function (id) {
      _this4.getParticipantsCallbacks[id](_this4.participants);
    });
  }
  /**
  * Returns either the uuid of a group channel or the public key of a direct channel.
  */;
  _proto.getId = function getId() {
    return this.uuid || this.getCurrentParticipants()[0];
  };
  _proto.getSecret = /*#__PURE__*/function () {
    var _getSecret = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(pub) {
      var epub;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (this.secrets[pub]) {
                _context5.next = 7;
                break;
              }
              _context5.next = 3;
              return util.gunOnceDefined(global$2().user(pub).get("epub"));
            case 3:
              epub = _context5.sent;
              _context5.next = 6;
              return Gun.SEA.secret(epub, session.getKey());
            case 6:
              this.secrets[pub] = _context5.sent;
            case 7:
              return _context5.abrupt("return", this.secrets[pub]);
            case 8:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));
    function getSecret(_x4) {
      return _getSecret.apply(this, arguments);
    }
    return getSecret;
  }() /**
      *
      */;
  Channel.getOurSecretChannelId =
  /*#__PURE__*/
  function () {
    var _getOurSecretChannelId = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(pub, pair) {
      var epub, secret;
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return util.gunOnceDefined(global$2().user(pub).get("epub"));
            case 2:
              epub = _context6.sent;
              _context6.next = 5;
              return Gun.SEA.secret(epub, pair);
            case 5:
              secret = _context6.sent;
              return _context6.abrupt("return", util.getHash(secret + pub));
            case 7:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6);
    }));
    function getOurSecretChannelId(_x5, _x6) {
      return _getOurSecretChannelId.apply(this, arguments);
    }
    return getOurSecretChannelId;
  }() /**
      *
      */;
  Channel.getTheirSecretChannelId =
  /*#__PURE__*/
  function () {
    var _getTheirSecretChannelId = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(pub, pair) {
      var epub, secret;
      return _regeneratorRuntime().wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return util.gunOnceDefined(global$2().user(pub).get("epub"));
            case 2:
              epub = _context7.sent;
              _context7.next = 5;
              return Gun.SEA.secret(epub, pair);
            case 5:
              secret = _context7.sent;
              return _context7.abrupt("return", util.getHash(secret + pair.pub));
            case 7:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    }));
    function getTheirSecretChannelId(_x7, _x8) {
      return _getTheirSecretChannelId.apply(this, arguments);
    }
    return getTheirSecretChannelId;
  }() /**
      * Calls back with Channels that you have initiated or written to.
      * @param {Object} keypair Gun.SEA keypair that the gun instance is authenticated with
      * @param callback callback function that is called for each public key you have a channel with
      */;
  Channel.getChannels =
  /*#__PURE__*/
  function () {
    var _getChannels = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(callback, listenToChatLinks) {
      var keypair, mySecret, seen, handleChannel;
      return _regeneratorRuntime().wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              if (listenToChatLinks === void 0) {
                listenToChatLinks = true;
              }
              keypair = session.getKey();
              _context9.next = 4;
              return Gun.SEA.secret(keypair.epub, keypair);
            case 4:
              mySecret = _context9.sent;
              if (listenToChatLinks) {
                Channel.getMyChatLinks(undefined, undefined, true);
              }
              seen = {};
              handleChannel = /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(value, ourSecretChannelId) {
                  var encryptedChatId, chatId;
                  return _regeneratorRuntime().wrap(function _callee8$(_context8) {
                    while (1) {
                      switch (_context8.prev = _context8.next) {
                        case 0:
                          if (!(value && !seen[ourSecretChannelId])) {
                            _context8.next = 14;
                            break;
                          }
                          seen[ourSecretChannelId] = true;
                          if (!(ourSecretChannelId.length > 44)) {
                            _context8.next = 5;
                            break;
                          }
                          global$2().user().get("chats").get(ourSecretChannelId).put(null);
                          return _context8.abrupt("return");
                        case 5:
                          _context8.next = 7;
                          return util.gunOnceDefined(global$2().user().get("chats").get(ourSecretChannelId).get("pub"));
                        case 7:
                          encryptedChatId = _context8.sent;
                          _context8.next = 10;
                          return Gun.SEA.decrypt(encryptedChatId, mySecret);
                        case 10:
                          chatId = _context8.sent;
                          if (chatId) {
                            _context8.next = 13;
                            break;
                          }
                          return _context8.abrupt("return");
                        case 13:
                          if (chatId.pub || typeof chatId === "string") {
                            callback(new Channel({
                              key: keypair,
                              participants: chatId.pub || chatId,
                              save: false
                            }));
                          } else if (chatId.uuid && chatId.participants && chatId.myGroupSecret) {
                            callback(new Channel({
                              key: keypair,
                              participants: chatId.participants,
                              uuid: chatId.uuid,
                              myGroupSecret: chatId.myGroupSecret,
                              save: false
                            }));
                          }
                        case 14:
                        case "end":
                          return _context8.stop();
                      }
                    }
                  }, _callee8);
                }));
                return function handleChannel(_x11, _x12) {
                  return _ref2.apply(this, arguments);
                };
              }();
              global$2().user().get("chats").map().on(handleChannel);
            case 9:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
    }));
    function getChannels(_x9, _x10) {
      return _getChannels.apply(this, arguments);
    }
    return getChannels;
  }();
  _proto.getMyGroupSecret = function getMyGroupSecret() {
    if (!this.myGroupSecret) {
      this.changeMyGroupSecret();
    }
    return this.myGroupSecret;
  };
  _proto.getOurSecretChannelId = /*#__PURE__*/function () {
    var _getOurSecretChannelId2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(pub) {
      var secret;
      return _regeneratorRuntime().wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              if (this.ourSecretChannelIds[pub]) {
                _context10.next = 7;
                break;
              }
              _context10.next = 3;
              return this.getSecret(pub);
            case 3:
              secret = _context10.sent;
              _context10.next = 6;
              return util.getHash(secret + pub);
            case 6:
              this.ourSecretChannelIds[pub] = _context10.sent;
            case 7:
              return _context10.abrupt("return", this.ourSecretChannelIds[pub]);
            case 8:
            case "end":
              return _context10.stop();
          }
        }
      }, _callee10, this);
    }));
    function getOurSecretChannelId(_x13) {
      return _getOurSecretChannelId2.apply(this, arguments);
    }
    return getOurSecretChannelId;
  }();
  _proto.getTheirSecretChannelId = /*#__PURE__*/function () {
    var _getTheirSecretChannelId2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(pub) {
      var secret;
      return _regeneratorRuntime().wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              if (this.theirSecretChannelIds[pub]) {
                _context11.next = 7;
                break;
              }
              _context11.next = 3;
              return this.getSecret(pub);
            case 3:
              secret = _context11.sent;
              _context11.next = 6;
              return util.getHash(secret + session.getKey().pub);
            case 6:
              this.theirSecretChannelIds[pub] = _context11.sent;
            case 7:
              return _context11.abrupt("return", this.theirSecretChannelIds[pub]);
            case 8:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11, this);
    }));
    function getTheirSecretChannelId(_x14) {
      return _getTheirSecretChannelId2.apply(this, arguments);
    }
    return getTheirSecretChannelId;
  }() /**
      * Get messages from the channel
      */;
  _proto.getMessages =
  /*#__PURE__*/
  function () {
    var _getMessages = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee13(callback) {
      var _this5 = this;
      var mySecretUuid;
      return _regeneratorRuntime().wrap(function _callee13$(_context13) {
        while (1) {
          switch (_context13.prev = _context13.next) {
            case 0:
              this.getCurrentParticipants().forEach( /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee12(pub) {
                  var theirSecretChannelId, ourSecretChannelId;
                  return _regeneratorRuntime().wrap(function _callee12$(_context12) {
                    while (1) {
                      switch (_context12.prev = _context12.next) {
                        case 0:
                          if (!(pub !== session.getKey().pub)) {
                            _context12.next = 11;
                            break;
                          }
                          if (!_this5.uuid) {
                            _context12.next = 7;
                            break;
                          }
                          _context12.next = 4;
                          return _this5.getTheirSecretUuid(pub);
                        case 4:
                          theirSecretChannelId = _context12.sent;
                          _context12.next = 10;
                          break;
                        case 7:
                          _context12.next = 9;
                          return _this5.getTheirSecretChannelId(pub);
                        case 9:
                          theirSecretChannelId = _context12.sent;
                        case 10:
                          global$2().user(pub).get("chats").get(theirSecretChannelId).get("msgs").map().once(function (data, key) {
                            _this5.messageReceived(callback, data, _this5.uuid || pub, false, key, pub);
                          });
                        case 11:
                          if (_this5.uuid) {
                            _context12.next = 16;
                            break;
                          }
                          _context12.next = 14;
                          return _this5.getOurSecretChannelId(pub);
                        case 14:
                          ourSecretChannelId = _context12.sent;
                          publicState().get("chats").get(ourSecretChannelId).get("msgs").map().once(function (data, key) {
                            _this5.messageReceived(callback, data, pub, true, key, session.getKey().pub);
                          });
                        case 16:
                        case "end":
                          return _context12.stop();
                      }
                    }
                  }, _callee12);
                }));
                return function (_x16) {
                  return _ref3.apply(this, arguments);
                };
              }());
              if (!this.uuid) {
                _context13.next = 6;
                break;
              }
              _context13.next = 4;
              return this.getMySecretUuid();
            case 4:
              mySecretUuid = _context13.sent;
              publicState().get("chats").get(mySecretUuid).get("msgs").map().once(function (data, key) {
                _this5.messageReceived(callback, data, _this5.uuid, true, key, session.getKey().pub);
              });
            case 6:
            case "end":
              return _context13.stop();
          }
        }
      }, _callee13, this);
    }));
    function getMessages(_x15) {
      return _getMessages.apply(this, arguments);
    }
    return getMessages;
  }();
  _proto.messageReceived = /*#__PURE__*/function () {
    var _messageReceived = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee14(callback, data, channelId, selfAuthored, key, from) {
      var secret, decrypted, info;
      return _regeneratorRuntime().wrap(function _callee14$(_context14) {
        while (1) {
          switch (_context14.prev = _context14.next) {
            case 0:
              if (!(this.messages[key] || !data)) {
                _context14.next = 2;
                break;
              }
              return _context14.abrupt("return");
            case 2:
              if (!this.uuid) {
                _context14.next = 8;
                break;
              }
              _context14.next = 5;
              return this.getTheirGroupSecret(from);
            case 5:
              _context14.t0 = _context14.sent;
              _context14.next = 11;
              break;
            case 8:
              _context14.next = 10;
              return this.getSecret(channelId);
            case 10:
              _context14.t0 = _context14.sent;
            case 11:
              secret = _context14.t0;
              _context14.next = 14;
              return Gun.SEA.decrypt(data, secret);
            case 14:
              decrypted = _context14.sent;
              if (!(typeof decrypted !== "object")) {
                _context14.next = 17;
                break;
              }
              return _context14.abrupt("return");
            case 17:
              info = {
                selfAuthored: selfAuthored,
                channelId: channelId,
                from: from
              };
              this.messages[key] = decrypted;
              callback(decrypted, info);
            case 20:
            case "end":
              return _context14.stop();
          }
        }
      }, _callee14, this);
    }));
    function messageReceived(_x17, _x18, _x19, _x20, _x21, _x22) {
      return _messageReceived.apply(this, arguments);
    }
    return messageReceived;
  }() /**
      * Get latest message in this channel. Useful for channel listing.
      */;
  _proto.getLatestMsg =
  /*#__PURE__*/
  function () {
    var _getLatestMsg = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee16(callback) {
      var _this6 = this;
      var callbackIfLatest;
      return _regeneratorRuntime().wrap(function _callee16$(_context16) {
        while (1) {
          switch (_context16.prev = _context16.next) {
            case 0:
              callbackIfLatest = /*#__PURE__*/function () {
                var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee15(msg, info) {
                  var t;
                  return _regeneratorRuntime().wrap(function _callee15$(_context15) {
                    while (1) {
                      switch (_context15.prev = _context15.next) {
                        case 0:
                          if (!_this6.latest) {
                            _this6.latest = msg;
                            callback(msg, info);
                          } else {
                            t = typeof _this6.latest.time === "string" ? _this6.latest.time : _this6.latest.time.toISOString();
                            if (t < msg.time) {
                              _this6.latest = msg;
                              callback(msg, info);
                            }
                          }
                        case 1:
                        case "end":
                          return _context15.stop();
                      }
                    }
                  }, _callee15);
                }));
                return function callbackIfLatest(_x24, _x25) {
                  return _ref4.apply(this, arguments);
                };
              }();
              this.onMy('latestMsg', function (msg) {
                return callbackIfLatest(msg, {
                  selfAuthored: true,
                  from: session.getKey().pub
                });
              });
              this.onTheir('latestMsg', function (msg, k, from) {
                return callbackIfLatest(msg, {
                  selfAuthored: false,
                  from: from
                });
              });
            case 3:
            case "end":
              return _context16.stop();
          }
        }
      }, _callee16, this);
    }));
    function getLatestMsg(_x23) {
      return _getLatestMsg.apply(this, arguments);
    }
    return getLatestMsg;
  }() /**
      * Useful for notifications
      * @param {integer} time last seen msg time (default: now)
      */;
  _proto.setMyMsgsLastSeenTime =
  /*#__PURE__*/
  function () {
    var _setMyMsgsLastSeenTime = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee17(time) {
      return _regeneratorRuntime().wrap(function _callee17$(_context17) {
        while (1) {
          switch (_context17.prev = _context17.next) {
            case 0:
              time = time || new Date().toISOString();
              return _context17.abrupt("return", this.put("msgsLastSeenTime", time));
            case 2:
            case "end":
              return _context17.stop();
          }
        }
      }, _callee17, this);
    }));
    function setMyMsgsLastSeenTime(_x26) {
      return _setMyMsgsLastSeenTime.apply(this, arguments);
    }
    return setMyMsgsLastSeenTime;
  }() /**
      * Useful for notifications
      */;
  _proto.getMyMsgsLastSeenTime =
  /*#__PURE__*/
  function () {
    var _getMyMsgsLastSeenTime = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee18(callback) {
      var _this7 = this;
      return _regeneratorRuntime().wrap(function _callee18$(_context18) {
        while (1) {
          switch (_context18.prev = _context18.next) {
            case 0:
              this.onMy("msgsLastSeenTime", function (time) {
                _this7.myMsgsLastSeenTime = time;
                if (callback) {
                  callback(_this7.myMsgsLastSeenTime);
                }
              });
            case 1:
            case "end":
              return _context18.stop();
          }
        }
      }, _callee18, this);
    }));
    function getMyMsgsLastSeenTime(_x27) {
      return _getMyMsgsLastSeenTime.apply(this, arguments);
    }
    return getMyMsgsLastSeenTime;
  }() /**
      * For "seen" status indicator
      */;
  _proto.getTheirMsgsLastSeenTime =
  /*#__PURE__*/
  function () {
    var _getTheirMsgsLastSeenTime = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee19(callback) {
      var _this8 = this;
      return _regeneratorRuntime().wrap(function _callee19$(_context19) {
        while (1) {
          switch (_context19.prev = _context19.next) {
            case 0:
              this.onTheir("msgsLastSeenTime", function (time) {
                _this8.theirMsgsLastSeenTime = time;
                if (callback) {
                  callback(_this8.theirMsgsLastSeenTime);
                }
              });
            case 1:
            case "end":
              return _context19.stop();
          }
        }
      }, _callee19, this);
    }));
    function getTheirMsgsLastSeenTime(_x28) {
      return _getTheirMsgsLastSeenTime.apply(this, arguments);
    }
    return getTheirMsgsLastSeenTime;
  }();
  _proto.removeParticipant = /*#__PURE__*/function () {
    var _removeParticipant = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee20(pub) {
      return _regeneratorRuntime().wrap(function _callee20$(_context20) {
        while (1) {
          switch (_context20.prev = _context20.next) {
            case 0:
              this.addParticipant(pub, true, {
                read: false,
                write: false
              });
            case 1:
            case "end":
              return _context20.stop();
          }
        }
      }, _callee20, this);
    }));
    function removeParticipant(_x29) {
      return _removeParticipant.apply(this, arguments);
    }
    return removeParticipant;
  }() /**
      * Add a public key to the channel or update its permissions
      * @param {string} pub
      */;
  _proto.addParticipant =
  /*#__PURE__*/
  function () {
    var _addParticipant = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee21(pub, save, permissions, subscribe) {
      var _this9 = this;
      var ourSecretChannelId, mySecret;
      return _regeneratorRuntime().wrap(function _callee21$(_context21) {
        while (1) {
          switch (_context21.prev = _context21.next) {
            case 0:
              if (save === void 0) {
                save = true;
              }
              if (!this.uuid) {
                _context21.next = 3;
                break;
              }
              return _context21.abrupt("return");
            case 3:
              if (permissions === undefined) {
                permissions = DEFAULT_PERMISSIONS;
              }
              if (!(this.secrets[pub] && JSON.stringify(this.secrets[pub]) === JSON.stringify(permissions))) {
                _context21.next = 6;
                break;
              }
              return _context21.abrupt("return");
            case 6:
              this.secrets[pub] = null;
              this.getSecret(pub);
              _context21.next = 10;
              return this.getOurSecretChannelId(pub);
            case 10:
              ourSecretChannelId = _context21.sent;
              if (!save) {
                _context21.next = 20;
                break;
              }
              _context21.next = 14;
              return Gun.SEA.secret(session.getKey().epub, session.getKey());
            case 14:
              mySecret = _context21.sent;
              _context21.t0 = global$2().user().get("chats").get(ourSecretChannelId).get("pub");
              _context21.next = 18;
              return Gun.SEA.encrypt({
                pub: pub
              }, mySecret);
            case 18:
              _context21.t1 = _context21.sent;
              _context21.t0.put.call(_context21.t0, _context21.t1);
            case 20:
              if (this.uuid) {
                this.participants[pub] = permissions;
                if (save) {
                  this.putDirect("S" + this.uuid, this.getMyGroupSecret());
                  this.getMySecretUuid().then(function (s) {
                    _this9.putDirect(_this9.uuid, s); // TODO: encrypt keys in put()
                  });

                  this.onTheirDirect(this.uuid, function (s, k, from) {
                    _this9.theirSecretUuids[from] = s;
                  });
                  this.onTheirDirect("S" + this.uuid, function (s, k, from) {
                    _this9.theirGroupSecrets[from] = s;
                  });
                  this.save();
                }
              }
              if (subscribe) {
                Object.values(this.directSubscriptions).forEach(function (arr) {
                  arr.forEach(function (o) {
                    if (!o.from || o.from === pub) {
                      _this9._onTheirDirectFromUser(pub, o.key, o.callback);
                    }
                  });
                });
                Object.values(this.groupSubscriptions).forEach(function (arr) {
                  arr.forEach(function (o) {
                    if (o.from && o.from !== pub) {
                      return;
                    }
                    if (permissions.write) {
                      _this9._onTheirGroupFromUser(pub, o.key, o.callback);
                    } else {
                      // unsubscribe
                      o.event && o.event.off();
                    }
                  });
                });
              }
            case 22:
            case "end":
              return _context21.stop();
          }
        }
      }, _callee21, this);
    }));
    function addParticipant(_x30, _x31, _x32, _x33) {
      return _addParticipant.apply(this, arguments);
    }
    return addParticipant;
  }() /**
      * Send a message to the channel
      * @param msg string or {time, text, ...} object
      */;
  _proto.send =
  /*#__PURE__*/
  function () {
    var _send = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee22(msg) {
      var encrypted, mySecretUuid, keys, i, _encrypted, ourSecretChannelId;
      return _regeneratorRuntime().wrap(function _callee22$(_context22) {
        while (1) {
          switch (_context22.prev = _context22.next) {
            case 0:
              if (!(typeof msg === "string")) {
                _context22.next = 7;
                break;
              }
              msg = msg.trim();
              if (!(msg.length === 0)) {
                _context22.next = 4;
                break;
              }
              return _context22.abrupt("return");
            case 4:
              msg = {
                time: new Date().toISOString(),
                text: msg
              };
              _context22.next = 12;
              break;
            case 7:
              if (!(typeof msg === "object")) {
                _context22.next = 11;
                break;
              }
              msg.time = msg.time || new Date().toISOString();
              _context22.next = 12;
              break;
            case 11:
              throw new Error("msg param must be a string or an object");
            case 12:
              if (!this.uuid) {
                _context22.next = 23;
                break;
              }
              _context22.next = 15;
              return Gun.SEA.encrypt(JSON.stringify(msg), this.getMyGroupSecret());
            case 15:
              encrypted = _context22.sent;
              _context22.next = 18;
              return this.getMySecretUuid();
            case 18:
              mySecretUuid = _context22.sent;
              publicState().get("chats").get(mySecretUuid).get("msgs").get("" + msg.time).put(encrypted);
              publicState().get("chats").get(mySecretUuid).get("latestMsg").put(encrypted);
              _context22.next = 42;
              break;
            case 23:
              keys = this.getCurrentParticipants();
              i = 0;
            case 25:
              if (!(i < keys.length)) {
                _context22.next = 42;
                break;
              }
              _context22.t0 = Gun.SEA;
              _context22.t1 = JSON.stringify(msg);
              _context22.next = 30;
              return this.getSecret(keys[i]);
            case 30:
              _context22.t2 = _context22.sent;
              _context22.next = 33;
              return _context22.t0.encrypt.call(_context22.t0, _context22.t1, _context22.t2);
            case 33:
              _encrypted = _context22.sent;
              _context22.next = 36;
              return this.getOurSecretChannelId(keys[i]);
            case 36:
              ourSecretChannelId = _context22.sent;
              publicState().get("chats").get(ourSecretChannelId).get("msgs").get("" + msg.time).put(_encrypted);
              publicState().get("chats").get(ourSecretChannelId).get("latestMsg").put(_encrypted);
            case 39:
              i++;
              _context22.next = 25;
              break;
            case 42:
            case "end":
              return _context22.stop();
          }
        }
      }, _callee22, this);
    }));
    function send(_x34) {
      return _send.apply(this, arguments);
    }
    return send;
  }() /**
      * Save the channel to our channels list without sending a message
      */;
  _proto.save =
  /*#__PURE__*/
  function () {
    var _save = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee23() {
      var mySecretUuid, mySecret, keys, i, ourSecretChannelId;
      return _regeneratorRuntime().wrap(function _callee23$(_context23) {
        while (1) {
          switch (_context23.prev = _context23.next) {
            case 0:
              if (!this.uuid) {
                _context23.next = 17;
                break;
              }
              _context23.next = 3;
              return this.getMySecretUuid();
            case 3:
              mySecretUuid = _context23.sent;
              publicState().get("chats").get(mySecretUuid).get('msgs').get('a').put(null);
              this.put("participants", this.participants); // public participants list
              _context23.next = 8;
              return Gun.SEA.secret(session.getKey().epub, session.getKey());
            case 8:
              mySecret = _context23.sent;
              _context23.t0 = publicState().get("chats").get(mySecretUuid).get("pub");
              _context23.next = 12;
              return Gun.SEA.encrypt({
                uuid: this.uuid,
                myGroupSecret: this.getMyGroupSecret(),
                participants: this.participants // private participants list
              }, mySecret);
            case 12:
              _context23.t1 = _context23.sent;
              _context23.t0.put.call(_context23.t0, _context23.t1);
              this.participantsChanged();
              _context23.next = 27;
              break;
            case 17:
              keys = this.getCurrentParticipants();
              i = 0;
            case 19:
              if (!(i < keys.length)) {
                _context23.next = 27;
                break;
              }
              _context23.next = 22;
              return this.getOurSecretChannelId(keys[i]);
            case 22:
              ourSecretChannelId = _context23.sent;
              publicState().get("chats").get(ourSecretChannelId).get('msgs').get('a').put(null);
            case 24:
              i++;
              _context23.next = 19;
              break;
            case 27:
            case "end":
              return _context23.stop();
          }
        }
      }, _callee23, this);
    }));
    function save() {
      return _save.apply(this, arguments);
    }
    return save;
  }() /**
      * Save a key-value pair, encrypt value. Each participant in the Channel writes to their own version of the key-value pair — they don't overwrite the same one.
      * @param {string} key
      * @param value
      */;
  _proto.put =
  /*#__PURE__*/
  function () {
    var _put = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee24(key, value) {
      return _regeneratorRuntime().wrap(function _callee24$(_context24) {
        while (1) {
          switch (_context24.prev = _context24.next) {
            case 0:
              return _context24.abrupt("return", (this.uuid ? this.putGroup : this.putDirect).call(this, key, value));
            case 1:
            case "end":
              return _context24.stop();
          }
        }
      }, _callee24, this);
    }));
    function put(_x35, _x36) {
      return _put.apply(this, arguments);
    }
    return put;
  }();
  _proto.putGroup = /*#__PURE__*/function () {
    var _putGroup = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee25(key, value) {
      var encrypted, mySecretUuid;
      return _regeneratorRuntime().wrap(function _callee25$(_context25) {
        while (1) {
          switch (_context25.prev = _context25.next) {
            case 0:
              if (!(key === "msgs")) {
                _context25.next = 2;
                break;
              }
              throw new Error("Sorry, you can't overwrite the msgs field which is used for .send()");
            case 2:
              _context25.next = 4;
              return Gun.SEA.encrypt(JSON.stringify(value), this.getMyGroupSecret());
            case 4:
              encrypted = _context25.sent;
              _context25.next = 7;
              return this.getMySecretUuid();
            case 7:
              mySecretUuid = _context25.sent;
              publicState().get("chats").get(mySecretUuid).get(key).put(encrypted);
            case 9:
            case "end":
              return _context25.stop();
          }
        }
      }, _callee25, this);
    }));
    function putGroup(_x37, _x38) {
      return _putGroup.apply(this, arguments);
    }
    return putGroup;
  }();
  _proto.putDirect = /*#__PURE__*/function () {
    var _putDirect = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee26(key, value) {
      var keys, i, encrypted, ourSecretChannelId;
      return _regeneratorRuntime().wrap(function _callee26$(_context26) {
        while (1) {
          switch (_context26.prev = _context26.next) {
            case 0:
              if (!(key === "msgs")) {
                _context26.next = 2;
                break;
              }
              throw new Error("Sorry, you can't overwrite the msgs field which is used for .send()");
            case 2:
              keys = this.getCurrentParticipants();
              i = 0;
            case 4:
              if (!(i < keys.length)) {
                _context26.next = 20;
                break;
              }
              _context26.t0 = Gun.SEA;
              _context26.t1 = JSON.stringify(value);
              _context26.next = 9;
              return this.getSecret(keys[i]);
            case 9:
              _context26.t2 = _context26.sent;
              _context26.next = 12;
              return _context26.t0.encrypt.call(_context26.t0, _context26.t1, _context26.t2);
            case 12:
              encrypted = _context26.sent;
              _context26.next = 15;
              return this.getOurSecretChannelId(keys[i]);
            case 15:
              ourSecretChannelId = _context26.sent;
              publicState().get("chats").get(ourSecretChannelId).get(key).put(encrypted);
            case 17:
              i++;
              _context26.next = 4;
              break;
            case 20:
            case "end":
              return _context26.stop();
          }
        }
      }, _callee26, this);
    }));
    function putDirect(_x39, _x40) {
      return _putDirect.apply(this, arguments);
    }
    return putDirect;
  }() /**
      * Subscribe to a key-value pair. Callback returns every participant's value unless you limit it with *from* param.
      * @param {string} key
      * @param {function} callback
      * @param {string} from public key whose value you want, or *"me"* for your value only, or *"them"* for the value of others only
      */;
  _proto.on =
  /*#__PURE__*/
  function () {
    var _on = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee27(key, callback, from) {
      return _regeneratorRuntime().wrap(function _callee27$(_context27) {
        while (1) {
          switch (_context27.prev = _context27.next) {
            case 0:
              return _context27.abrupt("return", (this.uuid ? this.onGroup : this.onDirect).call(this, key, callback, from));
            case 1:
            case "end":
              return _context27.stop();
          }
        }
      }, _callee27, this);
    }));
    function on(_x41, _x42, _x43) {
      return _on.apply(this, arguments);
    }
    return on;
  }();
  _proto.onDirect = /*#__PURE__*/function () {
    var _onDirect = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee28(key, callback, from) {
      return _regeneratorRuntime().wrap(function _callee28$(_context28) {
        while (1) {
          switch (_context28.prev = _context28.next) {
            case 0:
              if (!from || from === "me" || from === session.getKey().pub) {
                this.onMy(key, function (val) {
                  return callback(val, session.getKey().pub);
                });
              }
              if (!from || from !== "me" && from !== session.getKey().pub) {
                this.onTheir(key, function (val, k, pub) {
                  return callback(val, pub);
                });
              }
            case 2:
            case "end":
              return _context28.stop();
          }
        }
      }, _callee28, this);
    }));
    function onDirect(_x44, _x45, _x46) {
      return _onDirect.apply(this, arguments);
    }
    return onDirect;
  }();
  _proto.onGroup = /*#__PURE__*/function () {
    var _onGroup = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee29(key, callback, from) {
      return _regeneratorRuntime().wrap(function _callee29$(_context29) {
        while (1) {
          switch (_context29.prev = _context29.next) {
            case 0:
              if (!from || from === "me" || from === session.getKey().pub) {
                this.onMyGroup(key, function (val) {
                  return callback(val, session.getKey().pub);
                });
              }
              if (!from || from !== "me" && from !== session.getKey().pub) {
                this.onTheirGroup(key, function (val, k, pub) {
                  return callback(val, pub);
                });
              }
            case 2:
            case "end":
              return _context29.stop();
          }
        }
      }, _callee29, this);
    }));
    function onGroup(_x47, _x48, _x49) {
      return _onGroup.apply(this, arguments);
    }
    return onGroup;
  }();
  _proto.onMy = /*#__PURE__*/function () {
    var _onMy = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee30(key, callback) {
      return _regeneratorRuntime().wrap(function _callee30$(_context30) {
        while (1) {
          switch (_context30.prev = _context30.next) {
            case 0:
              return _context30.abrupt("return", (this.uuid ? this.onMyGroup : this.onMyDirect).call(this, key, callback));
            case 1:
            case "end":
              return _context30.stop();
          }
        }
      }, _callee30, this);
    }));
    function onMy(_x50, _x51) {
      return _onMy.apply(this, arguments);
    }
    return onMy;
  }();
  _proto.onMyDirect = /*#__PURE__*/function () {
    var _onMyDirect = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee32(key, callback) {
      var _this10 = this;
      var keys, _loop, i, _ret;
      return _regeneratorRuntime().wrap(function _callee32$(_context33) {
        while (1) {
          switch (_context33.prev = _context33.next) {
            case 0:
              if (!(typeof callback !== 'function')) {
                _context33.next = 2;
                break;
              }
              throw new Error("onMy callback must be a function, got " + typeof callback);
            case 2:
              keys = this.getCurrentParticipants();
              _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop(i) {
                var ourSecretChannelId;
                return _regeneratorRuntime().wrap(function _loop$(_context32) {
                  while (1) {
                    switch (_context32.prev = _context32.next) {
                      case 0:
                        _context32.next = 2;
                        return _this10.getOurSecretChannelId(keys[i]);
                      case 2:
                        ourSecretChannelId = _context32.sent;
                        global$2().user().get("chats").get(ourSecretChannelId).get(key).on( /*#__PURE__*/function () {
                          var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee31(data) {
                            var decrypted;
                            return _regeneratorRuntime().wrap(function _callee31$(_context31) {
                              while (1) {
                                switch (_context31.prev = _context31.next) {
                                  case 0:
                                    _context31.t0 = Gun.SEA;
                                    _context31.t1 = data;
                                    _context31.next = 4;
                                    return _this10.getSecret(keys[i]);
                                  case 4:
                                    _context31.t2 = _context31.sent;
                                    _context31.next = 7;
                                    return _context31.t0.decrypt.call(_context31.t0, _context31.t1, _context31.t2);
                                  case 7:
                                    decrypted = _context31.sent;
                                    if (decrypted) {
                                      callback(typeof decrypted.v !== "undefined" ? decrypted.v : decrypted, key);
                                    }
                                  case 9:
                                  case "end":
                                    return _context31.stop();
                                }
                              }
                            }, _callee31);
                          }));
                          return function (_x54) {
                            return _ref5.apply(this, arguments);
                          };
                        }());
                        return _context32.abrupt("return", "break");
                      case 5:
                      case "end":
                        return _context32.stop();
                    }
                  }
                }, _loop);
              });
              i = 0;
            case 5:
              if (!(i < keys.length)) {
                _context33.next = 13;
                break;
              }
              return _context33.delegateYield(_loop(i), "t0", 7);
            case 7:
              _ret = _context33.t0;
              if (!(_ret === "break")) {
                _context33.next = 10;
                break;
              }
              return _context33.abrupt("break", 13);
            case 10:
              i++;
              _context33.next = 5;
              break;
            case 13:
            case "end":
              return _context33.stop();
          }
        }
      }, _callee32, this);
    }));
    function onMyDirect(_x52, _x53) {
      return _onMyDirect.apply(this, arguments);
    }
    return onMyDirect;
  }();
  _proto.onMyGroup = /*#__PURE__*/function () {
    var _onMyGroup = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee34(key, callback) {
      var mySecretUuid, mySecret;
      return _regeneratorRuntime().wrap(function _callee34$(_context35) {
        while (1) {
          switch (_context35.prev = _context35.next) {
            case 0:
              if (!(typeof callback !== 'function')) {
                _context35.next = 2;
                break;
              }
              throw new Error("onMy callback must be a function, got " + typeof callback);
            case 2:
              _context35.next = 4;
              return this.getMySecretUuid();
            case 4:
              mySecretUuid = _context35.sent;
              _context35.next = 7;
              return this.getMyGroupSecret();
            case 7:
              mySecret = _context35.sent;
              global$2().user().get("chats").get(mySecretUuid).get(key).on( /*#__PURE__*/function () {
                var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee33(data) {
                  var decrypted;
                  return _regeneratorRuntime().wrap(function _callee33$(_context34) {
                    while (1) {
                      switch (_context34.prev = _context34.next) {
                        case 0:
                          _context34.next = 2;
                          return Gun.SEA.decrypt(data, mySecret);
                        case 2:
                          decrypted = _context34.sent;
                          if (decrypted) {
                            callback(typeof decrypted.v !== "undefined" ? decrypted.v : decrypted, key, session.getKey().pub);
                          }
                        case 4:
                        case "end":
                          return _context34.stop();
                      }
                    }
                  }, _callee33);
                }));
                return function (_x57) {
                  return _ref6.apply(this, arguments);
                };
              }());
            case 9:
            case "end":
              return _context35.stop();
          }
        }
      }, _callee34, this);
    }));
    function onMyGroup(_x55, _x56) {
      return _onMyGroup.apply(this, arguments);
    }
    return onMyGroup;
  }();
  _proto.onTheir = /*#__PURE__*/function () {
    var _onTheir = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee35(key, callback, from) {
      return _regeneratorRuntime().wrap(function _callee35$(_context36) {
        while (1) {
          switch (_context36.prev = _context36.next) {
            case 0:
              return _context36.abrupt("return", (this.uuid ? this.onTheirGroup : this.onTheirDirect).call(this, key, callback, from));
            case 1:
            case "end":
              return _context36.stop();
          }
        }
      }, _callee35, this);
    }));
    function onTheir(_x58, _x59, _x60) {
      return _onTheir.apply(this, arguments);
    }
    return onTheir;
  }();
  _proto._onTheirDirectFromUser = /*#__PURE__*/function () {
    var _onTheirDirectFromUser2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee37(key, callback, pub) {
      var _this11 = this;
      var theirSecretChannelId;
      return _regeneratorRuntime().wrap(function _callee37$(_context38) {
        while (1) {
          switch (_context38.prev = _context38.next) {
            case 0:
              if (this.hasWritePermission(pub)) {
                _context38.next = 2;
                break;
              }
              return _context38.abrupt("return");
            case 2:
              _context38.next = 4;
              return this.getTheirSecretChannelId(pub);
            case 4:
              theirSecretChannelId = _context38.sent;
              global$2().user(pub).get("chats").get(theirSecretChannelId).get(key).on( /*#__PURE__*/function () {
                var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee36(data) {
                  var decrypted;
                  return _regeneratorRuntime().wrap(function _callee36$(_context37) {
                    while (1) {
                      switch (_context37.prev = _context37.next) {
                        case 0:
                          if (_this11.hasWritePermission(pub)) {
                            _context37.next = 2;
                            break;
                          }
                          return _context37.abrupt("return");
                        case 2:
                          _context37.t0 = Gun.SEA;
                          _context37.t1 = data;
                          _context37.next = 6;
                          return _this11.getSecret(pub);
                        case 6:
                          _context37.t2 = _context37.sent;
                          _context37.next = 9;
                          return _context37.t0.decrypt.call(_context37.t0, _context37.t1, _context37.t2);
                        case 9:
                          decrypted = _context37.sent;
                          if (decrypted) {
                            callback(typeof decrypted.v !== "undefined" ? decrypted.v : decrypted, key, pub);
                          }
                        case 11:
                        case "end":
                          return _context37.stop();
                      }
                    }
                  }, _callee36);
                }));
                return function (_x64) {
                  return _ref7.apply(this, arguments);
                };
              }());
            case 6:
            case "end":
              return _context38.stop();
          }
        }
      }, _callee37, this);
    }));
    function _onTheirDirectFromUser(_x61, _x62, _x63) {
      return _onTheirDirectFromUser2.apply(this, arguments);
    }
    return _onTheirDirectFromUser;
  }();
  _proto.onTheirDirect = /*#__PURE__*/function () {
    var _onTheirDirect = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee39(key, callback, from) {
      var _this12 = this;
      var participants;
      return _regeneratorRuntime().wrap(function _callee39$(_context40) {
        while (1) {
          switch (_context40.prev = _context40.next) {
            case 0:
              if (!(typeof callback !== 'function')) {
                _context40.next = 2;
                break;
              }
              throw new Error("onTheir callback must be a function, got " + typeof callback);
            case 2:
              if (!Object.prototype.hasOwnProperty.call(this.directSubscriptions, key)) {
                this.directSubscriptions[key] = [];
              }
              this.directSubscriptions[key].push({
                key: key,
                callback: callback,
                from: from
              });
              participants = this.getCurrentParticipants();
              participants.forEach( /*#__PURE__*/function () {
                var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee38(pub) {
                  return _regeneratorRuntime().wrap(function _callee38$(_context39) {
                    while (1) {
                      switch (_context39.prev = _context39.next) {
                        case 0:
                          if (!(from && pub !== from)) {
                            _context39.next = 2;
                            break;
                          }
                          return _context39.abrupt("return");
                        case 2:
                          _this12._onTheirDirectFromUser(pub, key, callback);
                        case 3:
                        case "end":
                          return _context39.stop();
                      }
                    }
                  }, _callee38);
                }));
                return function (_x68) {
                  return _ref8.apply(this, arguments);
                };
              }());
            case 6:
            case "end":
              return _context40.stop();
          }
        }
      }, _callee39, this);
    }));
    function onTheirDirect(_x65, _x66, _x67) {
      return _onTheirDirect.apply(this, arguments);
    }
    return onTheirDirect;
  }();
  _proto.hasWritePermission = function hasWritePermission(pub) {
    return !this.uuid || this.participants && this.participants[pub] && this.participants[pub].write;
  };
  _proto._onTheirGroupFromUser = /*#__PURE__*/function () {
    var _onTheirGroupFromUser2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee41(pub, key, callback, subscription) {
      var _this13 = this;
      var theirSecretUuid;
      return _regeneratorRuntime().wrap(function _callee41$(_context42) {
        while (1) {
          switch (_context42.prev = _context42.next) {
            case 0:
              if (this.hasWritePermission(pub)) {
                _context42.next = 2;
                break;
              }
              return _context42.abrupt("return");
            case 2:
              _context42.next = 4;
              return this.getTheirSecretUuid(pub);
            case 4:
              theirSecretUuid = _context42.sent;
              global$2().user(pub).get("chats").get(theirSecretUuid).get(key).on( /*#__PURE__*/function () {
                var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee40(data, _a, _b, e) {
                  var decrypted;
                  return _regeneratorRuntime().wrap(function _callee40$(_context41) {
                    while (1) {
                      switch (_context41.prev = _context41.next) {
                        case 0:
                          if (subscription) {
                            subscription.event = e;
                          }
                          if (_this13.hasWritePermission(pub)) {
                            _context41.next = 3;
                            break;
                          }
                          return _context41.abrupt("return");
                        case 3:
                          _context41.t0 = Gun.SEA;
                          _context41.t1 = data;
                          _context41.next = 7;
                          return _this13.getTheirGroupSecret(pub);
                        case 7:
                          _context41.t2 = _context41.sent;
                          _context41.next = 10;
                          return _context41.t0.decrypt.call(_context41.t0, _context41.t1, _context41.t2);
                        case 10:
                          decrypted = _context41.sent;
                          if (decrypted) {
                            callback(typeof decrypted.v !== "undefined" ? decrypted.v : decrypted, key, pub);
                          }
                        case 12:
                        case "end":
                          return _context41.stop();
                      }
                    }
                  }, _callee40);
                }));
                return function (_x73, _x74, _x75, _x76) {
                  return _ref9.apply(this, arguments);
                };
              }());
            case 6:
            case "end":
              return _context42.stop();
          }
        }
      }, _callee41, this);
    }));
    function _onTheirGroupFromUser(_x69, _x70, _x71, _x72) {
      return _onTheirGroupFromUser2.apply(this, arguments);
    }
    return _onTheirGroupFromUser;
  }();
  _proto.onTheirGroup = /*#__PURE__*/function () {
    var _onTheirGroup = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee43(key, callback, from) {
      var _this14 = this;
      var subscription;
      return _regeneratorRuntime().wrap(function _callee43$(_context44) {
        while (1) {
          switch (_context44.prev = _context44.next) {
            case 0:
              if (!(typeof callback !== 'function')) {
                _context44.next = 2;
                break;
              }
              throw new Error("onTheir callback must be a function, got " + typeof callback);
            case 2:
              if (!Object.prototype.hasOwnProperty.call(this.groupSubscriptions, key)) {
                this.groupSubscriptions[key] = [];
              }
              subscription = {
                key: key,
                callback: callback,
                from: from
              };
              this.groupSubscriptions[key].push(subscription);
              this.getParticipants(function (participants) {
                Object.keys(participants).forEach( /*#__PURE__*/function () {
                  var _ref10 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee42(pub) {
                    return _regeneratorRuntime().wrap(function _callee42$(_context43) {
                      while (1) {
                        switch (_context43.prev = _context43.next) {
                          case 0:
                            if (!(from && pub !== from)) {
                              _context43.next = 2;
                              break;
                            }
                            return _context43.abrupt("return");
                          case 2:
                            if (participants[pub] && participants[pub].write) {
                              _context43.next = 4;
                              break;
                            }
                            return _context43.abrupt("return");
                          case 4:
                            _this14._onTheirGroupFromUser(pub, key, callback, subscription);
                          case 5:
                          case "end":
                            return _context43.stop();
                        }
                      }
                    }, _callee42);
                  }));
                  return function (_x80) {
                    return _ref10.apply(this, arguments);
                  };
                }());
              });
            case 6:
            case "end":
              return _context44.stop();
          }
        }
      }, _callee43, this);
    }));
    function onTheirGroup(_x77, _x78, _x79) {
      return _onTheirGroup.apply(this, arguments);
    }
    return onTheirGroup;
  }() /**
      * Set typing status
      */;
  _proto.setTyping = function setTyping(isTyping, timeout) {
    var _this15 = this;
    if (timeout === void 0) {
      timeout = 5;
    }
    isTyping = typeof isTyping === "undefined" ? true : isTyping;
    timeout = timeout * 1000;
    this.put("typing", isTyping ? new Date().toISOString() : new Date(0).toISOString());
    clearTimeout(this.setTypingTimeout);
    this.setTypingTimeout = setTimeout(function () {
      return _this15.put("typing", false);
    }, timeout);
  }
  /**
  * Get typing status
  */;
  _proto.getTyping = function getTyping(callback, timeout) {
    var _this16 = this;
    if (timeout === void 0) {
      timeout = 5;
    }
    timeout = timeout * 1000;
    this.onTheir("typing", function (typing, key, pub) {
      if (callback) {
        var isTyping = typing && new Date() - new Date(typing) <= timeout;
        callback(isTyping, pub);
        _this16.getTypingTimeouts = _this16.getTypingTimeouts || {};
        clearTimeout(_this16.getTypingTimeouts[pub]);
        if (isTyping) {
          _this16.getTypingTimeouts[pub] = setTimeout(function () {
            return callback(false, pub);
          }, timeout);
        }
      }
    });
  }
  /**
  * Add a chat button to page
  * @param options {label, channelOptions}
  */;
  Channel.addChatButton = function addChatButton(options) {
    if (options === void 0) {
      options = {};
    }
    options = Object.assign({
      label: 'Chat'
    }, options);
    if (!options.channelOptions) {
      throw new Error('addChatButton missing options.channelOptions param');
    }
    util.injectCss();
    var channel, box;
    var btn = util.createElement('div', 'iris-chat-open-button', document.body);
    btn.setAttribute('id', 'iris-chat-open-button');
    btn.innerHTML = "<svg style=\"margin-right:7px;margin-bottom: -0.2em\" version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 510 510\" xml:space=\"preserve\"><path fill=\"currentColor\" d=\"M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z\"></path></svg> " + options.label;
    btn.addEventListener('click', function () {
      btn.setAttribute('style', 'display: none');
      if (!channel) {
        channel = new Channel(options.channelOptions);
        box = channel.getChatBox();
        document.body.appendChild(box);
      } else {
        box.setAttribute('style', ''); // show
      }
    });
  }
  /**
  * Get a simple link that points to the channel.
  *
  * Direct channel: both users need to give their simple links. Use createChatLink() to get a two-way link that needs to be given by one user only.
  *
  * Group channel: Works only if the link recipient has been already added onto the channel participants list.
  */;
  _proto.getSimpleLink = function getSimpleLink(urlRoot) {
    if (urlRoot === void 0) {
      urlRoot = 'https://iris.to/';
    }
    if (this.uuid) {
      return urlRoot + "?channelId=" + this.uuid + "&inviter=" + session.getKey().pub;
    }
    return urlRoot + "?chatWith=" + this.getCurrentParticipants()[0];
  }
  /**
  *
  */;
  _proto.getChatLinks =
  /*#__PURE__*/
  function () {
    var _getChatLinks = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee45(opts) {
      var _this17 = this;
      var _opts, callback, urlRoot, subscribe, chatLinks, chatLinkSubscriptions;
      return _regeneratorRuntime().wrap(function _callee45$(_context46) {
        while (1) {
          switch (_context46.prev = _context46.next) {
            case 0:
              if (opts === void 0) {
                opts = {};
              }
              _opts = opts, callback = _opts.callback, urlRoot = _opts.urlRoot, subscribe = _opts.subscribe;
              urlRoot = urlRoot || 'https://iris.to/';
              if (this.uuid) {
                _context46.next = 5;
                break;
              }
              throw new Error('Only group channels may have chat links');
            case 5:
              chatLinks = [];
              chatLinkSubscriptions = {};
              this.on('chatLinks', function (links, from) {
                // TODO: check admin permissions
                if (!links || typeof links !== 'object') {
                  return;
                }
                Object.keys(links).forEach(function (linkId) {
                  var link = links[linkId];
                  if (link === null) {
                    chatLinkSubscriptions[linkId] && chatLinkSubscriptions[linkId].off(); // unsubscribe removed chat link
                    delete chatLinkSubscriptions[linkId];
                    callback && callback({
                      id: linkId,
                      url: null
                    });
                    return;
                  }
                  if (chatLinks.indexOf(linkId) !== -1) {
                    return;
                  }
                  var channels = [];
                  chatLinks.push(linkId);
                  var url = Channel.formatChatLink({
                    urlRoot: urlRoot,
                    inviter: from,
                    channelId: _this17.uuid,
                    sharedSecret: link.sharedSecret,
                    linkId: linkId
                  });
                  callback && callback({
                    url: url,
                    id: linkId
                  });
                  if (subscribe) {
                    global$2().user(link.sharedKey.pub).get('chatRequests').map().on( /*#__PURE__*/function () {
                      var _ref11 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee44(encPub, requestId, a, e) {
                        var s, pub;
                        return _regeneratorRuntime().wrap(function _callee44$(_context45) {
                          while (1) {
                            switch (_context45.prev = _context45.next) {
                              case 0:
                                if (!(!encPub || typeof encPub !== 'string' || encPub.length < 10)) {
                                  _context45.next = 2;
                                  break;
                                }
                                return _context45.abrupt("return");
                              case 2:
                                chatLinkSubscriptions[linkId] = e;
                                s = JSON.stringify(encPub);
                                if (!(channels.indexOf(s) === -1)) {
                                  _context45.next = 10;
                                  break;
                                }
                                channels.push(s);
                                _context45.next = 8;
                                return Gun.SEA.decrypt(encPub, link.sharedSecret);
                              case 8:
                                pub = _context45.sent;
                                _this17.addParticipant(pub, undefined, undefined, true);
                              case 10:
                              case "end":
                                return _context45.stop();
                            }
                          }
                        }, _callee44);
                      }));
                      return function (_x82, _x83, _x84, _x85) {
                        return _ref11.apply(this, arguments);
                      };
                    }());
                  }
                });
              });
            case 8:
            case "end":
              return _context46.stop();
          }
        }
      }, _callee45, this);
    }));
    function getChatLinks(_x81) {
      return _getChatLinks.apply(this, arguments);
    }
    return getChatLinks;
  }();
  _proto.createChatLink = /*#__PURE__*/function () {
    var _createChatLink = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee46(urlRoot) {
      var sharedKey, sharedKeyString, sharedSecret, encryptedSharedKey, ownerSecret, ownerEncryptedSharedKey, linkId;
      return _regeneratorRuntime().wrap(function _callee46$(_context47) {
        while (1) {
          switch (_context47.prev = _context47.next) {
            case 0:
              if (urlRoot === void 0) {
                urlRoot = 'https://iris.to/';
              }
              _context47.next = 3;
              return Gun.SEA.pair();
            case 3:
              sharedKey = _context47.sent;
              sharedKeyString = JSON.stringify(sharedKey);
              _context47.next = 7;
              return Gun.SEA.secret(sharedKey.epub, sharedKey);
            case 7:
              sharedSecret = _context47.sent;
              _context47.next = 10;
              return Gun.SEA.encrypt(sharedKeyString, sharedSecret);
            case 10:
              encryptedSharedKey = _context47.sent;
              _context47.next = 13;
              return Gun.SEA.secret(session.getKey().epub, session.getKey());
            case 13:
              ownerSecret = _context47.sent;
              _context47.next = 16;
              return Gun.SEA.encrypt(sharedKeyString, ownerSecret);
            case 16:
              ownerEncryptedSharedKey = _context47.sent;
              _context47.next = 19;
              return util.getHash(encryptedSharedKey);
            case 19:
              linkId = _context47.sent;
              linkId = linkId.slice(0, 12);
              // User has to exist, in order for .get(chatRequests).on() to be ever triggered
              _context47.next = 23;
              return util.gunAsAnotherUser(global$2(), sharedKey, function (user) {
                return user.get('chatRequests').put({
                  a: 1
                }).then();
              });
            case 23:
              this.chatLinks[linkId] = {
                sharedKey: sharedKey,
                sharedSecret: sharedSecret
              };
              this.put('chatLinks', this.chatLinks);
              publicState().get('chatLinks').get(linkId).put({
                encryptedSharedKey: encryptedSharedKey,
                ownerEncryptedSharedKey: ownerEncryptedSharedKey
              });
              return _context47.abrupt("return", Channel.formatChatLink({
                urlRoot: urlRoot,
                channelId: this.uuid,
                inviter: session.getKey().pub,
                sharedSecret: sharedSecret,
                linkId: linkId
              }));
            case 27:
            case "end":
              return _context47.stop();
          }
        }
      }, _callee46, this);
    }));
    function createChatLink(_x86) {
      return _createChatLink.apply(this, arguments);
    }
    return createChatLink;
  }() /**
      * Get a channel box element that you can add to your page
      */;
  _proto.getChatBox = function getChatBox() {
    var _this18 = this;
    util.injectCss();
    var minimized = false;
    var chatBox = util.createElement('div', 'iris-chat-box');
    var header = util.createElement('div', 'iris-chat-header', chatBox);
    var minimize = util.createElement('span', 'iris-chat-minimize', header);
    minimize.innerText = '—';
    minimize.addEventListener('click', function (e) {
      e.stopPropagation();
      chatBox.setAttribute('class', 'iris-chat-box minimized');
      minimized = true;
    });
    var headerText = util.createElement('div', 'iris-chat-header-text', header);
    var onlineIndicator = util.createElement('span', 'iris-online-indicator', headerText);
    onlineIndicator.innerHTML = '&#x25cf;';
    var nameEl = util.createElement('span', undefined, headerText);
    var close = util.createElement('span', 'iris-chat-close', header);
    close.innerHTML = '&#215;';
    close.addEventListener('click', function () {
      chatBox.setAttribute('style', 'display: none');
      var openChatBtn = document.getElementById('iris-chat-open-button');
      if (openChatBtn) {
        openChatBtn.setAttribute('style', ''); // show
      }
    });

    header.addEventListener('click', function () {
      if (minimized) {
        chatBox.setAttribute('class', 'iris-chat-box');
        minimized = false;
      }
    });
    var messages = util.createElement('div', 'iris-chat-messages', chatBox);
    var typingIndicator = util.createElement('div', 'iris-typing-indicator', chatBox);
    typingIndicator.innerText = 'typing...';
    this.getTyping(function (isTyping) {
      typingIndicator.setAttribute('class', "iris-typing-indicator" + (isTyping ? ' yes' : ''));
    });
    var inputWrapper = util.createElement('div', 'iris-chat-input-wrapper', chatBox);
    var textArea = util.createElement('textarea', undefined, inputWrapper);
    textArea.setAttribute('rows', '1');
    textArea.setAttribute('placeholder', 'Type a message');
    if (util.isMobile) {
      var sendBtn = util.createElement('button', undefined, inputWrapper);
      sendBtn.innerHTML = "\n        <svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" viewBox=\"0 0 486.736 486.736\" style=\"enable-background:new 0 0 486.736 486.736;\" xml:space=\"preserve\" width=\"100px\" height=\"100px\" fill=\"#000000\" stroke=\"#000000\" stroke-width=\"0\"><path fill=\"currentColor\" d=\"M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z\"></path></svg>\n      ";
      sendBtn.addEventListener('click', function () {
        _this18.send(textArea.value);
        textArea.value = '';
        _this18.setTyping(false);
      });
    }
    var participants = this.getCurrentParticipants();
    if (participants.length) {
      var pub = participants[0];
      global$2().user(pub).get('profile').get('name').on(function (name) {
        return nameEl.innerText = name;
      });
      Channel.getActivity(global$2(), pub, function (status) {
        var cls = "iris-online-indicator" + (status.isActive ? ' yes' : '');
        onlineIndicator.setAttribute('class', cls);
        var undelivered = messages.querySelectorAll('.iris-chat-message:not(.delivered)');
        undelivered.forEach(function (msg) {
          if (msg.getAttribute('data-time') <= status.lastActive) {
            var c = msg.getAttribute('class');
            msg.setAttribute('class', c + " delivered");
          }
        });
      });
    }
    this.getTheirMsgsLastSeenTime(function (time) {
      var unseen = messages.querySelectorAll('.iris-seen:not(.yes)');
      unseen.forEach(function (indicator) {
        var msgEl = indicator.parentElement.parentElement.parentElement;
        if (msgEl.getAttribute('data-time') <= time) {
          var msgClass = msgEl.getAttribute('class');
          if (msgClass.indexOf('delivered') === -1) {
            msgEl.setAttribute('class', msgClass + " delivered");
          }
          indicator.setAttribute('class', 'iris-seen yes');
        }
      });
    });
    this.getMessages(function (msg, info) {
      var msgContent = util.createElement('div', 'iris-msg-content');
      msgContent.innerText = msg.text;
      var time = util.createElement('div', 'time', msgContent);
      time.innerText = util.formatTime(new Date(msg.time));
      if (info.selfAuthored) {
        var cls = _this18.theirMsgsLastSeenTime >= msg.time ? 'iris-seen yes' : 'iris-seen';
        var seenIndicator = util.createElement('span', cls, time);
        seenIndicator.innerHTML = ' <svg version="1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 59 42"><polygon fill="currentColor" points="40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9"></polygon><polygon class="iris-delivered-checkmark" fill="currentColor" points="55.6,12.1 32,35.7 29.4,33.1 26.6,36 32,41.3 58.4,14.9"></polygon></svg>';
      }
      msgContent.innerHTML = msgContent.innerHTML.replace(/\n/g, '<br>\n');
      var msgEl = util.createElement('div', (info.selfAuthored ? 'our' : 'their') + " iris-chat-message");
      msgEl.appendChild(msgContent);
      msgEl.setAttribute('data-time', msg.time);
      for (var i = messages.children.length; i >= 0; i--) {
        if (i === 0) {
          messages.insertBefore(msgEl, messages.firstChild);
        } else {
          var t = messages.children[i - 1].getAttribute('data-time');
          if (t && t < msg.time) {
            messages.children[i - 1].insertAdjacentElement('afterend', msgEl);
            break;
          }
        }
      }
      messages.scrollTop = messages.scrollHeight;
    });
    textArea.addEventListener('keyup', function (event) {
      Channel.setActivity(global$2(), true); // TODO
      _this18.setMyMsgsLastSeenTime(); // TODO
      if (event.keyCode === 13) {
        event.preventDefault();
        var content = textArea.value;
        var caret = util.getCaret(textArea);
        if (event.shiftKey) {
          textArea.value = content.substring(0, caret - 1) + "\n" + content.substring(caret, content.length);
        } else {
          textArea.value = content.substring(0, caret - 1) + content.substring(caret, content.length);
          _this18.send(textArea.value);
          textArea.value = '';
          _this18.setTyping(false);
        }
      } else {
        _this18.setTyping(!!textArea.value.length);
      }
    });
    return chatBox;
  }
  /**
  * Set the user's online/active status
  * @param {string} activity string: set the activity status every 3 seconds, null/false: stop updating
  */;
  Channel.setActivity = function setActivity(activity) {
    if (global$2().irisActivityStatus === activity) {
      return;
    }
    global$2().irisActivityStatus = activity;
    clearTimeout(global$2().setActivityTimeout);
    var update = function update() {
      global$2().user().get("activity").put({
        status: activity,
        time: new Date(Gun.state()).toISOString()
      });
    };
    update();
    function timerUpdate() {
      update();
      global$2().setActivityTimeout = setTimeout(timerUpdate, 3000);
    }
    if (activity) {
      timerUpdate();
    }
  }
  /**
  * Get the online status of a user.
  *
  * @param {string} pubKey public key of the user
  * @param {boolean} callback receives a boolean each time the user's online status changes
  */;
  Channel.getActivity = function getActivity(pubKey, callback) {
    var timeout;
    global$2().user(pubKey).get("activity").on(function (activity) {
      if (!activity || !(activity.time && activity.status)) {
        return;
      }
      clearTimeout(timeout);
      var now = new Date(Gun.state());
      var activityDate = new Date(activity.time);
      var isActive = activityDate > new Date(now.getTime() - 10 * 1000) && activityDate < new Date(now.getTime() + 30 * 1000);
      callback({
        isActive: isActive,
        lastActive: activity.time,
        status: activity.status
      });
      if (isActive) {
        timeout = setTimeout(function () {
          return callback({
            isOnline: false,
            lastActive: activity.time
          });
        }, 10000);
      }
    });
  };
  Channel.formatChatLink = function formatChatLink(_ref12) {
    var urlRoot = _ref12.urlRoot,
      chatWith = _ref12.chatWith,
      channelId = _ref12.channelId,
      inviter = _ref12.inviter,
      sharedSecret = _ref12.sharedSecret,
      linkId = _ref12.linkId;
    var enc = encodeURIComponent;
    if (channelId && inviter) {
      return urlRoot + "?channelId=" + enc(channelId) + "&inviter=" + enc(inviter) + "&s=" + enc(sharedSecret) + "&k=" + enc(linkId);
    }
    return urlRoot + "?chatWith=" + enc(chatWith) + "&s=" + enc(sharedSecret) + "&k=" + enc(linkId);
  }
  /**
  * Creates a channel link that can be used for two-way communication, i.e. only one link needs to be exchanged.
  */;
  Channel.createChatLink =
  /*#__PURE__*/
  function () {
    var _createChatLink2 = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee47(urlRoot) {
      var user, key, sharedKey, sharedKeyString, sharedSecret, encryptedSharedKey, ownerSecret, ownerEncryptedSharedKey, linkId;
      return _regeneratorRuntime().wrap(function _callee47$(_context48) {
        while (1) {
          switch (_context48.prev = _context48.next) {
            case 0:
              if (urlRoot === void 0) {
                urlRoot = 'https://iris.to/';
              }
              user = global$2().user();
              key = session.getKey(); // We create a new Gun user whose private key is shared with the chat link recipients.
              // Chat link recipients can contact you by writing their public key to the shared key's user space.
              _context48.next = 5;
              return Gun.SEA.pair();
            case 5:
              sharedKey = _context48.sent;
              sharedKeyString = JSON.stringify(sharedKey);
              _context48.next = 9;
              return Gun.SEA.secret(sharedKey.epub, sharedKey);
            case 9:
              sharedSecret = _context48.sent;
              _context48.next = 12;
              return Gun.SEA.encrypt(sharedKeyString, sharedSecret);
            case 12:
              encryptedSharedKey = _context48.sent;
              _context48.next = 15;
              return Gun.SEA.secret(key.epub, key);
            case 15:
              ownerSecret = _context48.sent;
              _context48.next = 18;
              return Gun.SEA.encrypt(sharedKeyString, ownerSecret);
            case 18:
              ownerEncryptedSharedKey = _context48.sent;
              _context48.next = 21;
              return util.getHash(encryptedSharedKey);
            case 21:
              linkId = _context48.sent;
              linkId = linkId.slice(0, 12);
              // User has to exist, in order for .get(chatRequests).on() to be ever triggered
              util.gunAsAnotherUser(global$2(), sharedKey, function (user) {
                user.get('chatRequests').put({
                  a: 1
                });
              });
              user.get('chatLinks').get(linkId).put({
                encryptedSharedKey: encryptedSharedKey,
                ownerEncryptedSharedKey: ownerEncryptedSharedKey
              });
              return _context48.abrupt("return", Channel.formatChatLink({
                urlRoot: urlRoot,
                chatWith: key.pub,
                sharedSecret: sharedSecret,
                linkId: linkId
              }));
            case 26:
            case "end":
              return _context48.stop();
          }
        }
      }, _callee47);
    }));
    function createChatLink(_x87) {
      return _createChatLink2.apply(this, arguments);
    }
    return createChatLink;
  }() /**
      *
      */;
  Channel.getMyChatLinks =
  /*#__PURE__*/
  function () {
    var _getMyChatLinks = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee50(urlRoot, callback, subscribe) {
      var key, user, mySecret, chatLinks;
      return _regeneratorRuntime().wrap(function _callee50$(_context51) {
        while (1) {
          switch (_context51.prev = _context51.next) {
            case 0:
              if (urlRoot === void 0) {
                urlRoot = 'https://iris.to/';
              }
              if (subscribe === void 0) {
                subscribe = false;
              }
              key = session.getKey();
              user = global$2().user();
              _context51.next = 6;
              return Gun.SEA.secret(key.epub, key);
            case 6:
              mySecret = _context51.sent;
              chatLinks = [];
              user.get('chatLinks').map().on(function (data, linkId) {
                if (!data || chatLinks.indexOf(linkId) !== -1) {
                  return;
                }
                var channels = [];
                user.get('chatLinks').get(linkId).get('ownerEncryptedSharedKey').on( /*#__PURE__*/function () {
                  var _ref13 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee49(enc) {
                    var sharedKey, sharedSecret, url;
                    return _regeneratorRuntime().wrap(function _callee49$(_context50) {
                      while (1) {
                        switch (_context50.prev = _context50.next) {
                          case 0:
                            if (!(!enc || chatLinks.indexOf(linkId) !== -1)) {
                              _context50.next = 2;
                              break;
                            }
                            return _context50.abrupt("return");
                          case 2:
                            chatLinks.push(linkId);
                            _context50.next = 5;
                            return Gun.SEA.decrypt(enc, mySecret);
                          case 5:
                            sharedKey = _context50.sent;
                            _context50.next = 8;
                            return Gun.SEA.secret(sharedKey.epub, sharedKey);
                          case 8:
                            sharedSecret = _context50.sent;
                            url = Channel.formatChatLink({
                              urlRoot: urlRoot,
                              chatWith: key.pub,
                              sharedSecret: sharedSecret,
                              linkId: linkId
                            });
                            if (callback) {
                              callback({
                                url: url,
                                id: linkId
                              });
                            }
                            if (subscribe) {
                              global$2().user(sharedKey.pub).get('chatRequests').map().on( /*#__PURE__*/function () {
                                var _ref14 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee48(encPub, requestId) {
                                  var s, pub, channel;
                                  return _regeneratorRuntime().wrap(function _callee48$(_context49) {
                                    while (1) {
                                      switch (_context49.prev = _context49.next) {
                                        case 0:
                                          if (encPub) {
                                            _context49.next = 2;
                                            break;
                                          }
                                          return _context49.abrupt("return");
                                        case 2:
                                          s = JSON.stringify(encPub);
                                          if (!(channels.indexOf(s) === -1)) {
                                            _context49.next = 10;
                                            break;
                                          }
                                          channels.push(s);
                                          _context49.next = 7;
                                          return Gun.SEA.decrypt(encPub, sharedSecret);
                                        case 7:
                                          pub = _context49.sent;
                                          channel = new Channel({
                                            key: key,
                                            participants: pub
                                          });
                                          channel.save();
                                        case 10:
                                          util.gunAsAnotherUser(global$2(), sharedKey, function (user) {
                                            user.get('chatRequests').get(requestId).put(null);
                                          });
                                        case 11:
                                        case "end":
                                          return _context49.stop();
                                      }
                                    }
                                  }, _callee48);
                                }));
                                return function (_x92, _x93) {
                                  return _ref14.apply(this, arguments);
                                };
                              }());
                            }
                          case 12:
                          case "end":
                            return _context50.stop();
                        }
                      }
                    }, _callee49);
                  }));
                  return function (_x91) {
                    return _ref13.apply(this, arguments);
                  };
                }());
              });
            case 9:
            case "end":
              return _context51.stop();
          }
        }
      }, _callee50);
    }));
    function getMyChatLinks(_x88, _x89, _x90) {
      return _getMyChatLinks.apply(this, arguments);
    }
    return getMyChatLinks;
  }() /**
      *
      */;
  _proto.removeGroupChatLink = function removeGroupChatLink(linkId) {
    this.chatLinks[linkId] = null;
    this.put('chatLinks', this.chatLinks);
    global$2().user().get('chatLinks').get(linkId).put(null);
  }
  /**
  *
  */;
  Channel.removePrivateChatLink = function removePrivateChatLink(key, linkId) {
    global$2().user().auth(key);
    global$2().user().get('chatLinks').get(linkId).put(null);
  }
  /**
  *
  */;
  Channel.deleteChannel =
  /*#__PURE__*/
  function () {
    var _deleteChannel = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee51(key, pub) {
      var channelId;
      return _regeneratorRuntime().wrap(function _callee51$(_context52) {
        while (1) {
          switch (_context52.prev = _context52.next) {
            case 0:
              global$2().user().auth(key);
              _context52.next = 3;
              return Channel.getOurSecretChannelId(pub, key);
            case 3:
              channelId = _context52.sent;
              global$2().user().get('channels').get(channelId).put(null);
              global$2().user().get('channels').get(channelId).off();
            case 6:
            case "end":
              return _context52.stop();
          }
        }
      }, _callee51);
    }));
    function deleteChannel(_x94, _x95) {
      return _deleteChannel.apply(this, arguments);
    }
    return deleteChannel;
  }() /**
      *
      */;
  Channel.deleteGroup =
  /*#__PURE__*/
  function () {
    var _deleteGroup = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee52(key, uuid) {
      var mySecret, mySecretHash, mySecretUuid;
      return _regeneratorRuntime().wrap(function _callee52$(_context53) {
        while (1) {
          switch (_context53.prev = _context53.next) {
            case 0:
              _context53.next = 2;
              return Gun.SEA.secret(key.epub, key);
            case 2:
              mySecret = _context53.sent;
              _context53.next = 5;
              return util.getHash(mySecret);
            case 5:
              mySecretHash = _context53.sent;
              _context53.next = 8;
              return util.getHash(mySecretHash + uuid);
            case 8:
              mySecretUuid = _context53.sent;
              global$2().user().auth(key);
              global$2().user().get('channels').get(mySecretUuid).put(null);
              global$2().user().get('channels').get(mySecretUuid).off();
            case 12:
            case "end":
              return _context53.stop();
          }
        }
      }, _callee52);
    }));
    function deleteGroup(_x96, _x97) {
      return _deleteGroup.apply(this, arguments);
    }
    return deleteGroup;
  }();
  return Channel;
}();

var channels = /*#__PURE__*/new Map();
/**
 * Private channel that only you and publicKey can read/write.
 * @param publicKey
 * @returns {Channel}
 */
function privateState (publicKey, chatLink) {
  if (publicKey === void 0) {
    publicKey = session.getKey();
  }
  var channel = channels.get(publicKey);
  if (!channel) {
    channel = new Channel({
      participants: publicKey,
      chatLink: chatLink
    });
    channels.set(publicKey, channel);
  }
  return channel;
}

// Localforage returns null if an item is not found, so we represent null with this uuid instead.
// not foolproof, but good enough for now.
var LOCALFORAGE_NULL = "c2fc1ad0-f76f-11ec-b939-0242ac120002";
var notInLocalForage = /*#__PURE__*/new Set();
localForage.config({
  driver: [localForage.LOCALSTORAGE, localForage.INDEXEDDB, localForage.WEBSQL]
});
/**
  Our very own implementation of the Gun API
 */
var Node = /*#__PURE__*/function () {
  /** */
  function Node(id, parent) {
    var _this = this;
    if (id === void 0) {
      id = '';
    }
    if (parent === void 0) {
      parent = null;
    }
    this.children = new Map();
    this.on_subscriptions = new Map();
    this.map_subscriptions = new Map();
    this.value = undefined;
    this.counter = 0;
    this.loaded = false;
    this.saveLocalForage = _.throttle( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var children;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (_this.loaded) {
                _context.next = 3;
                break;
              }
              _context.next = 3;
              return _this.loadLocalForage();
            case 3:
              if (_this.children.size) {
                children = Array.from(_this.children.keys());
                localForage.setItem(_this.id, children);
              } else if (_this.value === undefined) {
                localForage.removeItem(_this.id);
              } else {
                localForage.setItem(_this.id, _this.value === null ? LOCALFORAGE_NULL : _this.value);
              }
            case 4:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    })), 500);
    this.loadLocalForage = _.throttle( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      var result, newResult;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!notInLocalForage.has(_this.id)) {
                _context3.next = 2;
                break;
              }
              return _context3.abrupt("return", undefined);
            case 2:
              _context3.next = 4;
              return localForage.getItem(_this.id);
            case 4:
              result = _context3.sent;
              if (!(result === null)) {
                _context3.next = 10;
                break;
              }
              result = undefined;
              notInLocalForage.add(_this.id);
              _context3.next = 22;
              break;
            case 10:
              if (!(result === LOCALFORAGE_NULL)) {
                _context3.next = 14;
                break;
              }
              result = null;
              _context3.next = 22;
              break;
            case 14:
              if (!Array.isArray(result)) {
                _context3.next = 21;
                break;
              }
              // result is a list of children
              newResult = {};
              _context3.next = 18;
              return Promise.all(result.map( /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(key) {
                  return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          _context2.next = 2;
                          return _this.get(key).once();
                        case 2:
                          newResult[key] = _context2.sent;
                        case 3:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2);
                }));
                return function (_x) {
                  return _ref3.apply(this, arguments);
                };
              }()));
            case 18:
              result = newResult;
              _context3.next = 22;
              break;
            case 21:
              // result is a value
              _this.value = result;
            case 22:
              _this.loaded = true;
              return _context3.abrupt("return", result);
            case 24:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    })), 500);
    this.doCallbacks = _.throttle(function () {
      var _loop3 = function _loop3() {
        var _step$value = _step.value,
          id = _step$value[0],
          callback = _step$value[1];
        var event = {
          off: function off() {
            return _this.on_subscriptions["delete"](id);
          }
        };
        _this.once(callback, event, false);
      };
      for (var _iterator = _createForOfIteratorHelperLoose(_this.on_subscriptions), _step; !(_step = _iterator()).done;) {
        _loop3();
      }
      if (_this.parent) {
        var _loop = function _loop() {
          var _step2$value = _step2.value,
            id = _step2$value[0],
            callback = _step2$value[1];
          var event = {
            off: function off() {
              return _this.parent.on_subscriptions["delete"](id);
            }
          };
          _this.parent.once(callback, event, false);
        };
        for (var _iterator2 = _createForOfIteratorHelperLoose(_this.parent.on_subscriptions), _step2; !(_step2 = _iterator2()).done;) {
          _loop();
        }
        var _loop2 = function _loop2() {
          var _step3$value = _step3.value,
            id = _step3$value[0],
            callback = _step3$value[1];
          var event = {
            off: function off() {
              return _this.parent.map_subscriptions["delete"](id);
            }
          };
          _this.once(callback, event, false);
        };
        for (var _iterator3 = _createForOfIteratorHelperLoose(_this.parent.map_subscriptions), _step3; !(_step3 = _iterator3()).done;) {
          _loop2();
        }
      }
    }, 40);
    this.id = id;
    this.parent = parent;
  }
  /**
   *
   * @param key
   * @returns {Node}
   * @example node.get('users').get('alice').put({name: 'Alice'})
   */
  var _proto = Node.prototype;
  _proto.get = function get(key) {
    var existing = this.children.get(key);
    if (existing) {
      return existing;
    }
    var new_node = new Node(this.id + "/" + key, this);
    this.children.set(key, new_node);
    this.saveLocalForage();
    return new_node;
  }
  /**
   * Set a value to the node. If the value is an object, it will be converted to child nodes.
   * @param value
   * @example node.get('users').get('alice').put({name: 'Alice'})
   */;
  _proto.put = function put(value) {
    var _this2 = this;
    if (Array.isArray(value)) {
      throw new Error('Sorry, we don\'t deal with arrays');
    }
    if (typeof value === 'object' && value !== null) {
      this.value = undefined;
      for (var key in value) {
        this.get(key).put(value[key]);
      }
      _.defer(function () {
        return _this2.doCallbacks();
      }, 100);
      return;
    }
    this.children = new Map();
    this.value = value;
    this.doCallbacks();
    this.saveLocalForage();
  }
  // protip: the code would be a lot cleaner if you separated the Node API from storage adapters.
  /**
   * Return a value without subscribing to it
   * @param callback
   * @param event
   * @param returnIfUndefined
   * @returns {Promise<*>}
   */;
  _proto.once =
  /*#__PURE__*/
  function () {
    var _once = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(callback, event, returnIfUndefined) {
      var _this3 = this;
      var result;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (returnIfUndefined === void 0) {
                returnIfUndefined = true;
              }
              if (!this.children.size) {
                _context5.next = 7;
                break;
              }
              // return an object containing all children
              result = {};
              _context5.next = 5;
              return Promise.all(Array.from(this.children.keys()).map( /*#__PURE__*/function () {
                var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(key) {
                  return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          _context4.next = 2;
                          return _this3.get(key).once(undefined, event);
                        case 2:
                          result[key] = _context4.sent;
                        case 3:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4);
                }));
                return function (_x5) {
                  return _ref4.apply(this, arguments);
                };
              }()));
            case 5:
              _context5.next = 14;
              break;
            case 7:
              if (!(this.value !== undefined)) {
                _context5.next = 11;
                break;
              }
              result = this.value;
              _context5.next = 14;
              break;
            case 11:
              _context5.next = 13;
              return this.loadLocalForage();
            case 13:
              result = _context5.sent;
            case 14:
              if (!(result !== undefined || returnIfUndefined)) {
                _context5.next = 17;
                break;
              }
              callback && callback(result, this.id.slice(this.id.lastIndexOf('/') + 1), null, event);
              return _context5.abrupt("return", result);
            case 17:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));
    function once(_x2, _x3, _x4) {
      return _once.apply(this, arguments);
    }
    return once;
  }() /**
       * Subscribe to a value
       * @param callback
       */;
  _proto.on = function on(callback) {
    var _this4 = this;
    var id = this.counter++;
    this.on_subscriptions.set(id, callback);
    var event = {
      off: function off() {
        return _this4.on_subscriptions["delete"](id);
      }
    };
    this.once(callback, event, false);
  }
  /**
   * Subscribe to the children of a node. Callback is called separately for each child.
   * @param callback
   * @returns {Promise<void>}
   */;
  _proto.map =
  /*#__PURE__*/
  function () {
    var _map = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(callback) {
      var _this5 = this;
      var id, event, _iterator4, _step4, child;
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              id = this.counter++;
              this.map_subscriptions.set(id, callback);
              event = {
                off: function off() {
                  return _this5.map_subscriptions["delete"](id);
                }
              };
              if (this.loaded) {
                _context6.next = 6;
                break;
              }
              _context6.next = 6;
              return this.loadLocalForage();
            case 6:
              for (_iterator4 = _createForOfIteratorHelperLoose(this.children.values()); !(_step4 = _iterator4()).done;) {
                child = _step4.value;
                child.once(callback, event, false);
              }
            case 7:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));
    function map(_x6) {
      return _map.apply(this, arguments);
    }
    return map;
  }();
  return Node;
}();

var local;
/**
 * Get a state that is only synced in memory and local storage.
 *
 * Useful for storing things like UI state, local indexes or logged in user.
 * @returns {Node}
 */
function local$1 () {
  if (!local) {
    local = new Node();
  }
  return local;
}

var blockedUsers = {};
function blockedUsers$1 () {
  if (!blockedUsers) {
    blockedUsers = {};
    local$1().get('block').map(function (isBlocked, user) {
      if (isBlocked === blockedUsers[user]) {
        return;
      }
      if (isBlocked) {
        blockedUsers[user] = isBlocked;
        local$1().get('groups').map(function (_v, k) {
          local$1().get('groups').get(k).get(user).put(false);
        });
      } else {
        delete blockedUsers[user];
      }
    });
  }
  return blockedUsers;
}

var counter = 0;
var cache = /*#__PURE__*/new Map();
var callbacks = /*#__PURE__*/new Map();
/**
 * Aggregates public data from all users in the group.
 *
 * For example, the public message feed, message replies and likes are aggregated using this.
 * @param groupName
 * @returns object
 */
function group (groupName) {
  if (groupName === void 0) {
    groupName = 'everyone';
  }
  return {
    get: function get(path, callback) {
      var groupNode = local$1().get('groups').get(groupName);
      var follows = {};
      requestAnimationFrame(function () {
        groupNode.map(function (isFollowing, user) {
          if (blockedUsers$1()[user]) {
            return;
          } // TODO: allow to specifically query blocked users?
          if (follows[user] && follows[user] === isFollowing) {
            return;
          }
          follows[user] = isFollowing;
          if (isFollowing) {
            // TODO: callback on unfollow, for unsubscribe
            var node = publicState(user);
            if (path && path !== '/') {
              node = path.split('/').reduce(function (sum, s) {
                return sum.get(decodeURIComponent(s));
              }, node);
            }
            callback(node, user);
          }
        });
      });
    },
    _cached_map: function _cached_map(cached, cacheKey, path, myEvent, callback) {
      if (!cached) {
        var _cached = new Map();
        cache.set(cacheKey, _cached);
        this.get(path, function (node, from) {
          return node.map(function (value, key, x) {
            var item = {
              value: value,
              key: key,
              from: from
            };
            _cached.set(key, item);
            for (var _iterator = _createForOfIteratorHelperLoose(callbacks.get(cacheKey).values()), _step; !(_step = _iterator()).done;) {
              var cb = _step.value;
              cb(value, key, x, myEvent, from);
            }
          });
        });
      } else {
        for (var _iterator2 = _createForOfIteratorHelperLoose(cached.values()), _step2; !(_step2 = _iterator2()).done;) {
          var item = _step2.value;
          callback(item.value, item.key, 0, myEvent, item.from);
        }
      }
    },
    // TODO: this should probably store just the most recent value, not everyone's value
    // TODO: for counting of likes etc, use this.count() instead
    _cached_on: function _cached_on(cached, cacheKey, path, myEvent, callback) {
      if (!cached) {
        var _cached2 = new Map();
        cache.set(cacheKey, _cached2);
        this.get(path, function (node, from) {
          return node.on(function (value, key, x) {
            var item = {
              value: value,
              key: key,
              from: from
            };
            _cached2.set(from, item);
            for (var _iterator3 = _createForOfIteratorHelperLoose(callbacks.get(cacheKey).values()), _step3; !(_step3 = _iterator3()).done;) {
              var cb = _step3.value;
              cb(value, key, x, myEvent, from);
            }
          });
        });
      } else {
        for (var _iterator4 = _createForOfIteratorHelperLoose(cached.values()), _step4; !(_step4 = _iterator4()).done;) {
          var item = _step4.value;
          callback(item.value, item.key, 0, myEvent, item.from);
        }
      }
    },
    _cached_count: function _cached_count(cached, cacheKey, path, myEvent, callback) {
      if (!cached) {
        var _cached3 = new Map();
        cache.set(cacheKey, _cached3);
        this.get(path, function (node, from) {
          return node.on(function (value, key) {
            value ? _cached3.set(from, true) : _cached3["delete"](from);
            var count = _cached3.size;
            for (var _iterator5 = _createForOfIteratorHelperLoose(callbacks.get(cacheKey).values()), _step5; !(_step5 = _iterator5()).done;) {
              var cb = _step5.value;
              cb(count, key, null, myEvent, from);
            }
          });
        });
      } else {
        callback(cached.size, path.split('/').pop(), null, myEvent);
      }
    },
    _cached_fn: function _cached_fn(fn, path, callback) {
      var cacheKey = fn + ":" + groupName + ":" + path;
      var callbackId = counter++;
      if (callbacks.has(cacheKey)) {
        callbacks.get(cacheKey).set(callbackId, callback);
      } else {
        callbacks.set(cacheKey, new Map([[callbackId, callback]]));
      }
      var myEvent = {
        off: function off() {
          var myCallbacks = callbacks.get(cacheKey);
          myCallbacks && myCallbacks["delete"](callbackId);
        }
      };
      var cached = cache.get(cacheKey);
      switch (fn) {
        case 'map':
          this._cached_map(cached, cacheKey, path, myEvent, callback);
          break;
        case 'on':
          this._cached_on(cached, cacheKey, path, myEvent, callback);
          break;
        case 'count':
          this._cached_count(cached, cacheKey, path, myEvent, callback);
          break;
      }
    },
    map: function map(path, callback) {
      this._cached_fn('map', path, callback);
    },
    on: function on(path, callback) {
      this._cached_fn('on', path, callback);
    },
    count: function count(path, callback) {
      this._cached_fn('count', path, callback);
    }
  };
}

var NOTIFICATION_SERVICE_URL = 'https://iris-notifications.herokuapp.com/notify';
// const notificationSound = new Audio('../../assets/audio/notification.mp3'); // TODO
var loginTime;
var unseenMsgsTotal = 0;
var unseenNotificationCount = 0;
var webPushSubscriptions = {};
function desktopNotificationsEnabled() {
  return window.Notification && Notification.permission === 'granted';
}
function notifyMsg(msg, info, channelId, onClick) {
  function shouldNotify() {
    if (msg.timeObj < loginTime) {
      return false;
    }
    if (info.selfAuthored) {
      return false;
    }
    if (document.visibilityState === 'visible') {
      return false;
    }
    var channel = privateState(channelId);
    if (channel.notificationSetting === 'nothing') {
      return false;
    }
    if (channel.notificationSetting === 'mentions' && !msg.text.includes(session.getMyName())) {
      return false;
    }
    return true;
  }
  function shouldDesktopNotify() {
    if (!desktopNotificationsEnabled()) {
      return false;
    }
    return shouldNotify();
  }
  function shouldAudioNotify() {
    return shouldNotify();
  }
  if (shouldAudioNotify()) ;
  if (shouldDesktopNotify()) {
    var body, title;
    var channel = privateState(channelId);
    if (channel.uuid) {
      title = channel.participantProfiles[info.from].name;
      body = name + ": " + msg.text;
    } else {
      title = 'Message';
      body = msg.text;
    }
    body = util.truncateString(body, 50);
    var desktopNotification = new Notification(title, {
      icon: '/assets/img/icon128.png',
      body: body,
      silent: true
    });
    desktopNotification.onclick = function () {
      changeUnseenNotificationCount(-1);
      onClick && onClick();
      window.focus();
    };
  }
}
function changeChatUnseenMsgsCount(chatId, change) {
  var chat = privateState(chatId);
  if (!chat) return;
  var chatNode = local$1().get('channels').get(chatId);
  if (change) {
    unseenMsgsTotal += change;
    chat.unseen += change;
  } else {
    unseenMsgsTotal = unseenMsgsTotal - (chat.unseen || 0);
    chat.unseen = 0;
  }
  chatNode.get('unseen').put(chat.unseen);
  unseenMsgsTotal = unseenMsgsTotal >= 0 ? unseenMsgsTotal : 0;
  local$1().get('unseenMsgsTotal').put(unseenMsgsTotal);
}
var publicVapidKey = 'BMqSvZArOIdn7vGkYplSpkZ70-Qt8nhYbey26WVa3LF3SwzblSzm3n3HHycpNkAKVq7MCkrzFuTFs_en7Y_J2MI';
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function subscribe(_x) {
  return _subscribe.apply(this, arguments);
}
function _subscribe() {
  _subscribe = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(reg) {
    var subscription;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          case 3:
            subscription = _context3.sent;
            addWebPushSubscription(subscription);
            _context3.next = 10;
            break;
          case 7:
            _context3.prev = 7;
            _context3.t0 = _context3["catch"](0);
            console.error('web push subscription error', _context3.t0);
          case 10:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 7]]);
  }));
  return _subscribe.apply(this, arguments);
}
function subscribeToWebPush() {
  return _subscribeToWebPush.apply(this, arguments);
}
function _subscribeToWebPush() {
  _subscribeToWebPush = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var reg, sub;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            console.log('subscribing to web push', navigator.serviceWorker);
            if (!(!desktopNotificationsEnabled() || !navigator.serviceWorker)) {
              _context4.next = 3;
              break;
            }
            return _context4.abrupt("return", false);
          case 3:
            _context4.next = 5;
            return navigator.serviceWorker.ready;
          case 5:
            _context4.next = 7;
            return navigator.serviceWorker.getRegistration();
          case 7:
            reg = _context4.sent;
            reg.active.postMessage({
              key: session.getKey()
            });
            _context4.next = 11;
            return reg.pushManager.getSubscription();
          case 11:
            sub = _context4.sent;
            sub ? addWebPushSubscription(sub) : subscribe(reg);
          case 13:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _subscribeToWebPush.apply(this, arguments);
}
var addWebPushSubscriptionsToChats = /*#__PURE__*/_.debounce(function () {
  var arr = Object.values(webPushSubscriptions);
  session.channelIds.forEach(function (channelId) {
    privateState(channelId).put('webPushSubscriptions', arr);
  });
}, 5000);
function removeSubscription(hash) {
  delete webPushSubscriptions[hash];
  global$2().user().get('webPushSubscriptions').get(hash).put(null);
  addWebPushSubscriptionsToChats();
}
function addWebPushSubscription(_x2, _x3) {
  return _addWebPushSubscription.apply(this, arguments);
}
function _addWebPushSubscription() {
  _addWebPushSubscription = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(s, saveToGun) {
    var myKey, mySecret, enc, hash;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (saveToGun === void 0) {
              saveToGun = true;
            }
            myKey = session.getKey();
            _context5.next = 4;
            return Gun.SEA.secret(myKey.epub, myKey);
          case 4:
            mySecret = _context5.sent;
            _context5.next = 7;
            return Gun.SEA.encrypt(s, mySecret);
          case 7:
            enc = _context5.sent;
            _context5.next = 10;
            return util.getHash(JSON.stringify(s));
          case 10:
            hash = _context5.sent;
            if (saveToGun) {
              global$2().user().get('webPushSubscriptions').get(hash).put(enc);
            }
            webPushSubscriptions[hash] = s;
            addWebPushSubscriptionsToChats();
          case 14:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _addWebPushSubscription.apply(this, arguments);
}
function getWebPushSubscriptions() {
  return _getWebPushSubscriptions.apply(this, arguments);
}
function _getWebPushSubscriptions() {
  _getWebPushSubscriptions = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7() {
    var myKey, mySecret;
    return _regeneratorRuntime().wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            myKey = session.getKey();
            _context7.next = 3;
            return Gun.SEA.secret(myKey.epub, myKey);
          case 3:
            mySecret = _context7.sent;
            global$2().user().get('webPushSubscriptions').map().on( /*#__PURE__*/function () {
              var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(enc) {
                var s;
                return _regeneratorRuntime().wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        if (enc) {
                          _context6.next = 2;
                          break;
                        }
                        return _context6.abrupt("return");
                      case 2:
                        _context6.next = 4;
                        return Gun.SEA.decrypt(enc, mySecret);
                      case 4:
                        s = _context6.sent;
                        addWebPushSubscription(s, false);
                      case 6:
                      case "end":
                        return _context6.stop();
                    }
                  }
                }, _callee6);
              }));
              return function (_x18) {
                return _ref3.apply(this, arguments);
              };
            }());
          case 5:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
  return _getWebPushSubscriptions.apply(this, arguments);
}
function getEpub(user) {
  return new Promise(function (resolve) {
    global$2().user(user).get('epub').on( /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(epub, k, x, e) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (epub) {
                  e.off();
                  resolve(epub);
                }
              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));
      return function (_x4, _x5, _x6, _x7) {
        return _ref.apply(this, arguments);
      };
    }());
  });
}
function getNotificationText(_x8) {
  return _getNotificationText.apply(this, arguments);
}
function _getNotificationText() {
  _getNotificationText = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(notification) {
    var profile, name, event, eventText;
    return _regeneratorRuntime().wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return global$2().user(notification.from).get('profile').once();
          case 2:
            profile = _context8.sent;
            name = profile && profile.name || 'someone';
            event = notification.event || notification.action;
            if (event === 'like') eventText = name + " liked your post";else if (event === 'reply') eventText = name + " replied to your post";else if (event === 'mention') eventText = name + " mentioned you in their post";else if (event === 'follow') eventText = name + " started following you";else eventText = name + " sent you a notification: " + event;
            return _context8.abrupt("return", eventText);
          case 7:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return _getNotificationText.apply(this, arguments);
}
function subscribeToIrisNotifications(onClick) {
  var notificationsSeenTime;
  var notificationsShownTime;
  global$2().user().get('notificationsSeenTime').on(function (v) {
    notificationsSeenTime = v;
    console.log(v);
  });
  global$2().user().get('notificationsShownTime').on(function (v) {
    return notificationsShownTime = v;
  });
  var setNotificationsShownTime = _.debounce(function () {
    global$2().user().get('notificationsShownTime').put(new Date().toISOString());
  }, 1000);
  var alreadyHave = new Set();
  group().on("notifications/" + session.getPubKey(), /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(encryptedNotification, k, x, e, from) {
      var id, epub, secret, notification, text, desktopNotification;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              id = from.slice(0, 30) + encryptedNotification.slice(0, 30);
              if (!alreadyHave.has(id)) {
                _context2.next = 3;
                break;
              }
              return _context2.abrupt("return");
            case 3:
              alreadyHave.add(id);
              _context2.next = 6;
              return getEpub(from);
            case 6:
              epub = _context2.sent;
              _context2.next = 9;
              return Gun.SEA.secret(epub, session.getKey());
            case 9:
              secret = _context2.sent;
              _context2.next = 12;
              return Gun.SEA.decrypt(encryptedNotification, secret);
            case 12:
              notification = _context2.sent;
              if (!(!notification || typeof notification !== 'object')) {
                _context2.next = 15;
                break;
              }
              return _context2.abrupt("return");
            case 15:
              setNotificationsShownTime();
              notification.from = from;
              local$1().get('notifications').get(notification.time).put(notification);
              if (!notificationsSeenTime || notificationsSeenTime < notification.time) {
                changeUnseenNotificationCount(1);
              }
              if (!(!notificationsShownTime || notificationsShownTime < notification.time)) {
                _context2.next = 26;
                break;
              }
              console.log('was new!');
              _context2.next = 23;
              return getNotificationText(notification);
            case 23:
              text = _context2.sent;
              desktopNotification = new Notification(text, {
                icon: '/assets/img/icon128.png',
                body: text,
                silent: true
              });
              desktopNotification.onclick = function () {
                var link = notification.target ? "/post/" + notification.target : "/profile/" + notification.from;
                onClick && onClick(link);
                changeUnseenNotificationCount(-1);
                window.focus();
              };
            case 26:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    return function (_x9, _x10, _x11, _x12, _x13) {
      return _ref2.apply(this, arguments);
    };
  }());
}
function changeUnseenNotificationCount(change) {
  if (!change) {
    unseenNotificationCount = 0;
    global$2().user().get('notificationsSeenTime').put(new Date().toISOString());
  } else {
    unseenNotificationCount += change;
    unseenNotificationCount = Math.max(unseenNotificationCount, 0);
  }
  local$1().get('unseenNotificationCount').put(unseenNotificationCount);
}
function sendIrisNotification(_x14, _x15) {
  return _sendIrisNotification.apply(this, arguments);
}
function _sendIrisNotification() {
  _sendIrisNotification = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(recipient, notification) {
    var epub, secret, enc;
    return _regeneratorRuntime().wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            if (recipient && notification) {
              _context9.next = 2;
              break;
            }
            return _context9.abrupt("return");
          case 2:
            // TODO: use typescript or sth :D
            if (typeof notification === 'object') {
              notification.time = new Date().toISOString();
            }
            _context9.next = 5;
            return getEpub(recipient);
          case 5:
            epub = _context9.sent;
            _context9.next = 8;
            return Gun.SEA.secret(epub, session.getKey());
          case 8:
            secret = _context9.sent;
            _context9.next = 11;
            return Gun.SEA.encrypt(notification, secret);
          case 11:
            enc = _context9.sent;
            global$2().user().get('notifications').get(recipient).put(enc);
          case 13:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));
  return _sendIrisNotification.apply(this, arguments);
}
function sendWebPushNotification(_x16, _x17) {
  return _sendWebPushNotification.apply(this, arguments);
}
function _sendWebPushNotification() {
  _sendWebPushNotification = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee11(recipient, notification) {
    var channel, myKey, shouldWebPush, _ret;
    return _regeneratorRuntime().wrap(function _callee11$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            console.log('sending web push notification to', recipient, notification);
            channel = privateState(recipient);
            myKey = session.getKey();
            shouldWebPush = recipient === myKey.pub || !(channel.activity && channel.activity.isActive);
            if (!(shouldWebPush && channel.webPushSubscriptions)) {
              _context12.next = 9;
              break;
            }
            return _context12.delegateYield( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10() {
              var subscriptions, participants, _loop, i;
              return _regeneratorRuntime().wrap(function _callee10$(_context11) {
                while (1) {
                  switch (_context11.prev = _context11.next) {
                    case 0:
                      subscriptions = [];
                      participants = Object.keys(channel.webPushSubscriptions);
                      _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop(i) {
                        var participant, secret, payload;
                        return _regeneratorRuntime().wrap(function _loop$(_context10) {
                          while (1) {
                            switch (_context10.prev = _context10.next) {
                              case 0:
                                participant = participants[i];
                                _context10.next = 3;
                                return channel.getSecret(participant);
                              case 3:
                                secret = _context10.sent;
                                _context10.next = 6;
                                return Gun.SEA.encrypt(notification.title, secret);
                              case 6:
                                _context10.t0 = _context10.sent;
                                _context10.next = 9;
                                return Gun.SEA.encrypt(notification.body, secret);
                              case 9:
                                _context10.t1 = _context10.sent;
                                _context10.t2 = {
                                  pub: myKey.pub,
                                  epub: myKey.epub
                                };
                                payload = {
                                  title: _context10.t0,
                                  body: _context10.t1,
                                  from: _context10.t2
                                };
                                channel.webPushSubscriptions[participant].forEach(function (s) {
                                  if (s && s.endpoint) {
                                    subscriptions.push({
                                      subscription: s,
                                      payload: payload
                                    });
                                  }
                                });
                              case 13:
                              case "end":
                                return _context10.stop();
                            }
                          }
                        }, _loop);
                      });
                      i = 0;
                    case 4:
                      if (!(i < participants.length)) {
                        _context11.next = 9;
                        break;
                      }
                      return _context11.delegateYield(_loop(i), "t0", 6);
                    case 6:
                      i++;
                      _context11.next = 4;
                      break;
                    case 9:
                      if (!(subscriptions.length === 0)) {
                        _context11.next = 11;
                        break;
                      }
                      return _context11.abrupt("return", {
                        v: void 0
                      });
                    case 11:
                      fetch(NOTIFICATION_SERVICE_URL, {
                        method: 'POST',
                        body: JSON.stringify({
                          subscriptions: subscriptions
                        }),
                        headers: {
                          'content-type': 'application/json'
                        }
                      })["catch"](function () {});
                    case 12:
                    case "end":
                      return _context11.stop();
                  }
                }
              }, _callee10);
            })(), "t0", 6);
          case 6:
            _ret = _context12.t0;
            if (!(typeof _ret === "object")) {
              _context12.next = 9;
              break;
            }
            return _context12.abrupt("return", _ret.v);
          case 9:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee11);
  }));
  return _sendWebPushNotification.apply(this, arguments);
}
function init() {
  loginTime = new Date();
  unseenMsgsTotal = 0;
}
var notifications = {
  init: init,
  notifyMsg: notifyMsg,
  getNotificationText: getNotificationText,
  sendWebPushNotification: sendWebPushNotification,
  changeUnseenNotificationCount: changeUnseenNotificationCount,
  subscribeToIrisNotifications: subscribeToIrisNotifications,
  sendIrisNotification: sendIrisNotification,
  changeChatUnseenCount: changeChatUnseenMsgsCount,
  webPushSubscriptions: webPushSubscriptions,
  subscribeToWebPush: subscribeToWebPush,
  getWebPushSubscriptions: getWebPushSubscriptions,
  removeSubscription: removeSubscription
};

var electron = util.isElectron ? /*#__PURE__*/new Gun({
  peers: ['http://localhost:8768/gun'],
  file: 'State.electron',
  multicast: false,
  localStorage: false
}).get('state') : null;

var key;
var myName;
var latestChatLink;
var onlineTimeout;
var ourActivity;
var noFollows;
var noFollowers;
var searchIndex;
var initCalled;
var searchableItems = {};
var getExtendedFollowsCalled = /*#__PURE__*/new Map();
var DEFAULT_FOLLOW = 'hyECQHwSo7fgr2MVfPyakvayPeixxsaAWVtZ-vbaiSc.TXIp8MnCtrnW6n2MrYquWPcc-DTmZzMBmc2yaGv9gIU';
var DEFAULT_SETTINGS = {
  electron: {
    openAtLogin: true,
    minimizeOnClose: true
  },
  local: {
    enableWebtorrent: !util.isMobile,
    enablePublicPeerDiscovery: true,
    autoplayWebtorrent: true,
    maxConnectedPeers: util.isElectron ? 2 : 1
  }
};
/**
 * User session management utilities.
 */
var session = {
  /**
   * Log in with a key from localStorage.
   *
   * If no key is found and options.autologin is not false, a new user will be created.
   *
   * If options.autofollow is not false, the default follow will be added.
   * @param options
   */init: function init(options) {
    var _this = this;
    if (options === void 0) {
      options = {};
    }
    if (initCalled) {
      return;
    }
    initCalled = true;
    var localStorageKey = localStorage.getItem('chatKeyPair');
    if (localStorageKey) {
      this.login(JSON.parse(localStorageKey));
    } else if (options.autologin !== false) {
      this.loginAsNewUser(options);
    } else {
      this.clearIndexedDB();
    }
    setTimeout(function () {
      local$1().get('block').map(function () {
        _this.updateSearchIndex();
      });
      _this.updateSearchIndex();
    });
    setInterval(function () {
      if (_this.taskQueue.length) {
        //console.log('this.taskQueue', this.taskQueue.length);
        var t = _this.taskQueue.shift();
        t && t();
      }
    }, 10);
  },
  DEFAULT_SETTINGS: DEFAULT_SETTINGS,
  DEFAULT_FOLLOW: DEFAULT_FOLLOW,
  taskQueue: [],
  updateSearchIndex: /*#__PURE__*/_.throttle(function () {
    var options = {
      keys: ['name'],
      includeScore: true,
      includeMatches: true,
      threshold: 0.3
    };
    var values = Object.values(_.omit(searchableItems, Object.keys(blockedUsers$1())));
    searchIndex = new Fuse(values, options);
    local$1().get('searchIndexUpdated').put(true);
  }, 2000, {
    leading: true
  }),
  saveSearchResult: /*#__PURE__*/_.throttle(function (k) {
    local$1().get('contacts').get(k).put({
      followDistance: searchableItems[k].followDistance,
      followerCount: searchableItems[k].followers.size
    });
  }, 1000, {
    leading: true
  }),
  addFollow: function addFollow(callback, k, followDistance, follower) {
    if (searchableItems[k]) {
      if (searchableItems[k].followDistance > followDistance) {
        searchableItems[k].followDistance = followDistance;
      }
      follower && searchableItems[k].followers.add(follower);
    } else {
      searchableItems[k] = {
        key: k,
        followDistance: followDistance,
        followers: new Set(follower && [follower])
      };
      this.taskQueue.push(function () {
        publicState(k).get('profile').get('name').on(function (name) {
          searchableItems[k].name = name;
          local$1().get('contacts').get(k).get('name').put(name);
          callback && callback(k, searchableItems[k]);
        });
      });
    }
    this.saveSearchResult(k);
    callback && callback(k, searchableItems[k]);
    this.updateSearchIndex();
    this.updateNoFollows();
    this.updateNoFollowers();
  },
  removeFollow: function removeFollow(k, followDistance, follower) {
    if (searchableItems[k]) {
      searchableItems[k].followers["delete"](follower);
      if (followDistance === 1) {
        local$1().get('groups').get('follows').get(k).put(false);
      }
      this.updateNoFollows();
      this.updateNoFollowers();
    }
  },
  getExtendedFollows: function getExtendedFollows(callback, k, maxDepth, currentDepth) {
    var _this2 = this;
    if (k === void 0) {
      k = key.pub;
    }
    if (maxDepth === void 0) {
      maxDepth = 3;
    }
    if (currentDepth === void 0) {
      currentDepth = 1;
    }
    var called = getExtendedFollowsCalled.get(k);
    if (called && called <= currentDepth) {
      return;
    }
    getExtendedFollowsCalled.set(k, currentDepth);
    this.addFollow(callback, k, currentDepth - 1);
    publicState(k).get('follow').map().on(function (isFollowing, followedKey) {
      if (isFollowing) {
        _this2.addFollow(callback, followedKey, currentDepth, k);
        if (currentDepth < maxDepth) {
          _this2.taskQueue.push(function () {
            return _this2.getExtendedFollows(callback, followedKey, maxDepth, currentDepth + 1);
          });
        }
      } else {
        _this2.removeFollow(followedKey, currentDepth, k);
      }
    });
    return searchableItems;
  },
  updateNoFollows: /*#__PURE__*/_.throttle(function () {
    var v = Object.keys(searchableItems).length <= 1;
    if (v !== noFollows) {
      noFollows = v;
      local$1().get('noFollows').put(noFollows);
    }
  }, 1000, {
    leading: true
  }),
  updateNoFollowers: /*#__PURE__*/_.throttle(function () {
    var v = !(searchableItems[key.pub] && searchableItems[key.pub].followers.size > 0);
    if (v !== noFollowers) {
      noFollowers = v;
      local$1().get('noFollowers').put(noFollowers);
    }
  }, 1000, {
    leading: true
  }),
  getSearchIndex: function getSearchIndex() {
    return searchIndex;
  },
  setOurOnlineStatus: function setOurOnlineStatus() {
    var activeRoute = window.location.hash;
    Channel.setActivity(ourActivity = 'active');
    var setActive = _.debounce(function () {
      var chatId = activeRoute && activeRoute.replace('#/profile/', '').replace('#/chat/', '');
      var chat = privateState(chatId);
      if (chat && !ourActivity) {
        chat.setMyMsgsLastSeenTime();
      }
      Channel.setActivity(ourActivity = 'active');
      clearTimeout(onlineTimeout);
      onlineTimeout = setTimeout(function () {
        return Channel.setActivity(ourActivity = 'online');
      }, 30000);
    }, 1000);
    document.addEventListener("touchmove", setActive);
    document.addEventListener("mousemove", setActive);
    document.addEventListener("keypress", setActive);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === 'visible') {
        Channel.setActivity(ourActivity = 'active');
        var chatId = location.pathname.slice(1).replace('chat/', '');
        var chat = activeRoute && privateState(chatId);
        if (chat) {
          chat.setMyMsgsLastSeenTime();
          notifications.changeChatUnseenCount(chatId, 0);
        }
      } else {
        Channel.setActivity(ourActivity = 'online');
      }
    });
    setActive();
    window.addEventListener("beforeunload", function () {
      Channel.setActivity(ourActivity = null);
    });
  },
  updateGroups: function updateGroups() {
    var _this3 = this;
    this.getExtendedFollows(function (k, info) {
      if (info.followDistance <= 1) {
        local$1().get('groups').get('follows').get(k).put(true);
      }
      local$1().get('groups').get('everyone').get(k).put(true);
      if (k === _this3.getPubKey()) {
        _this3.updateNoFollowers();
      }
    });
  },
  /**
   * Log in with a private key.
   * @param key
   */login: function login(k) {
    var _this4 = this;
    var shouldRefresh = !!key;
    key = k;
    localStorage.setItem('chatKeyPair', JSON.stringify(k));
    publicState().auth(key);
    publicState().put({
      epub: key.epub
    });
    publicState().get('likes').put({
      a: null
    }); // gun bug?
    publicState().get('msgs').put({
      a: null
    }); // gun bug?
    publicState().get('replies').put({
      a: null
    }); // gun bug?
    notifications.subscribeToWebPush();
    notifications.getWebPushSubscriptions();
    notifications.subscribeToIrisNotifications();
    Channel.getMyChatLinks(undefined, function (chatLink) {
      local$1().get('chatLinks').get(chatLink.id).put(chatLink.url);
      latestChatLink = chatLink.url;
    });
    this.setOurOnlineStatus();
    Channel.getChannels(function (c) {
      return _this4.addChannel(c);
    });
    publicState().get('profile').get('name').on(function (name) {
      if (name && typeof name === 'string') {
        myName = name;
      }
    });
    notifications.init();
    local$1().get('loggedIn').put(true);
    local$1().get('settings').once().then(function (settings) {
      if (!settings) {
        local$1().get('settings').put(DEFAULT_SETTINGS.local);
      } else if (settings.enableWebtorrent === undefined || settings.autoplayWebtorrent === undefined) {
        local$1().get('settings').get('enableWebtorrent').put(DEFAULT_SETTINGS.local.enableWebtorrent);
        local$1().get('settings').get('autoplayWebtorrent').put(DEFAULT_SETTINGS.local.autoplayWebtorrent);
      }
    });
    publicState().get('block').map().on(function (isBlocked, user) {
      local$1().get('block').get(user).put(isBlocked);
      if (isBlocked) {
        delete searchableItems[user];
      }
    });
    this.updateGroups();
    if (shouldRefresh) {
      location.reload();
    }
    if (electron) {
      electron.get('settings').on(function (electron) {
        local$1().get('settings').get('electron').put(electron);
      });
      electron.get('user').put(key.pub);
    }
    local$1().get('filters').get('group').once().then(function (v) {
      if (!v) {
        local$1().get('filters').get('group').put('follows');
      }
    });
  },
  /**
   * Create a new user account and log in.
   * @param options {Object} - Options for the new account.
   * @returns {Promise<*>}
   */loginAsNewUser: function loginAsNewUser(options) {
    var _this5 = this;
    if (options === void 0) {
      options = {};
    }
    var name = options.name || util.generateName();
    console.log('loginAsNewUser name', name);
    return Gun.SEA.pair().then(function (k) {
      _this5.login(k);
      publicState().get('profile').put({
        a: null
      });
      publicState().get('profile').get('name').put(name);
      local$1().get('filters').put({
        a: null
      });
      local$1().get('filters').get('group').put('follows');
      Channel.createChatLink().then(function (l) {
        return latestChatLink = l;
      });
      setTimeout(function () {
        if (options.autofollow !== false) {
          console.log('autofollowing', DEFAULT_FOLLOW);
          publicState().get('follow').get(DEFAULT_FOLLOW).put(true);
        }
      }, 1000); // maybe wait for login return instead
    });
  },
  /**
   * Log out the current user.
   * @returns {Promise<void>}
   */logOut: function logOut() {
    var _this6 = this;
    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var reg, _reg$active, sub, hash;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (electron) {
                electron.get('user').put(null);
              }
              // TODO: remove subscription from your channels
              if (!navigator.serviceWorker) {
                _context.next = 16;
                break;
              }
              _context.next = 4;
              return navigator.serviceWorker.getRegistration();
            case 4:
              reg = _context.sent;
              if (!(reg && reg.pushManager)) {
                _context.next = 16;
                break;
              }
              (_reg$active = reg.active) == null ? void 0 : _reg$active.postMessage({
                key: null
              });
              _context.next = 9;
              return reg.pushManager.getSubscription();
            case 9:
              sub = _context.sent;
              if (!sub) {
                _context.next = 16;
                break;
              }
              _context.next = 13;
              return util.getHash(JSON.stringify(sub));
            case 13:
              hash = _context.sent;
              notifications.removeSubscription(hash);
              sub.unsubscribe && sub.unsubscribe();
            case 16:
              _this6.clearIndexedDB();
              localStorage.clear(); // TODO clear only iris data
              localForage.clear().then(function () {
                window.location.hash = '';
                window.location.href = '/';
                location.reload();
              });
            case 19:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  },
  clearIndexedDB: function clearIndexedDB() {
    return new Promise(function (resolve) {
      var r1 = window.indexedDB.deleteDatabase('local()');
      var r2 = window.indexedDB.deleteDatabase('radata');
      var r1done = false;
      var r2done = false;
      var check = function check() {
        r1done && r2done && resolve(undefined);
      };
      r1.onerror = r2.onerror = function (e) {
        return console.error(e);
      };
      //r1.onblocked = r2.onblocked = e => console.error('blocked', e);
      r1.onsuccess = function () {
        r1done = true;
        check();
      };
      r2.onsuccess = function () {
        r2done = true;
        check();
      };
    });
  },
  getMyChatLink: function getMyChatLink() {
    return latestChatLink || util.getProfileLink(key.pub);
  },
  /**
   * Get the keypair of the logged in user.
   * @returns {*}
   */getKey: function getKey() {
    return key;
  },
  /**
   * Get the public key of the logged in user.
   * @returns {*}
   */getPubKey: function getPubKey() {
    return key && key.pub;
  },
  /**
   * Get the name of the logged in user.
   * @returns {*}
   */getMyName: function getMyName() {
    return myName;
  },
  myPeerUrl: function myPeerUrl(ip) {
    return "http://" + ip + ":8767/gun";
  },
  shareMyPeerUrl: function shareMyPeerUrl(channel) {
    var _this7 = this;
    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
      var myIp;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return local$1().get('settings').get('electron').get('publicIp').once();
            case 2:
              myIp = _context2.sent;
              myIp && channel.put && channel.put('my_peer', _this7.myPeerUrl(myIp));
            case 4:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }))();
  },
  newChannel: function newChannel(pub, chatLink) {
    if (!pub || this.channelIds.has(pub)) {
      return;
    }
    var chat = privateState(pub, chatLink);
    this.addChannel(chat);
    return chat;
  },
  addChannel: function addChannel(chat) {
    var _this8 = this;
    this.taskQueue.push(function () {
      var pub = chat.getId();
      if (_this8.channelIds.has(pub)) {
        return;
      }
      _this8.channelIds.add(pub);
      var chatNode = local$1().get('channels').get(pub);
      chatNode.get('latestTime').on(function (t) {
        if (t && (!chat.latestTime || t > chat.latestTime)) {
          chat.latestTime = t;
        }
      });
      chatNode.get('theirMsgsLastSeenTime').on(function (t) {
        if (!t) {
          return;
        }
        var d = new Date(t);
        if (!chat.theirMsgsLastSeenDate || chat.theirMsgsLastSeenDate < d) {
          chat.theirMsgsLastSeenDate = d;
        }
      });
      chat.getLatestMsg && chat.getLatestMsg(function (latest, info) {
        _this8.processMessage(pub, latest, info);
      });
      notifications.changeChatUnseenCount(pub, 0);
      chat.notificationSetting = 'all';
      chat.onMy('notificationSetting', function (val) {
        chat.notificationSetting = val;
      });
      //$(".chat-list").append(el);
      chat.theirMsgsLastSeenTime = '';
      chat.getTheirMsgsLastSeenTime(function (time) {
        if (chat && time && time >= chat.theirMsgsLastSeenTime) {
          chat.theirMsgsLastSeenTime = time;
          chatNode.get('theirMsgsLastSeenTime').put(time);
        }
      });
      chat.getMyMsgsLastSeenTime(function (time) {
        chat.myLastSeenTime = new Date(time);
        if (chat.latest && chat.myLastSeenTime >= chat.latest.time) {
          notifications.changeChatUnseenCount(pub, 0);
        }
      });
      chat.isTyping = false;
      chat.getTyping(function (isTyping) {
        chat.isTyping = isTyping;
        local$1().get('channels').get(pub).get('isTyping').put(isTyping);
      });
      chat.online = {};
      Channel.getActivity(pub, function (activity) {
        if (chat) {
          chatNode.put({
            theirLastActiveTime: activity && activity.lastActive,
            activity: activity && activity.isActive && activity.status
          });
          chat.activity = activity;
        }
      });
      if (chat.uuid) {
        var isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        chat.participantProfiles = {};
        chat.on('name', function (v) {
          chat.name = v;
          searchableItems[chat.uuid] = {
            name: v,
            uuid: chat.uuid
          };
          local$1().get('channels').get(chat.uuid).get('name').put(v);
        });
        chat.on('photo', function (v) {
          searchableItems[chat.uuid] = searchableItems[chat.uuid] || {};
          searchableItems[chat.uuid].photo = v;
          local$1().get('channels').get(chat.uuid).get('photo').put(v);
        });
        chat.on('about', function (v) {
          return local$1().get('channels').get(chat.uuid).get('about').put(v);
        });
        chat.getParticipants(function (participants) {
          delete participants.undefined; // TODO fix where it comes from
          if (typeof participants === 'object') {
            var keys = Object.keys(participants);
            keys.forEach(function (k, i) {
              var hue = 360 / Math.max(keys.length, 2) * i; // TODO use css filter brightness
              chat.participantProfiles[k] = {
                permissions: participants[k],
                color: "hsl(" + hue + ", 98%, " + (isDarkMode ? 80 : 33) + "%)"
              };
              publicState(k).get('profile').get('name').on(function (name) {
                chat.participantProfiles[k].name = name;
              });
            });
          }
          local$1().get('channels').get(chat.uuid).get('participants').put(participants);
        });
        chat.inviteLinks = {};
        chat.getChatLinks({
          callback: function callback(_ref) {
            var url = _ref.url,
              id = _ref.id;
            console.log('got chat link', id, url);
            chat.inviteLinks[id] = url; // TODO use State
            local$1().get('inviteLinksChanged').put(true);
          }
        });
      } else {
        local$1().get('groups').get('everyone').get(pub).put(true);
        _this8.addFollow(null, pub, Infinity);
        publicState(pub).get('profile').get('name').on(function (v) {
          return local$1().get('channels').get(pub).get('name').put(v);
        });
      }
      if (chat.put) {
        chat.onTheir('webPushSubscriptions', function (s, k, from) {
          if (!Array.isArray(s)) {
            return;
          }
          chat.webPushSubscriptions = chat.webPushSubscriptions || {};
          chat.webPushSubscriptions[from || pub] = s;
        });
        var arr = Object.values(notifications.webPushSubscriptions);
        setTimeout(function () {
          return chat.put('webPushSubscriptions', arr);
        }, 5000);
        _this8.shareMyPeerUrl(chat);
      }
      chat.onTheir('call', function (call) {
        local$1().get('call').put({
          pub: pub,
          call: call
        });
      });
      local$1().get('channels').get(pub).put({
        enabled: true
      });
      /* Disable private peer discovery, since they're not connecting anyway
      if (chat.onTheir) {
        chat.onTheir('my_peer', (url, k, from) => {
          console.log('Got private peer url', url, 'from', from);
          peers.addPeer({url, from})
        });
      }
       */
    });
  },
  // TODO: should perhaps be in Channel
  processMessage: function processMessage(chatId, msg, info, onClickNotification) {
    var chat = privateState(chatId);
    chat.messageIds = chat.messageIds || {};
    if (chat.messageIds[msg.time + info.from]) return;
    chat.messageIds[msg.time + info.from] = true;
    if (info) {
      msg = Object.assign(msg, info);
    }
    if (msg.invite) {
      var chatLink = "https://iris.to/?channelId=" + msg.invite.group + "&inviter=" + chatId;
      this.newChannel(msg.invite.group, chatLink);
      return;
    }
    msg.selfAuthored = info.selfAuthored;
    local$1().get('channels').get(chatId).get('msgs').get(msg.time + (msg.from && msg.from.slice(0, 10))).put(JSON.stringify(msg));
    msg.timeObj = new Date(msg.time);
    if (!info.selfAuthored && msg.timeObj > chat.myLastSeenTime) {
      if (window.location.hash !== "#/chat/" + chatId || document.visibilityState !== 'visible') {
        notifications.changeChatUnseenCount(chatId, 1);
      } else if (ourActivity === 'active') {
        chat.setMyMsgsLastSeenTime();
      }
    }
    if (!info.selfAuthored && msg.time > chat.theirMsgsLastSeenTime) {
      local$1().get('channels').get(chatId).get('theirMsgsLastSeenTime').put(msg.time);
    }
    if (!chat.latestTime || msg.time > chat.latestTime) {
      local$1().get('channels').get(chatId).put({
        latestTime: msg.time,
        latest: {
          time: msg.time,
          text: msg.text,
          selfAuthored: info.selfAuthored
        }
      });
    }
    // TODO: onclickNotification should do       route(`/chat/${  pub}`);
    notifications.notifyMsg(msg, info, chatId, onClickNotification);
  },
  subscribeToMsgs: function subscribeToMsgs(pub) {
    var _this9 = this;
    var c = privateState(pub);
    if (c.subscribed) {
      return;
    }
    c.subscribed = true;
    c.getMessages(function (msg, info) {
      _this9.processMessage(pub, msg, info);
    });
  },
  /**
   * Known private channels with other users
   */
  channelIds: /*#__PURE__*/new Set()
};

/**
 * Content-addressed storage
 */
var staticState = {
  /**
   * Get a file identified by its hash
   * @param hash
   * @param callback
   * @returns {Promise<unknown>}
   */get: function get(hash, callback) {
    return new Promise(function (resolve, reject) {
      if (!hash) {
        reject('No hash provided');
      }
      if (typeof hash !== 'string') {
        reject('Hash must be a string');
      }
      global$2().get('#').get(hash).on(function (v, _k, _x, e) {
        if (v) {
          e.off();
          callback && callback(v);
          resolve(v);
        }
      });
    });
  },
  /**
   * Store a file and return its hash
   * @param value
   * @returns {Promise<string>}
   */put: function put(value) {
    return _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var hash;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return util.getHash(value);
            case 2:
              hash = _context.sent;
              global$2().get('#').get(hash).put(value);
              return _context.abrupt("return", hash);
            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }))();
  }
};

// eslint-disable-line no-unused-vars
var myKey;
var Key = /*#__PURE__*/function () {
  function Key() {}
  Key.getActiveKey = /*#__PURE__*/function () {
    var _getActiveKey = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(datadir, keyfile, fs) {
      var privKeyFile, f, newKey, str, _newKey;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (datadir === void 0) {
                datadir = ".";
              }
              if (keyfile === void 0) {
                keyfile = "iris.key";
              }
              if (!myKey) {
                _context.next = 4;
                break;
              }
              return _context.abrupt("return", myKey);
            case 4:
              if (!fs) {
                _context.next = 21;
                break;
              }
              privKeyFile = datadir + "/" + keyfile;
              if (!fs.existsSync(privKeyFile)) {
                _context.next = 11;
                break;
              }
              f = fs.readFileSync(privKeyFile, "utf8");
              myKey = Key.fromString(f);
              _context.next = 17;
              break;
            case 11:
              _context.next = 13;
              return Key.generate();
            case 13:
              newKey = _context.sent;
              myKey = myKey || newKey; // eslint-disable-line require-atomic-updates
              fs.writeFileSync(privKeyFile, Key.toString(myKey));
              fs.chmodSync(privKeyFile, 400);
            case 17:
              if (myKey) {
                _context.next = 19;
                break;
              }
              throw new Error("loading default key failed - check " + datadir + "/" + keyfile);
            case 19:
              _context.next = 33;
              break;
            case 21:
              str = window.localStorage.getItem("iris.myKey");
              if (!str) {
                _context.next = 26;
                break;
              }
              myKey = Key.fromString(str);
              _context.next = 31;
              break;
            case 26:
              _context.next = 28;
              return Key.generate();
            case 28:
              _newKey = _context.sent;
              myKey = myKey || _newKey; // eslint-disable-line require-atomic-updates
              window.localStorage.setItem("iris.myKey", Key.toString(myKey));
            case 31:
              if (myKey) {
                _context.next = 33;
                break;
              }
              throw new Error("loading default key failed - check localStorage iris.myKey");
            case 33:
              return _context.abrupt("return", myKey);
            case 34:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
    function getActiveKey(_x, _x2, _x3) {
      return _getActiveKey.apply(this, arguments);
    }
    return getActiveKey;
  }();
  Key.getDefault = function getDefault(datadir, keyfile) {
    if (datadir === void 0) {
      datadir = ".";
    }
    if (keyfile === void 0) {
      keyfile = "iris.key";
    }
    return Key.getActiveKey(datadir, keyfile);
  };
  Key.getActivePub = /*#__PURE__*/function () {
    var _getActivePub = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(datadir, keyfile) {
      var key;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (datadir === void 0) {
                datadir = ".";
              }
              if (keyfile === void 0) {
                keyfile = "iris.key";
              }
              _context2.next = 4;
              return Key.getActiveKey(datadir, keyfile);
            case 4:
              key = _context2.sent;
              return _context2.abrupt("return", key.pub);
            case 6:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    function getActivePub(_x4, _x5) {
      return _getActivePub.apply(this, arguments);
    }
    return getActivePub;
  }();
  Key.setActiveKey = function setActiveKey(key, save, datadir, keyfile, fs) {
    if (save === void 0) {
      save = true;
    }
    if (datadir === void 0) {
      datadir = ".";
    }
    if (keyfile === void 0) {
      keyfile = "iris.key";
    }
    myKey = key;
    if (!save) return;
    if (util.isNode) {
      var privKeyFile = datadir + "/" + keyfile;
      fs.writeFileSync(privKeyFile, Key.toString(myKey));
      fs.chmodSync(privKeyFile, 400);
    } else {
      window.localStorage.setItem("iris.myKey", Key.toString(myKey));
    }
  };
  Key.toString = function toString(key) {
    return JSON.stringify(key);
  };
  Key.getId = function getId(key) {
    if (!(key && key.pub)) {
      throw new Error("missing param");
    }
    return key.pub; // hack until GUN supports lookups by keyID
    //return util.getHash(key.pub);
  };
  Key.fromString = function fromString(str) {
    return JSON.parse(str);
  };
  Key.generate = function generate() {
    return Gun.SEA.pair();
  };
  Key.sign = /*#__PURE__*/function () {
    var _sign = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(msg, pair) {
      var sig;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return Gun.SEA.sign(msg, pair);
            case 2:
              sig = _context3.sent;
              return _context3.abrupt("return", "a" + sig);
            case 4:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));
    function sign(_x6, _x7) {
      return _sign.apply(this, arguments);
    }
    return sign;
  }();
  Key.verify = function verify(msg, pubKey) {
    return Gun.SEA.verify(msg.slice(1), pubKey);
  };
  return Key;
}();

var errorMsg = "Invalid  message:";
var ValidationError = /*#__PURE__*/function (_Error) {
  _inheritsLoose(ValidationError, _Error);
  function ValidationError() {
    return _Error.apply(this, arguments) || this;
  }
  return ValidationError;
}( /*#__PURE__*/_wrapNativeSuper(Error)); /**
                                          * Signed message object. Your friends can index and relay your messages, while others can still verify that they were signed by you.
                                          *
                                          * Fields: signedData, signer (public key) and signature.
                                          *
                                          * signedData has an author, signer, type, time and optionally other fields.
                                          *
                                          * signature covers the utf8 string representation of signedData. Since messages are digitally signed, users only need to care about the message signer and not who relayed it or whose index it was found from.
                                          *
                                          * signer is the entity that verified its origin. In other words: message author and signer can be different entities, and only the signer needs to use Iris.
                                          *
                                          * For example, a crawler can import and sign other people's messages from Twitter. Only the users who trust the crawler will see the messages.
                                          *
                                          * Constructor: creates a message from the param obj.signedData that must contain at least the mandatory fields: author, type and time.
                                          * @param obj
                                          *
                                          * @example
                                          * https://github.com/irislib/iris-lib/blob/master/__tests__/SignedMessage.js
                                          *
                                          * Verification message:
                                          * {
                                          *   signedData: {
                                          *     author: {name:'Alice', key:'ABCD1234'},
                                          *     recipient: {
                                          *       name: 'Bob',
                                          *       email: ['bob@example.com', 'bob.saget@example.com'],
                                          *       bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
                                          *     },
                                          *     type: 'verification'
                                          *   },
                                          *   signer: 'ABCD1234',
                                          *   signature: '1234ABCD'
                                          * }
                                          */
var SignedMessage = /*#__PURE__*/function () {
  function SignedMessage(obj) {
    this.signedData = obj.signedData;
    this.pubKey = obj.pubKey;
    if (obj.sig) {
      if (typeof obj.sig !== "string") {
        throw new ValidationError("SignedMessage signature must be a string");
      }
      this.sig = obj.sig;
      this.getHash();
    }
    this._validate();
  }
  SignedMessage._getArray = function _getArray(authorOrRecipient) {
    var arr = [];
    var keys = Object.keys(authorOrRecipient);
    for (var i = 0; i < keys.length; i++) {
      var type = keys[i];
      var value = authorOrRecipient[keys[i]];
      if (typeof value === "string") {
        arr.push(new Attribute(type, value));
      } else {
        // array
        for (var j = 0; j < value.length; j++) {
          var elementValue = value[j];
          arr.push(new Attribute(type, elementValue));
        }
      }
    }
    return arr;
  };
  SignedMessage._getIterable = function _getIterable(authorOrRecipient) {
    var _ref;
    return _ref = {}, _ref[Symbol.iterator] = /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var keys, i, type, value, j, elementValue;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              keys = Object.keys(authorOrRecipient);
              i = 0;
            case 2:
              if (!(i < keys.length)) {
                _context.next = 21;
                break;
              }
              type = keys[i];
              value = authorOrRecipient[keys[i]];
              if (!(typeof value === "string")) {
                _context.next = 10;
                break;
              }
              _context.next = 8;
              return new Attribute(type, value);
            case 8:
              _context.next = 18;
              break;
            case 10:
              j = 0;
            case 11:
              if (!(j < value.length)) {
                _context.next = 18;
                break;
              }
              elementValue = value[j];
              _context.next = 15;
              return new Attribute(type, elementValue);
            case 15:
              j++;
              _context.next = 11;
              break;
            case 18:
              i++;
              _context.next = 2;
              break;
            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }), _ref;
  };
  var _proto = SignedMessage.prototype;
  _proto.getAuthorIterable = function getAuthorIterable() {
    return SignedMessage._getIterable(this.signedData.author);
  };
  _proto.getRecipientIterable = function getRecipientIterable() {
    return SignedMessage._getIterable(this.signedData.recipient);
  };
  _proto.getAuthorArray = function getAuthorArray() {
    return SignedMessage._getArray(this.signedData.author);
  };
  _proto.getRecipientArray = function getRecipientArray() {
    return this.signedData.recipient ? SignedMessage._getArray(this.signedData.recipient) : [];
  };
  _proto.getSignerKeyID = function getSignerKeyID() {
    return this.pubKey; // hack until gun supports keyID lookups
    //return util.getHash(this.pubKey);
  };
  _proto._validate = function _validate() {
    if (!this.signedData) {
      throw new ValidationError(errorMsg + " Missing signedData");
    }
    if (typeof this.signedData !== "object") {
      throw new ValidationError(errorMsg + " signedData must be an object");
    }
    var d = this.signedData;
    if (!d.type) {
      throw new ValidationError(errorMsg + " Missing type definition");
    }
    if (!d.author) {
      throw new ValidationError(errorMsg + " Missing author");
    }
    if (typeof d.author !== "object") {
      throw new ValidationError(errorMsg + " Author must be object");
    }
    if (Array.isArray(d.author)) {
      throw new ValidationError(errorMsg + " Author must not be an array");
    }
    if (Object.keys(d.author).length === 0) {
      throw new ValidationError(errorMsg + " Author empty");
    }
    if (this.pubKey) {
      this.signerKeyHash = this.getSignerKeyID();
    }
    for (var attr in d.author) {
      var t = typeof d.author[attr];
      if (t !== "string") {
        if (Array.isArray(d.author[attr])) {
          for (var i = 0; i < d.author[attr].length; i++) {
            if (typeof d.author[attr][i] !== "string") {
              throw new ValidationError(errorMsg + " Author attribute must be string, got " + attr + ": [" + d.author[attr][i] + "]");
            }
            if (d.author[attr][i].length === 0) {
              throw new ValidationError(errorMsg + " author " + attr + " in array[" + i + "] is empty");
            }
          }
        } else {
          throw new ValidationError(errorMsg + " Author attribute must be string or array, got " + attr + ": " + d.author[attr]);
        }
      }
      if (attr === "keyID") {
        if (t !== "string") {
          throw new ValidationError(errorMsg + " Author keyID must be string, got " + t);
        }
        if (this.signerKeyHash && d.author[attr] !== this.signerKeyHash) {
          throw new ValidationError(errorMsg + " If message has a keyID author, it must be signed by the same key");
        }
      }
    }
    if (d.recipient) {
      if (typeof d.recipient !== "object") {
        throw new ValidationError(errorMsg + " Recipient must be object");
      }
      if (Array.isArray(d.recipient)) {
        throw new ValidationError(errorMsg + " Recipient must not be an array");
      }
      if (Object.keys(d.recipient).length === 0) {
        throw new ValidationError(errorMsg + " Recipient empty");
      }
      for (var _attr in d.recipient) {
        var _t = typeof d.recipient[_attr];
        if (_t !== "string") {
          if (Array.isArray(d.recipient[_attr])) {
            for (var _i = 0; _i < d.recipient[_attr].length; _i++) {
              if (typeof d.recipient[_attr][_i] !== "string") {
                throw new ValidationError(errorMsg + " Recipient attribute must be string, got " + _attr + ": [" + d.recipient[_attr][_i] + "]");
              }
              if (d.recipient[_attr][_i].length === 0) {
                throw new ValidationError(errorMsg + " recipient " + _attr + " in array[" + _i + "] is empty");
              }
            }
          } else {
            throw new ValidationError(errorMsg + " Recipient attribute must be string or array, got " + _attr + ": " + d.recipient[_attr]);
          }
        }
      }
    }
    if (!(d.time || d.timestamp)) {
      throw new ValidationError(errorMsg + " Missing time field");
    }
    if (!Date.parse(d.time || d.timestamp)) {
      throw new ValidationError(errorMsg + " Invalid time field");
    }
    if (d.type === "rating") {
      if (isNaN(d.rating)) {
        throw new ValidationError(errorMsg + " Invalid rating");
      }
      if (isNaN(d.maxRating)) {
        throw new ValidationError(errorMsg + " Invalid maxRating");
      }
      if (isNaN(d.minRating)) {
        throw new ValidationError(errorMsg + " Invalid minRating");
      }
      if (d.rating > d.maxRating) {
        throw new ValidationError(errorMsg + " Rating is above maxRating");
      }
      if (d.rating < d.minRating) {
        throw new ValidationError(errorMsg + " Rating is below minRating");
      }
      if (typeof d.context !== "string" || !d.context.length) {
        throw new ValidationError(errorMsg + " Rating messages must have a context field");
      }
    }
    if (d.type === "verification" || d.type === "unverification") {
      if (d.recipient.length < 2) {
        throw new ValidationError(errorMsg + " At least 2 recipient attributes are needed for a connection / disconnection. Got: " + d.recipient);
      }
    }
    return true;
  };
  _proto.isPositive = function isPositive() {
    return this.signedData.type === "rating" && this.signedData.rating > (this.signedData.maxRating + this.signedData.minRating) / 2;
  };
  _proto.isNegative = function isNegative() {
    return this.signedData.type === "rating" && this.signedData.rating < (this.signedData.maxRating + this.signedData.minRating) / 2;
  };
  _proto.isNeutral = function isNeutral() {
    return this.signedData.type === "rating" && this.signedData.rating === (this.signedData.maxRating + this.signedData.minRating) / 2;
  }
  /**
  * @param {Object} key Gun.SEA keypair to sign the message with
  */;
  _proto.sign =
  /*#__PURE__*/
  function () {
    var _sign = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(key) {
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return Key.sign(this.signedData, key);
            case 2:
              this.sig = _context2.sent;
              this.pubKey = key.pub;
              _context2.next = 6;
              return this.getHash();
            case 6:
              return _context2.abrupt("return", true);
            case 7:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this);
    }));
    function sign(_x) {
      return _sign.apply(this, arguments);
    }
    return sign;
  }() /**
      * Create an iris message. SignedMessage time is automatically set. If signingKey is specified and author omitted, signingKey will be used as author.
      * @param {Object} signedData message data object including author, recipient and other possible attributes
      * @param {Object} signingKey optionally, you can set the key to sign the message with
      * @returns {Promise<SignedMessage>}  message
      */;
  SignedMessage.create =
  /*#__PURE__*/
  function () {
    var _create = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(signedData, signingKey) {
      var m;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!signedData.author && signingKey) {
                signedData.author = {
                  keyID: Key.getId(signingKey)
                };
              }
              signedData.time = signedData.time || new Date().toISOString();
              m = new SignedMessage({
                signedData: signedData
              });
              if (!signingKey) {
                _context3.next = 6;
                break;
              }
              _context3.next = 6;
              return m.sign(signingKey);
            case 6:
              return _context3.abrupt("return", m);
            case 7:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3);
    }));
    function create(_x2, _x3) {
      return _create.apply(this, arguments);
    }
    return create;
  }();
  SignedMessage.createVerification = function createVerification(signedData, signingKey) {
    signedData.type = "verification";
    return SignedMessage.create(signedData, signingKey);
  };
  SignedMessage.createRating = function createRating(signedData, signingKey) {
    signedData.type = "rating";
    signedData.context = signedData.context || "iris";
    signedData.maxRating = signedData.maxRating || 10;
    signedData.minRating = signedData.minRating || -10;
    return SignedMessage.create(signedData, signingKey);
  };
  _proto.getAuthor = function getAuthor(index) {
    for (var _iterator = _createForOfIteratorHelperLoose(this.getAuthorIterable()), _step; !(_step = _iterator()).done;) {
      var a = _step.value;
      if (a.isUniqueType()) {
        return index.getContacts(a);
      }
    }
  };
  _proto.getRecipient = function getRecipient(index) {
    if (!this.signedData.recipient) {
      return undefined;
    }
    for (var _iterator2 = _createForOfIteratorHelperLoose(this.getRecipientIterable()), _step2; !(_step2 = _iterator2()).done;) {
      var a = _step2.value;
      if (a.isUniqueType()) {
        return index.getContacts(a);
      }
    }
  }
  /**
  * @returns {string} base64 sha256 hash of message
  */;
  _proto.getHash =
  /*#__PURE__*/
  function () {
    var _getHash = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
      return _regeneratorRuntime().wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              if (!(this.sig && !this.hash)) {
                _context4.next = 4;
                break;
              }
              _context4.next = 3;
              return util.getHash(this.sig);
            case 3:
              this.hash = _context4.sent;
            case 4:
              return _context4.abrupt("return", this.hash);
            case 5:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));
    function getHash() {
      return _getHash.apply(this, arguments);
    }
    return getHash;
  }();
  _proto.getId = function getId() {
    return this.getHash();
  };
  SignedMessage.fromSig = /*#__PURE__*/function () {
    var _fromSig = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(obj) {
      var signedData, o;
      return _regeneratorRuntime().wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (obj.sig) {
                _context5.next = 2;
                break;
              }
              throw new Error("Missing signature in object:", obj);
            case 2:
              if (obj.pubKey) {
                _context5.next = 4;
                break;
              }
              throw new Error("Missing pubKey in object:");
            case 4:
              //const signedData = await Key.verify(obj.sig, obj.pubKey); // disable sig verification while migrating to new gun :(
              signedData = JSON.parse(obj.sig.slice(4)).m;
              o = {
                signedData: signedData,
                sig: obj.sig,
                pubKey: obj.pubKey
              };
              return _context5.abrupt("return", new SignedMessage(o));
            case 7:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));
    function fromSig(_x4) {
      return _fromSig.apply(this, arguments);
    }
    return fromSig;
  }() /**
      * @return {boolean} true if message signature is valid. Otherwise throws ValidationError.
      */;
  _proto.verify =
  /*#__PURE__*/
  function () {
    var _verify = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
      return _regeneratorRuntime().wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              if (this.pubKey) {
                _context6.next = 2;
                break;
              }
              throw new ValidationError(errorMsg + " SignedMessage has no .pubKey");
            case 2:
              if (this.sig) {
                _context6.next = 4;
                break;
              }
              throw new ValidationError(errorMsg + " SignedMessage has no .sig");
            case 4:
              _context6.next = 6;
              return Key.verify(this.sig, this.pubKey);
            case 6:
              this.signedData = _context6.sent;
              if (this.signedData) {
                _context6.next = 9;
                break;
              }
              throw new ValidationError(errorMsg + " Invalid signature");
            case 9:
              if (!this.hash) {
                _context6.next = 18;
                break;
              }
              _context6.t0 = this.hash;
              _context6.next = 13;
              return util.getHash(this.sig);
            case 13:
              _context6.t1 = _context6.sent;
              if (!(_context6.t0 !== _context6.t1)) {
                _context6.next = 16;
                break;
              }
              throw new ValidationError(errorMsg + " Invalid message hash");
            case 16:
              _context6.next = 19;
              break;
            case 18:
              this.getHash();
            case 19:
              return _context6.abrupt("return", true);
            case 20:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));
    function verify() {
      return _verify.apply(this, arguments);
    }
    return verify;
  }() /**
      * @returns {string}
      */;
  _proto.serialize = function serialize() {
    return {
      sig: this.sig,
      pubKey: this.pubKey
    };
  };
  _proto.toString = function toString() {
    return JSON.stringify(this.serialize());
  }
  /**
  * @returns {Promise<SignedMessage>}
  */;
  SignedMessage.deserialize =
  /*#__PURE__*/
  function () {
    var _deserialize = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(s) {
      return _regeneratorRuntime().wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt("return", SignedMessage.fromSig(s));
            case 1:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    }));
    function deserialize(_x5) {
      return _deserialize.apply(this, arguments);
    }
    return deserialize;
  }();
  SignedMessage.fromString = /*#__PURE__*/function () {
    var _fromString = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(s) {
      return _regeneratorRuntime().wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              return _context8.abrupt("return", SignedMessage.fromSig(JSON.parse(s)));
            case 1:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8);
    }));
    function fromString(_x6) {
      return _fromString.apply(this, arguments);
    }
    return fromString;
  }();
  SignedMessage.setReaction = /*#__PURE__*/function () {
    var _setReaction = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9(gun, msg, reaction) {
      var hash;
      return _regeneratorRuntime().wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return msg.getHash();
            case 2:
              hash = _context9.sent;
              gun.get("reactions").get(hash).put(reaction);
              gun.get("reactions").get(hash).put(reaction);
              gun.get("messagesByHash").get(hash).get("reactions").get(this.rootContact.value).put(reaction);
              gun.get("messagesByHash").get(hash).get("reactions").get(this.rootContact.value).put(reaction);
            case 7:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));
    function setReaction(_x7, _x8, _x9) {
      return _setReaction.apply(this, arguments);
    }
    return setReaction;
  }();
  return SignedMessage;
}();

/*eslint no-useless-escape: "off", camelcase: "off" */
var index = {
  local: local$1,
  global: global$2,
  group: group,
  "public": publicState,
  "private": privateState,
  "static": staticState,
  electron: electron,
  peers: peers,
  session: session,
  util: util,
  notifications: notifications,
  SEA: Gun.SEA,
  Gun: Gun,
  SignedMessage: SignedMessage,
  Channel: Channel,
  Node: Node
};

export default index;
//# sourceMappingURL=iris.esm.js.map
