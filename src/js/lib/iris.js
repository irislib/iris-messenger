(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('gun')) :
	typeof define === 'function' && define.amd ? define(['gun'], factory) :
	(global.iris = factory(global.Gun));
}(this, (function (Gun) { 'use strict';

	Gun = Gun && Gun.hasOwnProperty('default') ? Gun['default'] : Gun;

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	// 7.2.1 RequireObjectCoercible(argument)
	var _defined = function (it) {
	  if (it == undefined) throw TypeError("Can't call method on  " + it);
	  return it;
	};

	// 7.1.13 ToObject(argument)

	var _toObject = function (it) {
	  return Object(_defined(it));
	};

	var hasOwnProperty = {}.hasOwnProperty;
	var _has = function (it, key) {
	  return hasOwnProperty.call(it, key);
	};

	var toString = {}.toString;

	var _cof = function (it) {
	  return toString.call(it).slice(8, -1);
	};

	// fallback for non-array-like ES3 and non-enumerable old V8 strings

	// eslint-disable-next-line no-prototype-builtins
	var _iobject = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
	  return _cof(it) == 'String' ? it.split('') : Object(it);
	};

	// to indexed object, toObject with fallback for non-array-like ES3 strings


	var _toIobject = function (it) {
	  return _iobject(_defined(it));
	};

	// 7.1.4 ToInteger
	var ceil = Math.ceil;
	var floor = Math.floor;
	var _toInteger = function (it) {
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

	// 7.1.15 ToLength

	var min = Math.min;
	var _toLength = function (it) {
	  return it > 0 ? min(_toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

	var max = Math.max;
	var min$1 = Math.min;
	var _toAbsoluteIndex = function (index, length) {
	  index = _toInteger(index);
	  return index < 0 ? max(index + length, 0) : min$1(index, length);
	};

	// false -> Array#indexOf
	// true  -> Array#includes



	var _arrayIncludes = function (IS_INCLUDES) {
	  return function ($this, el, fromIndex) {
	    var O = _toIobject($this);
	    var length = _toLength(O.length);
	    var index = _toAbsoluteIndex(fromIndex, length);
	    var value;
	    // Array#includes uses SameValueZero equality algorithm
	    // eslint-disable-next-line no-self-compare
	    if (IS_INCLUDES && el != el) while (length > index) {
	      value = O[index++];
	      // eslint-disable-next-line no-self-compare
	      if (value != value) return true;
	    // Array#indexOf ignores holes, Array#includes - not
	    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
	      if (O[index] === el) return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

	var _core = createCommonjsModule(function (module) {
	var core = module.exports = { version: '2.6.11' };
	if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef
	});
	var _core_1 = _core.version;

	var _global = createCommonjsModule(function (module) {
	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self
	  // eslint-disable-next-line no-new-func
	  : Function('return this')();
	if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef
	});

	var _library = true;

	var _shared = createCommonjsModule(function (module) {
	var SHARED = '__core-js_shared__';
	var store = _global[SHARED] || (_global[SHARED] = {});

	(module.exports = function (key, value) {
	  return store[key] || (store[key] = value !== undefined ? value : {});
	})('versions', []).push({
	  version: _core.version,
	  mode: 'pure',
	  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
	});
	});

	var id = 0;
	var px = Math.random();
	var _uid = function (key) {
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

	var shared = _shared('keys');

	var _sharedKey = function (key) {
	  return shared[key] || (shared[key] = _uid(key));
	};

	var arrayIndexOf = _arrayIncludes(false);
	var IE_PROTO = _sharedKey('IE_PROTO');

	var _objectKeysInternal = function (object, names) {
	  var O = _toIobject(object);
	  var i = 0;
	  var result = [];
	  var key;
	  for (key in O) if (key != IE_PROTO) _has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while (names.length > i) if (_has(O, key = names[i++])) {
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};

	// IE 8- don't enum bug keys
	var _enumBugKeys = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)



	var _objectKeys = Object.keys || function keys(O) {
	  return _objectKeysInternal(O, _enumBugKeys);
	};

	var _aFunction = function (it) {
	  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
	  return it;
	};

	// optional / simple context binding

	var _ctx = function (fn, that, length) {
	  _aFunction(fn);
	  if (that === undefined) return fn;
	  switch (length) {
	    case 1: return function (a) {
	      return fn.call(that, a);
	    };
	    case 2: return function (a, b) {
	      return fn.call(that, a, b);
	    };
	    case 3: return function (a, b, c) {
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function (/* ...args */) {
	    return fn.apply(that, arguments);
	  };
	};

	var _isObject = function (it) {
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

	var _anObject = function (it) {
	  if (!_isObject(it)) throw TypeError(it + ' is not an object!');
	  return it;
	};

	var _fails = function (exec) {
	  try {
	    return !!exec();
	  } catch (e) {
	    return true;
	  }
	};

	// Thank's IE8 for his funny defineProperty
	var _descriptors = !_fails(function () {
	  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
	});

	var document$1 = _global.document;
	// typeof document.createElement is 'object' in old IE
	var is = _isObject(document$1) && _isObject(document$1.createElement);
	var _domCreate = function (it) {
	  return is ? document$1.createElement(it) : {};
	};

	var _ie8DomDefine = !_descriptors && !_fails(function () {
	  return Object.defineProperty(_domCreate('div'), 'a', { get: function () { return 7; } }).a != 7;
	});

	// 7.1.1 ToPrimitive(input [, PreferredType])

	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	var _toPrimitive = function (it, S) {
	  if (!_isObject(it)) return it;
	  var fn, val;
	  if (S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (typeof (fn = it.valueOf) == 'function' && !_isObject(val = fn.call(it))) return val;
	  if (!S && typeof (fn = it.toString) == 'function' && !_isObject(val = fn.call(it))) return val;
	  throw TypeError("Can't convert object to primitive value");
	};

	var dP = Object.defineProperty;

	var f = _descriptors ? Object.defineProperty : function defineProperty(O, P, Attributes) {
	  _anObject(O);
	  P = _toPrimitive(P, true);
	  _anObject(Attributes);
	  if (_ie8DomDefine) try {
	    return dP(O, P, Attributes);
	  } catch (e) { /* empty */ }
	  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
	  if ('value' in Attributes) O[P] = Attributes.value;
	  return O;
	};

	var _objectDp = {
		f: f
	};

	var _propertyDesc = function (bitmap, value) {
	  return {
	    enumerable: !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable: !(bitmap & 4),
	    value: value
	  };
	};

	var _hide = _descriptors ? function (object, key, value) {
	  return _objectDp.f(object, key, _propertyDesc(1, value));
	} : function (object, key, value) {
	  object[key] = value;
	  return object;
	};

	var PROTOTYPE = 'prototype';

	var $export = function (type, name, source) {
	  var IS_FORCED = type & $export.F;
	  var IS_GLOBAL = type & $export.G;
	  var IS_STATIC = type & $export.S;
	  var IS_PROTO = type & $export.P;
	  var IS_BIND = type & $export.B;
	  var IS_WRAP = type & $export.W;
	  var exports = IS_GLOBAL ? _core : _core[name] || (_core[name] = {});
	  var expProto = exports[PROTOTYPE];
	  var target = IS_GLOBAL ? _global : IS_STATIC ? _global[name] : (_global[name] || {})[PROTOTYPE];
	  var key, own, out;
	  if (IS_GLOBAL) source = name;
	  for (key in source) {
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if (own && _has(exports, key)) continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? _ctx(out, _global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function (C) {
	      var F = function (a, b, c) {
	        if (this instanceof C) {
	          switch (arguments.length) {
	            case 0: return new C();
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? _ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if (IS_PROTO) {
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if (type & $export.R && expProto && !expProto[key]) _hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library`
	var _export = $export;

	// most Object methods by ES6 should accept primitives



	var _objectSap = function (KEY, exec) {
	  var fn = (_core.Object || {})[KEY] || Object[KEY];
	  var exp = {};
	  exp[KEY] = exec(fn);
	  _export(_export.S + _export.F * _fails(function () { fn(1); }), 'Object', exp);
	};

	// 19.1.2.14 Object.keys(O)



	_objectSap('keys', function () {
	  return function keys(it) {
	    return _objectKeys(_toObject(it));
	  };
	});

	var keys = _core.Object.keys;

	var keys$1 = createCommonjsModule(function (module) {
	module.exports = { "default": keys, __esModule: true };
	});

	var _Object$keys = unwrapExports(keys$1);

	var classCallCheck = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;

	exports.default = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};
	});

	var _classCallCheck = unwrapExports(classCallCheck);

	// eslint-disable-line no-unused-vars

	/**
	* Gun object collection that provides tools for indexing and search. Decentralize everything!
	*
	* If opt.class is passed, object.serialize() and opt.class.deserialize() must be defined.
	*
	* Supports search from multiple indexes.
	* For example, retrieve message feed from your own index and your friends' indexes.
	*
	* TODO: aggregation
	* TODO: example
	* TODO: scrollable and stretchable "search result window"
	* @param {Object} opt {gun, class, indexes = [], askPeers = true, name = class.name}
	*/

	var Collection = function () {
	  function Collection() {
	    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    _classCallCheck(this, Collection);

	    if (!opt.gun) {
	      throw new Error('Missing opt.gun');
	    }
	    if (!(opt.class || opt.name)) {
	      throw new Error('You must supply either opt.name or opt.class');
	    }
	    this.class = opt.class;
	    this.serializer = opt.serializer;
	    if (this.class && !this.class.deserialize && !this.serializer) {
	      throw new Error('opt.class must have deserialize() method or opt.serializer must be defined');
	    }
	    this.name = opt.name || opt.class.name;
	    this.gun = opt.gun;
	    this.indexes = opt.indexes || [];
	    this.indexer = opt.indexer;
	    this.askPeers = typeof opt.askPeers === 'undefined' ? true : opt.askPeers;
	  }

	  /**
	  * @return {String} id of added object, which can be used for collection.get(id)
	  */


	  Collection.prototype.put = function put(object) {
	    var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    var data = object;
	    if (this.serializer) {
	      data = this.serializer.serialize(object);
	    }if (this.class) {
	      data = object.serialize();
	    }
	    // TODO: optionally use gun hash table
	    var node = void 0;
	    if (opt.id || data.id) {
	      node = this.gun.get(this.name).get('id').get(opt.id || data.id).put(data); // TODO: use .top()
	    } else if (object.getId) {
	      node = this.gun.get(this.name).get('id').get(object.getId()).put(data);
	    } else {
	      node = this.gun.get(this.name).get('id').set(data);
	    }
	    this._addToIndexes(data, node);
	    return data.id || Gun.node.soul(node) || node._.link;
	  };

	  Collection.prototype._addToIndexes = async function _addToIndexes(serializedObject, node) {
	    var _this = this;

	    if (Gun.node.is(serializedObject)) {
	      serializedObject = await serializedObject.open();
	    }
	    var addToIndex = function addToIndex(indexName, indexKey) {
	      _this.gun.get(_this.name).get(indexName).get(indexKey).put(node);
	    };
	    if (this.indexer) {
	      var customIndexes = await this.indexer(serializedObject);
	      var customIndexKeys = _Object$keys(customIndexes);
	      for (var i = 0; i < customIndexKeys; i++) {
	        var key = customIndexKeys[i];
	        addToIndex(key, customIndexes[key]);
	      }
	    }
	    for (var _i = 0; _i < this.indexes.length; _i++) {
	      var indexName = this.indexes[_i];
	      if (Object.prototype.hasOwnProperty.call(serializedObject, indexName)) {
	        addToIndex(indexName, serializedObject[indexName]);
	      }
	    }
	  };

	  // TODO: method for terminating the query
	  // TODO: query ttl. https://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html
	  /**
	  * @param {Object} opt {callback, id, selector, limit, orderBy}
	  */


	  Collection.prototype.get = function get() {
	    var _this2 = this;

	    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    if (!opt.callback) {
	      return;
	    }
	    var results = 0;
	    var matcher = function matcher(data, id, node) {
	      if (!data) {
	        return;
	      }
	      if (opt.limit && results++ >= opt.limit) {
	        return; // TODO: terminate query
	      }
	      if (opt.selector) {
	        // TODO: deep compare selector object?
	        var keys = _Object$keys(opt.selector);
	        for (var i = 0; i < keys.length; i++) {
	          var key = keys[i];
	          if (!Object.prototype.hasOwnProperty.call(data, key)) {
	            return;
	          }
	          var v1 = void 0,
	              v2 = void 0;
	          if (opt.caseSensitive === false) {
	            v1 = data[key].toLowerCase();
	            v2 = opt.selector[key].toLowerCase();
	          } else {
	            v1 = data[key];
	            v2 = opt.selector[key];
	          }
	          if (v1 !== v2) {
	            return;
	          }
	        }
	      }
	      if (opt.query) {
	        // TODO: use gun.get() lt / gt operators
	        var _keys = _Object$keys(opt.query);
	        for (var _i2 = 0; _i2 < _keys.length; _i2++) {
	          var _key = _keys[_i2];
	          if (!Object.prototype.hasOwnProperty.call(data, _key)) {
	            return;
	          }
	          var _v = void 0,
	              _v2 = void 0;
	          if (opt.caseSensitive === false) {
	            _v = data[_key].toLowerCase();
	            _v2 = opt.query[_key].toLowerCase();
	          } else {
	            _v = data[_key];
	            _v2 = opt.query[_key];
	          }
	          if (_v.indexOf(_v2) !== 0) {
	            return;
	          }
	        }
	      }
	      if (_this2.serializer) {
	        opt.callback(_this2.serializer.deserialize(data, { id: id, gun: node.$ }));
	      } else if (_this2.class) {
	        opt.callback(_this2.class.deserialize(data, { id: id, gun: node.$ }));
	      } else {
	        opt.callback(data);
	      }
	    };

	    if (opt.id) {
	      opt.limit = 1;
	      this.gun.get(this.name).get('id').get(opt.id).on(matcher);
	      return;
	    }

	    var indexName = 'id';
	    if (opt.orderBy && this.indexes.indexOf(opt.orderBy) > -1) {
	      indexName = opt.orderBy;
	    }

	    // TODO: query from indexes
	    this.gun.get(this.name).get(indexName).map().on(matcher); // TODO: limit .open recursion
	    if (this.askPeers) {
	      this.gun.get('trustedIndexes').on(function (val, key) {
	        _this2.gun.user(key).get(_this2.name).get(indexName).map().on(matcher);
	      });
	    }
	  };

	  Collection.prototype.delete = function _delete() {
	    // gun.unset()
	  };

	  return Collection;
	}();

	var $JSON = _core.JSON || (_core.JSON = { stringify: JSON.stringify });
	var stringify = function stringify(it) { // eslint-disable-line no-unused-vars
	  return $JSON.stringify.apply($JSON, arguments);
	};

	var stringify$1 = createCommonjsModule(function (module) {
	module.exports = { "default": stringify, __esModule: true };
	});

	var _JSON$stringify = unwrapExports(stringify$1);

	// true  -> String#at
	// false -> String#codePointAt
	var _stringAt = function (TO_STRING) {
	  return function (that, pos) {
	    var s = String(_defined(that));
	    var i = _toInteger(pos);
	    var l = s.length;
	    var a, b;
	    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

	var _redefine = _hide;

	var _iterators = {};

	var _objectDps = _descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
	  _anObject(O);
	  var keys = _objectKeys(Properties);
	  var length = keys.length;
	  var i = 0;
	  var P;
	  while (length > i) _objectDp.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

	var document$2 = _global.document;
	var _html = document$2 && document$2.documentElement;

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])



	var IE_PROTO$1 = _sharedKey('IE_PROTO');
	var Empty = function () { /* empty */ };
	var PROTOTYPE$1 = 'prototype';

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function () {
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = _domCreate('iframe');
	  var i = _enumBugKeys.length;
	  var lt = '<';
	  var gt = '>';
	  var iframeDocument;
	  iframe.style.display = 'none';
	  _html.appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while (i--) delete createDict[PROTOTYPE$1][_enumBugKeys[i]];
	  return createDict();
	};

	var _objectCreate = Object.create || function create(O, Properties) {
	  var result;
	  if (O !== null) {
	    Empty[PROTOTYPE$1] = _anObject(O);
	    result = new Empty();
	    Empty[PROTOTYPE$1] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO$1] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : _objectDps(result, Properties);
	};

	var _wks = createCommonjsModule(function (module) {
	var store = _shared('wks');

	var Symbol = _global.Symbol;
	var USE_SYMBOL = typeof Symbol == 'function';

	var $exports = module.exports = function (name) {
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : _uid)('Symbol.' + name));
	};

	$exports.store = store;
	});

	var def = _objectDp.f;

	var TAG = _wks('toStringTag');

	var _setToStringTag = function (it, tag, stat) {
	  if (it && !_has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
	};

	var IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	_hide(IteratorPrototype, _wks('iterator'), function () { return this; });

	var _iterCreate = function (Constructor, NAME, next) {
	  Constructor.prototype = _objectCreate(IteratorPrototype, { next: _propertyDesc(1, next) });
	  _setToStringTag(Constructor, NAME + ' Iterator');
	};

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)


	var IE_PROTO$2 = _sharedKey('IE_PROTO');
	var ObjectProto = Object.prototype;

	var _objectGpo = Object.getPrototypeOf || function (O) {
	  O = _toObject(O);
	  if (_has(O, IE_PROTO$2)) return O[IE_PROTO$2];
	  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

	var ITERATOR = _wks('iterator');
	var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
	var FF_ITERATOR = '@@iterator';
	var KEYS = 'keys';
	var VALUES = 'values';

	var returnThis = function () { return this; };

	var _iterDefine = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
	  _iterCreate(Constructor, NAME, next);
	  var getMethod = function (kind) {
	    if (!BUGGY && kind in proto) return proto[kind];
	    switch (kind) {
	      case KEYS: return function keys() { return new Constructor(this, kind); };
	      case VALUES: return function values() { return new Constructor(this, kind); };
	    } return function entries() { return new Constructor(this, kind); };
	  };
	  var TAG = NAME + ' Iterator';
	  var DEF_VALUES = DEFAULT == VALUES;
	  var VALUES_BUG = false;
	  var proto = Base.prototype;
	  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
	  var $default = $native || getMethod(DEFAULT);
	  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
	  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
	  var methods, key, IteratorPrototype;
	  // Fix native
	  if ($anyNative) {
	    IteratorPrototype = _objectGpo($anyNative.call(new Base()));
	    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
	      // Set @@toStringTag to native iterators
	      _setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if (!_library && typeof IteratorPrototype[ITERATOR] != 'function') _hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if (DEF_VALUES && $native && $native.name !== VALUES) {
	    VALUES_BUG = true;
	    $default = function values() { return $native.call(this); };
	  }
	  // Define iterator
	  if ((!_library || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
	    _hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  _iterators[NAME] = $default;
	  _iterators[TAG] = returnThis;
	  if (DEFAULT) {
	    methods = {
	      values: DEF_VALUES ? $default : getMethod(VALUES),
	      keys: IS_SET ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if (FORCED) for (key in methods) {
	      if (!(key in proto)) _redefine(proto, key, methods[key]);
	    } else _export(_export.P + _export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

	var $at = _stringAt(true);

	// 21.1.3.27 String.prototype[@@iterator]()
	_iterDefine(String, 'String', function (iterated) {
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var index = this._i;
	  var point;
	  if (index >= O.length) return { value: undefined, done: true };
	  point = $at(O, index);
	  this._i += point.length;
	  return { value: point, done: false };
	});

	var _iterStep = function (done, value) {
	  return { value: value, done: !!done };
	};

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	var es6_array_iterator = _iterDefine(Array, 'Array', function (iterated, kind) {
	  this._t = _toIobject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function () {
	  var O = this._t;
	  var kind = this._k;
	  var index = this._i++;
	  if (!O || index >= O.length) {
	    this._t = undefined;
	    return _iterStep(1);
	  }
	  if (kind == 'keys') return _iterStep(0, index);
	  if (kind == 'values') return _iterStep(0, O[index]);
	  return _iterStep(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	_iterators.Arguments = _iterators.Array;

	var TO_STRING_TAG = _wks('toStringTag');

	var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
	  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
	  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
	  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
	  'TextTrackList,TouchList').split(',');

	for (var i = 0; i < DOMIterables.length; i++) {
	  var NAME = DOMIterables[i];
	  var Collection$1 = _global[NAME];
	  var proto = Collection$1 && Collection$1.prototype;
	  if (proto && !proto[TO_STRING_TAG]) _hide(proto, TO_STRING_TAG, NAME);
	  _iterators[NAME] = _iterators.Array;
	}

	// getting tag from 19.1.3.6 Object.prototype.toString()

	var TAG$1 = _wks('toStringTag');
	// ES3 wrong here
	var ARG = _cof(function () { return arguments; }()) == 'Arguments';

	// fallback for IE11 Script Access Denied error
	var tryGet = function (it, key) {
	  try {
	    return it[key];
	  } catch (e) { /* empty */ }
	};

	var _classof = function (it) {
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG$1)) == 'string' ? T
	    // builtinTag case
	    : ARG ? _cof(O)
	    // ES3 arguments fallback
	    : (B = _cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

	var _anInstance = function (it, Constructor, name, forbiddenField) {
	  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
	    throw TypeError(name + ': incorrect invocation!');
	  } return it;
	};

	// call something on iterator step with safe closing on error

	var _iterCall = function (iterator, fn, value, entries) {
	  try {
	    return entries ? fn(_anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch (e) {
	    var ret = iterator['return'];
	    if (ret !== undefined) _anObject(ret.call(iterator));
	    throw e;
	  }
	};

	// check on default Array iterator

	var ITERATOR$1 = _wks('iterator');
	var ArrayProto = Array.prototype;

	var _isArrayIter = function (it) {
	  return it !== undefined && (_iterators.Array === it || ArrayProto[ITERATOR$1] === it);
	};

	var ITERATOR$2 = _wks('iterator');

	var core_getIteratorMethod = _core.getIteratorMethod = function (it) {
	  if (it != undefined) return it[ITERATOR$2]
	    || it['@@iterator']
	    || _iterators[_classof(it)];
	};

	var _forOf = createCommonjsModule(function (module) {
	var BREAK = {};
	var RETURN = {};
	var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
	  var iterFn = ITERATOR ? function () { return iterable; } : core_getIteratorMethod(iterable);
	  var f = _ctx(fn, that, entries ? 2 : 1);
	  var index = 0;
	  var length, step, iterator, result;
	  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if (_isArrayIter(iterFn)) for (length = _toLength(iterable.length); length > index; index++) {
	    result = entries ? f(_anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	    if (result === BREAK || result === RETURN) return result;
	  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
	    result = _iterCall(iterator, f, step.value, entries);
	    if (result === BREAK || result === RETURN) return result;
	  }
	};
	exports.BREAK = BREAK;
	exports.RETURN = RETURN;
	});

	// 7.3.20 SpeciesConstructor(O, defaultConstructor)


	var SPECIES = _wks('species');
	var _speciesConstructor = function (O, D) {
	  var C = _anObject(O).constructor;
	  var S;
	  return C === undefined || (S = _anObject(C)[SPECIES]) == undefined ? D : _aFunction(S);
	};

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	var _invoke = function (fn, args, that) {
	  var un = that === undefined;
	  switch (args.length) {
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return fn.apply(that, args);
	};

	var process = _global.process;
	var setTask = _global.setImmediate;
	var clearTask = _global.clearImmediate;
	var MessageChannel = _global.MessageChannel;
	var Dispatch = _global.Dispatch;
	var counter = 0;
	var queue = {};
	var ONREADYSTATECHANGE = 'onreadystatechange';
	var defer, channel, port;
	var run = function () {
	  var id = +this;
	  // eslint-disable-next-line no-prototype-builtins
	  if (queue.hasOwnProperty(id)) {
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listener = function (event) {
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if (!setTask || !clearTask) {
	  setTask = function setImmediate(fn) {
	    var args = [];
	    var i = 1;
	    while (arguments.length > i) args.push(arguments[i++]);
	    queue[++counter] = function () {
	      // eslint-disable-next-line no-new-func
	      _invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id) {
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if (_cof(process) == 'process') {
	    defer = function (id) {
	      process.nextTick(_ctx(run, id, 1));
	    };
	  // Sphere (JS game engine) Dispatch API
	  } else if (Dispatch && Dispatch.now) {
	    defer = function (id) {
	      Dispatch.now(_ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if (MessageChannel) {
	    channel = new MessageChannel();
	    port = channel.port2;
	    channel.port1.onmessage = listener;
	    defer = _ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if (_global.addEventListener && typeof postMessage == 'function' && !_global.importScripts) {
	    defer = function (id) {
	      _global.postMessage(id + '', '*');
	    };
	    _global.addEventListener('message', listener, false);
	  // IE8-
	  } else if (ONREADYSTATECHANGE in _domCreate('script')) {
	    defer = function (id) {
	      _html.appendChild(_domCreate('script'))[ONREADYSTATECHANGE] = function () {
	        _html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function (id) {
	      setTimeout(_ctx(run, id, 1), 0);
	    };
	  }
	}
	var _task = {
	  set: setTask,
	  clear: clearTask
	};

	var macrotask = _task.set;
	var Observer = _global.MutationObserver || _global.WebKitMutationObserver;
	var process$1 = _global.process;
	var Promise$1 = _global.Promise;
	var isNode = _cof(process$1) == 'process';

	var _microtask = function () {
	  var head, last, notify;

	  var flush = function () {
	    var parent, fn;
	    if (isNode && (parent = process$1.domain)) parent.exit();
	    while (head) {
	      fn = head.fn;
	      head = head.next;
	      try {
	        fn();
	      } catch (e) {
	        if (head) notify();
	        else last = undefined;
	        throw e;
	      }
	    } last = undefined;
	    if (parent) parent.enter();
	  };

	  // Node.js
	  if (isNode) {
	    notify = function () {
	      process$1.nextTick(flush);
	    };
	  // browsers with MutationObserver, except iOS Safari - https://github.com/zloirock/core-js/issues/339
	  } else if (Observer && !(_global.navigator && _global.navigator.standalone)) {
	    var toggle = true;
	    var node = document.createTextNode('');
	    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
	    notify = function () {
	      node.data = toggle = !toggle;
	    };
	  // environments with maybe non-completely correct, but existent Promise
	  } else if (Promise$1 && Promise$1.resolve) {
	    // Promise.resolve without an argument throws an error in LG WebOS 2
	    var promise = Promise$1.resolve(undefined);
	    notify = function () {
	      promise.then(flush);
	    };
	  // for other environments - macrotask based on:
	  // - setImmediate
	  // - MessageChannel
	  // - window.postMessag
	  // - onreadystatechange
	  // - setTimeout
	  } else {
	    notify = function () {
	      // strange IE + webpack dev server bug - use .call(global)
	      macrotask.call(_global, flush);
	    };
	  }

	  return function (fn) {
	    var task = { fn: fn, next: undefined };
	    if (last) last.next = task;
	    if (!head) {
	      head = task;
	      notify();
	    } last = task;
	  };
	};

	// 25.4.1.5 NewPromiseCapability(C)


	function PromiseCapability(C) {
	  var resolve, reject;
	  this.promise = new C(function ($$resolve, $$reject) {
	    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
	    resolve = $$resolve;
	    reject = $$reject;
	  });
	  this.resolve = _aFunction(resolve);
	  this.reject = _aFunction(reject);
	}

	var f$1 = function (C) {
	  return new PromiseCapability(C);
	};

	var _newPromiseCapability = {
		f: f$1
	};

	var _perform = function (exec) {
	  try {
	    return { e: false, v: exec() };
	  } catch (e) {
	    return { e: true, v: e };
	  }
	};

	var navigator$1 = _global.navigator;

	var _userAgent = navigator$1 && navigator$1.userAgent || '';

	var _promiseResolve = function (C, x) {
	  _anObject(C);
	  if (_isObject(x) && x.constructor === C) return x;
	  var promiseCapability = _newPromiseCapability.f(C);
	  var resolve = promiseCapability.resolve;
	  resolve(x);
	  return promiseCapability.promise;
	};

	var _redefineAll = function (target, src, safe) {
	  for (var key in src) {
	    if (safe && target[key]) target[key] = src[key];
	    else _hide(target, key, src[key]);
	  } return target;
	};

	var SPECIES$1 = _wks('species');

	var _setSpecies = function (KEY) {
	  var C = typeof _core[KEY] == 'function' ? _core[KEY] : _global[KEY];
	  if (_descriptors && C && !C[SPECIES$1]) _objectDp.f(C, SPECIES$1, {
	    configurable: true,
	    get: function () { return this; }
	  });
	};

	var ITERATOR$3 = _wks('iterator');
	var SAFE_CLOSING = false;

	try {
	  var riter = [7][ITERATOR$3]();
	  riter['return'] = function () { SAFE_CLOSING = true; };
	} catch (e) { /* empty */ }

	var _iterDetect = function (exec, skipClosing) {
	  if (!skipClosing && !SAFE_CLOSING) return false;
	  var safe = false;
	  try {
	    var arr = [7];
	    var iter = arr[ITERATOR$3]();
	    iter.next = function () { return { done: safe = true }; };
	    arr[ITERATOR$3] = function () { return iter; };
	    exec(arr);
	  } catch (e) { /* empty */ }
	  return safe;
	};

	var task = _task.set;
	var microtask = _microtask();




	var PROMISE = 'Promise';
	var TypeError$1 = _global.TypeError;
	var process$2 = _global.process;
	var versions = process$2 && process$2.versions;
	var v8 = versions && versions.v8 || '';
	var $Promise = _global[PROMISE];
	var isNode$1 = _classof(process$2) == 'process';
	var empty = function () { /* empty */ };
	var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
	var newPromiseCapability = newGenericPromiseCapability = _newPromiseCapability.f;

	var USE_NATIVE = !!function () {
	  try {
	    // correct subclassing with @@species support
	    var promise = $Promise.resolve(1);
	    var FakePromise = (promise.constructor = {})[_wks('species')] = function (exec) {
	      exec(empty, empty);
	    };
	    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
	    return (isNode$1 || typeof PromiseRejectionEvent == 'function')
	      && promise.then(empty) instanceof FakePromise
	      // v8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
	      // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
	      // we can't detect it synchronously, so just check versions
	      && v8.indexOf('6.6') !== 0
	      && _userAgent.indexOf('Chrome/66') === -1;
	  } catch (e) { /* empty */ }
	}();

	// helpers
	var isThenable = function (it) {
	  var then;
	  return _isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var notify = function (promise, isReject) {
	  if (promise._n) return;
	  promise._n = true;
	  var chain = promise._c;
	  microtask(function () {
	    var value = promise._v;
	    var ok = promise._s == 1;
	    var i = 0;
	    var run = function (reaction) {
	      var handler = ok ? reaction.ok : reaction.fail;
	      var resolve = reaction.resolve;
	      var reject = reaction.reject;
	      var domain = reaction.domain;
	      var result, then, exited;
	      try {
	        if (handler) {
	          if (!ok) {
	            if (promise._h == 2) onHandleUnhandled(promise);
	            promise._h = 1;
	          }
	          if (handler === true) result = value;
	          else {
	            if (domain) domain.enter();
	            result = handler(value); // may throw
	            if (domain) {
	              domain.exit();
	              exited = true;
	            }
	          }
	          if (result === reaction.promise) {
	            reject(TypeError$1('Promise-chain cycle'));
	          } else if (then = isThenable(result)) {
	            then.call(result, resolve, reject);
	          } else resolve(result);
	        } else reject(value);
	      } catch (e) {
	        if (domain && !exited) domain.exit();
	        reject(e);
	      }
	    };
	    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
	    promise._c = [];
	    promise._n = false;
	    if (isReject && !promise._h) onUnhandled(promise);
	  });
	};
	var onUnhandled = function (promise) {
	  task.call(_global, function () {
	    var value = promise._v;
	    var unhandled = isUnhandled(promise);
	    var result, handler, console;
	    if (unhandled) {
	      result = _perform(function () {
	        if (isNode$1) {
	          process$2.emit('unhandledRejection', value, promise);
	        } else if (handler = _global.onunhandledrejection) {
	          handler({ promise: promise, reason: value });
	        } else if ((console = _global.console) && console.error) {
	          console.error('Unhandled promise rejection', value);
	        }
	      });
	      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
	      promise._h = isNode$1 || isUnhandled(promise) ? 2 : 1;
	    } promise._a = undefined;
	    if (unhandled && result.e) throw result.v;
	  });
	};
	var isUnhandled = function (promise) {
	  return promise._h !== 1 && (promise._a || promise._c).length === 0;
	};
	var onHandleUnhandled = function (promise) {
	  task.call(_global, function () {
	    var handler;
	    if (isNode$1) {
	      process$2.emit('rejectionHandled', promise);
	    } else if (handler = _global.onrejectionhandled) {
	      handler({ promise: promise, reason: promise._v });
	    }
	  });
	};
	var $reject = function (value) {
	  var promise = this;
	  if (promise._d) return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  promise._v = value;
	  promise._s = 2;
	  if (!promise._a) promise._a = promise._c.slice();
	  notify(promise, true);
	};
	var $resolve = function (value) {
	  var promise = this;
	  var then;
	  if (promise._d) return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  try {
	    if (promise === value) throw TypeError$1("Promise can't be resolved itself");
	    if (then = isThenable(value)) {
	      microtask(function () {
	        var wrapper = { _w: promise, _d: false }; // wrap
	        try {
	          then.call(value, _ctx($resolve, wrapper, 1), _ctx($reject, wrapper, 1));
	        } catch (e) {
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      promise._v = value;
	      promise._s = 1;
	      notify(promise, false);
	    }
	  } catch (e) {
	    $reject.call({ _w: promise, _d: false }, e); // wrap
	  }
	};

	// constructor polyfill
	if (!USE_NATIVE) {
	  // 25.4.3.1 Promise(executor)
	  $Promise = function Promise(executor) {
	    _anInstance(this, $Promise, PROMISE, '_h');
	    _aFunction(executor);
	    Internal.call(this);
	    try {
	      executor(_ctx($resolve, this, 1), _ctx($reject, this, 1));
	    } catch (err) {
	      $reject.call(this, err);
	    }
	  };
	  // eslint-disable-next-line no-unused-vars
	  Internal = function Promise(executor) {
	    this._c = [];             // <- awaiting reactions
	    this._a = undefined;      // <- checked in isUnhandled reactions
	    this._s = 0;              // <- state
	    this._d = false;          // <- done
	    this._v = undefined;      // <- value
	    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
	    this._n = false;          // <- notify
	  };
	  Internal.prototype = _redefineAll($Promise.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected) {
	      var reaction = newPromiseCapability(_speciesConstructor(this, $Promise));
	      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
	      reaction.fail = typeof onRejected == 'function' && onRejected;
	      reaction.domain = isNode$1 ? process$2.domain : undefined;
	      this._c.push(reaction);
	      if (this._a) this._a.push(reaction);
	      if (this._s) notify(this, false);
	      return reaction.promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function (onRejected) {
	      return this.then(undefined, onRejected);
	    }
	  });
	  OwnPromiseCapability = function () {
	    var promise = new Internal();
	    this.promise = promise;
	    this.resolve = _ctx($resolve, promise, 1);
	    this.reject = _ctx($reject, promise, 1);
	  };
	  _newPromiseCapability.f = newPromiseCapability = function (C) {
	    return C === $Promise || C === Wrapper
	      ? new OwnPromiseCapability(C)
	      : newGenericPromiseCapability(C);
	  };
	}

	_export(_export.G + _export.W + _export.F * !USE_NATIVE, { Promise: $Promise });
	_setToStringTag($Promise, PROMISE);
	_setSpecies(PROMISE);
	Wrapper = _core[PROMISE];

	// statics
	_export(_export.S + _export.F * !USE_NATIVE, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r) {
	    var capability = newPromiseCapability(this);
	    var $$reject = capability.reject;
	    $$reject(r);
	    return capability.promise;
	  }
	});
	_export(_export.S + _export.F * (_library || !USE_NATIVE), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x) {
	    return _promiseResolve(_library && this === Wrapper ? $Promise : this, x);
	  }
	});
	_export(_export.S + _export.F * !(USE_NATIVE && _iterDetect(function (iter) {
	  $Promise.all(iter)['catch'](empty);
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable) {
	    var C = this;
	    var capability = newPromiseCapability(C);
	    var resolve = capability.resolve;
	    var reject = capability.reject;
	    var result = _perform(function () {
	      var values = [];
	      var index = 0;
	      var remaining = 1;
	      _forOf(iterable, false, function (promise) {
	        var $index = index++;
	        var alreadyCalled = false;
	        values.push(undefined);
	        remaining++;
	        C.resolve(promise).then(function (value) {
	          if (alreadyCalled) return;
	          alreadyCalled = true;
	          values[$index] = value;
	          --remaining || resolve(values);
	        }, reject);
	      });
	      --remaining || resolve(values);
	    });
	    if (result.e) reject(result.v);
	    return capability.promise;
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable) {
	    var C = this;
	    var capability = newPromiseCapability(C);
	    var reject = capability.reject;
	    var result = _perform(function () {
	      _forOf(iterable, false, function (promise) {
	        C.resolve(promise).then(capability.resolve, reject);
	      });
	    });
	    if (result.e) reject(result.v);
	    return capability.promise;
	  }
	});

	_export(_export.P + _export.R, 'Promise', { 'finally': function (onFinally) {
	  var C = _speciesConstructor(this, _core.Promise || _global.Promise);
	  var isFunction = typeof onFinally == 'function';
	  return this.then(
	    isFunction ? function (x) {
	      return _promiseResolve(C, onFinally()).then(function () { return x; });
	    } : onFinally,
	    isFunction ? function (e) {
	      return _promiseResolve(C, onFinally()).then(function () { throw e; });
	    } : onFinally
	  );
	} });

	// https://github.com/tc39/proposal-promise-try




	_export(_export.S, 'Promise', { 'try': function (callbackfn) {
	  var promiseCapability = _newPromiseCapability.f(this);
	  var result = _perform(callbackfn);
	  (result.e ? promiseCapability.reject : promiseCapability.resolve)(result.v);
	  return promiseCapability.promise;
	} });

	var promise = _core.Promise;

	var promise$1 = createCommonjsModule(function (module) {
	module.exports = { "default": promise, __esModule: true };
	});

	var _Promise = unwrapExports(promise$1);

	var core_getIterator = _core.getIterator = function (it) {
	  var iterFn = core_getIteratorMethod(it);
	  if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
	  return _anObject(iterFn.call(it));
	};

	var getIterator = core_getIterator;

	var getIterator$1 = createCommonjsModule(function (module) {
	module.exports = { "default": getIterator, __esModule: true };
	});

	var _getIterator = unwrapExports(getIterator$1);

	var f$2 = _wks;

	var _wksExt = {
		f: f$2
	};

	var iterator = _wksExt.f('iterator');

	var iterator$1 = createCommonjsModule(function (module) {
	module.exports = { "default": iterator, __esModule: true };
	});

	var _Symbol$iterator = unwrapExports(iterator$1);

	var _meta = createCommonjsModule(function (module) {
	var META = _uid('meta');


	var setDesc = _objectDp.f;
	var id = 0;
	var isExtensible = Object.isExtensible || function () {
	  return true;
	};
	var FREEZE = !_fails(function () {
	  return isExtensible(Object.preventExtensions({}));
	});
	var setMeta = function (it) {
	  setDesc(it, META, { value: {
	    i: 'O' + ++id, // object ID
	    w: {}          // weak collections IDs
	  } });
	};
	var fastKey = function (it, create) {
	  // return primitive with prefix
	  if (!_isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if (!_has(it, META)) {
	    // can't set metadata to uncaught frozen object
	    if (!isExtensible(it)) return 'F';
	    // not necessary to add metadata
	    if (!create) return 'E';
	    // add missing metadata
	    setMeta(it);
	  // return object ID
	  } return it[META].i;
	};
	var getWeak = function (it, create) {
	  if (!_has(it, META)) {
	    // can't set metadata to uncaught frozen object
	    if (!isExtensible(it)) return true;
	    // not necessary to add metadata
	    if (!create) return false;
	    // add missing metadata
	    setMeta(it);
	  // return hash weak collections IDs
	  } return it[META].w;
	};
	// add metadata on freeze-family methods calling
	var onFreeze = function (it) {
	  if (FREEZE && meta.NEED && isExtensible(it) && !_has(it, META)) setMeta(it);
	  return it;
	};
	var meta = module.exports = {
	  KEY: META,
	  NEED: false,
	  fastKey: fastKey,
	  getWeak: getWeak,
	  onFreeze: onFreeze
	};
	});
	var _meta_1 = _meta.KEY;
	var _meta_2 = _meta.NEED;
	var _meta_3 = _meta.fastKey;
	var _meta_4 = _meta.getWeak;
	var _meta_5 = _meta.onFreeze;

	var defineProperty = _objectDp.f;
	var _wksDefine = function (name) {
	  var $Symbol = _core.Symbol || (_core.Symbol = {});
	  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: _wksExt.f(name) });
	};

	var f$3 = Object.getOwnPropertySymbols;

	var _objectGops = {
		f: f$3
	};

	var f$4 = {}.propertyIsEnumerable;

	var _objectPie = {
		f: f$4
	};

	// all enumerable object keys, includes symbols



	var _enumKeys = function (it) {
	  var result = _objectKeys(it);
	  var getSymbols = _objectGops.f;
	  if (getSymbols) {
	    var symbols = getSymbols(it);
	    var isEnum = _objectPie.f;
	    var i = 0;
	    var key;
	    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
	  } return result;
	};

	// 7.2.2 IsArray(argument)

	var _isArray = Array.isArray || function isArray(arg) {
	  return _cof(arg) == 'Array';
	};

	// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)

	var hiddenKeys = _enumBugKeys.concat('length', 'prototype');

	var f$5 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
	  return _objectKeysInternal(O, hiddenKeys);
	};

	var _objectGopn = {
		f: f$5
	};

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window

	var gOPN = _objectGopn.f;
	var toString$1 = {}.toString;

	var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];

	var getWindowNames = function (it) {
	  try {
	    return gOPN(it);
	  } catch (e) {
	    return windowNames.slice();
	  }
	};

	var f$6 = function getOwnPropertyNames(it) {
	  return windowNames && toString$1.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(_toIobject(it));
	};

	var _objectGopnExt = {
		f: f$6
	};

	var gOPD = Object.getOwnPropertyDescriptor;

	var f$7 = _descriptors ? gOPD : function getOwnPropertyDescriptor(O, P) {
	  O = _toIobject(O);
	  P = _toPrimitive(P, true);
	  if (_ie8DomDefine) try {
	    return gOPD(O, P);
	  } catch (e) { /* empty */ }
	  if (_has(O, P)) return _propertyDesc(!_objectPie.f.call(O, P), O[P]);
	};

	var _objectGopd = {
		f: f$7
	};

	// ECMAScript 6 symbols shim





	var META = _meta.KEY;





















	var gOPD$1 = _objectGopd.f;
	var dP$1 = _objectDp.f;
	var gOPN$1 = _objectGopnExt.f;
	var $Symbol = _global.Symbol;
	var $JSON$1 = _global.JSON;
	var _stringify = $JSON$1 && $JSON$1.stringify;
	var PROTOTYPE$2 = 'prototype';
	var HIDDEN = _wks('_hidden');
	var TO_PRIMITIVE = _wks('toPrimitive');
	var isEnum = {}.propertyIsEnumerable;
	var SymbolRegistry = _shared('symbol-registry');
	var AllSymbols = _shared('symbols');
	var OPSymbols = _shared('op-symbols');
	var ObjectProto$1 = Object[PROTOTYPE$2];
	var USE_NATIVE$1 = typeof $Symbol == 'function' && !!_objectGops.f;
	var QObject = _global.QObject;
	// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
	var setter = !QObject || !QObject[PROTOTYPE$2] || !QObject[PROTOTYPE$2].findChild;

	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = _descriptors && _fails(function () {
	  return _objectCreate(dP$1({}, 'a', {
	    get: function () { return dP$1(this, 'a', { value: 7 }).a; }
	  })).a != 7;
	}) ? function (it, key, D) {
	  var protoDesc = gOPD$1(ObjectProto$1, key);
	  if (protoDesc) delete ObjectProto$1[key];
	  dP$1(it, key, D);
	  if (protoDesc && it !== ObjectProto$1) dP$1(ObjectProto$1, key, protoDesc);
	} : dP$1;

	var wrap = function (tag) {
	  var sym = AllSymbols[tag] = _objectCreate($Symbol[PROTOTYPE$2]);
	  sym._k = tag;
	  return sym;
	};

	var isSymbol = USE_NATIVE$1 && typeof $Symbol.iterator == 'symbol' ? function (it) {
	  return typeof it == 'symbol';
	} : function (it) {
	  return it instanceof $Symbol;
	};

	var $defineProperty = function defineProperty(it, key, D) {
	  if (it === ObjectProto$1) $defineProperty(OPSymbols, key, D);
	  _anObject(it);
	  key = _toPrimitive(key, true);
	  _anObject(D);
	  if (_has(AllSymbols, key)) {
	    if (!D.enumerable) {
	      if (!_has(it, HIDDEN)) dP$1(it, HIDDEN, _propertyDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if (_has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
	      D = _objectCreate(D, { enumerable: _propertyDesc(0, false) });
	    } return setSymbolDesc(it, key, D);
	  } return dP$1(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P) {
	  _anObject(it);
	  var keys = _enumKeys(P = _toIobject(P));
	  var i = 0;
	  var l = keys.length;
	  var key;
	  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
	  return it;
	};
	var $create = function create(it, P) {
	  return P === undefined ? _objectCreate(it) : $defineProperties(_objectCreate(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key) {
	  var E = isEnum.call(this, key = _toPrimitive(key, true));
	  if (this === ObjectProto$1 && _has(AllSymbols, key) && !_has(OPSymbols, key)) return false;
	  return E || !_has(this, key) || !_has(AllSymbols, key) || _has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
	  it = _toIobject(it);
	  key = _toPrimitive(key, true);
	  if (it === ObjectProto$1 && _has(AllSymbols, key) && !_has(OPSymbols, key)) return;
	  var D = gOPD$1(it, key);
	  if (D && _has(AllSymbols, key) && !(_has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it) {
	  var names = gOPN$1(_toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (!_has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
	  } return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
	  var IS_OP = it === ObjectProto$1;
	  var names = gOPN$1(IS_OP ? OPSymbols : _toIobject(it));
	  var result = [];
	  var i = 0;
	  var key;
	  while (names.length > i) {
	    if (_has(AllSymbols, key = names[i++]) && (IS_OP ? _has(ObjectProto$1, key) : true)) result.push(AllSymbols[key]);
	  } return result;
	};

	// 19.4.1.1 Symbol([description])
	if (!USE_NATIVE$1) {
	  $Symbol = function Symbol() {
	    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
	    var tag = _uid(arguments.length > 0 ? arguments[0] : undefined);
	    var $set = function (value) {
	      if (this === ObjectProto$1) $set.call(OPSymbols, value);
	      if (_has(this, HIDDEN) && _has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, _propertyDesc(1, value));
	    };
	    if (_descriptors && setter) setSymbolDesc(ObjectProto$1, tag, { configurable: true, set: $set });
	    return wrap(tag);
	  };
	  _redefine($Symbol[PROTOTYPE$2], 'toString', function toString() {
	    return this._k;
	  });

	  _objectGopd.f = $getOwnPropertyDescriptor;
	  _objectDp.f = $defineProperty;
	  _objectGopn.f = _objectGopnExt.f = $getOwnPropertyNames;
	  _objectPie.f = $propertyIsEnumerable;
	  _objectGops.f = $getOwnPropertySymbols;

	  if (_descriptors && !_library) {
	    _redefine(ObjectProto$1, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }

	  _wksExt.f = function (name) {
	    return wrap(_wks(name));
	  };
	}

	_export(_export.G + _export.W + _export.F * !USE_NATIVE$1, { Symbol: $Symbol });

	for (var es6Symbols = (
	  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
	  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
	).split(','), j = 0; es6Symbols.length > j;)_wks(es6Symbols[j++]);

	for (var wellKnownSymbols = _objectKeys(_wks.store), k = 0; wellKnownSymbols.length > k;) _wksDefine(wellKnownSymbols[k++]);

	_export(_export.S + _export.F * !USE_NATIVE$1, 'Symbol', {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function (key) {
	    return _has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(sym) {
	    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
	    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
	  },
	  useSetter: function () { setter = true; },
	  useSimple: function () { setter = false; }
	});

	_export(_export.S + _export.F * !USE_NATIVE$1, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});

	// Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
	// https://bugs.chromium.org/p/v8/issues/detail?id=3443
	var FAILS_ON_PRIMITIVES = _fails(function () { _objectGops.f(1); });

	_export(_export.S + _export.F * FAILS_ON_PRIMITIVES, 'Object', {
	  getOwnPropertySymbols: function getOwnPropertySymbols(it) {
	    return _objectGops.f(_toObject(it));
	  }
	});

	// 24.3.2 JSON.stringify(value [, replacer [, space]])
	$JSON$1 && _export(_export.S + _export.F * (!USE_NATIVE$1 || _fails(function () {
	  var S = $Symbol();
	  // MS Edge converts symbol values to JSON as {}
	  // WebKit converts symbol values to JSON as null
	  // V8 throws on boxed symbols
	  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
	})), 'JSON', {
	  stringify: function stringify(it) {
	    var args = [it];
	    var i = 1;
	    var replacer, $replacer;
	    while (arguments.length > i) args.push(arguments[i++]);
	    $replacer = replacer = args[1];
	    if (!_isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
	    if (!_isArray(replacer)) replacer = function (key, value) {
	      if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
	      if (!isSymbol(value)) return value;
	    };
	    args[1] = replacer;
	    return _stringify.apply($JSON$1, args);
	  }
	});

	// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
	$Symbol[PROTOTYPE$2][TO_PRIMITIVE] || _hide($Symbol[PROTOTYPE$2], TO_PRIMITIVE, $Symbol[PROTOTYPE$2].valueOf);
	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	_setToStringTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	_setToStringTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	_setToStringTag(_global.JSON, 'JSON', true);

	_wksDefine('asyncIterator');

	_wksDefine('observable');

	var symbol = _core.Symbol;

	var symbol$1 = createCommonjsModule(function (module) {
	module.exports = { "default": symbol, __esModule: true };
	});

	unwrapExports(symbol$1);

	var _typeof_1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _iterator2 = _interopRequireDefault(iterator$1);



	var _symbol2 = _interopRequireDefault(symbol$1);

	var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
	  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
	} : function (obj) {
	  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
	};
	});

	var _typeof = unwrapExports(_typeof_1);

	var runtime = createCommonjsModule(function (module) {
	/**
	 * Copyright (c) 2014-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	!(function(global) {

	  var Op = Object.prototype;
	  var hasOwn = Op.hasOwnProperty;
	  var undefined; // More compressible than void 0.
	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
	  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
	  var runtime = global.regeneratorRuntime;
	  if (runtime) {
	    {
	      // If regeneratorRuntime is defined globally and we're in a module,
	      // make the exports object identical to regeneratorRuntime.
	      module.exports = runtime;
	    }
	    // Don't bother evaluating the rest of this file if the runtime was
	    // already defined globally.
	    return;
	  }

	  // Define the runtime globally (as expected by generated code) as either
	  // module.exports (if we're in a module) or a new, empty object.
	  runtime = global.regeneratorRuntime = module.exports;

	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
	    var generator = Object.create(protoGenerator.prototype);
	    var context = new Context(tryLocsList || []);

	    // The ._invoke method unifies the implementations of the .next,
	    // .throw, and .return methods.
	    generator._invoke = makeInvokeMethod(innerFn, self, context);

	    return generator;
	  }
	  runtime.wrap = wrap;

	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }

	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";

	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};

	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}

	  // This is a polyfill for %IteratorPrototype% for environments that
	  // don't natively support it.
	  var IteratorPrototype = {};
	  IteratorPrototype[iteratorSymbol] = function () {
	    return this;
	  };

	  var getProto = Object.getPrototypeOf;
	  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	  if (NativeIteratorPrototype &&
	      NativeIteratorPrototype !== Op &&
	      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
	    // This environment has a native %IteratorPrototype%; use it instead
	    // of the polyfill.
	    IteratorPrototype = NativeIteratorPrototype;
	  }

	  var Gp = GeneratorFunctionPrototype.prototype =
	    Generator.prototype = Object.create(IteratorPrototype);
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunctionPrototype[toStringTagSymbol] =
	    GeneratorFunction.displayName = "GeneratorFunction";

	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function(method) {
	      prototype[method] = function(arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }

	  runtime.isGeneratorFunction = function(genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor
	      ? ctor === GeneratorFunction ||
	        // For the native GeneratorFunction constructor, the best we can
	        // do is to check its .name property.
	        (ctor.displayName || ctor.name) === "GeneratorFunction"
	      : false;
	  };

	  runtime.mark = function(genFun) {
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	    } else {
	      genFun.__proto__ = GeneratorFunctionPrototype;
	      if (!(toStringTagSymbol in genFun)) {
	        genFun[toStringTagSymbol] = "GeneratorFunction";
	      }
	    }
	    genFun.prototype = Object.create(Gp);
	    return genFun;
	  };

	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `hasOwn.call(value, "__await")` to determine if the yielded value is
	  // meant to be awaited.
	  runtime.awrap = function(arg) {
	    return { __await: arg };
	  };

	  function AsyncIterator(generator) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value &&
	            typeof value === "object" &&
	            hasOwn.call(value, "__await")) {
	          return Promise.resolve(value.__await).then(function(value) {
	            invoke("next", value, resolve, reject);
	          }, function(err) {
	            invoke("throw", err, resolve, reject);
	          });
	        }

	        return Promise.resolve(value).then(function(unwrapped) {
	          // When a yielded Promise is resolved, its final value becomes
	          // the .value of the Promise<{value,done}> result for the
	          // current iteration. If the Promise is rejected, however, the
	          // result for this iteration will be rejected with the same
	          // reason. Note that rejections of yielded Promises are not
	          // thrown back into the generator function, as is the case
	          // when an awaited Promise is rejected. This difference in
	          // behavior between yield and await is important, because it
	          // allows the consumer to decide what to do with the yielded
	          // rejection (swallow it and continue, manually .throw it back
	          // into the generator, abandon iteration, whatever). With
	          // await, by contrast, there is no opportunity to examine the
	          // rejection reason outside the generator function, so the
	          // only option is to throw it from the await expression, and
	          // let the generator function handle the exception.
	          result.value = unwrapped;
	          resolve(result);
	        }, reject);
	      }
	    }

	    var previousPromise;

	    function enqueue(method, arg) {
	      function callInvokeWithMethodAndArg() {
	        return new Promise(function(resolve, reject) {
	          invoke(method, arg, resolve, reject);
	        });
	      }

	      return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(
	          callInvokeWithMethodAndArg,
	          // Avoid propagating failures to Promises returned by later
	          // invocations of the iterator.
	          callInvokeWithMethodAndArg
	        ) : callInvokeWithMethodAndArg();
	    }

	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }

	  defineIteratorMethods(AsyncIterator.prototype);
	  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
	    return this;
	  };
	  runtime.AsyncIterator = AsyncIterator;

	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
	    var iter = new AsyncIterator(
	      wrap(innerFn, outerFn, self, tryLocsList)
	    );

	    return runtime.isGeneratorFunction(outerFn)
	      ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function(result) {
	          return result.done ? result.value : iter.next();
	        });
	  };

	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;

	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }

	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }

	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }

	      context.method = method;
	      context.arg = arg;

	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          var delegateResult = maybeInvokeDelegate(delegate, context);
	          if (delegateResult) {
	            if (delegateResult === ContinueSentinel) continue;
	            return delegateResult;
	          }
	        }

	        if (context.method === "next") {
	          // Setting context._sent for legacy support of Babel's
	          // function.sent implementation.
	          context.sent = context._sent = context.arg;

	        } else if (context.method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw context.arg;
	          }

	          context.dispatchException(context.arg);

	        } else if (context.method === "return") {
	          context.abrupt("return", context.arg);
	        }

	        state = GenStateExecuting;

	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done
	            ? GenStateCompleted
	            : GenStateSuspendedYield;

	          if (record.arg === ContinueSentinel) {
	            continue;
	          }

	          return {
	            value: record.arg,
	            done: context.done
	          };

	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(context.arg) call above.
	          context.method = "throw";
	          context.arg = record.arg;
	        }
	      }
	    };
	  }

	  // Call delegate.iterator[context.method](context.arg) and handle the
	  // result, either by returning a { value, done } result from the
	  // delegate iterator, or by modifying context.method and context.arg,
	  // setting context.delegate to null, and returning the ContinueSentinel.
	  function maybeInvokeDelegate(delegate, context) {
	    var method = delegate.iterator[context.method];
	    if (method === undefined) {
	      // A .throw or .return when the delegate iterator has no .throw
	      // method always terminates the yield* loop.
	      context.delegate = null;

	      if (context.method === "throw") {
	        if (delegate.iterator.return) {
	          // If the delegate iterator has a return method, give it a
	          // chance to clean up.
	          context.method = "return";
	          context.arg = undefined;
	          maybeInvokeDelegate(delegate, context);

	          if (context.method === "throw") {
	            // If maybeInvokeDelegate(context) changed context.method from
	            // "return" to "throw", let that override the TypeError below.
	            return ContinueSentinel;
	          }
	        }

	        context.method = "throw";
	        context.arg = new TypeError(
	          "The iterator does not provide a 'throw' method");
	      }

	      return ContinueSentinel;
	    }

	    var record = tryCatch(method, delegate.iterator, context.arg);

	    if (record.type === "throw") {
	      context.method = "throw";
	      context.arg = record.arg;
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    var info = record.arg;

	    if (! info) {
	      context.method = "throw";
	      context.arg = new TypeError("iterator result is not an object");
	      context.delegate = null;
	      return ContinueSentinel;
	    }

	    if (info.done) {
	      // Assign the result of the finished delegate to the temporary
	      // variable specified by delegate.resultName (see delegateYield).
	      context[delegate.resultName] = info.value;

	      // Resume execution at the desired location (see delegateYield).
	      context.next = delegate.nextLoc;

	      // If context.method was "throw" but the delegate handled the
	      // exception, let the outer generator proceed normally. If
	      // context.method was "next", forget context.arg since it has been
	      // "consumed" by the delegate iterator. If context.method was
	      // "return", allow the original .return call to continue in the
	      // outer generator.
	      if (context.method !== "return") {
	        context.method = "next";
	        context.arg = undefined;
	      }

	    } else {
	      // Re-yield the result returned by the delegate method.
	      return info;
	    }

	    // The delegate iterator is finished, so forget it and continue with
	    // the outer generator.
	    context.delegate = null;
	    return ContinueSentinel;
	  }

	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);

	  Gp[toStringTagSymbol] = "Generator";

	  // A Generator should always return itself as the iterator object when the
	  // @@iterator function is called on it. Some browsers' implementations of the
	  // iterator prototype chain incorrectly implement this, causing the Generator
	  // object to not be returned from this call. This ensures that doesn't happen.
	  // See https://github.com/facebook/regenerator/issues/274 for more details.
	  Gp[iteratorSymbol] = function() {
	    return this;
	  };

	  Gp.toString = function() {
	    return "[object Generator]";
	  };

	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };

	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }

	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }

	    this.tryEntries.push(entry);
	  }

	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }

	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }

	  runtime.keys = function(object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();

	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }

	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };

	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }

	      if (typeof iterable.next === "function") {
	        return iterable;
	      }

	      if (!isNaN(iterable.length)) {
	        var i = -1, next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }

	          next.value = undefined;
	          next.done = true;

	          return next;
	        };

	        return next.next = next;
	      }
	    }

	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  runtime.values = values;

	  function doneResult() {
	    return { value: undefined, done: true };
	  }

	  Context.prototype = {
	    constructor: Context,

	    reset: function(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      // Resetting context._sent for legacy support of Babel's
	      // function.sent implementation.
	      this.sent = this._sent = undefined;
	      this.done = false;
	      this.delegate = null;

	      this.method = "next";
	      this.arg = undefined;

	      this.tryEntries.forEach(resetTryEntry);

	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" &&
	              hasOwn.call(this, name) &&
	              !isNaN(+name.slice(1))) {
	            this[name] = undefined;
	          }
	        }
	      }
	    },

	    stop: function() {
	      this.done = true;

	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }

	      return this.rval;
	    },

	    dispatchException: function(exception) {
	      if (this.done) {
	        throw exception;
	      }

	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;

	        if (caught) {
	          // If the dispatched exception was caught by a catch block,
	          // then let that catch block handle the exception normally.
	          context.method = "next";
	          context.arg = undefined;
	        }

	        return !! caught;
	      }

	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;

	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }

	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");

	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }

	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }

	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },

	    abrupt: function(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev &&
	            hasOwn.call(entry, "finallyLoc") &&
	            this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }

	      if (finallyEntry &&
	          (type === "break" ||
	           type === "continue") &&
	          finallyEntry.tryLoc <= arg &&
	          arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }

	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;

	      if (finallyEntry) {
	        this.method = "next";
	        this.next = finallyEntry.finallyLoc;
	        return ContinueSentinel;
	      }

	      return this.complete(record);
	    },

	    complete: function(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }

	      if (record.type === "break" ||
	          record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = this.arg = record.arg;
	        this.method = "return";
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }

	      return ContinueSentinel;
	    },

	    finish: function(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },

	    "catch": function(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }

	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },

	    delegateYield: function(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };

	      if (this.method === "next") {
	        // Deliberately forget the last sent value so that we don't
	        // accidentally pass it on to the delegate.
	        this.arg = undefined;
	      }

	      return ContinueSentinel;
	    }
	  };
	})(
	  // In sloppy mode, unbound `this` refers to the global object, fallback to
	  // Function constructor if we're in global strict mode. That is sadly a form
	  // of indirect eval which violates Content Security Policy.
	  (function() { return this })() || Function("return this")()
	);
	});

	/**
	 * Copyright (c) 2014-present, Facebook, Inc.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 */

	// This method of obtaining a reference to the global object needs to be
	// kept identical to the way it is obtained in runtime.js
	var g = (function() { return this })() || Function("return this")();

	// Use `getOwnPropertyNames` because not all browsers support calling
	// `hasOwnProperty` on the global `self` object in a worker. See #183.
	var hadRuntime = g.regeneratorRuntime &&
	  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

	// Save the old regeneratorRuntime in case it needs to be restored later.
	var oldRuntime = hadRuntime && g.regeneratorRuntime;

	// Force reevalutation of runtime.js.
	g.regeneratorRuntime = undefined;

	var runtimeModule = runtime;

	if (hadRuntime) {
	  // Restore the original runtime.
	  g.regeneratorRuntime = oldRuntime;
	} else {
	  // Remove the global property added by runtime.js.
	  try {
	    delete g.regeneratorRuntime;
	  } catch(e) {
	    g.regeneratorRuntime = undefined;
	  }
	}

	var regenerator = runtimeModule;

	var possibleConstructorReturn = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _typeof3 = _interopRequireDefault(_typeof_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return call && ((typeof call === "undefined" ? "undefined" : (0, _typeof3.default)(call)) === "object" || typeof call === "function") ? call : self;
	};
	});

	var _possibleConstructorReturn = unwrapExports(possibleConstructorReturn);

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */


	var check = function (O, proto) {
	  _anObject(O);
	  if (!_isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
	};
	var _setProto = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
	    function (test, buggy, set) {
	      try {
	        set = _ctx(Function.call, _objectGopd.f(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch (e) { buggy = true; }
	      return function setPrototypeOf(O, proto) {
	        check(O, proto);
	        if (buggy) O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

	// 19.1.3.19 Object.setPrototypeOf(O, proto)

	_export(_export.S, 'Object', { setPrototypeOf: _setProto.set });

	var setPrototypeOf = _core.Object.setPrototypeOf;

	var setPrototypeOf$1 = createCommonjsModule(function (module) {
	module.exports = { "default": setPrototypeOf, __esModule: true };
	});

	unwrapExports(setPrototypeOf$1);

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	_export(_export.S, 'Object', { create: _objectCreate });

	var $Object = _core.Object;
	var create = function create(P, D) {
	  return $Object.create(P, D);
	};

	var create$1 = createCommonjsModule(function (module) {
	module.exports = { "default": create, __esModule: true };
	});

	unwrapExports(create$1);

	var inherits = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;



	var _setPrototypeOf2 = _interopRequireDefault(setPrototypeOf$1);



	var _create2 = _interopRequireDefault(create$1);



	var _typeof3 = _interopRequireDefault(_typeof_1);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	exports.default = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : (0, _typeof3.default)(superClass)));
	  }

	  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;
	};
	});

	var _inherits = unwrapExports(inherits);

	var global$1 = (typeof global !== "undefined" ? global :
	            typeof self !== "undefined" ? self :
	            typeof window !== "undefined" ? window : {});

	var isEnum$1 = _objectPie.f;
	var _objectToArray = function (isEntries) {
	  return function (it) {
	    var O = _toIobject(it);
	    var keys = _objectKeys(O);
	    var length = keys.length;
	    var i = 0;
	    var result = [];
	    var key;
	    while (length > i) {
	      key = keys[i++];
	      if (!_descriptors || isEnum$1.call(O, key)) {
	        result.push(isEntries ? [key, O[key]] : O[key]);
	      }
	    }
	    return result;
	  };
	};

	// https://github.com/tc39/proposal-object-values-entries

	var $values = _objectToArray(false);

	_export(_export.S, 'Object', {
	  values: function values(it) {
	    return $values(it);
	  }
	});

	var values = _core.Object.values;

	var values$1 = createCommonjsModule(function (module) {
	module.exports = { "default": values, __esModule: true };
	});

	var _Object$values = unwrapExports(values$1);

	// eslint-disable-line no-unused-vars

	var isNode$2 = false;
	try {
	  isNode$2 = Object.prototype.toString.call(global$1.process) === '[object process]';
	} catch (e) {
	}

	var userAgent = !isNode$2 && navigator && navigator.userAgent && navigator.userAgent.toLowerCase();
	var isElectron = userAgent && userAgent.indexOf(' electron/') > -1;

	var isMobile = !isNode$2 && function () {
	  if (isElectron) {
	    return false;
	  }
	  var check = false;
	  (function (a) {
	    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
	  })(navigator.userAgent || navigator.vendor || window.opera || '');
	  return check;
	}();

	function gunAsAnotherUser(gun, key, f) {
	  // Hacky way to use multiple users with gun
	  var gun2 = new Gun({ radisk: false, peers: _Object$keys(gun._.opt.peers) }); // TODO: copy other options too
	  var user = gun2.user();
	  user.auth(key);
	  setTimeout(function () {
	    var peers = _Object$values(gun2.back('opt.peers'));
	    peers.forEach(function (peer) {
	      gun2.on('bye', peer);
	    });
	  }, 20000);
	  return f(user);
	}

	function gunOnceDefined(node) {
	  return new _Promise(function (resolve) {
	    node.on(function (val, k, a, eve) {
	      if (val !== undefined) {
	        eve.off();
	        resolve(val);
	      }
	    });
	  });
	}

	async function loadGunDepth(chain) {
	  var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
	  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

	  opts.maxBreadth = opts.maxBreadth || 50;
	  opts.cache = opts.cache || {};

	  return chain.then().then(function (layer) {

	    // Depth limit reached, or non-object, or array value returned
	    if (maxDepth < 1 || !layer || (typeof layer === 'undefined' ? 'undefined' : _typeof(layer)) !== 'object' || layer.constructor === Array) {
	      return layer;
	    }

	    var bcount = 0;
	    var promises = _Object$keys(layer).map(function (key) {
	      // Only fetch links & restrict total search queries to maxBreadth ^ maxDepth requests
	      if (!Gun.val.link.is(layer[key]) || ++bcount >= opts.maxBreadth) {
	        return;
	      }

	      // During one recursive lookup, don't fetch the same key multiple times
	      if (opts.cache[key]) {
	        return opts.cache[key].then(function (data) {
	          layer[key] = data;
	        });
	      }

	      return opts.cache[key] = loadGunDepth(chain.get(key), maxDepth - 1, opts).then(function (data) {
	        layer[key] = data;
	      });
	    });

	    return _Promise.all(promises).then(function () {
	      return layer;
	    });
	  });
	}

	var util = {
	  loadGunDepth: loadGunDepth,

	  gunOnceDefined: gunOnceDefined,

	  gunAsAnotherUser: gunAsAnotherUser,

	  getHash: async function getHash(str) {
	    var format = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'base64';

	    if (!str) {
	      return undefined;
	    }
	    var hash = await Gun.SEA.work(str, undefined, undefined, { name: 'SHA-256' });
	    if (hash.length > 44) {
	      throw new Error('Gun.SEA.work returned an invalid SHA-256 hash longer than 44 chars: ' + hash + '. This is probably due to a sea.js bug on Safari.');
	    }
	    if (format === 'hex') {
	      return this.base64ToHex(hash);
	    }
	    return hash;
	  },

	  base64ToHex: function base64ToHex(str) {
	    var raw = atob(str);
	    var result = '';
	    for (var i = 0; i < raw.length; i++) {
	      var hex = raw.charCodeAt(i).toString(16);
	      result += hex.length === 2 ? hex : '0' + hex;
	    }
	    return result;
	  },
	  timeoutPromise: function timeoutPromise(promise, timeout) {
	    return _Promise.race([promise, new _Promise(function (resolve) {
	      setTimeout(function () {
	        resolve();
	      }, timeout);
	    })]);
	  },
	  getCaret: function getCaret(el) {
	    if (el.selectionStart) {
	      return el.selectionStart;
	    } else if (document.selection) {
	      el.focus();
	      var r = document.selection.createRange();
	      if (r == null) {
	        return 0;
	      }
	      var re = el.createTextRange(),
	          rc = re.duplicate();
	      re.moveToBookmark(r.getBookmark());
	      rc.setEndPoint('EndToStart', re);
	      return rc.text.length;
	    }
	    return 0;
	  },
	  injectCss: function injectCss() {
	    var elementId = 'irisStyle';
	    if (document.getElementById(elementId)) {
	      return;
	    }
	    var sheet = document.createElement('style');
	    sheet.id = elementId;
	    sheet.innerHTML = '\n      .iris-identicon * {\n        box-sizing: border-box;\n      }\n\n      .iris-identicon {\n        vertical-align: middle;\n        border-radius: 50%;\n        text-align: center;\n        display: inline-block;\n        position: relative;\n        max-width: 100%;\n      }\n\n      .iris-distance {\n        z-index: 2;\n        position: absolute;\n        left:0%;\n        top:2px;\n        width: 100%;\n        text-align: right;\n        color: #fff;\n        text-shadow: 0 0 1px #000;\n        font-size: 75%;\n        line-height: 75%;\n        font-weight: bold;\n      }\n\n      .iris-pie {\n        border-radius: 50%;\n        position: absolute;\n        top: 0;\n        left: 0;\n        box-shadow: 0px 0px 0px 0px #82FF84;\n        padding-bottom: 100%;\n        max-width: 100%;\n        -webkit-transition: all 0.2s ease-in-out;\n        -moz-transition: all 0.2s ease-in-out;\n        transition: all 0.2s ease-in-out;\n      }\n\n      .iris-card {\n        padding: 10px;\n        background-color: #f7f7f7;\n        color: #777;\n        border: 1px solid #ddd;\n        display: flex;\n        flex-direction: row;\n        overflow: hidden;\n      }\n\n      .iris-card a {\n        -webkit-transition: color 150ms;\n        transition: color 150ms;\n        text-decoration: none;\n        color: #337ab7;\n      }\n\n      .iris-card a:hover, .iris-card a:active {\n        text-decoration: underline;\n        color: #23527c;\n      }\n\n      .iris-pos {\n        color: #3c763d;\n      }\n\n      .iris-neg {\n        color: #a94442;\n      }\n\n      .iris-identicon img {\n        position: absolute;\n        top: 0;\n        left: 0;\n        max-width: 100%;\n        border-radius: 50%;\n        border-color: transparent;\n        border-style: solid;\n      }\n\n      .iris-chat-open-button {\n        background-color: #1e1e1e;\n        color: #fff;\n        padding: 15px;\n        cursor: pointer;\n        user-select: none;\n      }\n\n      .iris-chat-open-button svg {\n        width: 1em;\n      }\n\n      .iris-chat-open-button, .iris-chat-box {\n        position: fixed;\n        bottom: 0.5rem;\n        right: 0.5rem;\n        border-radius: 8px;\n        font-family: system-ui;\n        font-size: 15px;\n      }\n\n      .iris-chat-box {\n        background-color: #fff;\n        max-height: 25rem;\n        box-shadow: 2px 2px 20px rgba(0, 0, 0, 0.2);\n        height: calc(100% - 44px);\n        display: flex;\n        flex-direction: column;\n        width: 320px;\n        color: rgb(38, 38, 38);\n      }\n\n      .iris-chat-box.minimized {\n        height: auto;\n      }\n\n      .iris-chat-box.minimized .iris-chat-header {\n        border-radius: 8px;\n        cursor: pointer;\n      }\n\n      .iris-chat-box.minimized .iris-chat-messages, .iris-chat-box.minimized .iris-typing-indicator, .iris-chat-box.minimized .iris-chat-input-wrapper, .iris-chat-box.minimized .iris-chat-minimize, .iris-chat-box.minimized .iris-chat-close {\n        display: none;\n      }\n\n      .iris-chat-header {\n        background-color: #1e1e1e;\n        height: 44px;\n        color: #fff;\n        border-radius: 8px 8px 0 0;\n        text-align: center;\n        display: flex;\n        flex-direction: row;\n        justify-content: center;\n        align-items: center;\n        flex: none;\n        white-space: nowrap;\n        text-overflow: ellipsis;\n        overflow: hidden;\n      }\n\n      .iris-chat-header-text {\n        flex: 1;\n      }\n\n      .iris-online-indicator {\n        color: #bfbfbf;\n        margin-right: 5px;\n        font-size: 12px;\n        user-select: none;\n        flex: none;\n      }\n\n      .iris-online-indicator.yes {\n        color: #80bf5f;\n      }\n\n      .iris-typing-indicator {\n        display: none;\n        background-color: rgba(255, 255, 255, 0.5);\n        font-size: 12px;\n        padding: 2px;\n        color: #777;\n      }\n\n      .iris-typing-indicator.yes {\n        display: block;\n      }\n\n      .iris-chat-messages {\n        flex: 1;\n        padding: 15px;\n        overflow-y: scroll;\n      }\n\n      .iris-chat-input-wrapper {\n        flex: none;\n        padding: 15px;\n        background-color: #efefef;\n        display: flex;\n        flex-direction: row;\n        border-radius: 0 0 8px 8px;\n      }\n\n      .iris-chat-input-wrapper textarea {\n        padding: 15px 8px;\n        border-radius: 4px;\n        border: 1px solid rgba(0,0,0,0);\n        width: auto;\n        font-size: 15px;\n        resize: none;\n        flex: 1;\n      }\n\n      .iris-chat-input-wrapper textarea:focus {\n        outline: none;\n        border: 1px solid #6dd0ed;\n      }\n\n      .iris-chat-input-wrapper button svg {\n        display: inline-block;\n        font-size: inherit;\n        height: 1em;\n        width: 1em;\n        overflow: visible;\n        vertical-align: -0.125em;\n      }\n\n      .iris-chat-input-wrapper button, .iris-chat-input-wrapper button:hover, .iris-chat-input-wrapper button:active, .iris-chat-input-wrapper button:focus {\n        flex: none;\n        color: #999;\n        background-color: transparent;\n        font-size: 30px;\n        padding: 5px;\n        border: 1px solid rgba(0,0,0,0);\n        border-radius: 4px;\n        margin-left: 5px;\n      }\n\n      .iris-chat-input-wrapper button:active, .iris-chat-input-wrapper button:focus {\n        outline: none;\n        border: 1px solid #6dd0ed;\n      }\n\n      .iris-chat-message {\n        display: flex;\n        flex-direction: column;\n        margin-bottom: 2px;\n        overflow-wrap: break-word;\n      }\n\n      .iris-msg-content {\n        background-color: #efefef;\n        padding: 6px 10px;\n        border-radius: 8px;\n        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);\n        flex: none;\n        max-width: 75%;\n      }\n\n      .emoji {\n        font-size: 1.3em;\n        line-height: 1em;\n      }\n\n      .iris-chat-message .emoji-only {\n        font-size: 3em;\n        text-align: center;\n      }\n\n      .iris-seen {\n        color: rgba(0, 0, 0, 0.45);\n        user-select: none;\n      }\n\n      .iris-seen.yes {\n        color: #4fc3f7;\n      }\n\n      .iris-seen svg {\n        width: 18px;\n      }\n\n      .iris-delivered-checkmark {\n        display: none;\n      }\n\n      .delivered .iris-delivered-checkmark {\n        display: initial;\n      }\n\n      .iris-chat-minimize, .iris-chat-close {\n        user-select: none;\n        cursor: pointer;\n        width: 45px;\n        line-height: 44px;\n      }\n\n      .iris-chat-message.their {\n        align-items: flex-start;\n      }\n\n      .iris-chat-message.their + .iris-chat-message.our .iris-msg-content, .day-separator + .iris-chat-message.our .iris-msg-content {\n        margin-top: 15px;\n        border-radius: 8px 0px 8px 8px;\n      }\n\n      .iris-chat-message.their:first-of-type .iris-msg-content {\n        border-radius: 0px 8px 8px 8px;\n      }\n\n      .iris-chat-message.our:first-of-type .iris-msg-content {\n        border-radius: 8px 0px 8px 8px;\n      }\n\n      .iris-chat-message.our + .iris-chat-message.their .iris-msg-content, .day-separator + .iris-chat-message.their .iris-msg-content {\n        margin-top: 15px;\n        border-radius: 0px 8px 8px 8px;\n      }\n\n      .iris-chat-message.our {\n        align-items: flex-end;\n      }\n\n      .iris-chat-message.our .iris-msg-content {\n        background-color: #c5ecf7;\n      }\n\n      .iris-chat-message .time {\n        text-align: right;\n        font-size: 12px;\n        color: rgba(0, 0, 0, 0.45);\n      }\n\n      .day-separator {\n        display: inline-block;\n        border-radius: 8px;\n        background-color: rgba(227, 249, 255, 0.91);\n        padding: 6px 10px;\n        margin-top: 15px;\n        margin-left: auto;\n        margin-right: auto;\n        text-transform: uppercase;\n        font-size: 13px;\n        color: rgba(74, 74, 74, 0.88);\n        box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);\n        user-select: none;\n      }\n\n      .day-separator:first-of-type {\n        margin-top: 0;\n      }\n      ';
	    document.head.prepend(sheet);
	  },
	  getUrlParameter: function getUrlParameter(sParam, sParams) {
	    var sPageURL = sParams || window.location.search.substring(1);
	    var sURLVariables = sPageURL.split('&');
	    var sParameterName = void 0,
	        i = void 0;

	    for (i = 0; i < sURLVariables.length; i++) {
	      sParameterName = sURLVariables[i].split('=');
	      if (sParameterName[0] === sParam) {
	        return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
	      }
	    }
	  },
	  formatTime: function formatTime(date) {
	    var t = date.toLocaleTimeString(undefined, { timeStyle: 'short' });
	    var s = t.split(':');
	    if (s.length === 3) {
	      // safari tries to display seconds
	      return s[0] + ':' + s[1] + s[2].slice(2);
	    }
	    return t;
	  },
	  formatDate: function formatDate(date) {
	    var t = date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
	    var s = t.split(':');
	    if (s.length === 3) {
	      // safari tries to display seconds
	      return s[0] + ':' + s[1] + s[2].slice(2);
	    }
	    return t;
	  },
	  getDaySeparatorText: function getDaySeparatorText(date, dateStr, now, nowStr) {
	    if (!now) {
	      now = new Date();
	      nowStr = now.toLocaleDateString({ dateStyle: 'short' });
	    }
	    if (dateStr === nowStr) {
	      return 'today';
	    }
	    var dayDifference = Math.round((now - date) / (1000 * 60 * 60 * 24));
	    if (dayDifference <= 1) {
	      return 'yesterday';
	    }
	    if (dayDifference <= 5) {
	      return date.toLocaleDateString(undefined, { weekday: 'long' });
	    }
	    return dateStr;
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


	  isNode: isNode$2,
	  isElectron: isElectron,
	  isMobile: isMobile
	};

	// 19.1.2.1 Object.assign(target, source, ...)






	var $assign = Object.assign;

	// should work with symbols and should have deterministic property order (V8 bug)
	var _objectAssign = !$assign || _fails(function () {
	  var A = {};
	  var B = {};
	  // eslint-disable-next-line no-undef
	  var S = Symbol();
	  var K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function (k) { B[k] = k; });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
	  var T = _toObject(target);
	  var aLen = arguments.length;
	  var index = 1;
	  var getSymbols = _objectGops.f;
	  var isEnum = _objectPie.f;
	  while (aLen > index) {
	    var S = _iobject(arguments[index++]);
	    var keys = getSymbols ? _objectKeys(S).concat(getSymbols(S)) : _objectKeys(S);
	    var length = keys.length;
	    var j = 0;
	    var key;
	    while (length > j) {
	      key = keys[j++];
	      if (!_descriptors || isEnum.call(S, key)) T[key] = S[key];
	    }
	  } return T;
	} : $assign;

	// 19.1.3.1 Object.assign(target, source)


	_export(_export.S + _export.F, 'Object', { assign: _objectAssign });

	var assign = _core.Object.assign;

	var assign$1 = createCommonjsModule(function (module) {
	module.exports = { "default": assign, __esModule: true };
	});

	var _Object$assign = unwrapExports(assign$1);

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
	var inited = false;
	function init () {
	  inited = true;
	  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	  for (var i = 0, len = code.length; i < len; ++i) {
	    lookup[i] = code[i];
	    revLookup[code.charCodeAt(i)] = i;
	  }

	  revLookup['-'.charCodeAt(0)] = 62;
	  revLookup['_'.charCodeAt(0)] = 63;
	}

	function toByteArray (b64) {
	  if (!inited) {
	    init();
	  }
	  var i, j, l, tmp, placeHolders, arr;
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

	  // base64 is 4/3 + up to two characters of the original data
	  arr = new Arr(len * 3 / 4 - placeHolders);

	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len;

	  var L = 0;

	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
	    arr[L++] = (tmp >> 16) & 0xFF;
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[L++] = tmp & 0xFF;
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  if (!inited) {
	    init();
	  }
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var output = '';
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    output += lookup[tmp >> 2];
	    output += lookup[(tmp << 4) & 0x3F];
	    output += '==';
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
	    output += lookup[tmp >> 10];
	    output += lookup[(tmp >> 4) & 0x3F];
	    output += lookup[(tmp << 2) & 0x3F];
	    output += '=';
	  }

	  parts.push(output);

	  return parts.join('')
	}

	function read (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	function write (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	}

	var toString$2 = {}.toString;

	var isArray = Array.isArray || function (arr) {
	  return toString$2.call(arr) == '[object Array]';
	};

	var INSPECT_MAX_BYTES = 50;

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
	  ? global$1.TYPED_ARRAY_SUPPORT
	  : true;

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length);
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length);
	    }
	    that.length = length;
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192; // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype;
	  return arr
	};

	function from (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from(null, value, encodingOrOffset, length)
	};

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype;
	  Buffer.__proto__ = Uint8Array;
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size);
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	};

	function allocUnsafe (that, size) {
	  assertSize(size);
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0;
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	};
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	};

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8';
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0;
	  that = createBuffer(that, length);

	  var actual = that.write(string, encoding);

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual);
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0;
	  that = createBuffer(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array);
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset);
	  } else {
	    array = new Uint8Array(array, byteOffset, length);
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array;
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array);
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (internalIsBuffer(obj)) {
	    var len = checked(obj.length) | 0;
	    that = createBuffer(that, len);

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len);
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}
	Buffer.isBuffer = isBuffer;
	function internalIsBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	};

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length;
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length);
	  var pos = 0;
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i];
	    if (!internalIsBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos);
	    pos += buf.length;
	  }
	  return buffer
	};

	function byteLength (string, encoding) {
	  if (internalIsBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string;
	  }

	  var len = string.length;
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer.byteLength = byteLength;

	function slowToString (encoding, start, end) {
	  var loweredCase = false;

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0;
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length;
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0;
	  start >>>= 0;

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8';

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true;

	function swap (b, n, m) {
	  var i = b[n];
	  b[n] = b[m];
	  b[m] = i;
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length;
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1);
	  }
	  return this
	};

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length;
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3);
	    swap(this, i + 1, i + 2);
	  }
	  return this
	};

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length;
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7);
	    swap(this, i + 1, i + 6);
	    swap(this, i + 2, i + 5);
	    swap(this, i + 3, i + 4);
	  }
	  return this
	};

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0;
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	};

	Buffer.prototype.equals = function equals (b) {
	  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	};

	Buffer.prototype.inspect = function inspect () {
	  var str = '';
	  var max = INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>'
	};

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!internalIsBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0;
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0;
	  }
	  if (thisStart === undefined) {
	    thisStart = 0;
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length;
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0;
	  end >>>= 0;
	  thisStart >>>= 0;
	  thisEnd >>>= 0;

	  if (this === target) return 0

	  var x = thisEnd - thisStart;
	  var y = end - start;
	  var len = Math.min(x, y);

	  var thisCopy = this.slice(thisStart, thisEnd);
	  var targetCopy = target.slice(start, end);

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i];
	      y = targetCopy[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset;
	    byteOffset = 0;
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff;
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000;
	  }
	  byteOffset = +byteOffset;  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1);
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1;
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0;
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding);
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (internalIsBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf$1(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF; // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf$1(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf$1 (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1;
	  var arrLength = arr.length;
	  var valLength = val.length;

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase();
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2;
	      arrLength /= 2;
	      valLength /= 2;
	      byteOffset /= 2;
	    }
	  }

	  function read$$1 (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i;
	  if (dir) {
	    var foundIndex = -1;
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex;
	        foundIndex = -1;
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true;
	      for (var j = 0; j < valLength; j++) {
	        if (read$$1(arr, i + j) !== read$$1(val, j)) {
	          found = false;
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	};

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	};

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	};

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed;
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write$$1 (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset;
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0;
	    if (isFinite(length)) {
	      length = length | 0;
	      if (encoding === undefined) encoding = 'utf8';
	    } else {
	      encoding = length;
	      length = undefined;
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8';

	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	};

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return fromByteArray(buf)
	  } else {
	    return fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];

	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1;

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte;
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD;
	      bytesPerSequence = 1;
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000;
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
	      codePoint = 0xDC00 | codePoint & 0x3FF;
	    }

	    res.push(codePoint);
	    i += bytesPerSequence;
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    );
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F);
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length;

	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;

	  var out = '';
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i]);
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length;
	  start = ~~start;
	  end = end === undefined ? len : ~~end;

	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }

	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }

	  if (end < start) end = start;

	  var newBuf;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end);
	    newBuf.__proto__ = Buffer.prototype;
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start];
	    }
	  }

	  return newBuf
	};

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }

	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset]
	};

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | (this[offset + 1] << 8)
	};

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return (this[offset] << 8) | this[offset + 1]
	};

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	};

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	};

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	};

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | (this[offset + 1] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | (this[offset] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	};

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	};

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read(this, offset, true, 23, 4)
	};

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read(this, offset, false, 23, 4)
	};

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read(this, offset, true, 52, 8)
	};

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read(this, offset, false, 52, 8)
	};

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8;
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 1] = (value >>> 8);
	    this[offset] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = 0;
	  var mul = 1;
	  var sub = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = 0;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 0xff + value + 1;
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 3] = (value >>> 24);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (value < 0) value = 0xffffffff + value + 1;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
	  }
	  write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	};

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
	  }
	  write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }

	  var len = end - start;
	  var i;

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    );
	  }

	  return len
	};

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start;
	      start = 0;
	      end = this.length;
	    } else if (typeof end === 'string') {
	      encoding = end;
	      end = this.length;
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0);
	      if (code < 256) {
	        val = code;
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255;
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0;
	  end = end === undefined ? this.length : end >>> 0;

	  if (!val) val = 0;

	  var i;
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val;
	    }
	  } else {
	    var bytes = internalIsBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString());
	    var len = bytes.length;
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len];
	    }
	  }

	  return this
	};

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i);

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint;

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	        leadSurrogate = codePoint;
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	    }

	    leadSurrogate = null;

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint);
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF);
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }

	  return byteArray
	}


	function base64ToBytes (str) {
	  return toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i];
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}


	// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	function isBuffer(obj) {
	  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
	}

	function isFastBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
	}

	var pnglib = createCommonjsModule(function (module) {
	/**
	* A handy class to calculate color values.
	*
	* @version 1.0
	* @author Robert Eisele <robert@xarg.org>
	* @copyright Copyright (c) 2010, Robert Eisele
	* @link http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
	* @license http://www.opensource.org/licenses/bsd-license.php BSD License
	*
	*/

	(function() {

		// helper functions for that ctx
		function write(buffer, offs) {
			for (var i = 2; i < arguments.length; i++) {
				for (var j = 0; j < arguments[i].length; j++) {
					buffer[offs++] = arguments[i].charAt(j);
				}
			}
		}

		function byte2(w) {
			return String.fromCharCode((w >> 8) & 255, w & 255);
		}

		function byte4(w) {
			return String.fromCharCode((w >> 24) & 255, (w >> 16) & 255, (w >> 8) & 255, w & 255);
		}

		function byte2lsb(w) {
			return String.fromCharCode(w & 255, (w >> 8) & 255);
		}

		// modified from original source to support NPM
		var PNGlib = function(width,height,depth) {

			this.width   = width;
			this.height  = height;
			this.depth   = depth;

			// pixel data and row filter identifier size
			this.pix_size = height * (width + 1);

			// deflate header, pix_size, block headers, adler32 checksum
			this.data_size = 2 + this.pix_size + 5 * Math.floor((0xfffe + this.pix_size) / 0xffff) + 4;

			// offsets and sizes of Png chunks
			this.ihdr_offs = 0;									// IHDR offset and size
			this.ihdr_size = 4 + 4 + 13 + 4;
			this.plte_offs = this.ihdr_offs + this.ihdr_size;	// PLTE offset and size
			this.plte_size = 4 + 4 + 3 * depth + 4;
			this.trns_offs = this.plte_offs + this.plte_size;	// tRNS offset and size
			this.trns_size = 4 + 4 + depth + 4;
			this.idat_offs = this.trns_offs + this.trns_size;	// IDAT offset and size
			this.idat_size = 4 + 4 + this.data_size + 4;
			this.iend_offs = this.idat_offs + this.idat_size;	// IEND offset and size
			this.iend_size = 4 + 4 + 4;
			this.buffer_size  = this.iend_offs + this.iend_size;	// total PNG size

			this.buffer  = new Array();
			this.palette = new Object();
			this.pindex  = 0;

			var _crc32 = new Array();

			// initialize buffer with zero bytes
			for (var i = 0; i < this.buffer_size; i++) {
				this.buffer[i] = "\x00";
			}

			// initialize non-zero elements
			write(this.buffer, this.ihdr_offs, byte4(this.ihdr_size - 12), 'IHDR', byte4(width), byte4(height), "\x08\x03");
			write(this.buffer, this.plte_offs, byte4(this.plte_size - 12), 'PLTE');
			write(this.buffer, this.trns_offs, byte4(this.trns_size - 12), 'tRNS');
			write(this.buffer, this.idat_offs, byte4(this.idat_size - 12), 'IDAT');
			write(this.buffer, this.iend_offs, byte4(this.iend_size - 12), 'IEND');

			// initialize deflate header
			var header = ((8 + (7 << 4)) << 8) | (3 << 6);
			header+= 31 - (header % 31);

			write(this.buffer, this.idat_offs + 8, byte2(header));

			// initialize deflate block headers
			for (var i = 0; (i << 16) - 1 < this.pix_size; i++) {
				var size, bits;
				if (i + 0xffff < this.pix_size) {
					size = 0xffff;
					bits = "\x00";
				} else {
					size = this.pix_size - (i << 16) - i;
					bits = "\x01";
				}
				write(this.buffer, this.idat_offs + 8 + 2 + (i << 16) + (i << 2), bits, byte2lsb(size), byte2lsb(~size));
			}

			/* Create crc32 lookup table */
			for (var i = 0; i < 256; i++) {
				var c = i;
				for (var j = 0; j < 8; j++) {
					if (c & 1) {
						c = -306674912 ^ ((c >> 1) & 0x7fffffff);
					} else {
						c = (c >> 1) & 0x7fffffff;
					}
				}
				_crc32[i] = c;
			}

			// compute the index into a png for a given pixel
			this.index = function(x,y) {
				var i = y * (this.width + 1) + x + 1;
				var j = this.idat_offs + 8 + 2 + 5 * Math.floor((i / 0xffff) + 1) + i;
				return j;
			};

			// convert a color and build up the palette
			this.color = function(red, green, blue, alpha) {

				alpha = alpha >= 0 ? alpha : 255;
				var color = (((((alpha << 8) | red) << 8) | green) << 8) | blue;

				if (typeof this.palette[color] == "undefined") {
					if (this.pindex == this.depth) return "\x00";

					var ndx = this.plte_offs + 8 + 3 * this.pindex;

					this.buffer[ndx + 0] = String.fromCharCode(red);
					this.buffer[ndx + 1] = String.fromCharCode(green);
					this.buffer[ndx + 2] = String.fromCharCode(blue);
					this.buffer[this.trns_offs+8+this.pindex] = String.fromCharCode(alpha);

					this.palette[color] = String.fromCharCode(this.pindex++);
				}
				return this.palette[color];
			};

			// output a PNG string, Base64 encoded
			this.getBase64 = function() {

				var s = this.getDump();

				var ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
				var c1, c2, c3, e1, e2, e3, e4;
				var l = s.length;
				var i = 0;
				var r = "";

				do {
					c1 = s.charCodeAt(i);
					e1 = c1 >> 2;
					c2 = s.charCodeAt(i+1);
					e2 = ((c1 & 3) << 4) | (c2 >> 4);
					c3 = s.charCodeAt(i+2);
					if (l < i+2) { e3 = 64; } else { e3 = ((c2 & 0xf) << 2) | (c3 >> 6); }
					if (l < i+3) { e4 = 64; } else { e4 = c3 & 0x3f; }
					r+= ch.charAt(e1) + ch.charAt(e2) + ch.charAt(e3) + ch.charAt(e4);
				} while ((i+= 3) < l);
				return r;
			};

			// output a PNG string
			this.getDump = function() {

				// compute adler32 of output pixels + row filter bytes
				var BASE = 65521; /* largest prime smaller than 65536 */
				var NMAX = 5552;  /* NMAX is the largest n such that 255n(n+1)/2 + (n+1)(BASE-1) <= 2^32-1 */
				var s1 = 1;
				var s2 = 0;
				var n = NMAX;

				for (var y = 0; y < this.height; y++) {
					for (var x = -1; x < this.width; x++) {
						s1+= this.buffer[this.index(x, y)].charCodeAt(0);
						s2+= s1;
						if ((n-= 1) == 0) {
							s1%= BASE;
							s2%= BASE;
							n = NMAX;
						}
					}
				}
				s1%= BASE;
				s2%= BASE;
				write(this.buffer, this.idat_offs + this.idat_size - 8, byte4((s2 << 16) | s1));

				// compute crc32 of the PNG chunks
				function crc32(png, offs, size) {
					var crc = -1;
					for (var i = 4; i < size-4; i += 1) {
						crc = _crc32[(crc ^ png[offs+i].charCodeAt(0)) & 0xff] ^ ((crc >> 8) & 0x00ffffff);
					}
					write(png, offs+size-4, byte4(crc ^ -1));
				}

				crc32(this.buffer, this.ihdr_offs, this.ihdr_size);
				crc32(this.buffer, this.plte_offs, this.plte_size);
				crc32(this.buffer, this.trns_offs, this.trns_size);
				crc32(this.buffer, this.idat_offs, this.idat_size);
				crc32(this.buffer, this.iend_offs, this.iend_size);

				// convert PNG to string
				return "\x89PNG\r\n\x1a\n"+this.buffer.join('');
			};
		};

		// modified from original source to support NPM
		{
			module.exports = PNGlib;
		}
	})();
	});

	var identicon = createCommonjsModule(function (module) {
	/**
	 * Identicon.js 2.3.3
	 * http://github.com/stewartlord/identicon.js
	 *
	 * PNGLib required for PNG output
	 * http://www.xarg.org/download/pnglib.js
	 *
	 * Copyright 2018, Stewart Lord
	 * Released under the BSD license
	 * http://www.opensource.org/licenses/bsd-license.php
	 */

	(function() {
	    var PNGlib;
	    {
	        PNGlib = pnglib;
	    }

	    var Identicon = function(hash, options){
	        if (typeof(hash) !== 'string' || hash.length < 15) {
	            throw 'A hash of at least 15 characters is required.';
	        }

	        this.defaults = {
	            background: [240, 240, 240, 255],
	            margin:     0.08,
	            size:       64,
	            saturation: 0.7,
	            brightness: 0.5,
	            format:     'png'
	        };

	        this.options = typeof(options) === 'object' ? options : this.defaults;

	        // backward compatibility with old constructor (hash, size, margin)
	        if (typeof(arguments[1]) === 'number') { this.options.size   = arguments[1]; }
	        if (arguments[2])                      { this.options.margin = arguments[2]; }

	        this.hash        = hash;
	        this.background  = this.options.background || this.defaults.background;
	        this.size        = this.options.size       || this.defaults.size;
	        this.format      = this.options.format     || this.defaults.format;
	        this.margin      = this.options.margin !== undefined ? this.options.margin : this.defaults.margin;

	        // foreground defaults to last 7 chars as hue at 70% saturation, 50% brightness
	        var hue          = parseInt(this.hash.substr(-7), 16) / 0xfffffff;
	        var saturation   = this.options.saturation || this.defaults.saturation;
	        var brightness   = this.options.brightness || this.defaults.brightness;
	        this.foreground  = this.options.foreground || this.hsl2rgb(hue, saturation, brightness);
	    };

	    Identicon.prototype = {
	        background: null,
	        foreground: null,
	        hash:       null,
	        margin:     null,
	        size:       null,
	        format:     null,

	        image: function(){
	            return this.isSvg()
	                ? new Svg(this.size, this.foreground, this.background)
	                : new PNGlib(this.size, this.size, 256);
	        },

	        render: function(){
	            var image      = this.image(),
	                size       = this.size,
	                baseMargin = Math.floor(size * this.margin),
	                cell       = Math.floor((size - (baseMargin * 2)) / 5),
	                margin     = Math.floor((size - cell * 5) / 2),
	                bg         = image.color.apply(image, this.background),
	                fg         = image.color.apply(image, this.foreground);

	            // the first 15 characters of the hash control the pixels (even/odd)
	            // they are drawn down the middle first, then mirrored outwards
	            var i, color;
	            for (i = 0; i < 15; i++) {
	                color = parseInt(this.hash.charAt(i), 16) % 2 ? bg : fg;
	                if (i < 5) {
	                    this.rectangle(2 * cell + margin, i * cell + margin, cell, cell, color, image);
	                } else if (i < 10) {
	                    this.rectangle(1 * cell + margin, (i - 5) * cell + margin, cell, cell, color, image);
	                    this.rectangle(3 * cell + margin, (i - 5) * cell + margin, cell, cell, color, image);
	                } else if (i < 15) {
	                    this.rectangle(0 * cell + margin, (i - 10) * cell + margin, cell, cell, color, image);
	                    this.rectangle(4 * cell + margin, (i - 10) * cell + margin, cell, cell, color, image);
	                }
	            }

	            return image;
	        },

	        rectangle: function(x, y, w, h, color, image){
	            if (this.isSvg()) {
	                image.rectangles.push({x: x, y: y, w: w, h: h, color: color});
	            } else {
	                var i, j;
	                for (i = x; i < x + w; i++) {
	                    for (j = y; j < y + h; j++) {
	                        image.buffer[image.index(i, j)] = color;
	                    }
	                }
	            }
	        },

	        // adapted from: https://gist.github.com/aemkei/1325937
	        hsl2rgb: function(h, s, b){
	            h *= 6;
	            s = [
	                b += s *= b < .5 ? b : 1 - b,
	                b - h % 1 * s * 2,
	                b -= s *= 2,
	                b,
	                b + h % 1 * s,
	                b + s
	            ];

	            return [
	                s[ ~~h    % 6 ] * 255, // red
	                s[ (h|16) % 6 ] * 255, // green
	                s[ (h|8)  % 6 ] * 255  // blue
	            ];
	        },

	        toString: function(raw){
	            // backward compatibility with old toString, default to base64
	            if (raw) {
	                return this.render().getDump();
	            } else {
	                return this.render().getBase64();
	            }
	        },

	        isSvg: function(){
	            return this.format.match(/svg/i)
	        }
	    };

	    var Svg = function(size, foreground, background){
	        this.size       = size;
	        this.foreground = this.color.apply(this, foreground);
	        this.background = this.color.apply(this, background);
	        this.rectangles = [];
	    };

	    Svg.prototype = {
	        size:       null,
	        foreground: null,
	        background: null,
	        rectangles: null,

	        color: function(r, g, b, a){
	            var values = [r, g, b].map(Math.round);
	            values.push((a >= 0) && (a <= 255) ? a/255 : 1);
	            return 'rgba(' + values.join(',') + ')';
	        },

	        getDump: function(){
	          var i,
	                xml,
	                rect,
	                fg     = this.foreground,
	                bg     = this.background,
	                stroke = this.size * 0.005;

	            xml = "<svg xmlns='http://www.w3.org/2000/svg'"
	                + " width='" + this.size + "' height='" + this.size + "'"
	                + " style='background-color:" + bg + ";'>"
	                + "<g style='fill:" + fg + "; stroke:" + fg + "; stroke-width:" + stroke + ";'>";

	            for (i = 0; i < this.rectangles.length; i++) {
	                rect = this.rectangles[i];
	                if (rect.color == bg) continue;
	                xml += "<rect "
	                    + " x='"      + rect.x + "'"
	                    + " y='"      + rect.y + "'"
	                    + " width='"  + rect.w + "'"
	                    + " height='" + rect.h + "'"
	                    + "/>";
	            }
	            xml += "</g></svg>";

	            return xml;
	        },

	        getBase64: function(){
	            if ('function' === typeof btoa) {
	                return btoa(this.getDump());
	            } else if (Buffer) {
	                return new Buffer(this.getDump(), 'binary').toString('base64');
	            } else {
	                throw 'Cannot generate base64 output';
	            }
	        }
	    };

	    {
	        module.exports = Identicon;
	    }
	})();
	});

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

	/**
	* A simple key-value pair with helper functions.
	*
	* Constructor: new Attribute(value), new Attribute(type, value) or new Attribute({type, value})
	*/

	var Attribute = function () {
	  /**
	  * @param {string} a
	  * @param {string} b
	  */
	  function Attribute(a, b) {
	    _classCallCheck(this, Attribute);

	    if (typeof a === 'object') {
	      if (typeof a.value !== 'string') {
	        throw new Error('param1.value must be a string, got ' + _typeof(a.value) + ': ' + _JSON$stringify(a.value));
	      }
	      if (typeof a.type !== 'string') {
	        throw new Error('param1.type must be a string, got ' + _typeof(a.type) + ': ' + _JSON$stringify(a.type));
	      }
	      b = a.value;
	      a = a.type;
	    }
	    if (typeof a !== 'string') {
	      throw new Error('First param must be a string, got ' + (typeof a === 'undefined' ? 'undefined' : _typeof(a)) + ': ' + _JSON$stringify(a));
	    }
	    if (!a.length) {
	      throw new Error('First param string is empty');
	    }
	    if (b) {
	      if (typeof b !== 'string') {
	        throw new Error('Second parameter must be a string, got ' + (typeof b === 'undefined' ? 'undefined' : _typeof(b)) + ': ' + _JSON$stringify(b));
	      }
	      if (!b.length) {
	        throw new Error('Second param string is empty');
	      }
	      this.type = a;
	      this.value = b;
	    } else {
	      this.value = a;
	      var t = Attribute.guessTypeOf(this.value);
	      if (t) {
	        this.type = t;
	      } else {
	        throw new Error('Type of attribute was omitted and could not be guessed');
	      }
	    }
	  }

	  /**
	  * @returns {Attribute} uuid
	  */


	  Attribute.getUuid = function getUuid() {
	    var b = function b(a) {
	      return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
	    };
	    return new Attribute('uuid', b());
	  };

	  /**
	  * @returns {Object} an object with attribute types as keys and regex patterns as values
	  */


	  Attribute.getUniqueIdValidators = function getUniqueIdValidators() {
	    return UNIQUE_ID_VALIDATORS;
	  };

	  /**
	  * @param {string} type attribute type
	  * @returns {boolean} true if the attribute type is unique
	  */


	  Attribute.isUniqueType = function isUniqueType(type) {
	    return _Object$keys(UNIQUE_ID_VALIDATORS).indexOf(type) > -1;
	  };

	  /**
	  * @returns {boolean} true if the attribute type is unique
	  */


	  Attribute.prototype.isUniqueType = function isUniqueType() {
	    return Attribute.isUniqueType(this.type);
	  };

	  /**
	  * @param {string} value guess type of this attribute value
	  * @returns {string} type of attribute value or undefined
	  */


	  Attribute.guessTypeOf = function guessTypeOf(value) {
	    for (var key in UNIQUE_ID_VALIDATORS) {
	      if (value.match(UNIQUE_ID_VALIDATORS[key])) {
	        return key;
	      }
	    }
	  };

	  /**
	  * @param {Attribute} a
	  * @param {Attribute} b
	  * @returns {boolean} true if params are equal
	  */


	  Attribute.equals = function equals(a, b) {
	    return a.equals(b);
	  };

	  /**
	  * @param {Attribute} a attribute to compare to
	  * @returns {boolean} true if attribute matches param
	  */


	  Attribute.prototype.equals = function equals(a) {
	    return a && this.type === a.type && this.value === a.value;
	  };

	  /**
	  * @returns {string} uri - `${encodeURIComponent(this.value)}:${encodeURIComponent(this.type)}`
	  * @example
	  * user%20example.com:email
	  */


	  Attribute.prototype.uri = function uri() {
	    return encodeURIComponent(this.value) + ':' + encodeURIComponent(this.type);
	  };

	  Attribute.prototype.identiconXml = function identiconXml() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    return util.getHash(encodeURIComponent(this.type) + ':' + encodeURIComponent(this.value), 'hex').then(function (hash) {
	      var identicon$$1 = new identicon(hash, { width: options.width, format: 'svg' });
	      return identicon$$1.toString(true);
	    });
	  };

	  Attribute.prototype.identiconSrc = function identiconSrc() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    return util.getHash(encodeURIComponent(this.type) + ':' + encodeURIComponent(this.value), 'hex').then(function (hash) {
	      var identicon$$1 = new identicon(hash, { width: options.width, format: 'svg' });
	      return 'data:image/svg+xml;base64,' + identicon$$1.toString();
	    });
	  };

	  /**
	  * Generate a visually recognizable representation of the attribute
	  * @param {object} options {width}
	  * @returns {HTMLElement} identicon div element
	  */


	  Attribute.prototype.identicon = function identicon$$1() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    options = _Object$assign({
	      width: 50,
	      showType: true
	    }, options);
	    util.injectCss(); // some other way that is not called on each identicon generation?

	    var div = document.createElement('div');
	    div.className = 'iris-identicon';
	    div.style.width = options.width + 'px';
	    div.style.height = options.width + 'px';

	    var img = document.createElement('img');
	    img.alt = '';
	    img.width = options.width;
	    img.height = options.width;
	    this.identiconSrc(options).then(function (src) {
	      return img.src = src;
	    });

	    if (options.showType) {
	      var name = document.createElement('span');
	      name.className = 'iris-distance';
	      name.style.fontSize = options.width > 50 ? options.width / 4 + 'px' : '10px';
	      name.textContent = this.type.slice(0, 5);
	      div.appendChild(name);
	    }

	    div.appendChild(img);

	    return div;
	  };

	  return Attribute;
	}();

	// eslint-disable-line no-unused-vars

	var myKey = void 0;

	/**
	* Key management utils. Wraps GUN's Gun.SEA. https://gun.eco/docs/Gun.SEA
	*/

	var Key = function () {
	  function Key() {
	    _classCallCheck(this, Key);
	  }

	  /**
	  * Load default key from datadir/private.key on node.js or from local storage 'iris.myKey' in browser.
	  *
	  * If default key does not exist, it is generated.
	  * @param {string} datadir directory to find key from. In browser, localStorage is used instead.
	  * @returns {Promise<Object>} keypair object
	  */
	  Key.getDefault = async function getDefault() {
	    var datadir = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '.';
	    var keyfile = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'identifi.key';

	    if (myKey) {
	      return myKey;
	    }
	    if (util.isNode) {
	      var fs = require('fs');
	      var privKeyFile = datadir + '/' + keyfile;
	      if (fs.existsSync(privKeyFile)) {
	        var f = fs.readFileSync(privKeyFile, 'utf8');
	        myKey = Key.fromString(f);
	      } else {
	        var newKey = await Key.generate();
	        myKey = myKey || newKey; // eslint-disable-line require-atomic-updates
	        fs.writeFileSync(privKeyFile, Key.toString(myKey));
	        fs.chmodSync(privKeyFile, 400);
	      }
	      if (!myKey) {
	        throw new Error('loading default key failed - check ' + datadir + '/' + keyfile);
	      }
	    } else {
	      var str = window.localStorage.getItem('iris.myKey');
	      if (str) {
	        myKey = Key.fromString(str);
	      } else {
	        var _newKey = await Key.generate();
	        myKey = myKey || _newKey; // eslint-disable-line require-atomic-updates
	        window.localStorage.setItem('iris.myKey', Key.toString(myKey));
	      }
	      if (!myKey) {
	        throw new Error('loading default key failed - check localStorage iris.myKey');
	      }
	    }
	    return myKey;
	  };

	  /**
	  * Serialize key as JSON string
	  * @param {Object} key key to serialize
	  * @returns {String} JSON Web Key string
	  */


	  Key.toString = function toString(key) {
	    return _JSON$stringify(key);
	  };

	  /**
	  * Get keyID
	  * @param {Object} key key to get an id for. Currently just returns the public key string.
	  * @returns {String} public key string
	  */


	  Key.getId = function getId(key) {
	    if (!(key && key.pub)) {
	      throw new Error('missing param');
	    }
	    return key.pub; // hack until GUN supports lookups by keyID
	    //return util.getHash(key.pub);
	  };

	  /**
	  * Get a keypair from a JSON string.
	  * @param {String} str key JSON
	  * @returns {Object} Gun.SEA keypair object
	  */


	  Key.fromString = function fromString(str) {
	    return JSON.parse(str);
	  };

	  /**
	  * Generate a new keypair
	  * @returns {Promise<Object>} Gun.SEA keypair object
	  */


	  Key.generate = function generate() {
	    return Gun.SEA.pair();
	  };

	  /**
	  * Sign a message
	  * @param {String} msg message to sign
	  * @param {Object} pair signing keypair
	  * @returns {Promise<String>} signed message string
	  */


	  Key.sign = async function sign(msg, pair) {
	    var sig = await Gun.SEA.sign(msg, pair);
	    return 'a' + sig;
	  };

	  /**
	  * Verify a signed message
	  * @param {String} msg message to verify
	  * @param {Object} pubKey public key of the signer
	  * @returns {Promise<String>} signature string
	  */


	  Key.verify = function verify(msg, pubKey) {
	    return Gun.SEA.verify(msg.slice(1), pubKey);
	  };

	  return Key;
	}();

	var errorMsg = 'Invalid  message:';

	var ValidationError = function (_Error) {
	  _inherits(ValidationError, _Error);

	  function ValidationError() {
	    _classCallCheck(this, ValidationError);

	    return _possibleConstructorReturn(this, _Error.apply(this, arguments));
	  }

	  return ValidationError;
	}(Error);

	/**
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
	* "Rating" type messages, when added to an SocialNetwork, can add or remove Identities from the web of trust. Verification/unverification messages can add or remove Attributes from an Contact. Other types of messages such as social media "post" are just indexed by their author, recipient and time.
	*
	* Constructor: creates a message from the param obj.signedData that must contain at least the mandatory fields: author, recipient, type and time. You can use createRating() and createVerification() to automatically populate some of these fields and optionally sign the message.
	* @param obj
	*
	* @example
	* https://github.com/irislib/iris-lib/blob/master/__tests__/SignedMessage.js
	*
	* Rating message:
	* {
	*   signedData: {
	*     author: {name:'Alice', key:'ABCD1234'},
	*     recipient: {name:'Bob', email:'bob@example.com'},
	*     type: 'rating',
	*     rating: 1,
	*     maxRating: 10,
	*     minRating: -10,
	*     text: 'Traded 1 BTC'
	*   },
	*   signer: 'ABCD1234',
	*   signature: '1234ABCD'
	* }
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


	var SignedMessage = function () {
	  function SignedMessage(obj) {
	    _classCallCheck(this, SignedMessage);

	    if (obj.signedData) {
	      this.signedData = obj.signedData;
	    }
	    if (obj.pubKey) {
	      this.pubKey = obj.pubKey;
	    }
	    if (obj.ipfsUri) {
	      this.ipfsUri = obj.ipfsUri;
	    }
	    if (obj.sig) {
	      if (typeof obj.sig !== 'string') {
	        throw new ValidationError('SignedMessage signature must be a string');
	      }
	      this.sig = obj.sig;
	      this.getHash();
	    }
	    this._validate();
	  }

	  SignedMessage._getArray = function _getArray(authorOrRecipient) {
	    var arr = [];
	    var keys = _Object$keys(authorOrRecipient);
	    for (var i = 0; i < keys.length; i++) {
	      var type = keys[i];
	      var value = authorOrRecipient[keys[i]];
	      if (typeof value === 'string') {
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

	    return _ref = {}, _ref[_Symbol$iterator] = /*#__PURE__*/regenerator.mark(function _callee() {
	      var keys, i, type, value, j, elementValue;
	      return regenerator.wrap(function _callee$(_context) {
	        while (1) {
	          switch (_context.prev = _context.next) {
	            case 0:
	              keys = _Object$keys(authorOrRecipient);
	              i = 0;

	            case 2:
	              if (!(i < keys.length)) {
	                _context.next = 21;
	                break;
	              }

	              type = keys[i];
	              value = authorOrRecipient[keys[i]];

	              if (!(typeof value === 'string')) {
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
	            case 'end':
	              return _context.stop();
	          }
	        }
	      }, _callee, this);
	    }), _ref;
	  };

	  /**
	  * @returns {object} Javascript iterator over author attributes
	  */


	  SignedMessage.prototype.getAuthorIterable = function getAuthorIterable() {
	    return SignedMessage._getIterable(this.signedData.author);
	  };

	  /**
	  * @returns {object} Javascript iterator over recipient attributes
	  */


	  SignedMessage.prototype.getRecipientIterable = function getRecipientIterable() {
	    return SignedMessage._getIterable(this.signedData.recipient);
	  };

	  /**
	  * @returns {array} Array containing author attributes
	  */


	  SignedMessage.prototype.getAuthorArray = function getAuthorArray() {
	    return SignedMessage._getArray(this.signedData.author);
	  };

	  /**
	  * @returns {array} Array containing recipient attributes
	  */


	  SignedMessage.prototype.getRecipientArray = function getRecipientArray() {
	    return this.signedData.recipient ? SignedMessage._getArray(this.signedData.recipient) : [];
	  };

	  /**
	  * @returns {string} SignedMessage signer keyID, i.e. base64 hash of public key
	  */


	  SignedMessage.prototype.getSignerKeyID = function getSignerKeyID() {
	    return this.pubKey; // hack until gun supports keyID lookups
	    //return util.getHash(this.pubKey);
	  };

	  SignedMessage.prototype._validate = function _validate() {
	    if (!this.signedData) {
	      throw new ValidationError(errorMsg + ' Missing signedData');
	    }
	    if (typeof this.signedData !== 'object') {
	      throw new ValidationError(errorMsg + ' signedData must be an object');
	    }
	    var d = this.signedData;

	    if (!d.type) {
	      throw new ValidationError(errorMsg + ' Missing type definition');
	    }
	    if (!d.author) {
	      throw new ValidationError(errorMsg + ' Missing author');
	    }
	    if (typeof d.author !== 'object') {
	      throw new ValidationError(errorMsg + ' Author must be object');
	    }
	    if (Array.isArray(d.author)) {
	      throw new ValidationError(errorMsg + ' Author must not be an array');
	    }
	    if (_Object$keys(d.author).length === 0) {
	      throw new ValidationError(errorMsg + ' Author empty');
	    }
	    if (this.pubKey) {
	      this.signerKeyHash = this.getSignerKeyID();
	    }
	    for (var attr in d.author) {
	      var t = _typeof(d.author[attr]);
	      if (t !== 'string') {
	        if (Array.isArray(d.author[attr])) {
	          for (var i = 0; i < d.author[attr].length; i++) {
	            if (typeof d.author[attr][i] !== 'string') {
	              throw new ValidationError(errorMsg + ' Author attribute must be string, got ' + attr + ': [' + d.author[attr][i] + ']');
	            }
	            if (d.author[attr][i].length === 0) {
	              throw new ValidationError(errorMsg + ' author ' + attr + ' in array[' + i + '] is empty');
	            }
	          }
	        } else {
	          throw new ValidationError(errorMsg + ' Author attribute must be string or array, got ' + attr + ': ' + d.author[attr]);
	        }
	      }
	      if (attr === 'keyID') {
	        if (t !== 'string') {
	          throw new ValidationError(errorMsg + ' Author keyID must be string, got ' + t);
	        }
	        if (this.signerKeyHash && d.author[attr] !== this.signerKeyHash) {
	          throw new ValidationError(errorMsg + ' If message has a keyID author, it must be signed by the same key');
	        }
	      }
	    }
	    if (d.recipient) {
	      if (typeof d.recipient !== 'object') {
	        throw new ValidationError(errorMsg + ' Recipient must be object');
	      }
	      if (Array.isArray(d.recipient)) {
	        throw new ValidationError(errorMsg + ' Recipient must not be an array');
	      }
	      if (_Object$keys(d.recipient).length === 0) {
	        throw new ValidationError(errorMsg + ' Recipient empty');
	      }
	      for (var _attr in d.recipient) {
	        var _t = _typeof(d.recipient[_attr]);
	        if (_t !== 'string') {
	          if (Array.isArray(d.recipient[_attr])) {
	            for (var _i = 0; _i < d.recipient[_attr].length; _i++) {
	              if (typeof d.recipient[_attr][_i] !== 'string') {
	                throw new ValidationError(errorMsg + ' Recipient attribute must be string, got ' + _attr + ': [' + d.recipient[_attr][_i] + ']');
	              }
	              if (d.recipient[_attr][_i].length === 0) {
	                throw new ValidationError(errorMsg + ' recipient ' + _attr + ' in array[' + _i + '] is empty');
	              }
	            }
	          } else {
	            throw new ValidationError(errorMsg + ' Recipient attribute must be string or array, got ' + _attr + ': ' + d.recipient[_attr]);
	          }
	        }
	      }
	    }
	    if (!(d.time || d.timestamp)) {
	      throw new ValidationError(errorMsg + ' Missing time field');
	    }

	    if (!Date.parse(d.time || d.timestamp)) {
	      throw new ValidationError(errorMsg + ' Invalid time field');
	    }

	    if (d.type === 'rating') {
	      if (isNaN(d.rating)) {
	        throw new ValidationError(errorMsg + ' Invalid rating');
	      }
	      if (isNaN(d.maxRating)) {
	        throw new ValidationError(errorMsg + ' Invalid maxRating');
	      }
	      if (isNaN(d.minRating)) {
	        throw new ValidationError(errorMsg + ' Invalid minRating');
	      }
	      if (d.rating > d.maxRating) {
	        throw new ValidationError(errorMsg + ' Rating is above maxRating');
	      }
	      if (d.rating < d.minRating) {
	        throw new ValidationError(errorMsg + ' Rating is below minRating');
	      }
	      if (typeof d.context !== 'string' || !d.context.length) {
	        throw new ValidationError(errorMsg + ' Rating messages must have a context field');
	      }
	    }

	    if (d.type === 'verification' || d.type === 'unverification') {
	      if (d.recipient.length < 2) {
	        throw new ValidationError(errorMsg + ' At least 2 recipient attributes are needed for a connection / disconnection. Got: ' + d.recipient);
	      }
	    }

	    return true;
	  };

	  /**
	  * @returns {boolean} true if message has a positive rating
	  */


	  SignedMessage.prototype.isPositive = function isPositive() {
	    return this.signedData.type === 'rating' && this.signedData.rating > (this.signedData.maxRating + this.signedData.minRating) / 2;
	  };

	  /**
	  * @returns {boolean} true if message has a negative rating
	  */


	  SignedMessage.prototype.isNegative = function isNegative() {
	    return this.signedData.type === 'rating' && this.signedData.rating < (this.signedData.maxRating + this.signedData.minRating) / 2;
	  };

	  /**
	  * @returns {boolean} true if message has a neutral rating
	  */


	  SignedMessage.prototype.isNeutral = function isNeutral() {
	    return this.signedData.type === 'rating' && this.signedData.rating === (this.signedData.maxRating + this.signedData.minRating) / 2;
	  };

	  /**
	  * @param {Object} key Gun.SEA keypair to sign the message with
	  */


	  SignedMessage.prototype.sign = async function sign(key) {
	    this.sig = await Key.sign(this.signedData, key);
	    this.pubKey = key.pub;
	    await this.getHash();
	    return true;
	  };

	  /**
	  * Create an iris message. SignedMessage time is automatically set. If signingKey is specified and author omitted, signingKey will be used as author.
	  * @param {Object} signedData message data object including author, recipient and other possible attributes
	  * @param {Object} signingKey optionally, you can set the key to sign the message with
	  * @returns {Promise<SignedMessage>}  message
	  */


	  SignedMessage.create = async function create(signedData, signingKey) {
	    if (!signedData.author && signingKey) {
	      signedData.author = { keyID: Key.getId(signingKey) };
	    }
	    signedData.time = signedData.time || new Date().toISOString();
	    var m = new SignedMessage({ signedData: signedData });
	    if (signingKey) {
	      await m.sign(signingKey);
	    }
	    return m;
	  };

	  /**
	  * Create an  verification message. SignedMessage signedData's type and time are automatically set. Recipient must be set. If signingKey is specified and author omitted, signingKey will be used as author.
	  * @returns {Promise<Object>} message object promise
	  */


	  SignedMessage.createVerification = function createVerification(signedData, signingKey) {
	    signedData.type = 'verification';
	    return SignedMessage.create(signedData, signingKey);
	  };

	  /**
	  * Create an  rating message. SignedMessage signedData's type, maxRating, minRating, time and context are set automatically. Recipient and rating must be set. If signingKey is specified and author omitted, signingKey will be used as author.
	  * @returns {Promise<Object>} message object promise
	  */


	  SignedMessage.createRating = function createRating(signedData, signingKey) {
	    signedData.type = 'rating';
	    signedData.context = signedData.context || 'iris';
	    signedData.maxRating = signedData.maxRating || 10;
	    signedData.minRating = signedData.minRating || -10;
	    return SignedMessage.create(signedData, signingKey);
	  };

	  /**
	  * @param {Index} index index to look up the message author from
	  * @returns {Contact} message author identity
	  */


	  SignedMessage.prototype.getAuthor = function getAuthor(index) {
	    for (var _iterator = this.getAuthorIterable(), _isArray = Array.isArray(_iterator), _i2 = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
	      var _ref2;

	      if (_isArray) {
	        if (_i2 >= _iterator.length) break;
	        _ref2 = _iterator[_i2++];
	      } else {
	        _i2 = _iterator.next();
	        if (_i2.done) break;
	        _ref2 = _i2.value;
	      }

	      var a = _ref2;

	      if (a.isUniqueType()) {
	        return index.getContacts(a);
	      }
	    }
	  };

	  /**
	  * @param {Index} index index to look up the message recipient from
	  * @returns {Contact} message recipient identity or undefined
	  */


	  SignedMessage.prototype.getRecipient = function getRecipient(index) {
	    if (!this.signedData.recipient) {
	      return undefined;
	    }
	    for (var _iterator2 = this.getRecipientIterable(), _isArray2 = Array.isArray(_iterator2), _i3 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
	      var _ref3;

	      if (_isArray2) {
	        if (_i3 >= _iterator2.length) break;
	        _ref3 = _iterator2[_i3++];
	      } else {
	        _i3 = _iterator2.next();
	        if (_i3.done) break;
	        _ref3 = _i3.value;
	      }

	      var a = _ref3;

	      if (a.isUniqueType()) {
	        return index.getContacts(a);
	      }
	    }
	  };

	  /**
	  * @returns {string} base64 sha256 hash of message
	  */


	  SignedMessage.prototype.getHash = async function getHash() {
	    if (this.sig && !this.hash) {
	      this.hash = await util.getHash(this.sig);
	    }
	    return this.hash;
	  };

	  SignedMessage.prototype.getId = function getId() {
	    return this.getHash();
	  };

	  SignedMessage.fromSig = async function fromSig(obj) {
	    if (!obj.sig) {
	      throw new Error('Missing signature in object:', obj);
	    }
	    if (!obj.pubKey) {
	      throw new Error('Missing pubKey in object:');
	    }
	    var signedData = await Key.verify(obj.sig, obj.pubKey);
	    var o = { signedData: signedData, sig: obj.sig, pubKey: obj.pubKey };
	    return new SignedMessage(o);
	  };

	  /**
	  * @return {boolean} true if message signature is valid. Otherwise throws ValidationError.
	  */


	  SignedMessage.prototype.verify = async function verify() {
	    if (!this.pubKey) {
	      throw new ValidationError(errorMsg + ' SignedMessage has no .pubKey');
	    }
	    if (!this.sig) {
	      throw new ValidationError(errorMsg + ' SignedMessage has no .sig');
	    }
	    this.signedData = await Key.verify(this.sig, this.pubKey);
	    if (!this.signedData) {
	      throw new ValidationError(errorMsg + ' Invalid signature');
	    }
	    if (this.hash) {
	      if (this.hash !== (await util.getHash(this.sig))) {
	        throw new ValidationError(errorMsg + ' Invalid message hash');
	      }
	    } else {
	      this.getHash();
	    }
	    return true;
	  };

	  /**
	  *
	  */


	  SignedMessage.prototype.saveToIpfs = async function saveToIpfs(ipfs) {
	    var s = this.toString();
	    var r = await ipfs.add(ipfs.types.Buffer.from(s));
	    if (r.length) {
	      this.ipfsUri = r[0].hash;
	    }
	    return this.ipfsUri;
	  };

	  /**
	  *
	  */


	  SignedMessage.loadFromIpfs = async function loadFromIpfs(ipfs, uri) {
	    var f = await ipfs.cat(uri);
	    var s = ipfs.types.Buffer.from(f).toString('utf8');
	    try {
	      return SignedMessage.fromString(s);
	    } catch (e) {
	      console.log('loading message from ipfs failed');
	      return _Promise.reject();
	    }
	  };

	  /**
	  * @returns {string} JSON string of signature and public key
	  */


	  SignedMessage.prototype.serialize = function serialize() {
	    return { sig: this.sig, pubKey: this.pubKey };
	  };

	  SignedMessage.prototype.toString = function toString() {
	    return _JSON$stringify(this.serialize());
	  };

	  /**
	  * @returns {Promise<SignedMessage>} message from JSON string produced by toString
	  */


	  SignedMessage.deserialize = async function deserialize(s) {
	    return SignedMessage.fromSig(s);
	  };

	  SignedMessage.fromString = async function fromString(s) {
	    return SignedMessage.fromSig(JSON.parse(s));
	  };

	  /**
	  *
	  */


	  SignedMessage.setReaction = async function setReaction(gun, msg, reaction) {
	    var hash = await msg.getHash();
	    gun.get('reactions').get(hash).put(reaction);
	    gun.get('reactions').get(hash).put(reaction);
	    gun.get('messagesByHash').get(hash).get('reactions').get(this.rootContact.value).put(reaction);
	    gun.get('messagesByHash').get(hash).get('reactions').get(this.rootContact.value).put(reaction);
	  };

	  return SignedMessage;
	}();

	/**
	* An Iris Contact, such as person, organization or group. More abstractly speaking: an Identity.
	*
	* Usually you don't create Contacts yourself, but get them
	* from SocialNetwork methods such as get() and search().
	*/

	var Contact = function () {
	  /**
	  * @param {Object} gun node where the Contact data lives
	  */
	  function Contact(gun, linkTo) {
	    _classCallCheck(this, Contact);

	    this.gun = gun;
	    this.linkTo = linkTo;
	  }

	  Contact.create = function create(gun, data, index) {
	    if (!data.linkTo && !data.attrs) {
	      throw new Error('You must specify either data.linkTo or data.attrs');
	    }
	    if (data.linkTo && !data.attrs) {
	      var linkTo = new Attribute(data.linkTo);
	      data.attrs = {};
	      if (!Object.prototype.hasOwnProperty.call(data.attrs, linkTo.uri())) {
	        data.attrs[linkTo.uri()] = linkTo;
	      }
	    } else {
	      data.linkTo = Contact.getLinkTo(data.attrs);
	    }
	    var uri = data.linkTo.uri();
	    var attrs = gun.top(uri + '/attrs').put(data.attrs);
	    delete data['attrs'];
	    gun.put(data);
	    gun.get('attrs').put(attrs);
	    return new Contact(gun, uri, index);
	  };

	  Contact.getLinkTo = function getLinkTo(attrs) {
	    var mva = Contact.getMostVerifiedAttributes(attrs);
	    var keys = _Object$keys(mva);
	    var linkTo = void 0;
	    for (var i = 0; i < keys.length; i++) {
	      if (keys[i] === 'keyID') {
	        linkTo = mva[keys[i]].attribute;
	        break;
	      } else if (Attribute.isUniqueType(keys[i])) {
	        linkTo = mva[keys[i]].attribute;
	      }
	    }
	    return linkTo;
	  };

	  Contact.getMostVerifiedAttributes = function getMostVerifiedAttributes(attrs) {
	    var mostVerifiedAttributes = {};
	    _Object$keys(attrs).forEach(function (k) {
	      var a = attrs[k];
	      var keyExists = _Object$keys(mostVerifiedAttributes).indexOf(a.type) > -1;
	      a.verifications = isNaN(a.verifications) ? 1 : a.verifications;
	      a.unverifications = isNaN(a.unverifications) ? 0 : a.unverifications;
	      if (a.verifications * 2 > a.unverifications * 3 && (!keyExists || a.verifications - a.unverifications > mostVerifiedAttributes[a.type].verificationScore)) {
	        mostVerifiedAttributes[a.type] = {
	          attribute: a,
	          verificationScore: a.verifications - a.unverifications
	        };
	        if (a.verified) {
	          mostVerifiedAttributes[a.type].verified = true;
	        }
	      }
	    });
	    return mostVerifiedAttributes;
	  };

	  Contact.getAttrs = async function getAttrs(identity) {
	    var attrs = await util.loadGunDepth(identity.get('attrs'), 2);
	    if (attrs && attrs['_'] !== undefined) {
	      delete attrs['_'];
	    }
	    return attrs || {};
	  };

	  Contact.prototype.getId = function getId() {
	    return this.linkTo.value;
	  };

	  /**
	  * Get sent Messages
	  * @param {Object} index
	  * @param {Object} options
	  */


	  Contact.prototype.sent = function sent(index, options) {
	    index._getSentMsgs(this, options);
	  };

	  /**
	  * Get received Messages
	  * @param {Object} index
	  * @param {Object} options
	  */


	  Contact.prototype.received = function received(index, options) {
	    index._getReceivedMsgs(this, options);
	  };

	  /**
	  * @param {string} attribute attribute type
	  * @returns {string} most verified value of the param type
	  */


	  Contact.prototype.verified = async function verified(attribute) {
	    var attrs = await Contact.getAttrs(this.gun).then();
	    var mva = Contact.getMostVerifiedAttributes(attrs);
	    return Object.prototype.hasOwnProperty.call(mva, attribute) ? mva[attribute].attribute.value : undefined;
	  };

	  /**
	  * @param {Object} ipfs (optional) an IPFS instance that is used to fetch images
	  * @returns {HTMLElement} profile card html element describing the identity
	  */


	  Contact.prototype.profileCard = function profileCard(ipfs) {
	    var _this = this;

	    var card = document.createElement('div');
	    card.className = 'iris-card';

	    var identicon$$1 = this.identicon({ width: 60, ipfs: ipfs });
	    identicon$$1.style.order = 1;
	    identicon$$1.style.flexShrink = 0;
	    identicon$$1.style.marginRight = '15px';

	    var details = document.createElement('div');
	    details.style.padding = '5px';
	    details.style.order = 2;
	    details.style.flexGrow = 1;

	    var linkEl = document.createElement('span');
	    var links = document.createElement('small');
	    card.appendChild(identicon$$1);
	    card.appendChild(details);
	    details.appendChild(linkEl);
	    details.appendChild(links);

	    this.gun.on(async function (data) {
	      if (!data) {
	        return;
	      }
	      var attrs = await Contact.getAttrs(_this.gun);
	      var linkTo = await _this.gun.get('linkTo').then();
	      var link = 'https://iris.to/#/identities/' + linkTo.type + '/' + linkTo.value;
	      var mva = Contact.getMostVerifiedAttributes(attrs);
	      linkEl.innerHTML = '<a href="' + link + '">' + (mva.type && mva.type.attribute.value || mva.nickname && mva.nickname.attribute.value || linkTo.type + ':' + linkTo.value) + '</a><br>';
	      linkEl.innerHTML += '<small>Received: <span class="iris-pos">+' + (data.receivedPositive || 0) + '</span> / <span class="iris-neg">-' + (data.receivedNegative || 0) + '</span></small><br>';
	      links.innerHTML = '';
	      _Object$keys(attrs).forEach(function (k) {
	        var a = attrs[k];
	        if (a.link) {
	          links.innerHTML += a.type + ': <a href="' + a.link + '">' + a.value + '</a> ';
	        }
	      });
	    });

	    /*
	    const template = ```
	    <tr ng-repeat="result in ids.list" id="result{$index}" ng-hide="!result.linkTo" ui-sref="identities.show({ type: result.linkTo.type, value: result.linkTo.value })" class="search-result-row" ng-class="{active: result.active}">
	      <td class="gravatar-col"><identicon id="result" border="3" width="46" positive-score="result.pos" negative-score="result.neg"></identicon></td>
	      <td>
	        <span ng-if="result.distance == 0" class="label label-default pull-right">rootContact</span>
	        <span ng-if="result.distance > 0" ng-bind="result.distance | ordinal" class="label label-default pull-right"></span>
	        <a ng-bind-html="result.name|highlight:query.term" ui-sref="identities.show({ type: result.linkTo.type, value: result.linkTo.value })"></a>
	        <small ng-if="!result.name" class="list-group-item-text">
	          <span ng-bind-html="result[0][0]|highlight:query.term"></span>
	        </small><br>
	        <small>
	          <span ng-if="result.nickname && result.name != result.nickname" ng-bind-html="result.nickname|highlight:query.term" class="mar-right10"></span>
	          <span ng-if="result.email" class="mar-right10">
	            <span class="glyphicon glyphicon-envelope"></span> <span ng-bind-html="result.email|highlight:query.term"></span>
	          </span>
	          <span ng-if="result.facebook" class="mar-right10">
	            <span class="fa fa-facebook"></span> <span ng-bind-html="result.facebook|highlight:query.term"></span>
	          </span>
	          <span ng-if="result.twitter" class="mar-right10">
	            <span class="fa fa-twitter"></span> <span ng-bind-html="result.twitter|highlight:query.term"></span>
	          </span>
	          <span ng-if="result.googlePlus" class="mar-right10">
	            <span class="fa fa-google-plus"></span> <span ng-bind-html="result.googlePlus|highlight:query.term"></span>
	          </span>
	          <span ng-if="result.bitcoin" class="mar-right10">
	            <span class="fa fa-bitcoin"></span> <span ng-bind-html="result.bitcoin|highlight:query.term"></span>
	          </span>
	        </small>
	      </td>
	    </tr>
	    ```;*/
	    return card;
	  };

	  /**
	  * Appends an identity search widget to the given HTMLElement
	  * @param {HTMLElement} parentElement element where the search widget is added and event listener attached
	  * @param {Index} index index root to use for search
	  */


	  Contact.appendSearchWidget = function appendSearchWidget(parentElement, index) {
	    var form = document.createElement('form');

	    var input = document.createElement('input');
	    input.type = 'text';
	    input.placeholder = 'Search';
	    input.id = 'irisSearchInput';
	    form.innerHTML += '<div id="irisSearchResults"></div>';

	    var searchResults = document.createElement('div');

	    parentElement.appendChild(form);
	    form.appendChild(input);
	    form.appendChild(searchResults);
	    input.addEventListener('keyup', async function () {
	      var r = await index.search(input.value);
	      searchResults.innerHTML = '';
	      r.sort(function (a, b) {
	        return a.trustDistance - b.trustDistance;
	      });
	      r.forEach(function (i) {
	        searchResults.appendChild(i.profileCard());
	      });
	    });

	    return form;
	  };

	  Contact._ordinal = function _ordinal(n) {
	    if (n === 0) {
	      return '';
	    }
	    var s = ['th', 'st', 'nd', 'rd'];
	    var v = n % 100;
	    return n + (s[(v - 20) % 10] || s[v] || s[0]);
	  };

	  /**
	  * @param {Object} options {width: 50, border: 4, showDistance: true, ipfs: null, outerGlow: false}
	  * @returns {HTMLElement} identicon element that can be appended to DOM
	  */


	  Contact.prototype.identicon = function identicon$$1() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    options = _Object$assign({
	      width: 50,
	      border: 4,
	      showDistance: true,
	      outerGlow: false,
	      ipfs: null
	    }, options);
	    util.injectCss(); // some other way that is not called on each identicon generation?
	    var identicon$$1 = document.createElement('div');
	    identicon$$1.className = 'iris-identicon';
	    identicon$$1.style.width = options.width + 'px';
	    identicon$$1.style.height = options.width + 'px';

	    var pie = document.createElement('div');
	    pie.className = 'iris-pie';
	    pie.style.width = options.width + 'px';

	    var img = document.createElement('img');
	    img.alt = '';
	    img.width = options.width;
	    img.height = options.width;
	    img.style.borderWidth = options.border + 'px';

	    var distance = void 0;
	    if (options.border) {
	      distance = document.createElement('span');
	      distance.className = 'iris-distance';
	      distance.style.fontSize = options.width > 50 ? options.width / 4 + 'px' : '10px';
	      identicon$$1.appendChild(distance);
	    }
	    identicon$$1.appendChild(pie);
	    identicon$$1.appendChild(img);

	    function setPie(data) {
	      if (!data) {
	        return;
	      }
	      // Define colors etc
	      var bgColor = 'rgba(0,0,0,0.2)';
	      var bgImage = 'none';
	      var transform = '';
	      if (options.outerGlow) {
	        var boxShadow = '0px 0px 0px 0px #82FF84';
	        if (data.receivedPositive > data.receivedNegative * 20) {
	          boxShadow = '0px 0px ' + options.border * data.receivedPositive / 50 + 'px 0px #82FF84';
	        } else if (data.receivedPositive < data.receivedNegative * 3) {
	          boxShadow = '0px 0px ' + options.border * data.receivedNegative / 10 + 'px 0px #BF0400';
	        }
	        pie.style.boxShadow = boxShadow;
	      }
	      if (data.receivedPositive + data.receivedNegative > 0) {
	        if (data.receivedPositive > data.receivedNegative) {
	          transform = 'rotate(' + (-data.receivedPositive / (data.receivedPositive + data.receivedNegative) * 360 - 180) / 2 + 'deg)';
	          bgColor = '#A94442';
	          bgImage = 'linear-gradient(' + data.receivedPositive / (data.receivedPositive + data.receivedNegative) * 360 + 'deg, transparent 50%, #3C763D 50%), linear-gradient(0deg, #3C763D 50%, transparent 50%)';
	        } else {
	          transform = 'rotate(' + ((-data.receivedNegative / (data.receivedPositive + data.receivedNegative) * 360 - 180) / 2 + 180) + 'deg)';
	          bgColor = '#3C763D';
	          bgImage = 'linear-gradient(' + data.receivedNegative / (data.receivedPositive + data.receivedNegative) * 360 + 'deg, transparent 50%, #A94442 50%), linear-gradient(0deg, #A94442 50%, transparent 50%)';
	        }
	      }

	      pie.style.backgroundColor = bgColor;
	      pie.style.backgroundImage = bgImage;
	      pie.style.transform = transform;
	      pie.style.opacity = (data.receivedPositive + data.receivedNegative) / 10 * 0.5 + 0.35;

	      if (options.showDistance) {
	        distance.textContent = typeof data.trustDistance === 'number' ? Contact._ordinal(data.trustDistance) : '\u2715';
	      }
	    }

	    function setIdenticonImg(data) {
	      util.getHash(encodeURIComponent(data.type) + ':' + encodeURIComponent(data.value), 'hex').then(function (hash) {
	        var identiconImg = new identicon(hash, { width: options.width, format: 'svg' });
	        img.src = img.src || 'data:image/svg+xml;base64,' + identiconImg.toString();
	      });
	    }

	    if (this.linkTo) {
	      setIdenticonImg(this.linkTo);
	    } else {
	      this.gun.get('linkTo').on(setIdenticonImg);
	    }

	    this.gun.on(setPie);

	    if (options.ipfs) {
	      Contact.getAttrs(this.gun).then(function (attrs) {
	        var mva = Contact.getMostVerifiedAttributes(attrs);
	        if (mva.profilePhoto) {
	          var go = function go() {
	            options.ipfs.cat(mva.profilePhoto.attribute.value).then(function (file) {
	              var f = options.ipfs.types.Buffer.from(file).toString('base64');
	              img.src = 'data:image;base64,' + f;
	            });
	          };
	          options.ipfs.isOnline() ? go() : options.ipfs.on('ready', go);
	        }
	      });
	    }

	    return identicon$$1;
	  };

	  Contact.prototype.serialize = function serialize() {
	    return this.gun;
	  };

	  Contact.deserialize = function deserialize(data, opt) {
	    var linkTo = new Attribute({ type: 'uuid', value: opt.id });
	    return new Contact(opt.gun, linkTo);
	  };

	  return Contact;
	}();

	// shim for using process in browser
	// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	var cachedSetTimeout = defaultSetTimout;
	var cachedClearTimeout = defaultClearTimeout;
	if (typeof global$1.setTimeout === 'function') {
	    cachedSetTimeout = setTimeout;
	}
	if (typeof global$1.clearTimeout === 'function') {
	    cachedClearTimeout = clearTimeout;
	}

	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue$1 = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue$1 = currentQueue.concat(queue$1);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue$1.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue$1.length;
	    while(len) {
	        currentQueue = queue$1;
	        queue$1 = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue$1.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	function nextTick(fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue$1.push(new Item(fun, args));
	    if (queue$1.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	}
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	var title = 'browser';
	var platform = 'browser';
	var browser = true;
	var env = {};
	var argv = [];
	var version = ''; // empty string to avoid regexp issues
	var versions$1 = {};
	var release = {};
	var config = {};

	function noop() {}

	var on = noop;
	var addListener = noop;
	var once = noop;
	var off = noop;
	var removeListener = noop;
	var removeAllListeners = noop;
	var emit = noop;

	function binding(name) {
	    throw new Error('process.binding is not supported');
	}

	function cwd () { return '/' }
	function chdir (dir) {
	    throw new Error('process.chdir is not supported');
	}function umask() { return 0; }

	// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
	var performance = global$1.performance || {};
	var performanceNow =
	  performance.now        ||
	  performance.mozNow     ||
	  performance.msNow      ||
	  performance.oNow       ||
	  performance.webkitNow  ||
	  function(){ return (new Date()).getTime() };

	// generate timestamp or delta
	// see http://nodejs.org/api/process.html#process_process_hrtime
	function hrtime(previousTimestamp){
	  var clocktime = performanceNow.call(performance)*1e-3;
	  var seconds = Math.floor(clocktime);
	  var nanoseconds = Math.floor((clocktime%1)*1e9);
	  if (previousTimestamp) {
	    seconds = seconds - previousTimestamp[0];
	    nanoseconds = nanoseconds - previousTimestamp[1];
	    if (nanoseconds<0) {
	      seconds--;
	      nanoseconds += 1e9;
	    }
	  }
	  return [seconds,nanoseconds]
	}

	var startTime = new Date();
	function uptime() {
	  var currentTime = new Date();
	  var dif = currentTime - startTime;
	  return dif / 1000;
	}

	var process$3 = {
	  nextTick: nextTick,
	  title: title,
	  browser: browser,
	  env: env,
	  argv: argv,
	  version: version,
	  versions: versions$1,
	  on: on,
	  addListener: addListener,
	  once: once,
	  off: off,
	  removeListener: removeListener,
	  removeAllListeners: removeAllListeners,
	  emit: emit,
	  binding: binding,
	  cwd: cwd,
	  chdir: chdir,
	  umask: umask,
	  hrtime: hrtime,
	  platform: platform,
	  release: release,
	  config: config,
	  uptime: uptime
	};

	// 20.1.2.4 Number.isNaN(number)


	_export(_export.S, 'Number', {
	  isNaN: function isNaN(number) {
	    // eslint-disable-next-line no-self-compare
	    return number != number;
	  }
	});

	var isNan = _core.Number.isNaN;

	var isNan$1 = createCommonjsModule(function (module) {
	module.exports = { "default": isNan, __esModule: true };
	});

	var _Number$isNaN = unwrapExports(isNan$1);

	var _stringWs = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
	  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

	var space = '[' + _stringWs + ']';
	var non = '\u200b\u0085';
	var ltrim = RegExp('^' + space + space + '*');
	var rtrim = RegExp(space + space + '*$');

	var exporter = function (KEY, exec, ALIAS) {
	  var exp = {};
	  var FORCE = _fails(function () {
	    return !!_stringWs[KEY]() || non[KEY]() != non;
	  });
	  var fn = exp[KEY] = FORCE ? exec(trim) : _stringWs[KEY];
	  if (ALIAS) exp[ALIAS] = fn;
	  _export(_export.P + _export.F * FORCE, 'String', exp);
	};

	// 1 -> String#trimLeft
	// 2 -> String#trimRight
	// 3 -> String#trim
	var trim = exporter.trim = function (string, TYPE) {
	  string = String(_defined(string));
	  if (TYPE & 1) string = string.replace(ltrim, '');
	  if (TYPE & 2) string = string.replace(rtrim, '');
	  return string;
	};

	var _stringTrim = exporter;

	var $parseInt = _global.parseInt;
	var $trim = _stringTrim.trim;

	var hex = /^[-+]?0[xX]/;

	var _parseInt = $parseInt(_stringWs + '08') !== 8 || $parseInt(_stringWs + '0x16') !== 22 ? function parseInt(str, radix) {
	  var string = $trim(String(str), 3);
	  return $parseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
	} : $parseInt;

	// 20.1.2.13 Number.parseInt(string, radix)
	_export(_export.S + _export.F * (Number.parseInt != _parseInt), 'Number', { parseInt: _parseInt });

	var _parseInt$1 = _core.Number.parseInt;

	var _parseInt$2 = createCommonjsModule(function (module) {
	module.exports = { "default": _parseInt$1, __esModule: true };
	});

	var _Number$parseInt = unwrapExports(_parseInt$2);

	var UNIQUE_ID_VALIDATORS$1 = {
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

	/**
	* A simple key-value pair with helper functions.
	*
	* Constructor: new Attribute(value), new Attribute(type, value) or new Attribute({type, value})
	*/

	var Attribute$1 = function () {
	  /**
	  * @param {string} a
	  * @param {string} b
	  */
	  function Attribute(a, b) {
	    _classCallCheck(this, Attribute);

	    if (typeof a === 'object') {
	      if (typeof a.value !== 'string') {
	        throw new Error('param1.value must be a string, got ' + _typeof(a.value) + ': ' + _JSON$stringify(a.value));
	      }
	      if (typeof a.type !== 'string') {
	        throw new Error('param1.type must be a string, got ' + _typeof(a.type) + ': ' + _JSON$stringify(a.type));
	      }
	      b = a.value;
	      a = a.type;
	    }
	    if (typeof a !== 'string') {
	      throw new Error('First param must be a string, got ' + (typeof a === 'undefined' ? 'undefined' : _typeof(a)) + ': ' + _JSON$stringify(a));
	    }
	    if (!a.length) {
	      throw new Error('First param string is empty');
	    }
	    if (b) {
	      if (typeof b !== 'string') {
	        throw new Error('Second parameter must be a string, got ' + (typeof b === 'undefined' ? 'undefined' : _typeof(b)) + ': ' + _JSON$stringify(b));
	      }
	      if (!b.length) {
	        throw new Error('Second param string is empty');
	      }
	      this.type = a;
	      this.value = b;
	    } else {
	      this.value = a;
	      var t = Attribute.guessTypeOf(this.value);
	      if (t) {
	        this.type = t;
	      } else {
	        throw new Error('Type of attribute was omitted and could not be guessed');
	      }
	    }
	  }

	  /**
	  * @returns {Attribute} uuid
	  */


	  Attribute.getUuid = function getUuid() {
	    var b = function b(a) {
	      return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
	    };
	    return new Attribute('uuid', b());
	  };

	  /**
	  * @returns {Object} an object with attribute types as keys and regex patterns as values
	  */


	  Attribute.getUniqueIdValidators = function getUniqueIdValidators() {
	    return UNIQUE_ID_VALIDATORS$1;
	  };

	  /**
	  * @param {string} type attribute type
	  * @returns {boolean} true if the attribute type is unique
	  */


	  Attribute.isUniqueType = function isUniqueType(type) {
	    return _Object$keys(UNIQUE_ID_VALIDATORS$1).indexOf(type) > -1;
	  };

	  /**
	  * @returns {boolean} true if the attribute type is unique
	  */


	  Attribute.prototype.isUniqueType = function isUniqueType() {
	    return Attribute.isUniqueType(this.type);
	  };

	  /**
	  * @param {string} value guess type of this attribute value
	  * @returns {string} type of attribute value or undefined
	  */


	  Attribute.guessTypeOf = function guessTypeOf(value) {
	    for (var key in UNIQUE_ID_VALIDATORS$1) {
	      if (value.match(UNIQUE_ID_VALIDATORS$1[key])) {
	        return key;
	      }
	    }
	  };

	  /**
	  * @param {Attribute} a
	  * @param {Attribute} b
	  * @returns {boolean} true if params are equal
	  */


	  Attribute.equals = function equals(a, b) {
	    return a.equals(b);
	  };

	  /**
	  * @param {Attribute} a attribute to compare to
	  * @returns {boolean} true if attribute matches param
	  */


	  Attribute.prototype.equals = function equals(a) {
	    return a && this.type === a.type && this.value === a.value;
	  };

	  /**
	  * @returns {string} uri - `${encodeURIComponent(this.value)}:${encodeURIComponent(this.type)}`
	  * @example
	  * user%20example.com:email
	  */


	  Attribute.prototype.uri = function uri() {
	    return encodeURIComponent(this.value) + ':' + encodeURIComponent(this.type);
	  };

	  Attribute.prototype.identiconXml = function identiconXml() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    return util.getHash(encodeURIComponent(this.type) + ':' + encodeURIComponent(this.value), 'hex').then(function (hash) {
	      var identicon$$1 = new identicon(hash, { width: options.width, format: 'svg' });
	      return identicon$$1.toString(true);
	    });
	  };

	  Attribute.prototype.identiconSrc = function identiconSrc() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    return util.getHash(encodeURIComponent(this.type) + ':' + encodeURIComponent(this.value), 'hex').then(function (hash) {
	      var identicon$$1 = new identicon(hash, { width: options.width, format: 'svg' });
	      return 'data:image/svg+xml;base64,' + identicon$$1.toString();
	    });
	  };

	  /**
	  * Generate a visually recognizable representation of the attribute
	  * @param {object} options {width}
	  * @returns {HTMLElement} identicon div element
	  */


	  Attribute.prototype.identicon = function identicon$$1() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    options = _Object$assign({
	      width: 50,
	      showType: true
	    }, options);
	    util.injectCss(); // some other way that is not called on each identicon generation?

	    var div = document.createElement('div');
	    div.className = 'iris-identicon';
	    div.style.width = options.width + 'px';
	    div.style.height = options.width + 'px';

	    var img = document.createElement('img');
	    img.alt = '';
	    img.width = options.width;
	    img.height = options.width;
	    this.identiconSrc(options).then(function (src) {
	      return img.src = src;
	    });

	    if (options.showType) {
	      var name = document.createElement('span');
	      name.className = 'iris-distance';
	      name.style.fontSize = options.width > 50 ? options.width / 4 + 'px' : '10px';
	      name.textContent = this.type.slice(0, 5);
	      div.appendChild(name);
	    }

	    div.appendChild(img);

	    return div;
	  };

	  return Attribute;
	}();

	/**
	* Private communication channel between two or more participants ([Gun](https://github.com/amark/gun) public keys). Can be used independently of other Iris stuff.
	*
	* Used as a core element of [iris-messenger](https://github.com/irislib/iris-messenger).
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
	* **Note!** As of April 2020 Gun.SEA hashing function [is broken on Safari](https://github.com/amark/gun/issues/892). Channels don't work on Safari unless you patch sea.js by adding [this line](https://github.com/irislib/iris-messenger/blob/1e012581793485e6b8b5ed3c2ad0629716709366/src/js/sea.js#L270).
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

	var Channel = function () {
	  function Channel(options) {
	    var _this = this;

	    _classCallCheck(this, Channel);

	    this.DEFAULT_PERMISSIONS = { read: true, write: true };
	    this.key = options.key;
	    this.gun = options.gun;
	    this.myGroupSecret = options.myGroupSecret;
	    this.theirSecretUuids = {};
	    this.theirGroupSecrets = {};
	    this.user = this.gun.user();
	    this.user.auth(this.key);
	    this.user.put({ epub: this.key.epub });
	    this.secrets = {}; // maps participant public key to shared secret
	    this.ourSecretChannelIds = {}; // maps participant public key to our secret mutual channel id
	    this.theirSecretChannelIds = {}; // maps participant public key to their secret mutual channel id
	    this.messages = {};
	    this.chatLinks = {};

	    if (options.chatLink) {
	      this.useChatLink(options);
	    }

	    if (typeof options.participants === 'string') {
	      this.addParticipant(options.participants, options.save);
	    } else if (Array.isArray(options.participants)) {
	      var o = {};
	      options.participants.forEach(function (p) {
	        return o[p] = _Object$assign({}, _this.DEFAULT_PERMISSIONS);
	      });
	      options.participants = o;
	    }
	    if (typeof options.participants === 'object') {
	      // it's a group channel
	      var keys = _Object$keys(options.participants);
	      keys.forEach(function (k) {
	        if (k !== _this.key.pub) {
	          _this.addParticipant(k, options.save, _Object$assign({}, _this.DEFAULT_PERMISSIONS, options.participants[k]));
	        }
	      });
	      options.participants[this.key.pub] = options.participants[this.key.pub] || _Object$assign({}, this.DEFAULT_PERMISSIONS);
	      if (options.uuid) {
	        this.uuid = options.uuid;
	        this.name = options.name;
	      } else {
	        options.uuid = Attribute$1.getUuid().value;
	        this.uuid = options.uuid;
	        options.participants[this.key.pub].admin = true;
	        options.participants[this.key.pub].founder = true;
	      }
	      this.getChatLinks({ subscribe: true });
	    }
	    this.participants = options.participants;
	    if (options.uuid) {
	      // It's a group channel
	      // share secret uuid with other participants. since secret is already non-deterministic, maybe uuid could also be?
	      // generate channel-specific secret and share it with other participants
	      // put() keys should be encrypted first? so you could do put(uuid, secret)
	      // what if you join the channel with 2 unconnected devices? on reconnect, the older secret would be overwritten and messages unreadable. maybe participants should store each others' old keys? or maybe you should store them and re-encrypt old stuff when key changes? return them with map() instead?
	      this.putDirect('S' + this.uuid, this.getMyGroupSecret());
	      this.getMySecretUuid().then(function (s) {
	        _this.putDirect(_this.uuid, s); // TODO: encrypt keys in put()
	      });
	      this.onTheirDirect(this.uuid, function (s, k, from) {
	        _this.theirSecretUuids[from] = s;
	      });
	      this.onTheirDirect('S' + this.uuid, function (s, k, from) {
	        _this.theirGroupSecrets[from] = s;
	      });
	      // need to make put(), on(), send() and getMessages() behave differently when it's a group and retain the old versions for mutual signaling
	    }
	    this.onTheir('participants', function (participants, k, from) {
	      var hasAdmin = false;
	      var keys = _Object$keys(_this.participants);
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
	        if (typeof participants === 'object') {
	          var before = _JSON$stringify(_this.participants);
	          _this.participants = _Object$assign(_this.participants, participants);
	          delete _this.participants[from].inviter;
	          if (_JSON$stringify(_this.participants) === before) {
	            return;
	          }
	          _Object$keys(participants).forEach(function (k) {
	            if (k !== _this.key.pub) {
	              _this.addParticipant(k, true, _Object$assign({}, _this.DEFAULT_PERMISSIONS, participants[k]));
	            }
	          });
	          options.saved = true;
	        }
	      }
	    });
	    if (!options.saved && (options.save === undefined || options.save === true)) {
	      this.save();
	    }
	  }

	  Channel.prototype.useChatLink = function useChatLink(options) {
	    var _this2 = this;

	    var s = options.chatLink.split('?');
	    if (s.length === 2) {
	      var chatWith = util.getUrlParameter('chatWith', s[1]);
	      var channelId = util.getUrlParameter('channelId', s[1]);
	      var inviter = util.getUrlParameter('inviter', s[1]);
	      var pub = inviter || chatWith;
	      if (chatWith) {
	        options.participants = pub;
	      } else if (channelId && inviter && inviter !== this.key.pub) {
	        // TODO! initializing it twice breaks things - new secret is generated
	        options.uuid = channelId;
	        options.participants = {};
	        options.participants[inviter] = _Object$assign({ inviter: true }, this.DEFAULT_PERMISSIONS);
	      }
	      if (pub !== this.key.pub) {
	        var sharedSecret = util.getUrlParameter('s', s[1]);
	        var linkId = util.getUrlParameter('k', s[1]);
	        if (sharedSecret && linkId) {
	          this.save(); // save the channel first so it's there before inviter subscribes to it
	          options.saved = true;
	          this.gun.user(pub).get('chatLinks').get(linkId).get('encryptedSharedKey').on(async function (encrypted) {
	            var sharedKey = await Gun.SEA.decrypt(encrypted, sharedSecret);
	            var encryptedChatRequest = await Gun.SEA.encrypt(_this2.key.pub, sharedSecret); // TODO encrypt is not deterministic, it uses salt
	            var channelRequestId = await util.getHash(encryptedChatRequest);
	            util.gunAsAnotherUser(_this2.gun, sharedKey, function (user) {
	              user.get('chatRequests').get(channelRequestId.slice(0, 12)).put(encryptedChatRequest);
	            });
	          });
	        }
	      }
	    }
	  };

	  Channel.prototype.getTheirSecretUuid = function getTheirSecretUuid(pub) {
	    var _this3 = this;

	    return new _Promise(function (resolve) {
	      if (!_this3.theirSecretUuids[pub]) {
	        _this3.onTheirDirect(_this3.uuid, function (s) {
	          _this3.theirSecretUuids[pub] = s;
	          resolve(_this3.theirSecretUuids[pub]);
	        }, pub);
	      } else {
	        resolve(_this3.theirSecretUuids[pub]);
	      }
	    });
	  };

	  Channel.prototype.getTheirGroupSecret = function getTheirGroupSecret(pub) {
	    var _this4 = this;

	    if (pub === this.key.pub) {
	      return this.getMyGroupSecret();
	    }
	    return new _Promise(function (resolve) {
	      if (!_this4.theirGroupSecrets[pub]) {
	        _this4.onTheirDirect('S' + _this4.uuid, function (s) {
	          _this4.theirGroupSecrets[pub] = s;
	          resolve(_this4.theirGroupSecrets[pub]);
	        }, pub);
	      } else {
	        resolve(_this4.theirGroupSecrets[pub]);
	      }
	    });
	  };

	  Channel.prototype.changeMyGroupSecret = function changeMyGroupSecret() {
	    this.myGroupSecret = Gun.SEA.random(32).toString('base64');
	    // TODO: secret should be archived and probably messages should include the encryption key id so past messages don't become unreadable
	    this.putDirect('S' + this.uuid, this.myGroupSecret);
	  };

	  /**
	  * Unsubscribe messages from a channel participants
	  *
	  * @param {string} participant public key
	  */


	  Channel.prototype.mute = async function mute(participant) {
	    this.gun.user(participant).get(this.theirSecretUuids[participant]).off();
	    // TODO: persist
	  };

	  /**
	  * Mute user and prevent them from seeing your further (and maybe past) messages
	  *
	  * @param {string} participant public key
	  */


	  Channel.prototype.block = async function block(participant) {
	    this.mute(participant);
	    this.putDirect(this.uuid, null);
	    this.putDirect('S' + this.uuid, null);
	    delete this.secrets[participant];
	    delete this.ourSecretChannelIds[participant];
	    delete this.theirSecretChannelIds[participant];
	    this.changeMyGroupSecret();
	  };

	  Channel.prototype.getMySecretUuid = async function getMySecretUuid() {
	    if (!this.mySecretUuid) {
	      var mySecret = await Gun.SEA.secret(this.key.epub, this.key);
	      var mySecretHash = await util.getHash(mySecret);
	      this.mySecretUuid = await util.getHash(mySecretHash + this.uuid);
	    }
	    return this.mySecretUuid;
	  };

	  /**
	  * List participants of the channel (other than you)
	  */


	  Channel.prototype.getCurrentParticipants = function getCurrentParticipants() {
	    return _Object$keys(this.secrets);
	  };

	  /**
	  * Subscribe to the changing list of participants by channel admins
	  */


	  Channel.prototype.getParticipants = function getParticipants(callback) {};

	  /**
	  * Returns either the uuid of a group channel or the public key of a direct channel.
	  */


	  Channel.prototype.getId = function getId() {
	    return this.uuid || this.getCurrentParticipants()[0];
	  };

	  Channel.prototype.getSecret = async function getSecret(pub) {
	    if (!this.secrets[pub]) {
	      var epub = await util.gunOnceDefined(this.gun.user(pub).get('epub'));
	      this.secrets[pub] = await Gun.SEA.secret(epub, this.key);
	    }
	    return this.secrets[pub];
	  };

	  /**
	  *
	  */


	  Channel.getOurSecretChannelId = async function getOurSecretChannelId(gun, pub, pair) {
	    var epub = await util.gunOnceDefined(gun.user(pub).get('epub'));
	    var secret = await Gun.SEA.secret(epub, pair);
	    return util.getHash(secret + pub);
	  };

	  /**
	  *
	  */


	  Channel.getTheirSecretChannelId = async function getTheirSecretChannelId(gun, pub, pair) {
	    var epub = await util.gunOnceDefined(gun.user(pub).get('epub'));
	    var secret = await Gun.SEA.secret(epub, pair);
	    return util.getHash(secret + pair.pub);
	  };

	  /**
	  * Calls back with Channels that you have initiated or written to.
	  * @param {Object} gun user.authed gun instance
	  * @param {Object} keypair Gun.SEA keypair that the gun instance is authenticated with
	  * @param callback callback function that is called for each public key you have a channel with
	  */


	  Channel.getChannels = async function getChannels(gun, keypair, callback) {
	    var listenToChatLinks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

	    var mySecret = await Gun.SEA.secret(keypair.epub, keypair);
	    if (listenToChatLinks) {
	      Channel.getMyChatLinks(gun, keypair, undefined, undefined, true);
	    }
	    var seen = {};
	    gun.user().get('chats').map().on(async function (value, ourSecretChannelId) {
	      if (value && !seen[ourSecretChannelId]) {
	        seen[ourSecretChannelId] = true;
	        if (ourSecretChannelId.length > 44) {
	          gun.user().get('chats').get(ourSecretChannelId).put(null);
	          return;
	        }
	        var encryptedChatId = await util.gunOnceDefined(gun.user().get('chats').get(ourSecretChannelId).get('pub'));
	        var chatId = await Gun.SEA.decrypt(encryptedChatId, mySecret);
	        if (chatId.pub || typeof chatId === 'string') {
	          callback(new Channel({
	            key: keypair,
	            gun: gun,
	            participants: chatId.pub || chatId,
	            save: false
	          }));
	        } else {
	          if (chatId.uuid && chatId.participants && chatId.myGroupSecret) {
	            callback(new Channel({
	              key: keypair,
	              gun: gun,
	              participants: chatId.participants,
	              uuid: chatId.uuid,
	              myGroupSecret: chatId.myGroupSecret,
	              save: false
	            }));
	          }
	        }
	      }
	    });
	  };

	  Channel.prototype.getMyGroupSecret = function getMyGroupSecret() {
	    // group secret could be deterministic: hash(encryptToSelf(uuid + iterator))
	    if (!this.myGroupSecret) {
	      this.changeMyGroupSecret();
	    }
	    return this.myGroupSecret;
	  };

	  Channel.prototype.getOurSecretChannelId = async function getOurSecretChannelId(pub) {
	    if (!this.ourSecretChannelIds[pub]) {
	      var secret = await this.getSecret(pub);
	      this.ourSecretChannelIds[pub] = await util.getHash(secret + pub);
	    }
	    return this.ourSecretChannelIds[pub];
	  };

	  Channel.prototype.getTheirSecretChannelId = async function getTheirSecretChannelId(pub) {
	    if (!this.theirSecretChannelIds[pub]) {
	      var secret = await this.getSecret(pub);
	      this.theirSecretChannelIds[pub] = await util.getHash(secret + this.key.pub);
	    }
	    return this.theirSecretChannelIds[pub];
	  };

	  /**
	  * Get messages from the channel
	  */


	  Channel.prototype.getMessages = async function getMessages(callback) {
	    var _this5 = this;

	    // TODO: save callback and apply it when new participants are added to channel
	    this.getCurrentParticipants().forEach(async function (pub) {
	      if (pub !== _this5.key.pub) {
	        // Subscribe to their messages
	        var theirSecretChannelId = void 0;
	        if (_this5.uuid) {
	          theirSecretChannelId = await _this5.getTheirSecretUuid(pub);
	        } else {
	          theirSecretChannelId = await _this5.getTheirSecretChannelId(pub);
	        }
	        _this5.gun.user(pub).get('chats').get(theirSecretChannelId).get('msgs').map().once(function (data, key) {
	          _this5.messageReceived(callback, data, _this5.uuid || pub, false, key, pub);
	        });
	      }
	      if (!_this5.uuid) {
	        // Subscribe to our messages
	        var ourSecretChannelId = await _this5.getOurSecretChannelId(pub);
	        _this5.user.get('chats').get(ourSecretChannelId).get('msgs').map().once(function (data, key) {
	          _this5.messageReceived(callback, data, pub, true, key, _this5.key.pub);
	        });
	      }
	    });
	    if (this.uuid) {
	      // Subscribe to our messages
	      var mySecretUuid = await this.getMySecretUuid();
	      this.user.get('chats').get(mySecretUuid).get('msgs').map().once(function (data, key) {
	        _this5.messageReceived(callback, data, _this5.uuid, true, key, _this5.key.pub);
	      });
	    }
	  };

	  Channel.prototype.messageReceived = async function messageReceived(callback, data, channelId, selfAuthored, key, from) {
	    if (this.messages[key]) {
	      return;
	    }
	    var secret = this.uuid ? await this.getTheirGroupSecret(from) : await this.getSecret(channelId);
	    var decrypted = await Gun.SEA.decrypt(data, secret);
	    if (typeof decrypted !== 'object') {
	      return;
	    }
	    var info = { selfAuthored: selfAuthored, channelId: channelId, from: from };
	    this.messages[key] = decrypted;
	    callback(decrypted, info);
	  };

	  /**
	  * Get latest message in this channel. Useful for channel listing.
	  */


	  Channel.prototype.getLatestMsg = async function getLatestMsg(callback) {
	    var _this6 = this;

	    var callbackIfLatest = async function callbackIfLatest(msg, info) {
	      if (!_this6.latest) {
	        _this6.latest = msg;
	      } else {
	        var t = typeof _this6.latest.time === 'string' ? _this6.latest.time : _this6.latest.time.toISOString();
	        if (t < msg.time) {
	          _this6.latest = msg;
	          callback(msg, info);
	        }
	      }
	    };
	    this.onMy('latestMsg', function (msg) {
	      return callbackIfLatest(msg, { selfAuthored: true });
	    });
	    this.onTheir('latestMsg', function (msg) {
	      return callbackIfLatest(msg, { selfAuthored: false });
	    });
	  };

	  /**
	  * Useful for notifications
	  * @param {integer} time last seen msg time (default: now)
	  */


	  Channel.prototype.setMyMsgsLastSeenTime = async function setMyMsgsLastSeenTime(time) {
	    time = time || new Date().toISOString();
	    return this.put('msgsLastSeenTime', time);
	  };

	  /**
	  * Useful for notifications
	  */


	  Channel.prototype.getMyMsgsLastSeenTime = async function getMyMsgsLastSeenTime(callback) {
	    var _this7 = this;

	    this.onMy('msgsLastSeenTime', function (time) {
	      _this7.myMsgsLastSeenTime = time;
	      if (callback) {
	        callback(_this7.myMsgsLastSeenTime);
	      }
	    });
	  };

	  /**
	  * For "seen" status indicator
	  */


	  Channel.prototype.getTheirMsgsLastSeenTime = async function getTheirMsgsLastSeenTime(callback) {
	    var _this8 = this;

	    this.onTheir('msgsLastSeenTime', function (time) {
	      _this8.theirMsgsLastSeenTime = time;
	      if (callback) {
	        callback(_this8.theirMsgsLastSeenTime);
	      }
	    });
	  };

	  /**
	  * Add a public key to the channel
	  * @param {string} pub
	  */


	  Channel.prototype.addParticipant = async function addParticipant(pub) {
	    var _this9 = this;

	    var save = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
	    var permissions = arguments[2];

	    permissions = permissions || this.DEFAULT_PERMISSIONS;
	    if (this.secrets[pub] && _JSON$stringify(this.secrets[pub]) === _JSON$stringify(permissions)) {
	      // TODO: should be this.participants[pub]
	      return;
	    }
	    this.secrets[pub] = null;
	    this.getSecret(pub);
	    var ourSecretChannelId = await this.getOurSecretChannelId(pub);
	    if (save) {
	      // Save their public key in encrypted format, so in channel listing we know who we are channeling with
	      var mySecret = await Gun.SEA.secret(this.key.epub, this.key);
	      this.gun.user().get('chats').get(ourSecretChannelId).get('pub').put((await Gun.SEA.encrypt({ pub: pub }, mySecret)));
	    }
	    if (this.uuid) {
	      this.participants[pub] = permissions;
	      if (save) {
	        this.putDirect('S' + this.uuid, this.getMyGroupSecret());
	        this.getMySecretUuid().then(function (s) {
	          _this9.putDirect(_this9.uuid, s); // TODO: encrypt keys in put()
	        });
	        this.onTheirDirect(this.uuid, function (s, k, from) {
	          _this9.theirSecretUuids[from] = s;
	        });
	        this.onTheirDirect('S' + this.uuid, function (s, k, from) {
	          _this9.theirGroupSecrets[from] = s;
	        });
	        this.save();
	      }
	    }
	  };

	  /**
	  * Send a message to the channel
	  * @param msg string or {time, text, ...} object
	  */


	  Channel.prototype.send = async function send(msg) {
	    if (typeof msg === 'string') {
	      msg = msg.trim();
	      if (msg.length === 0) {
	        return;
	      }
	      msg = {
	        time: new Date().toISOString(),
	        text: msg
	      };
	    } else if (typeof msg === 'object') {
	      msg.time = msg.time || new Date().toISOString();
	    } else {
	      throw new Error('msg param must be a string or an object');
	    }
	    //this.gun.user().get('message').set(temp);
	    if (this.uuid) {
	      var encrypted = await Gun.SEA.encrypt(_JSON$stringify(msg), this.getMyGroupSecret());
	      var mySecretUuid = await this.getMySecretUuid();
	      this.user.get('chats').get(mySecretUuid).get('msgs').get('' + msg.time).put(encrypted);
	      this.user.get('chats').get(mySecretUuid).get('latestMsg').put(encrypted);
	    } else {
	      var keys = this.getCurrentParticipants();
	      for (var i = 0; i < keys.length; i++) {
	        var _encrypted = await Gun.SEA.encrypt(_JSON$stringify(msg), (await this.getSecret(keys[i])));
	        var ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
	        this.user.get('chats').get(ourSecretChannelId).get('msgs').get('' + msg.time).put(_encrypted);
	        this.user.get('chats').get(ourSecretChannelId).get('latestMsg').put(_encrypted);
	      }
	    }
	  };

	  /**
	  * Save the channel to our channels list without sending a message
	  */


	  Channel.prototype.save = async function save() {
	    if (this.uuid) {
	      var mySecretUuid = await this.getMySecretUuid();
	      this.user.get('chats').get(mySecretUuid).get('msgs').get('a').put(null);
	      this.put('participants', this.participants); // public participants list
	      var mySecret = await Gun.SEA.secret(this.key.epub, this.key);
	      this.user.get('chats').get(mySecretUuid).get('pub').put((await Gun.SEA.encrypt({
	        uuid: this.uuid,
	        myGroupSecret: this.getMyGroupSecret(),
	        participants: this.participants // private participants list
	      }, mySecret)));
	    } else {
	      var keys = this.getCurrentParticipants();
	      for (var i = 0; i < keys.length; i++) {
	        var ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
	        this.user.get('chats').get(ourSecretChannelId).get('msgs').get('a').put(null);
	      }
	    }
	  };

	  /**
	  * Save a key-value pair, encrypt value. Each participant in the Channel writes to their own version of the key-value pair — they don't overwrite the same one.
	  * @param {string} key
	  * @param value
	  */


	  Channel.prototype.put = async function put(key, value) {
	    return (this.uuid ? this.putGroup : this.putDirect).call(this, key, value);
	  };

	  Channel.prototype.putGroup = async function putGroup(key, value) {
	    if (key === 'msgs') {
	      throw new Error('Sorry, you can\'t overwrite the msgs field which is used for .send()');
	    }
	    var encrypted = await Gun.SEA.encrypt(_JSON$stringify(value), this.getMyGroupSecret());
	    var mySecretUuid = await this.getMySecretUuid();
	    this.user.get('chats').get(mySecretUuid).get(key).put(encrypted);
	  };

	  Channel.prototype.putDirect = async function putDirect(key, value) {
	    if (key === 'msgs') {
	      throw new Error('Sorry, you can\'t overwrite the msgs field which is used for .send()');
	    }
	    var keys = this.getCurrentParticipants();
	    for (var i = 0; i < keys.length; i++) {
	      var encrypted = await Gun.SEA.encrypt(_JSON$stringify(value), (await this.getSecret(keys[i])));
	      var ourSecretChannelId = await this.getOurSecretChannelId(keys[i]);
	      this.user.get('chats').get(ourSecretChannelId).get(key).put(encrypted);
	    }
	  };

	  /**
	  * Subscribe to a key-value pair. Callback returns every participant's value unless you limit it with *from* param.
	  * @param {string} key
	  * @param {function} callback
	  * @param {string} from public key whose value you want, or *"me"* for your value only, or *"them"* for the value of others only
	  */


	  Channel.prototype.on = async function on(key, callback, from) {
	    return (this.uuid ? this.onGroup : this.onDirect).call(this, key, callback, from);
	  };

	  Channel.prototype.onDirect = async function onDirect(key, callback, from) {
	    var _this10 = this;

	    if (!from || from === 'me' || from === this.key.pub) {
	      this.onMy(key, function (val) {
	        return callback(val, _this10.key.pub);
	      });
	    }
	    if (!from || from !== 'me' && from !== this.key.pub) {
	      this.onTheir(key, function (val, k, pub) {
	        return callback(val, pub);
	      });
	    }
	  };

	  Channel.prototype.onGroup = async function onGroup(key, callback, from) {
	    var _this11 = this;

	    if (!from || from === 'me' || from === this.key.pub) {
	      this.onMyGroup(key, function (val) {
	        return callback(val, _this11.key.pub);
	      });
	    }
	    if (!from || from !== 'me' && from !== this.key.pub) {
	      this.onTheirGroup(key, function (val, k, pub) {
	        return callback(val, pub);
	      });
	    }
	  };

	  Channel.prototype.onMy = async function onMy(key, callback) {
	    return (this.uuid ? this.onMyGroup : this.onMyDirect).call(this, key, callback);
	  };

	  Channel.prototype.onMyDirect = async function onMyDirect(key, callback) {
	    var _this12 = this;

	    if (typeof callback !== 'function') {
	      throw new Error('onMy callback must be a function, got ' + (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)));
	    }
	    var keys = this.getCurrentParticipants();

	    var _loop = async function _loop(i) {
	      var ourSecretChannelId = await _this12.getOurSecretChannelId(keys[i]);
	      _this12.gun.user().get('chats').get(ourSecretChannelId).get(key).on(async function (data) {
	        var decrypted = await Gun.SEA.decrypt(data, (await _this12.getSecret(keys[i])));
	        if (decrypted) {
	          callback(typeof decrypted.v !== 'undefined' ? decrypted.v : decrypted, key);
	        }
	      });
	      return 'break';
	    };

	    for (var i = 0; i < keys.length; i++) {
	      var _ret = await _loop(i);

	      if (_ret === 'break') break;
	    }
	  };

	  Channel.prototype.onMyGroup = async function onMyGroup(key, callback) {
	    if (typeof callback !== 'function') {
	      throw new Error('onMy callback must be a function, got ' + (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)));
	    }
	    var mySecretUuid = await this.getMySecretUuid();
	    var mySecret = await this.getMyGroupSecret();
	    this.gun.user().get('chats').get(mySecretUuid).get(key).on(async function (data) {
	      var decrypted = await Gun.SEA.decrypt(data, mySecret);
	      if (decrypted) {
	        callback(typeof decrypted.v !== 'undefined' ? decrypted.v : decrypted, key);
	      }
	    });
	  };

	  Channel.prototype.onTheir = async function onTheir(key, callback, from) {
	    return (this.uuid ? this.onTheirGroup : this.onTheirDirect).call(this, key, callback, from);
	  };

	  Channel.prototype.onTheirDirect = async function onTheirDirect(key, callback, from) {
	    var _this13 = this;

	    // TODO: subscribe to new channel participants
	    if (typeof callback !== 'function') {
	      throw new Error('onTheir callback must be a function, got ' + (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)));
	    }
	    var keys = this.getCurrentParticipants();
	    keys.forEach(async function (pub) {
	      if (from && pub !== from) {
	        return;
	      }
	      var theirSecretChannelId = await _this13.getTheirSecretChannelId(pub);
	      _this13.gun.user(pub).get('chats').get(theirSecretChannelId).get(key).on(async function (data) {
	        var decrypted = await Gun.SEA.decrypt(data, (await _this13.getSecret(pub)));
	        if (decrypted) {
	          callback(typeof decrypted.v !== 'undefined' ? decrypted.v : decrypted, key, pub);
	        }
	      });
	    });
	  };

	  Channel.prototype.onTheirGroup = async function onTheirGroup(key, callback, from) {
	    var _this14 = this;

	    // TODO: subscribe to new channel participants
	    if (typeof callback !== 'function') {
	      throw new Error('onTheir callback must be a function, got ' + (typeof callback === 'undefined' ? 'undefined' : _typeof(callback)));
	    }
	    var keys = this.getCurrentParticipants();
	    keys.forEach(async function (pub) {
	      if (from && pub !== from) {
	        return;
	      }
	      var theirSecretUuid = await _this14.getTheirSecretUuid(pub);
	      _this14.gun.user(pub).get('chats').get(theirSecretUuid).get(key).on(async function (data) {
	        var decrypted = await Gun.SEA.decrypt(data, (await _this14.getTheirGroupSecret(pub)));
	        if (decrypted) {
	          callback(typeof decrypted.v !== 'undefined' ? decrypted.v : decrypted, key, pub);
	        }
	      });
	    });
	  };

	  /**
	  * Set typing status
	  */


	  Channel.prototype.setTyping = function setTyping(isTyping) {
	    var _this15 = this;

	    var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;

	    isTyping = typeof isTyping === 'undefined' ? true : isTyping;
	    timeout = timeout * 1000;
	    this.put('typing', isTyping ? new Date().toISOString() : false);
	    clearTimeout(this.setTypingTimeout);
	    this.setTypingTimeout = setTimeout(function () {
	      return _this15.put('typing', false);
	    }, timeout);
	  };

	  /**
	  * Get typing status
	  */


	  Channel.prototype.getTyping = function getTyping(callback) {
	    var _this16 = this;

	    var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;
	    // TODO callback not called on setTyping(false), at least for self chat
	    timeout = timeout * 1000;
	    this.onTheir('typing', function (typing, key, pub) {
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
	  };

	  /**
	  * Add a chat button to page
	  * @param options {label, channelOptions}
	  */


	  Channel.addChatButton = function addChatButton() {
	    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    options = _Object$assign({ label: 'Chat' }, options);
	    if (!options.channelOptions) {
	      throw new Error('addChatButton missing options.channelOptions param');
	    }
	    util.injectCss();
	    var channel = void 0,
	        box = void 0;
	    var btn = util.createElement('div', 'iris-chat-open-button', document.body);
	    btn.setAttribute('id', 'iris-chat-open-button');
	    btn.innerHTML = '<svg style="margin-right:7px;margin-bottom: -0.2em" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 510 510" xml:space="preserve"><path fill="currentColor" d="M459,0H51C22.95,0,0,22.95,0,51v459l102-102h357c28.05,0,51-22.95,51-51V51C510,22.95,487.05,0,459,0z M102,178.5h306v51 H102V178.5z M306,306H102v-51h204V306z M408,153H102v-51h306V153z"></path></svg> ' + options.label;
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
	  };

	  /**
	  * Get a simple link that points to the channel.
	  *
	  * Direct channel: both users need to give their simple links. Use createChatLink() to get a two-way link that needs to be given by one user only.
	  *
	  * Group channel: Works only if the link recipient has been already added onto the channel participants list.
	  */


	  Channel.prototype.getSimpleLink = function getSimpleLink() {
	    var urlRoot = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'https://iris.to/';

	    if (this.uuid) {
	      return urlRoot + '?channelId=' + this.uuid + '&inviter=' + this.key.pub;
	    } else {
	      return urlRoot + '?chatWith=' + this.getCurrentParticipants()[0];
	    }
	  };

	  /**
	  *
	  */


	  Channel.prototype.getChatLinks = async function getChatLinks(_ref) {
	    var _this17 = this;

	    var callback = _ref.callback,
	        urlRoot = _ref.urlRoot,
	        subscribe = _ref.subscribe;

	    urlRoot = urlRoot || 'https://iris.to/';
	    if (!this.uuid) {
	      throw new Error('Only group channels may have chat links');
	    }
	    var chatLinks = [];
	    this.on('chatLinks', function (links, from) {
	      // TODO: check admin permissions
	      if (!links || (typeof links === 'undefined' ? 'undefined' : _typeof(links)) !== 'object') {
	        return;
	      }
	      _Object$keys(links).forEach(function (linkId) {
	        var link = links[linkId];
	        if (chatLinks.indexOf(linkId) !== -1) {
	          return;
	        } // TODO: check if link was nulled
	        var channels = [];
	        chatLinks.push(linkId);
	        var url = Channel.formatChatLink({ urlRoot: urlRoot, inviter: from, channelId: _this17.uuid, sharedSecret: link.sharedSecret, linkId: linkId });
	        if (callback) {
	          callback({ url: url, id: linkId });
	        }
	        if (subscribe) {
	          _this17.gun.user(link.sharedKey.pub).get('chatRequests').map().on(async function (encPub, requestId) {
	            if (!encPub) {
	              return;
	            }
	            var s = _JSON$stringify(encPub);
	            if (channels.indexOf(s) === -1) {
	              channels.push(s);
	              var pub = await Gun.SEA.decrypt(encPub, link.sharedSecret);
	              _this17.addParticipant(pub);
	            }
	          });
	        }
	      });
	    });
	  };

	  Channel.prototype.createChatLink = async function createChatLink() {
	    var urlRoot = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'https://iris.to/';

	    var sharedKey = await Gun.SEA.pair();
	    var sharedKeyString = _JSON$stringify(sharedKey);
	    var sharedSecret = await Gun.SEA.secret(sharedKey.epub, sharedKey);
	    var encryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, sharedSecret);
	    var ownerSecret = await Gun.SEA.secret(this.key.epub, this.key);
	    var ownerEncryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, ownerSecret);
	    var linkId = await util.getHash(encryptedSharedKey);
	    linkId = linkId.slice(0, 12);

	    // User has to exist, in order for .get(chatRequests).on() to be ever triggered
	    await util.gunAsAnotherUser(this.gun, sharedKey, function (user) {
	      return user.get('chatRequests').put({ a: 1 }).then();
	    });

	    this.chatLinks[linkId] = { sharedKey: sharedKey, sharedSecret: sharedSecret };
	    this.put('chatLinks', this.chatLinks);
	    this.user.get('chatLinks').get(linkId).put({ encryptedSharedKey: encryptedSharedKey, ownerEncryptedSharedKey: ownerEncryptedSharedKey });

	    return Channel.formatChatLink({ urlRoot: urlRoot, channelId: this.uuid, inviter: this.key.pub, sharedSecret: sharedSecret, linkId: linkId });
	  };

	  /**
	  * Get a channel box element that you can add to your page
	  */


	  Channel.prototype.getChatBox = function getChatBox() {
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
	      typingIndicator.setAttribute('class', 'iris-typing-indicator' + (isTyping ? ' yes' : ''));
	    });

	    var inputWrapper = util.createElement('div', 'iris-chat-input-wrapper', chatBox);
	    var textArea = util.createElement('textarea', undefined, inputWrapper);
	    textArea.setAttribute('rows', '1');
	    textArea.setAttribute('placeholder', 'Type a message');
	    if (util.isMobile) {
	      var sendBtn = util.createElement('button', undefined, inputWrapper);
	      sendBtn.innerHTML = '\n        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 486.736 486.736" style="enable-background:new 0 0 486.736 486.736;" xml:space="preserve" width="100px" height="100px" fill="#000000" stroke="#000000" stroke-width="0"><path fill="currentColor" d="M481.883,61.238l-474.3,171.4c-8.8,3.2-10.3,15-2.6,20.2l70.9,48.4l321.8-169.7l-272.4,203.4v82.4c0,5.6,6.3,9,11,5.9 l60-39.8l59.1,40.3c5.4,3.7,12.8,2.1,16.3-3.5l214.5-353.7C487.983,63.638,485.083,60.038,481.883,61.238z"></path></svg>\n      ';
	      sendBtn.addEventListener('click', function () {
	        _this18.send(textArea.value);
	        textArea.value = '';
	        _this18.setTyping(false);
	      });
	    }

	    var participants = this.getCurrentParticipants();
	    if (participants.length) {
	      var pub = participants[0];
	      this.gun.user(pub).get('profile').get('name').on(function (name) {
	        return nameEl.innerText = name;
	      });
	      Channel.getOnline(this.gun, pub, function (status) {
	        var cls = 'iris-online-indicator' + (status.isOnline ? ' yes' : '');
	        onlineIndicator.setAttribute('class', cls);
	        var undelivered = messages.querySelectorAll('.iris-chat-message:not(.delivered)');
	        undelivered.forEach(function (msg) {
	          if (msg.getAttribute('data-time') <= status.lastActive) {
	            var c = msg.getAttribute('class');
	            msg.setAttribute('class', c + ' delivered');
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
	            msgEl.setAttribute('class', msgClass + ' delivered');
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

	      var msgEl = util.createElement('div', (info.selfAuthored ? 'our' : 'their') + ' iris-chat-message');
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
	      Channel.setOnline(_this18.gun, true); // TODO
	      _this18.setMyMsgsLastSeenTime(); // TODO
	      if (event.keyCode === 13) {
	        event.preventDefault();
	        var content = textArea.value;
	        var caret = util.getCaret(textArea);
	        if (event.shiftKey) {
	          textArea.value = content.substring(0, caret - 1) + '\n' + content.substring(caret, content.length);
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
	  };

	  /**
	  * Set the user's online status
	  * @param {object} gun
	  * @param {boolean} isOnline true: update the user's lastActive time every 3 seconds, false: stop updating
	  */


	  Channel.setOnline = function setOnline(gun, isOnline) {
	    if (isOnline) {
	      if (gun.setOnlineInterval) {
	        return;
	      }
	      var update = function update() {
	        gun.user().get('lastActive').put(new Date(Gun.state()).toISOString());
	      };
	      update();
	      gun.setOnlineInterval = setInterval(update, 3000);
	    } else {
	      clearInterval(gun.setOnlineInterval);
	      gun.setOnlineInterval = undefined;
	    }
	  };

	  /**
	  * Get the online status of a user.
	  *
	  * @param {object} gun
	  * @param {string} pubKey public key of the user
	  * @param {boolean} callback receives a boolean each time the user's online status changes
	  */


	  Channel.getOnline = function getOnline(gun, pubKey, callback) {
	    var timeout = void 0;
	    gun.user(pubKey).get('lastActive').on(function (lastActive) {
	      clearTimeout(timeout);
	      var now = new Date(Gun.state());
	      var lastActiveDate = new Date(lastActive);
	      if (lastActiveDate.getFullYear() === 1970) {
	        // lol, format changed from seconds to iso string
	        lastActiveDate = new Date(lastActiveDate.getTime() * 1000);
	        lastActive = lastActiveDate.toISOString();
	      }
	      var isOnline = lastActiveDate > now - 10 * 1000 && lastActive < now + 30 * 1000;
	      callback({ isOnline: isOnline, lastActive: lastActive });
	      if (isOnline) {
	        timeout = setTimeout(function () {
	          return callback({ isOnline: false, lastActive: lastActive });
	        }, 10000);
	      }
	    });
	  };

	  /**
	  * In order to receive messages from others, this method must be called for newly created
	  * users that have not started a channel with an existing user yet.
	  *
	  * It saves the user's key.epub (public key for encryption) into their gun user space,
	  * so others can find it and write encrypted messages to them.
	  *
	  * If you start a channel with an existing user, key.epub is saved automatically and you don't need
	  * to call this method.
	  */


	  Channel.initUser = function initUser(gun, key) {
	    var user = gun.user();
	    user.auth(key);
	    user.put({ epub: key.epub });
	  };

	  Channel.formatChatLink = function formatChatLink(_ref2) {
	    var urlRoot = _ref2.urlRoot,
	        chatWith = _ref2.chatWith,
	        channelId = _ref2.channelId,
	        inviter = _ref2.inviter,
	        sharedSecret = _ref2.sharedSecret,
	        linkId = _ref2.linkId;

	    var enc = encodeURIComponent;
	    if (channelId && inviter) {
	      return urlRoot + '?channelId=' + enc(channelId) + '&inviter=' + enc(inviter) + '&s=' + enc(sharedSecret) + '&k=' + enc(linkId);
	    } else {
	      return urlRoot + '?chatWith=' + enc(chatWith) + '&s=' + enc(sharedSecret) + '&k=' + enc(linkId);
	    }
	  };

	  /**
	  * Creates a channel link that can be used for two-way communication, i.e. only one link needs to be exchanged.
	  */


	  Channel.createChatLink = async function createChatLink(gun, key) {
	    var urlRoot = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'https://iris.to/';

	    var user = gun.user();
	    user.auth(key);

	    var sharedKey = await Gun.SEA.pair();
	    var sharedKeyString = _JSON$stringify(sharedKey);
	    var sharedSecret = await Gun.SEA.secret(sharedKey.epub, sharedKey);
	    var encryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, sharedSecret);
	    var ownerSecret = await Gun.SEA.secret(key.epub, key);
	    var ownerEncryptedSharedKey = await Gun.SEA.encrypt(sharedKeyString, ownerSecret);
	    var linkId = await util.getHash(encryptedSharedKey);
	    linkId = linkId.slice(0, 12);

	    // User has to exist, in order for .get(chatRequests).on() to be ever triggered
	    await util.gunAsAnotherUser(gun, sharedKey, function (user) {
	      return user.get('chatRequests').put({ a: 1 }).then();
	    });

	    user.get('chatLinks').get(linkId).put({ encryptedSharedKey: encryptedSharedKey, ownerEncryptedSharedKey: ownerEncryptedSharedKey });

	    return Channel.formatChatLink({ urlRoot: urlRoot, chatWith: key.pub, sharedSecret: sharedSecret, linkId: linkId });
	  };

	  /**
	  *
	  */


	  Channel.getMyChatLinks = async function getMyChatLinks(gun, key) {
	    var urlRoot = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'https://iris.to/';
	    var callback = arguments[3];
	    var subscribe = arguments[4];

	    var user = gun.user();
	    user.auth(key);
	    var mySecret = await Gun.SEA.secret(key.epub, key);
	    var chatLinks = [];
	    user.get('chatLinks').map().on(function (data, linkId) {
	      if (!data || chatLinks.indexOf(linkId) !== -1) {
	        return;
	      }
	      var channels = [];
	      user.get('chatLinks').get(linkId).get('ownerEncryptedSharedKey').on(async function (enc) {
	        if (!enc || chatLinks.indexOf(linkId) !== -1) {
	          return;
	        }
	        chatLinks.push(linkId);
	        var sharedKey = await Gun.SEA.decrypt(enc, mySecret);
	        var sharedSecret = await Gun.SEA.secret(sharedKey.epub, sharedKey);
	        var url = Channel.formatChatLink({ urlRoot: urlRoot, chatWith: key.pub, sharedSecret: sharedSecret, linkId: linkId });
	        if (callback) {
	          callback({ url: url, id: linkId });
	        }
	        if (subscribe) {
	          gun.user(sharedKey.pub).get('chatRequests').map().on(async function (encPub, requestId) {
	            if (!encPub) {
	              return;
	            }
	            var s = _JSON$stringify(encPub);
	            if (channels.indexOf(s) === -1) {
	              channels.push(s);
	              var pub = await Gun.SEA.decrypt(encPub, sharedSecret);
	              var channel = new Channel({ gun: gun, key: key, participants: pub });
	              channel.save();
	            }
	            util.gunAsAnotherUser(gun, sharedKey, function (user) {
	              // remove the channel request after reading
	              user.get('chatRequests').get(requestId).put(null);
	            });
	          });
	        }
	      });
	    });
	  };

	  /**
	  *
	  */


	  Channel.removeChatLink = function removeChatLink(gun, key, linkId) {
	    gun.user().auth(key);
	    gun.user().get('chatLinks').get(linkId).put(null);
	  };

	  /**
	  *
	  */


	  Channel.deleteChannel = async function deleteChannel(gun, key, pub) {
	    gun.user().auth(key);
	    var channelId = await Channel.getOurSecretChannelId(gun, pub, key);
	    gun.user().get('channels').get(channelId).put(null);
	    gun.user().get('channels').get(channelId).off();
	  };

	  return Channel;
	}();

	// eslint-disable-line no-unused-vars

	/**
	* Gun object collection that provides tools for indexing and search. Decentralize everything!
	*
	* If opt.class is passed, object.serialize() and opt.class.deserialize() must be defined.
	*
	* Supports search from multiple indexes.
	* For example, retrieve message feed from your own index and your friends' indexes.
	*
	* TODO: aggregation
	* TODO: example
	* TODO: scrollable and stretchable "search result window"
	* @param {Object} opt {gun, class, indexes = [], askPeers = true, name = class.name}
	*/

	var Collection$2 = function () {
	  function Collection() {
	    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    _classCallCheck(this, Collection);

	    if (!opt.gun) {
	      throw new Error('Missing opt.gun');
	    }
	    if (!(opt.class || opt.name)) {
	      throw new Error('You must supply either opt.name or opt.class');
	    }
	    this.class = opt.class;
	    this.serializer = opt.serializer;
	    if (this.class && !this.class.deserialize && !this.serializer) {
	      throw new Error('opt.class must have deserialize() method or opt.serializer must be defined');
	    }
	    this.name = opt.name || opt.class.name;
	    this.gun = opt.gun;
	    this.indexes = opt.indexes || [];
	    this.indexer = opt.indexer;
	    this.askPeers = typeof opt.askPeers === 'undefined' ? true : opt.askPeers;
	  }

	  /**
	  * @return {String} id of added object, which can be used for collection.get(id)
	  */


	  Collection.prototype.put = function put(object) {
	    var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    var data = object;
	    if (this.serializer) {
	      data = this.serializer.serialize(object);
	    }if (this.class) {
	      data = object.serialize();
	    }
	    // TODO: optionally use gun hash table
	    var node = void 0;
	    if (opt.id || data.id) {
	      node = this.gun.get(this.name).get('id').get(opt.id || data.id).put(data); // TODO: use .top()
	    } else if (object.getId) {
	      node = this.gun.get(this.name).get('id').get(object.getId()).put(data);
	    } else {
	      node = this.gun.get(this.name).get('id').set(data);
	    }
	    this._addToIndexes(data, node);
	    return data.id || Gun.node.soul(node) || node._.link;
	  };

	  Collection.prototype._addToIndexes = async function _addToIndexes(serializedObject, node) {
	    var _this = this;

	    if (Gun.node.is(serializedObject)) {
	      serializedObject = await serializedObject.open();
	    }
	    var addToIndex = function addToIndex(indexName, indexKey) {
	      _this.gun.get(_this.name).get(indexName).get(indexKey).put(node);
	    };
	    if (this.indexer) {
	      var customIndexes = await this.indexer(serializedObject);
	      var customIndexKeys = _Object$keys(customIndexes);
	      for (var i = 0; i < customIndexKeys; i++) {
	        var key = customIndexKeys[i];
	        addToIndex(key, customIndexes[key]);
	      }
	    }
	    for (var _i = 0; _i < this.indexes.length; _i++) {
	      var indexName = this.indexes[_i];
	      if (Object.prototype.hasOwnProperty.call(serializedObject, indexName)) {
	        addToIndex(indexName, serializedObject[indexName]);
	      }
	    }
	  };

	  // TODO: method for terminating the query
	  // TODO: query ttl. https://mongodb.github.io/node-mongodb-native/2.0/api/Collection.html
	  /**
	  * @param {Object} opt {callback, id, selector, limit, orderBy}
	  */


	  Collection.prototype.get = function get() {
	    var _this2 = this;

	    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

	    if (!opt.callback) {
	      return;
	    }
	    var results = 0;
	    var matcher = function matcher(data, id, node) {
	      if (!data) {
	        return;
	      }
	      if (opt.limit && results++ >= opt.limit) {
	        return; // TODO: terminate query
	      }
	      if (opt.selector) {
	        // TODO: deep compare selector object?
	        var keys = _Object$keys(opt.selector);
	        for (var i = 0; i < keys.length; i++) {
	          var key = keys[i];
	          if (!Object.prototype.hasOwnProperty.call(data, key)) {
	            return;
	          }
	          var v1 = void 0,
	              v2 = void 0;
	          if (opt.caseSensitive === false) {
	            v1 = data[key].toLowerCase();
	            v2 = opt.selector[key].toLowerCase();
	          } else {
	            v1 = data[key];
	            v2 = opt.selector[key];
	          }
	          if (v1 !== v2) {
	            return;
	          }
	        }
	      }
	      if (opt.query) {
	        // TODO: use gun.get() lt / gt operators
	        var _keys = _Object$keys(opt.query);
	        for (var _i2 = 0; _i2 < _keys.length; _i2++) {
	          var _key = _keys[_i2];
	          if (!Object.prototype.hasOwnProperty.call(data, _key)) {
	            return;
	          }
	          var _v = void 0,
	              _v2 = void 0;
	          if (opt.caseSensitive === false) {
	            _v = data[_key].toLowerCase();
	            _v2 = opt.query[_key].toLowerCase();
	          } else {
	            _v = data[_key];
	            _v2 = opt.query[_key];
	          }
	          if (_v.indexOf(_v2) !== 0) {
	            return;
	          }
	        }
	      }
	      if (_this2.serializer) {
	        opt.callback(_this2.serializer.deserialize(data, { id: id, gun: node.$ }));
	      } else if (_this2.class) {
	        opt.callback(_this2.class.deserialize(data, { id: id, gun: node.$ }));
	      } else {
	        opt.callback(data);
	      }
	    };

	    if (opt.id) {
	      opt.limit = 1;
	      this.gun.get(this.name).get('id').get(opt.id).on(matcher);
	      return;
	    }

	    var indexName = 'id';
	    if (opt.orderBy && this.indexes.indexOf(opt.orderBy) > -1) {
	      indexName = opt.orderBy;
	    }

	    // TODO: query from indexes
	    this.gun.get(this.name).get(indexName).map().on(matcher); // TODO: limit .open recursion
	    if (this.askPeers) {
	      this.gun.get('trustedIndexes').on(function (val, key) {
	        _this2.gun.user(key).get(_this2.name).get(indexName).map().on(matcher);
	      });
	    }
	  };

	  Collection.prototype.delete = function _delete() {
	    // gun.unset()
	  };

	  return Collection;
	}();

	if (Gun && Gun.User) {
	  Gun.User.prototype.top = function (key) {
	    var gun = this,
	        root = gun.back(-1),
	        user = root.user();
	    if (!user.is) {
	      throw { err: 'Not logged in!' };
	    }
	    var top = user.chain(),
	        at = top._;
	    at.soul = at.get = '~' + user.is.pub + '.' + key;
	    var tmp = root.get(at.soul)._;
	    (tmp.echo || (tmp.echo = {}))[at.id] = at;
	    return top;
	  };
	}

	// temp method for GUN search
	async function searchText(node, callback, query, limit) {
	  // , cursor, desc
	  var seen = {};
	  node.map().once(function (value, key) {
	    //console.log(`searchText`, value, key, desc);
	    if (key.indexOf(query) === 0) {
	      if (typeof limit === 'number' && _Object$keys(seen).length >= limit) {
	        return;
	      }
	      if (Object.prototype.hasOwnProperty.call(seen, key)) {
	        return;
	      }
	      if (value && _Object$keys(value).length > 1) {
	        seen[key] = true;
	        callback({ value: value, key: key });
	      }
	    }
	  });
	}

	// TODO: flush onto IPFS
	/**
	* **Experimental.** Unlike Channel, this is probably not the most useful class yet.
	*
	* The essence of Iris: A database of Contacts and SignedMessages within your web of trust.
	*
	* NOTE: these docs reflect the latest commit at https://github.com/irislib/iris-lib
	*
	* To use someone else's index (read-only): set options.pubKey
	*
	* To use your own index: set options.keypair or omit it to use Key.getDefaultKey().
	*
	* Each added SignedMessage updates the SignedMessage and Contacts indexes and web of trust accordingly.
	*
	* You can pass options.gun to use custom gun storages and networking settings.
	*
	* If you want messages saved to IPFS, pass options.ipfs = instance.
	*
	* Wait for index.ready promise to resolve before calling instance methods.
	* @param {Object} options see default options in example
	* @example
	* https://github.com/irislib/iris-lib/blob/master/__tests__/SocialNetwork.js
	*
	* Default options:
	*{
	*  ipfs: undefined,
	*  keypair: undefined,
	*  pubKey: undefined,
	*  gun: undefined,
	*  self: undefined,
	*  indexSync: {
	*    importOnAdd: {
	*      enabled: true,
	*      maxMsgCount: 500,
	*      maxMsgDistance: 2
	*    },
	*    subscribe: {
	*      enabled: true,
	*      maxMsgDistance: 1
	*    },
	*    query: {
	*      enabled: true
	*    },
	*    msgTypes: {
	*      all: false,
	*      rating: true,
	*      verification: true,
	*      unverification: true
	*    },
	*    debug: false
	*  }
	*}
	* @returns {SocialNetwork}  index object
	*/

	var SocialNetwork = function () {
	  function SocialNetwork(options) {
	    var _this = this;

	    _classCallCheck(this, SocialNetwork);

	    this.options = _Object$assign({
	      ipfs: undefined,
	      keypair: undefined,
	      pubKey: undefined,
	      self: undefined,
	      indexSync: {
	        importOnAdd: {
	          enabled: true,
	          maxMsgCount: 100,
	          maxMsgDistance: 2
	        },
	        subscribe: {
	          enabled: true,
	          maxMsgDistance: 1
	        },
	        query: {
	          enabled: true
	        },
	        msgTypes: {
	          all: false,
	          rating: true,
	          verification: true,
	          unverification: true
	        },
	        debug: false
	      }
	    }, options);

	    if (options.pubKey) {
	      // someone else's index
	      var gun = options.gun || new Gun();
	      var user = gun.user(options.pubKey);
	      this.gun = user.get('iris');
	      this.rootContact = new Attribute({ type: 'keyID', value: options.pubKey });
	      this.ready = _Promise.resolve();
	    } else {
	      // our own index
	      this.ready = this._init();
	    }
	    this.ready.then(function () {
	      return _this._subscribeToTrustedIndexes();
	    });
	  }

	  SocialNetwork.prototype._init = async function _init() {
	    var _this2 = this;

	    var keypair = this.options.keypair;
	    if (!keypair) {
	      keypair = await Key.getDefault();
	    }
	    var gun = this.options.gun || new Gun();
	    var user = gun.user();
	    user.auth(keypair);
	    this.writable = true;
	    this.rootContact = new Attribute('keyID', Key.getId(keypair));
	    user.get('epub').put(keypair.epub);
	    // Initialize indexes with deterministic gun souls (.top)
	    this.gun = user.get('iris').put(user.top('iris'));
	    this.gun.get('identitiesBySearchKey').put(user.top('identitiesBySearchKey'));
	    this.gun.get('identitiesByTrustDistance').put(user.top('identitiesByTrustDistance'));
	    this.gun.get('messages').put(user.top('messages'));
	    this.gun.get('messagesByTimestamp').put(user.top('messagesByTimestamp'));
	    this.gun.get('messagesByHash').put(user.top('messagesByHash'));
	    this.gun.get('messagesByDistance').put(user.top('messagesByDistance'));

	    this.messages = new Collection$2({ gun: this.gun, class: SignedMessage, indexes: ['time', 'trustDistance'] });
	    this.contacts = new Collection$2({ gun: this.gun, class: Contact });

	    var uri = this.rootContact.uri();
	    var g = user.top(uri);
	    this.gun.get('identitiesBySearchKey').get(uri).put(g);
	    var attrs = {};
	    attrs[uri] = this.rootContact;
	    if (this.options.self) {
	      var keys = _Object$keys(this.options.self);
	      for (var i = 0; i < keys.length; i++) {
	        var a = new Attribute(keys[i], this.options.self[keys[i]]);
	        attrs[a.uri()] = a;
	      }
	    }
	    var id = Contact.create(g, { trustDistance: 0, linkTo: this.rootContact, attrs: attrs }, this);
	    await this._addContactToIndexes(id.gun);
	    if (this.options.self) {
	      var recipient = _Object$assign(this.options.self, { keyID: this.rootContact.value });
	      SignedMessage.createVerification({ recipient: recipient }, keypair).then(function (msg) {
	        _this2.addMessage(msg);
	      });
	    }
	  };

	  SocialNetwork.prototype._subscribeToTrustedIndexes = function _subscribeToTrustedIndexes() {
	    var _this3 = this;

	    if (this.writable && this.options.indexSync.subscribe.enabled) {
	      setTimeout(function () {
	        _this3.gun.get('trustedIndexes').map().once(function (val, uri) {
	          if (val) {
	            // TODO: only get new messages?
	            _this3.gun.user(uri).get('iris').get('messagesByDistance').map(function (val, key) {
	              var d = _Number$parseInt(key.split(':')[0]);
	              if (!isNaN(d) && d <= _this3.options.indexSync.subscribe.maxMsgDistance) {
	                SignedMessage.fromSig(val).then(function (msg) {
	                  if (_this3.options.indexSync.msgTypes.all || Object.prototype.hasOwnProperty.call(_this3.options.indexSync.msgTypes, msg.signedData.type)) {
	                    _this3.addMessage(msg, { checkIfExists: true });
	                  }
	                });
	              }
	            });
	            _this3.gun.user(uri).get('iris').get('reactions').map(function (reaction, msgHash) {
	              _this3.gun.get('messagesByHash').get(msgHash).get('reactions').get(uri).put(reaction);
	              _this3.gun.get('messagesByHash').get(msgHash).get('reactions').get(uri).put(reaction);
	            });
	          }
	        });
	      }, 5000); // TODO: this should be made to work without timeout
	    }
	  };

	  SocialNetwork.prototype.debug = function debug() {
	    var d = util.isNode && process$3.env.DEBUG ? process$3.env.DEBUG === 'true' : this.options.debug;
	    if (d) {
	      console.log.apply(console, arguments);
	    }
	  };

	  SocialNetwork.getMsgIndexKey = function getMsgIndexKey(msg) {
	    var distance = parseInt(msg.distance);
	    distance = _Number$isNaN(distance) ? 99 : distance;
	    distance = ('00' + distance).substring(distance.toString().length); // pad with zeros
	    var key = distance + ':' + Math.floor(Date.parse(msg.signedData.time || msg.signedData.timestamp)) + ':' + (msg.ipfs_hash || msg.hash).substr(0, 9);
	    return key;
	  };

	  // TODO: GUN indexing module that does this automatically


	  SocialNetwork.getMsgIndexKeys = async function getMsgIndexKeys(msg) {
	    var keys = {};
	    var distance = parseInt(msg.distance);
	    distance = _Number$isNaN(distance) ? 99 : distance;
	    distance = ('00' + distance).substring(distance.toString().length); // pad with zeros
	    var timestamp = Math.floor(Date.parse(msg.signedData.time || msg.signedData.timestamp));
	    var hash = await msg.getHash();
	    var hashSlice = hash.substr(0, 9);

	    if (msg.signedData.type === 'chat') {
	      if (msg.signedData.recipient.uuid) {
	        keys.chatMessagesByUuid = {};
	        keys.chatMessagesByUuid[msg.signedData.recipient.uuid] = msg.signedData.time + ':' + hashSlice;
	      }
	      return keys;
	    }

	    keys.messagesByHash = [hash];
	    keys.messagesByTimestamp = [timestamp + ':' + hashSlice];
	    keys.messagesByDistance = [distance + ':' + keys.messagesByTimestamp[0]];
	    keys.messagesByType = [msg.signedData.type + ':' + timestamp + ':' + hashSlice];

	    keys.messagesByAuthor = {};
	    var authors = msg.getAuthorArray();
	    for (var i = 0; i < authors.length; i++) {
	      if (authors[i].isUniqueType()) {
	        keys.messagesByAuthor[authors[i].uri()] = msg.signedData.timestamp + ':' + hashSlice;
	      }
	    }
	    keys.messagesByRecipient = {};
	    var recipients = msg.getRecipientArray();
	    for (var _i = 0; _i < recipients.length; _i++) {
	      if (recipients[_i].isUniqueType()) {
	        keys.messagesByRecipient[recipients[_i].uri()] = msg.signedData.timestamp + ':' + hashSlice;
	      }
	    }

	    if (['verification', 'unverification'].indexOf(msg.signedData.type) > -1) {
	      keys.verificationsByRecipient = {};
	      for (var _i2 = 0; _i2 < recipients.length; _i2++) {
	        var r = recipients[_i2];
	        if (!r.isUniqueType()) {
	          continue;
	        }
	        for (var j = 0; j < authors.length; j++) {
	          var a = authors[j];
	          if (!a.isUniqueType()) {
	            continue;
	          }
	          keys.verificationsByRecipient[r.uri()] = a.uri();
	        }
	      }
	    } else if (msg.signedData.type === 'rating') {
	      keys.ratingsByRecipient = {};
	      for (var _i3 = 0; _i3 < recipients.length; _i3++) {
	        var _r = recipients[_i3];
	        if (!_r.isUniqueType()) {
	          continue;
	        }
	        for (var _j = 0; _j < authors.length; _j++) {
	          var _a = authors[_j];
	          if (!_a.isUniqueType()) {
	            continue;
	          }
	          keys.ratingsByRecipient[_r.uri()] = _a.uri();
	        }
	      }
	    }
	    return keys;
	  };

	  SocialNetwork.prototype.getContactIndexKeys = async function getContactIndexKeys(contact, hash) {
	    var indexKeys = { identitiesByTrustDistance: [], identitiesBySearchKey: [] };
	    var d = void 0;
	    if (contact.keyID && this.rootContact.equals(contact.linkTo)) {
	      // TODO: contact is a gun instance, no linkTo
	      d = 0;
	    } else {
	      d = await contact.get('trustDistance').then();
	    }

	    function addIndexKey(a) {
	      if (!(a && a.value && a.type)) {
	        // TODO: this sometimes returns undefined
	        return;
	      }
	      var distance = d !== undefined ? d : parseInt(a.dist);
	      distance = _Number$isNaN(distance) ? 99 : distance;
	      distance = ('00' + distance).substring(distance.toString().length); // pad with zeros
	      var v = a.value || a[1];
	      var n = a.type || a[0];
	      var value = encodeURIComponent(v);
	      var lowerCaseValue = encodeURIComponent(v.toLowerCase());
	      var name = encodeURIComponent(n);
	      var key = value + ':' + name;
	      var lowerCaseKey = lowerCaseValue + ':' + name;
	      if (!Attribute.isUniqueType(n)) {
	        // allow for multiple index keys with same non-unique attribute
	        key = key + ':' + hash.substr(0, 9);
	        lowerCaseKey = lowerCaseKey + ':' + hash.substr(0, 9);
	      }
	      indexKeys.identitiesBySearchKey.push(key);
	      indexKeys.identitiesByTrustDistance.push(distance + ':' + key);
	      if (key !== lowerCaseKey) {
	        indexKeys.identitiesBySearchKey.push(lowerCaseKey);
	        indexKeys.identitiesByTrustDistance.push(distance + ':' + lowerCaseKey);
	      }
	      if (v.indexOf(' ') > -1) {
	        var words = v.toLowerCase().split(' ');
	        for (var l = 0; l < words.length; l += 1) {
	          var k = encodeURIComponent(words[l]) + ':' + name;
	          if (!Attribute.isUniqueType(n)) {
	            k = k + ':' + hash.substr(0, 9);
	          }
	          indexKeys.identitiesBySearchKey.push(k);
	          indexKeys.identitiesByTrustDistance.push(distance + ':' + k);
	        }
	      }
	      if (key.match(/^http(s)?:\/\/.+\/[a-zA-Z0-9_]+$/)) {
	        var split = key.split('/');
	        indexKeys.identitiesBySearchKey.push(split[split.length - 1]);
	        indexKeys.identitiesByTrustDistance.push(distance + ':' + split[split.length - 1]);
	      }
	    }

	    if (this.rootContact.equals(contact.keyID)) {
	      addIndexKey(contact.keyID);
	    }

	    var attrs = await Contact.getAttrs(contact);
	    _Object$values(attrs).map(addIndexKey);

	    return indexKeys;
	  };

	  /**
	  *
	  */


	  SocialNetwork.prototype.addContact = async function addContact(attributes) {
	    var follow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

	    // TODO: add uuid to attributes
	    var msg = void 0;
	    if (follow) {
	      msg = await SignedMessage.createRating({ recipient: attributes, rating: 1 });
	    } else {
	      msg = await SignedMessage.createVerification({ recipient: attributes });
	    }
	    return this.addMessage(msg);
	  };

	  /*
	  * Get an contact referenced by an identifier.
	  * get(type, value)
	  * get(Attribute)
	  * get(value) - guesses the type or throws an error
	  * @returns {Contact} contact that is connected to the identifier param
	  */


	  SocialNetwork.prototype.getContact = function getContact(a, b) {
	    var _this4 = this;

	    var reload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

	    if (!a) {
	      throw new Error('getContact failed: first param must be defined');
	    }
	    var attr = a;
	    if (a.constructor.name !== 'Attribute') {
	      var type = void 0,
	          value = void 0;
	      if (b) {
	        type = a;
	        value = b;
	      } else {
	        value = a;
	        type = Attribute.guessTypeOf(value);
	      }
	      attr = new Attribute(type, value);
	    }
	    if (reload) {
	      // 1) get verifications connecting attr to other attributes
	      // 2) recurse
	      // 3) get messages received by this list of attributes
	      // 4) calculate stats
	      // 5) update contact index entry
	      var o = {
	        attributes: {},
	        sent: {},
	        received: {},
	        receivedPositive: 0,
	        receivedNeutral: 0,
	        receivedNegative: 0,
	        sentPositive: 0,
	        sentNeutral: 0,
	        sentNegative: 0
	      };
	      var node = this.gun.get('identities').set(o);
	      var updateContactByLinkedAttribute = function updateContactByLinkedAttribute(attribute) {
	        _this4.gun.get('verificationsByRecipient').get(attribute.uri()).map().once(function (val) {
	          var m = SignedMessage.fromSig(val);
	          var recipients = m.getRecipientArray();
	          for (var i = 0; i < recipients.length; i++) {
	            var a2 = recipients[i];
	            if (!Object.prototype.hasOwnProperty.call(o.attributes), a2.uri()) {
	              // TODO remove attribute from contact if not enough verifications / too many unverifications
	              o.attributes[a2.uri()] = a2;
	              _this4.gun.get('messagesByRecipient').get(a2.uri()).map().once(async function (val) {
	                var m2 = SignedMessage.fromSig(val);
	                var m2hash = await m2.getHash();
	                if (!Object.prototype.hasOwnProperty.call(o.received.hasOwnProperty, m2hash)) {
	                  o.received[m2hash] = m2;
	                  if (m2.isPositive()) {
	                    o.receivedPositive++;
	                    m2.getAuthor(_this4).gun.get('trustDistance').on(function (d) {
	                      if (typeof d === 'number') {
	                        if (typeof o.trustDistance !== 'number' || o.trustDistance > d + 1) {
	                          o.trustDistance = d + 1;
	                          node.get('trustDistance').put(d + 1);
	                        }
	                      }
	                    });
	                  } else if (m2.isNegative()) {
	                    o.receivedNegative++;
	                  } else {
	                    o.receivedNeutral++;
	                  }
	                  node.put(o);
	                }
	              });
	              _this4.gun.get('messagesByAuthor').get(a2.uri()).map().once(async function (val) {
	                var m2 = SignedMessage.fromSig(val);
	                var m2hash = await m2.getHash();
	                if (!Object.prototype.hasOwnProperty.call(o.sent, m2hash)) {
	                  o.sent[m2hash] = m2;
	                  if (m2.isPositive()) {
	                    o.sentPositive++;
	                  } else if (m2.isNegative()) {
	                    o.sentNegative++;
	                  } else {
	                    o.sentNeutral++;
	                  }
	                  node.put(o);
	                }
	              });
	              updateContactByLinkedAttribute(a2);
	            }
	          }
	        });
	      };
	      updateContactByLinkedAttribute(attr);
	      if (this.writable) {
	        this._addContactToIndexes(node);
	      }
	      return new Contact(node, attr, this);
	    } else {
	      return new Contact(this.gun.get('identitiesBySearchKey').get(attr.uri()), attr, this);
	    }
	  };

	  /**
	  *
	  */


	  SocialNetwork.prototype.getContacts = function getContacts() {
	    var _this5 = this;

	    var opt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
	    // cursor // TODO: param 'exact', type param
	    if (opt.value) {
	      if (opt.type) {
	        return this.getContact(opt.type, opt.value, opt.reload);
	      } else {
	        return this.getContact(opt.value);
	      }
	    }
	    opt.query = opt.query || '';
	    var seen = {};
	    function searchTermCheck(key) {
	      var arr = key.split(':');
	      if (arr.length < 2) {
	        return false;
	      }
	      var keyValue = arr[0];
	      var keyType = arr[1];
	      if (keyValue.indexOf(encodeURIComponent(opt.query)) !== 0) {
	        return false;
	      }
	      if (opt.type && keyType !== opt.type) {
	        return false;
	      }
	      return true;
	    }
	    var node = this.gun.get('identitiesBySearchKey');
	    node.map().on(function (id, key) {
	      if (_Object$keys(seen).length >= opt.limit) {
	        // TODO: turn off .map cb
	        return;
	      }
	      if (!searchTermCheck(key)) {
	        return;
	      }
	      var soul = Gun.node.soul(id);
	      if (soul && !Object.prototype.hasOwnProperty.call(seen, soul)) {
	        seen[soul] = true;
	        var contact = new Contact(node.get(key), undefined, _this5);
	        contact.cursor = key;
	        opt.callback(contact);
	      }
	    });
	    if (this.options.indexSync.query.enabled) {
	      this.gun.get('trustedIndexes').map().once(function (val, key) {
	        if (val) {
	          _this5.gun.user(key).get('iris').get('identitiesBySearchKey').map().on(function (id, k) {
	            if (_Object$keys(seen).length >= opt.limit) {
	              // TODO: turn off .map cb
	              return;
	            }
	            if (!searchTermCheck(key)) {
	              return;
	            }
	            var soul = Gun.node.soul(id);
	            if (soul && !Object.prototype.hasOwnProperty.call(seen, soul)) {
	              seen[soul] = true;
	              opt.callback(new Contact(_this5.gun.user(key).get('iris').get('identitiesBySearchKey').get(k), undefined, _this5));
	            }
	          });
	        }
	      });
	    }
	  };

	  /**
	  * @returns {Contact} root contact (center of the social graph, trustDistance == 0)
	  */


	  SocialNetwork.prototype.getRootContact = function getRootContact() {
	    return new Contact(this.gun.get('identitiesBySearchKey').get(this.rootContact.uri()), undefined, this);
	  };

	  /**
	  * Return existing chats and listen to new chats initiated by friends.
	  * Like Channel.getChannels(), but also listens to chats initiated by friends.
	  */


	  SocialNetwork.prototype.getChannels = async function getChannels(callback) {
	    var _this6 = this;

	    Channel.getChannels(this.gun, this.options.keypair, callback);
	    this.gun.get('trustedIndexes').map().on(async function (value, pub) {
	      if (value && pub) {
	        var theirSecretChannelId = await Channel.getTheirSecretChannelId(_this6.gun, pub, _this6.options.keypair);
	        _this6.gun.user(pub).get('chats').get(theirSecretChannelId).on(function (v) {
	          if (v) {
	            callback(pub);
	          }
	        });
	      }
	    });
	  };

	  SocialNetwork.prototype._getMsgs = async function _getMsgs(msgIndex, callback, limit, cursor, desc, filter) {
	    var results = 0;
	    async function resultFound(result) {
	      if (results >= limit) {
	        return;
	      }
	      var msg = await SignedMessage.fromSig(result.value);
	      if (filter && !filter(msg)) {
	        return;
	      }
	      results++;
	      msg.cursor = result.key;
	      if (result.value && result.value.ipfsUri) {
	        msg.ipfsUri = result.value.ipfsUri;
	      }
	      msg.gun = msgIndex.get(result.key);
	      callback(msg);
	    }
	    searchText(msgIndex, resultFound, '', undefined, cursor, desc);
	  };

	  SocialNetwork.prototype._addContactToIndexes = async function _addContactToIndexes(id) {
	    if (typeof id === 'undefined') {
	      var e = new Error('id is undefined');
	      console.error(e.stack);
	      throw e;
	    }
	    var hash = Gun.node.soul(id) || id._ && id._.link || 'todo';
	    var indexKeys = await this.getContactIndexKeys(id, hash.substr(0, 6));

	    var indexes = _Object$keys(indexKeys);
	    for (var i = 0; i < indexes.length; i++) {
	      var index = indexes[i];
	      for (var j = 0; j < indexKeys[index].length; j++) {
	        var key = indexKeys[index][j];
	        // this.debug(`adding to index ${index} key ${key}, saving data: ${id}`);
	        this.gun.get(index).get(key).put(id); // FIXME: Check, why this can't be `await`ed for in tests? [index.ready promise gets stuck]
	      }
	    }
	  };

	  SocialNetwork.prototype._getSentMsgs = async function _getSentMsgs(contact, options) {
	    var _this7 = this;

	    this._getMsgs(contact.gun.get('sent'), options.callback, options.limit, options.cursor, true, options.filter);
	    if (this.options.indexSync.query.enabled) {
	      this.gun.get('trustedIndexes').map().once(function (val, key) {
	        if (val) {
	          var n = _this7.gun.user(key).get('iris').get('messagesByAuthor').get(contact.linkTo.uri());
	          _this7._getMsgs(n, options.callback, options.limit, options.cursor, false, options.filter);
	        }
	      });
	    }
	  };

	  SocialNetwork.prototype._getReceivedMsgs = async function _getReceivedMsgs(contact, options) {
	    var _this8 = this;

	    this._getMsgs(contact.gun.get('received'), options.callback, options.limit, options.cursor, true, options.filter);
	    if (this.options.indexSync.query.enabled) {
	      this.gun.get('trustedIndexes').map().once(function (val, key) {
	        if (val) {
	          var n = _this8.gun.user(key).get('iris').get('messagesByRecipient').get(contact.linkTo.uri());
	          _this8._getMsgs(n, options.callback, options.limit, options.cursor, false, options.filter);
	        }
	      });
	    }
	  };

	  SocialNetwork.prototype.getChatMsgs = async function getChatMsgs(uuid, options) {
	    var _this9 = this;

	    this._getMsgs(this.gun.get('chatMessagesByUuid').get(uuid), options.callback, options.limit, options.cursor, true, options.filter);
	    var callback = function callback(msg) {
	      if (options.callback) {
	        options.callback(msg);
	      }
	      _this9.addMessage(msg, { checkIfExists: true });
	    };
	    this.gun.get('trustedIndexes').map().once(function (val, key) {
	      if (val) {
	        var n = _this9.gun.user(key).get('iris').get('chatMessagesByUuid').get(uuid);
	        _this9._getMsgs(n, callback, options.limit, options.cursor, false, options.filter);
	      }
	    });
	  };

	  SocialNetwork.prototype._getAttributeTrustDistance = async function _getAttributeTrustDistance(a) {
	    if (!Attribute.isUniqueType(a.type)) {
	      return;
	    }
	    if (this.rootContact.equals(a)) {
	      return 0;
	    }
	    var id = this.getContact(a);
	    var d = await id.gun.get('trustDistance').then();
	    if (isNaN(d)) {
	      d = Infinity;
	    }
	    return d;
	  };

	  SocialNetwork.prototype._getMsgTrustDistance = async function _getMsgTrustDistance(msg) {
	    var shortestDistance = Infinity;
	    var signerAttr = new Attribute('keyID', msg.getSignerKeyID());
	    if (!signerAttr.equals(this.rootContact)) {
	      var signer = this.getContact(signerAttr);
	      var d = await signer.gun.get('trustDistance').then();
	      if (isNaN(d)) {
	        return;
	      }
	    }
	    for (var _iterator = msg.getAuthorArray(), _isArray = Array.isArray(_iterator), _i4 = 0, _iterator = _isArray ? _iterator : _getIterator(_iterator);;) {
	      var _ref;

	      if (_isArray) {
	        if (_i4 >= _iterator.length) break;
	        _ref = _iterator[_i4++];
	      } else {
	        _i4 = _iterator.next();
	        if (_i4.done) break;
	        _ref = _i4.value;
	      }

	      var a = _ref;

	      var _d = await this._getAttributeTrustDistance(a);
	      if (_d < shortestDistance) {
	        shortestDistance = _d;
	      }
	    }
	    return shortestDistance < Infinity ? shortestDistance : undefined;
	  };

	  SocialNetwork.prototype._updateMsgRecipientContact = async function _updateMsgRecipientContact(msg, msgIndexKey, recipient) {
	    var hash = recipient._ && recipient._.link || 'todo';
	    var contactIndexKeysBefore = await this.getContactIndexKeys(recipient, hash.substr(0, 6));
	    var attrs = await Contact.getAttrs(recipient);
	    if (['verification', 'unverification'].indexOf(msg.signedData.type) > -1) {
	      var isVerification = msg.signedData.type === 'verification';

	      var _loop = function _loop() {
	        if (_isArray2) {
	          if (_i5 >= _iterator2.length) return 'break';
	          _ref2 = _iterator2[_i5++];
	        } else {
	          _i5 = _iterator2.next();
	          if (_i5.done) return 'break';
	          _ref2 = _i5.value;
	        }

	        var a = _ref2;

	        var hasAttr = false;
	        var v = {
	          verifications: isVerification ? 1 : 0,
	          unverifications: isVerification ? 0 : 1
	        };
	        _Object$keys(attrs).forEach(function (k) {
	          // TODO: if author is self, mark as self verified
	          // TODO: only 1 verif / unverif per author
	          if (a.equals(attrs[k])) {
	            attrs[k].verifications = (attrs[k].verifications || 0) + v.verifications;
	            attrs[k].unverifications = (attrs[k].unverifications || 0) + v.unverifications;
	            hasAttr = true;
	          }
	        });
	        if (!hasAttr) {
	          attrs[a.uri()] = _Object$assign({ type: a.type, value: a.value }, v);
	        }
	        if (msg.goodVerification) {
	          if (isVerification) {
	            attrs[a.uri()].wellVerified = true;
	          } else {
	            attrs[a.uri()].wellUnverified = true;
	          }
	        }
	      };

	      for (var _iterator2 = msg.getRecipientArray(), _isArray2 = Array.isArray(_iterator2), _i5 = 0, _iterator2 = _isArray2 ? _iterator2 : _getIterator(_iterator2);;) {
	        var _ref2;

	        var _ret = _loop();

	        if (_ret === 'break') break;
	      }
	      var mva = Contact.getMostVerifiedAttributes(attrs);
	      recipient.get('mostVerifiedAttributes').put(mva); // TODO: why this needs to be done twice to register?
	      recipient.get('mostVerifiedAttributes').put(mva);
	      var k = mva.keyID && mva.keyID.attribute.value || mva.uuid && mva.uuid.attribute.value || hash;
	      console.log('k', k);
	      recipient.get('attrs').put(this.gun.user().top(k + '/attrs'));
	      recipient.get('attrs').put(attrs);
	      recipient.get('attrs').put(attrs);
	    }
	    if (msg.signedData.type === 'rating') {
	      var id = await recipient.then();
	      id.receivedPositive = id.receivedPositive || 0;
	      id.receivedNegative = id.receivedNegative || 0;
	      id.receivedNeutral = id.receivedNeutral || 0;
	      if (msg.isPositive()) {
	        if (typeof id.trustDistance !== 'number' || msg.distance + 1 < id.trustDistance) {
	          recipient.get('trustDistance').put(msg.distance + 1);
	        }
	        id.receivedPositive++;
	      } else {
	        if (msg.distance < id.trustDistance) {
	          recipient.get('trustDistance').put(false); // TODO: this should take into account the aggregate score of the contact
	        }
	        if (msg.isNegative()) {
	          id.receivedNegative++;
	        } else {
	          id.receivedNeutral++;
	        }
	      }

	      recipient.put({
	        receivedPositive: id.receivedPositive,
	        receivedNegative: id.receivedNegative,
	        receivedNeutral: id.receivedNeutral
	      });

	      if (msg.signedData.context === 'verifier') {
	        if (msg.distance === 0) {
	          if (msg.isPositive) {
	            recipient.get('scores').get(msg.signedData.context).get('score').put(10);
	          } else if (msg.isNegative()) {
	            recipient.get('scores').get(msg.signedData.context).get('score').put(0);
	          } else {
	            recipient.get('scores').get(msg.signedData.context).get('score').put(-10);
	          }
	        }
	      }
	    }
	    var obj = { sig: msg.sig, pubKey: msg.pubKey };
	    if (msg.ipfsUri) {
	      obj.ipfsUri = msg.ipfsUri;
	    }

	    recipient.get('received').get(msgIndexKey).put(obj);
	    recipient.get('received').get(msgIndexKey).put(obj);

	    var contactIndexKeysAfter = await this.getContactIndexKeys(recipient, hash.substr(0, 6));
	    var indexesBefore = _Object$keys(contactIndexKeysBefore);
	    for (var i = 0; i < indexesBefore.length; i++) {
	      var index = indexesBefore[i];
	      for (var j = 0; j < contactIndexKeysBefore[index].length; j++) {
	        var key = contactIndexKeysBefore[index][j];
	        if (!contactIndexKeysAfter[index] || contactIndexKeysAfter[index].indexOf(key) === -1) {
	          this.gun.get(index).get(key).put(null);
	        }
	      }
	    }
	  };

	  SocialNetwork.prototype._updateMsgAuthorContact = async function _updateMsgAuthorContact(msg, msgIndexKey, author) {
	    if (msg.signedData.type === 'rating') {
	      var id = await author.then();
	      id.sentPositive = id.sentPositive || 0;
	      id.sentNegative = id.sentNegative || 0;
	      id.sentNeutral = id.sentNeutral || 0;
	      if (msg.isPositive()) {
	        id.sentPositive++;
	      } else if (msg.isNegative()) {
	        id.sentNegative++;
	      } else {
	        id.sentNeutral++;
	      }
	      author.get('sentPositive').put(id.sentPositive);
	      author.get('sentNegative').put(id.sentNegative);
	      author.get('sentNeutral').put(id.sentNeutral);
	    }
	    var obj = { sig: msg.sig, pubKey: msg.pubKey };
	    if (msg.ipfsUri) {
	      obj.ipfsUri = msg.ipfsUri;
	    }
	    author.get('sent').get(msgIndexKey).put(obj); // for some reason, doesn't work unless I do it twice
	    author.get('sent').get(msgIndexKey).put(obj);
	    return;
	  };

	  SocialNetwork.prototype._updateContactProfilesByMsg = async function _updateContactProfilesByMsg(msg, authorIdentities, recipientIdentities) {
	    var start = void 0;
	    var msgIndexKey = SocialNetwork.getMsgIndexKey(msg);
	    msgIndexKey = msgIndexKey.substr(msgIndexKey.indexOf(':') + 1);
	    var ids = _Object$values(_Object$assign({}, authorIdentities, recipientIdentities));
	    for (var i = 0; i < ids.length; i++) {
	      // add new identifiers to contact
	      if (Object.prototype.hasOwnProperty.call(recipientIdentities, ids[i].gun['_'].link)) {
	        start = new Date();
	        await this._updateMsgRecipientContact(msg, msgIndexKey, ids[i].gun);
	        this.debug(new Date() - start, 'ms _updateMsgRecipientContact');
	      }
	      if (Object.prototype.hasOwnProperty.call(authorIdentities, ids[i].gun['_'].link)) {
	        start = new Date();
	        await this._updateMsgAuthorContact(msg, msgIndexKey, ids[i].gun);
	        this.debug(new Date() - start, 'ms _updateMsgAuthorContact');
	      }
	      start = new Date();
	      await this._addContactToIndexes(ids[i].gun);
	      this.debug(new Date() - start, 'ms _addContactToIndexes');
	    }
	  };

	  SocialNetwork.prototype.removeTrustedIndex = async function removeTrustedIndex(gunUri) {
	    this.gun.get('trustedIndexes').get(gunUri).put(null);
	  };

	  SocialNetwork.prototype.addTrustedIndex = async function addTrustedIndex(gunUri) {
	    var _this10 = this;

	    var maxMsgsToCrawl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.options.indexSync.importOnAdd.maxMsgCount;
	    // maxMsgDistance = this.options.indexSync.importOnAdd.maxMsgDistance
	    if (gunUri === this.rootContact.value) {
	      return;
	    }
	    var exists = await this.gun.get('trustedIndexes').get(gunUri).then();
	    if (exists) {
	      return;
	    }
	    this.gun.get('trustedIndexes').get(gunUri).put(true);
	    var msgs = [];
	    if (this.options.indexSync.importOnAdd.enabled) {
	      await util.timeoutPromise(new _Promise(function (resolve) {
	        var gun = _this10.gun.user(gunUri).get('iris');
	        var callback = function callback(msg) {
	          msgs.push(msg);
	          if (msgs.length >= maxMsgsToCrawl) {
	            resolve();
	          }
	        };
	        var messages = new Collection$2({ gun: gun, class: SignedMessage, indexes: ['trustDistance'] });
	        messages.get({ callback: callback, orderBy: 'trustDistance', desc: false });
	      }), 10000);
	      this.debug('adding', msgs.length, 'msgs');
	      this.addMessages(msgs);
	    }
	  };

	  SocialNetwork.prototype._updateContactIndexesByMsg = async function _updateContactIndexesByMsg(msg) {
	    var recipientIdentities = {};
	    var authorIdentities = {};
	    var selfAuthored = false;
	    var start = void 0;
	    start = new Date();
	    for (var _iterator3 = msg.getAuthorArray(), _isArray3 = Array.isArray(_iterator3), _i6 = 0, _iterator3 = _isArray3 ? _iterator3 : _getIterator(_iterator3);;) {
	      var _ref3;

	      if (_isArray3) {
	        if (_i6 >= _iterator3.length) break;
	        _ref3 = _iterator3[_i6++];
	      } else {
	        _i6 = _iterator3.next();
	        if (_i6.done) break;
	        _ref3 = _i6.value;
	      }

	      var _a3 = _ref3;

	      var _id = this.getContact(_a3);
	      var start2 = new Date();
	      var td = await _id.gun.get('trustDistance').then();
	      this.debug(new Date() - start2, 'ms get trustDistance');
	      if (!isNaN(td)) {
	        authorIdentities[_id.gun['_'].link] = _id;
	        start2 = new Date();
	        var scores = await _id.gun.get('scores').then();
	        this.debug(new Date() - start2, 'ms get scores');
	        if (scores && scores.verifier && msg.signedData.type === 'verification') {
	          msg.goodVerification = true;
	        }
	        if (td === 0) {
	          selfAuthored = true;
	        }
	      }
	    }
	    this.debug(new Date() - start, 'ms getAuthorArray');
	    if (!_Object$keys(authorIdentities).length) {
	      return; // unknown author, do nothing
	    }
	    start = new Date();
	    for (var _iterator4 = msg.getRecipientArray(), _isArray4 = Array.isArray(_iterator4), _i7 = 0, _iterator4 = _isArray4 ? _iterator4 : _getIterator(_iterator4);;) {
	      var _ref4;

	      if (_isArray4) {
	        if (_i7 >= _iterator4.length) break;
	        _ref4 = _iterator4[_i7++];
	      } else {
	        _i7 = _iterator4.next();
	        if (_i7.done) break;
	        _ref4 = _i7.value;
	      }

	      var _a4 = _ref4;

	      var _id2 = this.getContact(_a4);
	      var _td = await _id2.gun.get('trustDistance').then();

	      if (!isNaN(_td)) {
	        recipientIdentities[_id2.gun['_'].link] = _id2;
	      }
	      if (selfAuthored && _a4.type === 'keyID' && _a4.value !== this.rootContact.value) {
	        // TODO: not if already added - causes infinite loop?
	        if (msg.isPositive()) {
	          this.addTrustedIndex(_a4.value);
	        } else {
	          this.removeTrustedIndex(_a4.value);
	        }
	      }
	    }
	    this.debug(new Date() - start, 'ms getRecipientArray');
	    if (!msg.signedData.recipient) {
	      // message to self
	      recipientIdentities = authorIdentities;
	    }
	    if (!_Object$keys(recipientIdentities).length) {
	      // recipient is previously unknown
	      var attrs = {};
	      var u = void 0;
	      for (var _iterator5 = msg.getRecipientArray(), _isArray5 = Array.isArray(_iterator5), _i8 = 0, _iterator5 = _isArray5 ? _iterator5 : _getIterator(_iterator5);;) {
	        var _ref5;

	        if (_isArray5) {
	          if (_i8 >= _iterator5.length) break;
	          _ref5 = _iterator5[_i8++];
	        } else {
	          _i8 = _iterator5.next();
	          if (_i8.done) break;
	          _ref5 = _i8.value;
	        }

	        var _a2 = _ref5;

	        attrs[_a2.uri()] = _a2;
	        if (!u && _a2.isUniqueType()) {
	          u = _a2;
	        }
	      }
	      var linkTo = Contact.getLinkTo(attrs);
	      var trustDistance = msg.isPositive() && typeof msg.distance === 'number' ? msg.distance + 1 : false;
	      var _start = new Date();
	      var node = this.gun.get('identitiesBySearchKey').get(u.uri());
	      node.put({ a: 1 }); // {a:1} because inserting {} causes a "no signature on data" error from gun
	      var id = Contact.create(node, { attrs: attrs, linkTo: linkTo, trustDistance: trustDistance }, this);
	      this.debug(new Date() - _start, 'ms contact.create');

	      // TODO: take msg author trust into account
	      recipientIdentities[id.gun['_'].link] = id;
	    }

	    return this._updateContactProfilesByMsg(msg, authorIdentities, recipientIdentities);
	  };

	  /**
	  * Add a message to messagesByTimestamp and other relevant indexes. Update identities in the web of trust according to message data.
	  *
	  * @param msg SignedMessage (or an array of messages) to add to the index
	  */


	  SocialNetwork.prototype.addMessage = async function addMessage(msg) {
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	    if (!this.writable) {
	      throw new Error('Cannot write to a read-only index (initialized with options.pubKey)');
	    }
	    if (Array.isArray(msg)) {
	      return this.addMessages(msg, options);
	    }
	    var start = void 0;
	    if (msg.constructor.name !== 'SignedMessage') {
	      throw new Error('addMessage failed: param must be a SignedMessage, received ' + msg.constructor.name);
	    }
	    var hash = await msg.getHash();
	    if (true === options.checkIfExists) {
	      var exists = await this.gun.get('messagesByHash').get(hash).then();
	      if (exists) {
	        return;
	      }
	    }
	    var obj = { sig: msg.sig, pubKey: msg.pubKey };
	    //const node = this.gun.get(`messagesByHash`).get(hash).put(obj);
	    var node = this.gun.back(-1).get('messagesByHash').get(hash).put(obj); // TODO: needs fix to https://github.com/amark/gun/issues/719
	    start = new Date();
	    var d = await this._getMsgTrustDistance(msg);
	    msg.distance = Object.prototype.hasOwnProperty.call(msg, 'distance') ? msg.distance : d; // eslint-disable-line require-atomic-updates
	    this.debug('----');
	    this.debug(new Date() - start, 'ms _getMsgTrustDistance');
	    if (msg.distance === undefined) {
	      return false; // do not save messages from untrusted author
	    }
	    if (msg.signedData.replyTo) {
	      this.gun.back(-1).get('messagesByHash').get(msg.signedData.replyTo).get('replies').get(hash).put(node);
	      this.gun.back(-1).get('messagesByHash').get(msg.signedData.replyTo).get('replies').get(hash).put(node);
	    }
	    if (msg.signedData.sharedMsg) {
	      this.gun.back(-1).get('messagesByHash').get(msg.signedData.sharedMsg).get('shares').get(hash).put(node);
	      this.gun.back(-1).get('messagesByHash').get(msg.signedData.sharedMsg).get('shares').get(hash).put(node);
	    }
	    start = new Date();

	    this.messages.put(msg);

	    // TODO: this should be moved to Collection
	    var indexKeys = SocialNetwork.getMsgIndexKeys(msg);
	    this.debug(new Date() - start, 'ms getMsgIndexKeys');
	    for (var index in indexKeys) {
	      if (Array.isArray(indexKeys[index])) {
	        for (var i = 0; i < indexKeys[index].length; i++) {
	          var key = indexKeys[index][i];
	          // this.debug(`adding to index ${index} key ${key}`);
	          this.gun.get(index).get(key).put(node);
	          this.gun.get(index).get(key).put(node); // umm, what? doesn't work unless I write it twice
	        }
	      } else if (typeof indexKeys[index] === 'object') {
	        for (var _key in indexKeys[index]) {
	          this.gun.get(index).get(_key).get(indexKeys[index][_key]).put(node);
	          this.gun.get(index).get(_key).get(indexKeys[index][_key]).put(node);
	        }
	      }
	    }

	    if (this.options.ipfs) {
	      try {
	        var ipfsUri = await msg.saveToIpfs(this.options.ipfs);
	        this.gun.get('messagesByHash').get(ipfsUri).put(node);
	        this.gun.get('messagesByHash').get(ipfsUri).put(node);
	        this.gun.get('messagesByHash').get(ipfsUri).put({ ipfsUri: ipfsUri });
	      } catch (e) {
	        console.error('adding msg ' + msg + ' to ipfs failed: ' + e);
	      }
	    }
	    if (msg.signedData.type !== 'chat') {
	      start = new Date();
	      await this._updateContactIndexesByMsg(msg);
	      this.debug(new Date() - start, 'ms _updateContactIndexesByMsg');
	    }
	    return true;
	  };

	  /**
	  * Alias to socialNetwork.messages.get(opt) (but with opt.orderBy = 'time')
	  * @param {Object} opt {hash, orderBy, callback, limit, cursor, desc, filter}
	  */


	  SocialNetwork.prototype.getMessages = async function getMessages(opt) {
	    if (opt.hash) {
	      return this.messages.get({ id: opt.hash });
	    }
	    opt.orderBy = opt.orderBy || 'time';
	    return this.messages.get(opt);
	  };

	  /*
	  * Add a list of messages to the index.
	  * Useful for example when adding a new WoT dataset that contains previously
	  * unknown authors.
	  *
	  * Iteratively performs sorted merge joins on [previously known contacts] and
	  * [new msgs authors], until all messages from within the WoT have been added.
	  *
	  * @param {Array} msgs an array of messages.
	  * @returns {boolean} true on success
	  */


	  SocialNetwork.prototype.addMessages = async function addMessages(msgs) {
	    var _this11 = this;

	    if (!this.writable) {
	      throw new Error('Cannot write to a read-only index (initialized with options.pubKey)');
	    }
	    var msgsByAuthor = {};
	    if (Array.isArray(msgs)) {
	      this.debug('sorting ' + msgs.length + ' messages onto a search tree...');
	      for (var i = 0; i < msgs.length; i++) {
	        for (var _iterator6 = msgs[i].getAuthorArray(), _isArray6 = Array.isArray(_iterator6), _i9 = 0, _iterator6 = _isArray6 ? _iterator6 : _getIterator(_iterator6);;) {
	          var _ref6;

	          if (_isArray6) {
	            if (_i9 >= _iterator6.length) break;
	            _ref6 = _iterator6[_i9++];
	          } else {
	            _i9 = _iterator6.next();
	            if (_i9.done) break;
	            _ref6 = _i9.value;
	          }

	          var _a5 = _ref6;

	          if (_a5.isUniqueType()) {
	            var hash = msgs[i].getHash();
	            var key = _a5.uri() + ':' + hash;
	            msgsByAuthor[key] = msgs[i];
	          }
	        }
	      }
	      this.debug('...done');
	    } else {
	      throw 'msgs param must be an array';
	    }
	    var msgAuthors = _Object$keys(msgsByAuthor).sort();
	    if (!msgAuthors.length) {
	      return;
	    }
	    var initialMsgCount = void 0,
	        msgCountAfterwards = void 0;
	    var index = this.gun.get('identitiesBySearchKey');

	    var _loop2 = async function _loop2() {
	      var knownIdentities = [];
	      var stop = false;
	      searchText(index, function (result) {
	        if (stop) {
	          return;
	        }
	        knownIdentities.push(result);
	      }, '');
	      await new _Promise(function (r) {
	        return setTimeout(r, 2000);
	      }); // wait for results to accumulate
	      stop = true;
	      knownIdentities.sort(function (a, b) {
	        if (a.key === b.key) {
	          return 0;
	        } else if (a.key > b.key) {
	          return 1;
	        } else {
	          return -1;
	        }
	      });
	      var i = 0;
	      var author = msgAuthors[i];
	      var knownContact = knownIdentities.shift();
	      initialMsgCount = msgAuthors.length;
	      // sort-merge join identitiesBySearchKey and msgsByAuthor
	      while (author && knownContact) {
	        if (author.indexOf(knownContact.key) === 0) {
	          try {
	            await util.timeoutPromise(_this11.addMessage(msgsByAuthor[author], { checkIfExists: true }), 10000);
	          } catch (e) {
	            _this11.debug('adding failed:', e, _JSON$stringify(msgsByAuthor[author], null, 2));
	          }
	          msgAuthors.splice(i, 1);
	          author = i < msgAuthors.length ? msgAuthors[i] : undefined;
	          //knownContact = knownIdentities.shift();
	        } else if (author < knownContact.key) {
	          author = i < msgAuthors.length ? msgAuthors[++i] : undefined;
	        } else {
	          knownContact = knownIdentities.shift();
	        }
	      }
	      msgCountAfterwards = msgAuthors.length;
	    };

	    do {
	      await _loop2();
	    } while (msgCountAfterwards !== initialMsgCount);
	    return true;
	  };

	  /*
	  * @returns {Object} message matching the hash
	  */


	  SocialNetwork.prototype.getMessageByHash = function getMessageByHash(hash) {
	    var _this12 = this;

	    var isIpfsUri = hash.indexOf('Qm') === 0;
	    return new _Promise(function (resolve) {
	      var resolveIfHashMatches = async function resolveIfHashMatches(d, fromIpfs) {
	        var obj = typeof d === 'object' ? d : JSON.parse(d);
	        var m = await SignedMessage.fromSig(obj);
	        var h = void 0;
	        var republished = false;
	        if (fromIpfs) {
	          return resolve(m);
	        } else if (isIpfsUri && _this12.options.ipfs) {
	          h = await m.saveToIpfs(_this12.options.ipfs);
	          republished = true;
	        } else {
	          h = await m.getHash();
	        }
	        if (h === hash || isIpfsUri && !_this12.options.ipfs) {
	          // does not check hash validity if it's an ipfs uri and we don't have ipfs
	          if (!fromIpfs && _this12.options.ipfs && _this12.writable && !republished) {
	            m.saveToIpfs(_this12.options.ipfs).then(function (ipfsUri) {
	              obj.ipfsUri = ipfsUri;
	              _this12.gun.get('messagesByHash').get(hash).put(obj);
	              _this12.gun.get('messagesByHash').get(ipfsUri).put(obj);
	            });
	          }
	          resolve(m);
	        } else {
	          console.error('queried index for message ' + hash + ' but received ' + h);
	        }
	      };
	      if (isIpfsUri && _this12.options.ipfs) {
	        _this12.options.ipfs.cat(hash).then(function (file) {
	          var s = _this12.options.ipfs.types.Buffer.from(file).toString('utf8');
	          _this12.debug('got msg ' + hash + ' from ipfs');
	          resolveIfHashMatches(s, true);
	        });
	      }
	      _this12.gun.get('messagesByHash').get(hash).on(function (d) {
	        _this12.debug('got msg ' + hash + ' from own gun index');
	        resolveIfHashMatches(d);
	      });
	      if (_this12.options.indexSync.query.enabled) {
	        _this12.gun.get('trustedIndexes').map().once(function (val, key) {
	          if (val) {
	            _this12.gun.user(key).get('iris').get('messagesByHash').get(hash).on(function (d) {
	              _this12.debug('got msg ' + hash + ' from friend\'s gun index ' + val);
	              resolveIfHashMatches(d);
	            });
	          }
	        });
	      }
	    });
	  };

	  /*
	  * @returns {Array} list of messages
	  */


	  SocialNetwork.prototype.getMessagesByTimestamp = function getMessagesByTimestamp(callback, limit, cursor) {
	    var _this13 = this;

	    var desc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
	    var filter = arguments[4];

	    var seen = {};
	    var cb = async function cb(msg) {
	      if ((!limit || _Object$keys(seen).length < limit) && !Object.prototype.hasOwnProperty.call(seen, msg.hash)) {
	        seen[msg.hash] = true;
	        callback(msg);
	      }
	    };

	    this._getMsgs(this.gun.get('messagesByTimestamp'), cb, limit, cursor, desc, filter);
	    if (this.options.indexSync.query.enabled) {
	      this.gun.get('trustedIndexes').map().once(function (val, key) {
	        if (val) {
	          var n = _this13.gun.user(key).get('iris').get('messagesByTimestamp');
	          _this13._getMsgs(n, cb, limit, cursor, desc, filter);
	        }
	      });
	    }
	  };

	  /*
	  * @returns {Array} list of messages
	  */


	  SocialNetwork.prototype.getMessagesByDistance = function getMessagesByDistance(callback, limit, cursor, desc, filter) {
	    var _this14 = this;

	    var seen = {};
	    var cb = function cb(msg) {
	      if (!Object.prototype.hasOwnProperty.call(seen, msg.hash)) {
	        if ((!limit || _Object$keys(seen).length <= limit) && !Object.prototype.hasOwnProperty.call(seen, msg.hash)) {
	          seen[msg.hash] = true;
	          callback(msg);
	        }
	      }
	    };
	    this._getMsgs(this.gun.get('messagesByDistance'), cb, limit, cursor, desc, filter);
	    if (this.options.indexSync.query.enabled) {
	      this.gun.get('trustedIndexes').map().once(function (val, key) {
	        if (val) {
	          var n = _this14.gun.user(key).get('iris').get('messagesByDistance');
	          _this14._getMsgs(n, cb, limit, cursor, desc, filter);
	        }
	      });
	    }
	  };

	  return SocialNetwork;
	}();

	var version$1 = "0.0.146";

	/*eslint no-useless-escape: "off", camelcase: "off" */

	var index = {
	  VERSION: version$1,
	  Collection: Collection,
	  SignedMessage: SignedMessage,
	  Contact: Contact,
	  Attribute: Attribute,
	  SocialNetwork: SocialNetwork,
	  Key: Key,
	  Channel: Channel,
	  util: util
	};

	return index;

})));
