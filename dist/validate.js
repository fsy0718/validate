/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 rule规则，规则三部分组成  规则别名，规则详情，规则信息提示【未通过，为空提示，通过】
	  用户自行在config中以name为key进行的索引rule规则：
	   --- 可以是一个字符串，如果是字符串，包含内容必须是内置规则名，可以是多个规则的组合
	   --- 可以是一个对象，对象的key为rule别名，value为一个数组，规则详情，规则信息提示
	   --- 也可以是一个函数，会去提取默认错误信息
	   --- 也可以是一个正则，会去提取默认错误信息
	   --- 可以是一个数组，数组规则为 ['a','b',funtion(){},["c","d"]] 数组元素只能是字符串，数组【同样符合外部数组规则】，函数，正则
	 */
	var Validate, _check, buildConf, buildRule, check, enhanceCheck, getData, logFn, msgAttr, msgClass, msgTip, parseAlias, parseMsg, parseObj, parseReg, parseRule, parseTipClass, parseUrl, pass, queue, rClass, status, submit;

	buildRule = __webpack_require__(1);

	msgAttr = ['succ', 'null', 'fail'];


	/*信息提示类名， 0 -> 成功提示  1 -> 为空警告  2-> 错误提示  3->为空 */

	msgClass = ['s-succ', 's-warn', 's-error', ''];

	status = ['normal', 'posting', 'posted'];

	pass = ['passed', 'noPass'];

	msgTip = ['{{label}}通过检测', '请{{verb}}{{label}}', '{{label}}不合格式要求'];

	logFn = ['error', 'log', 'warn'];

	rClass = /(\bs\-(succ|warn|error)\b)?(\bvalidate-(succ|null|fail)\b)?/g;

	queue = [];

	buildConf = {
	  submit: '.J_submit-form',
	  tipType: 1,
	  label: '.form-label',
	  ajaxPost: true,
	  ajaxType: 'post',
	  postOnce: true,
	  ignoreHidden: false,
	  showProgressIcon: '.J_loading-box',
	  showProgressText: '.J_submit-form',
	  showrinfo: false,
	  trigger: 'blur',
	  icons: [true, true, true],
	  msgs: [true, true, true],
	  showAllError: true,
	  checkSubmit: false,
	  debug: false
	};

	Validate = function(form, config) {
	  var self;
	  self = this;
	  self.form = form;
	  if (self.form.attr('hasValidate') === 'true') {
	    return self;
	  }
	  self.settings = $.extend(true, {}, buildConf, config);
	  self.status = status[0];
	  self.form.on(self.settings.trigger + '.validate', '[check]', function(e, eData) {
	    return self.check($(this), false, e, eData);
	  });
	  self.form.find('input[rcheck]').each(function() {
	    var _inputCompare, _this;
	    _this = $(this);
	    _inputCompare = $('input[name="' + _this.attr('rcheck') + '"]', self.form);
	    return _inputCompare.on(self.settings.trigger + '.rcheck', function() {
	      var val;
	      val = self.getVal(_this);
	      if (val) {
	        return _this.data('lastVal', '').trigger(self.settings.trigger + '.validate');
	      }
	    });
	  });
	  self.form.on('submit', function() {
	    return self.submitForm();
	  });
	  if (!$(self.settings.submit).length) {
	    self.settings.submit = ':submit';
	  }
	  self.form.on('click.validate', self.settings.submit, function(e, eData) {
	    e.preventDefault();
	    return self.form.trigger('submit');
	  });
	  self.form.attr('hasValidate', 'true');
	  return self;
	};


	/* 获取表单元素的值 可以配置复选框值的分隔符及是否去掉前后空格[密码不需要] */

	Validate.prototype.getVal = function(obj, trim) {
	  var self, val;
	  self = this;
	  obj = parseObj(obj, self);
	  if (obj.is(':radio')) {
	    val = $(':radio[name="' + obj.attr('name') + '"]:checked', self.form).val();
	  } else if (obj.is(':checkbox')) {
	    val = '';
	    $(':checkbox[name="' + obj.attr('name') + '"]:checked', self.form).each(function() {
	      return val += $(this).val() + (self.settings.delimiter || ',');
	    });
	  } else {
	    val = obj.val();
	  }
	  trim && (val = $.trim(val));
	  return val;
	};


	/*获取检测规则【字符串，正则，函数，对象】，寻找顺序  行内 ->  单个配置 ->  自动加上require */

	Validate.prototype.getReg = function(obj) {
	  var _reg, name;
	  obj = parseObj(obj, this);
	  _reg = obj.data('rule');
	  if (!_reg) {
	    name = obj.attr('name');
	    if (this.settings[name]) {
	      _reg = this.settings[name].rule;
	    }
	    if (!_reg) {
	      _reg = 'required';
	    }
	  }
	  return _reg;
	};


	/*改变当前表单的状态 */

	Validate.prototype.changeStatus = function(num) {
	  num || (num = 0);
	  this.status = status[num];
	  return this;
	};


	/*获取表单项信息  type表示状态值 0 -> 成功   1 -> 空值信息  2 -> 错误信息
	  查询顺序：行内各种提示信息 -> 别名提示信息  -> 默认错误提示  -> 内置别名提示  -> 默认提示
	 */

	Validate.prototype.getMsg = function(obj, type, alias, tipType) {
	  var E, _msg, _msgPrefix, _name, _r, e, error, error1, msgKey;
	  _msg = '';
	  if (+tipType === 1) {
	    return true;
	  }
	  if (type < 2) {
	    alias = '';
	  }
	  if (type === 2 && (_r = obj.attr('rcheck'))) {
	    alias = 'rcheck';
	    _msgPrefix = 'rcheck';
	  } else {
	    alias || (alias = '');
	    _msgPrefix = alias + msgAttr[+type];
	  }
	  msgKey = _msgPrefix + 'msg';
	  _msg = obj.attr(msgKey);
	  if (!_msg) {
	    _name = obj.attr('name');
	    try {
	      _msg = this.settings[_name][alias][3 - type];
	    } catch (error) {
	      e = error;
	      try {
	        _msg = this.settings[_name][msgKey];
	      } catch (error1) {
	        E = error1;
	        _msg = obj.attr('rcheck') && type === 2 ? '{{label}}两次输入不一致' : buildRule[alias] && buildRule[alias][3 - type];
	      }
	    }
	    _msg || (_msg = msgTip[type]);
	  }
	  _msg = parseMsg(_msg, obj, this);
	  obj.attr(msgKey, _msg);
	  return _msg;
	};


	/*获取提示信息显示位置  1  将当前input变色  2  在当前表单项中加上 3 在当前检测表单项上指定位置显示【优先显示错误及空提示】  4  弹框显示   字符串，指定显示位置的选择器 */

	Validate.prototype.getTipType = function(obj) {
	  var name;
	  obj = parseObj(obj, this).eq(0);
	  name = obj.attr('name');
	  return obj.attr('tipType') || this.settings[name] && this.settings[name].tipType || this.form.attr('tipType') || this.settings.tipType || 1;
	};

	Validate.prototype.getMsgEle = function(obj, tipType, e, eData) {
	  var msgPlace, par;
	  msgPlace = null;
	  if (+tipType === 1) {
	    msgPlace = obj;
	  } else if (/^[23]$/.test(tipType)) {
	    par = obj.parents('.form-item');
	    msgPlace = par.find('.input-msg');
	    if (!msgPlace.length) {
	      msgPlace = $('<span class="input-msg"/>').appendTo(par);
	    }
	  } else if (tipType && tipType !== 4) {
	    msgPlace = $(tipType + ':eq(0)');
	  }
	  return msgPlace;
	};


	/* type  表示状态值 0 -> 成功   1 -> 空值信息  2 -> 错误信息 3-> 隐藏提示信息 */

	Validate.prototype.showMsg = function(obj, msg, type, tipType, submitTrigger, e, eData) {
	  var _class, msgPlace;
	  obj = parseObj(obj, this);
	  _class = '';
	  if (+tipType === 4) {
	    if (this.settings.checkSubmit) {
	      this.settings.showAllError = false;
	      if (!submitTrigger) {
	        return this;
	      }
	    }
	    __webpack_require__(2).async('layer', function(layer) {
	      return layer.alert(msg, {
	        'title': '表单校验提示',
	        cont: {
	          "class": msgClass[type]
	        }
	      });
	    });
	    return this;
	  } else {
	    msgPlace = this.getMsgEle(obj, tipType, e, eData);
	    if (tipType && +tipType !== 1) {
	      _class = this.getDisplay(obj, type, 'icon') && 'validate-' + msgAttr[type] || '';
	      !msg && !type && (type = 3);
	    }
	  }
	  parseTipClass(msgPlace, type, msg);
	  +tipType !== 1 && msgPlace.css('visibility', (this.settings.checkSubmit && !submitTrigger || !(_class || msg) ? 'hidden' : 'visible')).html(msg).addClass(_class);
	  return this;
	};


	/*检测 submitTrigger表示提交时触发检测 */

	Validate.prototype.check = function(obj, submitTrigger, e, eData) {
	  var error, msg, name, reg, result, self, tipType, type, val;
	  self = this;
	  type = obj.attr('type');
	  if (/button|rest|submit|file/.test(type)) {
	    return true;
	  }
	  val = self.getVal(obj, obj.is(':password') ? false : true);

	  /*有ignore标识 值未变化 设置不检测hidden的不用检测 TODO 需要对ignore可以进行配置 */
	  if (obj.attr('ignore') === 'ignore' && !val || submitTrigger && obj.attr('pass') === 'passed' || !submitTrigger && obj.data('lastVal') === val || obj.is(':hidden') && self.settings.ignoreHidden) {
	    self.settings.debug && console.log(obj.attr('name') + ' 通过检测;timestamp:' + Date.now());
	    return true;
	  }
	  name = obj.attr('name');

	  /*用户自定义检测函数,并且返回检测结果 */
	  if (self.settings[name] && $.isFunction(self.settings[name]['check'])) {
	    result = self.settings[name]['check'](val, obj, buildRule, submitTrigger, self, e, eData);
	    val = self.getVal(obj, obj.is(':password') ? false : true);
	    try {
	      result.passed;
	    } catch (error) {
	      result = {
	        passed: result,
	        alias: ''
	      };
	    }
	  } else {
	    if (!val || obj.is('select') && +val === -1) {
	      result = {
	        passed: false
	      };
	    } else {
	      reg = self.getReg(obj);
	      result = check(reg, val, obj, submitTrigger, self, e, eData);
	    }
	  }
	  type = result.passed ? 0 : !val || obj.is('select') && +val === -1 ? 1 : 2;
	  self.pass(obj, type);
	  obj.data('lastVal', val);
	  if (obj.attr('ajaxurl') && !type) {
	    enhanceCheck(obj, val, result.alias, submitTrigger, self);
	    return true;
	  }
	  tipType = self.getTipType(obj);
	  self.settings[name] && $.isFunction(self.settings[name].beforeShowMsg) && self.settings[name].beforeShowMsg(obj, val, {
	    status: (type ? 100 : 0),
	    ajaxCheck: false
	  }, self);
	  msg = self.getDisplay(obj, type, 'msg') && self.getMsg(obj, type, result.alias, tipType, e, eData) || '';
	  self.showMsg(obj, msg, type, tipType, submitTrigger, e, eData);
	  if (/1|2/.test(type) && !self.settings.showAllError) {
	    return false;
	  } else {
	    return true;
	  }
	};


	/*自动生成提示信息头 */

	Validate.prototype.getLabel = function(obj) {
	  var _label, label;
	  obj = parseObj(obj, this);
	  label = obj.attr('label');
	  if (!label) {
	    _label = obj.parents('.form-item').find(this.settings.label);
	    label = (_label.text() || '').replace(/^\s*\**|[:：]\s*$/g, '');
	  }
	  return label;
	};

	Validate.prototype.getDisplay = function(obj, testType, type) {
	  var _icon, name, result;
	  obj = parseObj(obj, this);
	  _icon = 'show' + msgAttr[testType] + type;
	  name = obj.attr('name');
	  result = obj.attr(_icon) || this.settings[name] && $.isPlainObject(this.settings[name]) && this.settings[name][_icon];
	  result = result === 'false' ? false : result === void 0 ? this.settings[type + 's'][testType] : result;
	  return result;
	};


	/*提交表单准备工作 */

	Validate.prototype.submitForm = function() {
	  var self;
	  self = this;
	  if (self.status === 'posting' || self.settings.postOnce && self.status === 'posted') {
	    return false;
	  } else if (self.ajaxValidate) {

	    /*标识正在ajax验证 */
	    queue.push('submit');
	    return false;
	  } else if (self.settings.ignoreValidate) {
	    return submit(self);
	  }

	  /*逐个用check方法检测，便于随时停止检测 */
	  $('[check]', self.form).each(function() {
	    return self.check($(this), true, {}, null);
	  });
	  if (!$("[pass='noPass']", self.form).length) {
	    return submit(self);
	  } else {
	    return false;
	  }
	};

	Validate.prototype.resetForm = function() {
	  var self;
	  self = this;
	  self.form[0].reset();
	  $('[pass]').attr('pass', null);
	  $('[check]').each(function() {
	    var that, tipType;
	    that = $(this);
	    that.data('lastVal', null);
	    tipType = self.getTipType(that);
	    return self.showMsg(that, '', 0, tipType, false, {}, null);
	  });
	  return self;
	};


	/*检测结果存储 */

	Validate.prototype.pass = function(obj, status) {
	  obj.attr('pass', pass[status] || 'noPass');
	  return this;
	};

	Validate.prototype.destroy = function() {
	  var self;
	  self = this;
	  self.resetForm();
	  self.off('click.validate');
	  self.off(self.settings.trigger + '.validate');
	  self.off('submit');
	  self.form = null;
	  return self = null;
	};


	/*解析jquery对象 */

	parseObj = function(obj, _v) {
	  if (obj.jquery && (obj.is(':radio') || obj.is(':checkbox'))) {
	    obj = obj.attr('name');
	  }
	  if (obj.jquery) {
	    return obj;
	  } else {
	    return $('[name="' + obj + '"]', _v.form);
	  }
	};


	/*解析规则，若规则是一个字符串，组合成数组或字符串，若是一个数组，对象 不作处理，若是一个函数 正则，不作处理，并将别名置空 */

	parseReg = function(reg, _v) {
	  var _alias, alias, m, n, r1, result, sepor;
	  r1 = /\/.+?\/[mgi]*(?=(,|$|\||\s))|[\w\*-]+/g;
	  if (typeof reg === 'string') {
	    alias = reg.match(r1);
	    if (alias) {
	      _alias = parseAlias(alias[0]);
	      if (alias.length === 1 && _alias) {
	        return _alias;
	      } else if (alias.length > 1) {
	        sepor = reg.replace(r1, '').replace(/\s*/g, '').split('');
	        result = [];
	        m = 0;
	        result[0] = [];
	        if (_alias) {
	          result[0].push(_alias);
	        }
	        n = 0;
	        while (n < sepor.length) {
	          if (sepor[n] === '|') {
	            m++;
	            result[m] = [];
	          }
	          _alias = parseAlias(alias[n + 1]);
	          if (_alias) {
	            result[m].push(_alias);
	            _alias = null;
	          }
	          n++;
	        }
	        return result;
	      }
	    }
	  } else {
	    return reg;
	  }
	};


	/*解析别名,若是字符串，则先判断是否为正则，若是，不做处理，若不是，解析成别名，并判断是否存在规则详情，不存在，直接清除，若是正则或函数，不做任何处理，其余类型，直接删除 */

	parseAlias = function(alias) {
	  var r2, r3;
	  r2 = /RegExp|Function/;
	  r3 = /\/.+\//g;
	  if (r2.test(Object.prototype.toString.call(alias)) || r3.test(alias) || typeof alias === 'string' && buildRule[alias]) {
	    return alias;
	  }
	};


	/*将索引解析成函数或者正则,返回规则别名，规则详情 */

	parseRule = function(reg, obj, _v) {
	  var name, param, r2, r3, regstr, rule;
	  r2 = /RegExp|Function/;
	  r3 = /\/.+\//g;
	  rule = {};
	  if (r2.test(Object.prototype.toString.call(reg))) {
	    rule = {
	      alias: '',
	      reg: reg
	    };
	  } else if (r3.test(reg)) {
	    regstr = reg.match(r3)[0].slice(1, -1);
	    param = reg.replace(r3, '');
	    rule = {
	      alias: '',
	      reg: RegExp(regstr, param)
	    };
	  } else if (typeof reg === 'string') {
	    name = obj.attr('name');
	    rule = {
	      alias: reg,
	      reg: _v.settings[name] && _v.settings[name].rule && _v.settings[name].rule[reg] || buildRule[reg] && buildRule[reg][0]
	    };
	  } else {
	    rule = null;
	  }
	  return rule;
	};

	parseTipClass = function(obj, type, addNewClass) {
	  var newClassName, oldClassName;
	  oldClassName = obj.attr('class') || '';
	  newClassName = $.trim(oldClassName.replace(rClass, '')) + (addNewClass ? ' ' + msgClass[type] : '');
	  obj.attr('class', newClassName);
	  return obj;
	};


	/*解析消息  将基本的占位符替换 */

	parseMsg = function(msg, obj, _v) {
	  var reg;
	  reg = /\{\{(\w+?)\}\}/g;
	  obj = parseObj(obj, _v);
	  if (reg.test(msg)) {
	    msg = msg.replace(reg, function(a, b) {
	      if (b === 'label') {
	        return _v.getLabel(obj);
	      } else if (b === 'again') {
	        if (obj.attr('rcheck')) {
	          return '再次';
	        } else {
	          return '';
	        }
	      } else if (b === 'verb') {
	        if (obj.is(':text') || obj.is('textarea') || obj.is(':password')) {
	          return '输入';
	        } else {
	          return '选择';
	        }
	      } else {
	        return obj.attr(b);
	      }
	    });
	  }
	  return msg;
	};


	/*单个检测函数,引入的检测是规则别名，需要进行处理成规则详情 */

	_check = function(alias, val, obj, submitTrigger, _v, e, eData) {
	  var passed, rule;
	  if (obj.attr('ajaxurl')) {
	    if (_v.ajax) {
	      _v.ajax.abort();
	      if (_v.status === 'posting') {
	        _v.changeStatus(0);
	        queue.push('submit');
	      }
	    }
	  }
	  if ($.isPlainObject(alias)) {
	    rule = alias;
	  } else {
	    rule = parseRule(alias, obj, _v);
	  }
	  if (rule) {
	    if ($.isFunction(rule.reg)) {
	      passed = rule.reg(val, obj, _v);
	    } else if (Object.prototype.toString.call(rule.reg) === '[object RegExp]') {
	      passed = rule.reg.test(val);
	    }
	    _v.settings.debug && console[logFn[+passed]](obj.attr('name') + ': 检测规则别名为：' + rule.alias + ';timestamp:' + Date.now());
	    return {
	      passed: passed,
	      alias: rule.alias
	    };
	  }
	};


	/*检测函数 */

	check = function(reg, val, obj, submitTrigger, _v, e, eData) {
	  var alias, checkResult, dtp, eithor;
	  alias = parseReg(reg);
	  if ($.isArray(alias)) {
	    eithor = 0;
	    while (eithor < alias.length) {
	      dtp = 0;
	      while (dtp < alias[eithor].length) {
	        checkResult = _check(alias[eithor][dtp], val, obj, submitTrigger, _v, e, eData) || {};
	        if (!checkResult.passed) {
	          break;
	        }
	        dtp++;
	      }
	      if (checkResult.passed) {
	        break;
	      }
	      eithor++;
	    }
	  } else if ($.isPlainObject(reg)) {
	    $.each(reg, function(j, k) {
	      var rule;
	      rule = {
	        alias: j,
	        reg: k
	      };
	      checkResult = _check(rule, val, obj, submitTrigger, _v, e, eData) || {};
	      rule = null;
	      if (!checkResult) {
	        return false;
	      }
	    });
	  } else {
	    checkResult = _check(alias, val, obj, submitTrigger, _v, e, eData) || {};
	  }
	  if (checkResult.passed) {
	    checkResult.passed = enhanceCheck(obj, val, checkResult.alias, submitTrigger, _v, e, eData);
	  }
	  return checkResult;
	};


	/*加强检测 TODO 需要对fe进行检测 */

	enhanceCheck = function(obj, val, alias, submitTrigger, _v, e, eData) {
	  var data, name, referVal, tipType, url;
	  if (name = obj.attr('rcheck')) {
	    referVal = _v.getVal($('[name="' + name + '"]', _v.form));
	    if (referVal === val) {
	      return true;
	    } else {
	      return false;
	    }
	  } else if (url = obj.attr('ajaxurl')) {
	    tipType = _v.getTipType(obj);
	    name = obj.attr('name');
	    url = parseUrl(url, 't=' + Math.random());
	    data = {};
	    data[name] = val;
	    if (_v.settings[name] && $.isFunction(_v.settings[name].beforeRemoteCheck)) {
	      data = _v.settings[name].beforeRemoteCheck(data, _v, e, eData);
	    }
	    return _v.ajax = $.ajax({
	      url: url,
	      data: data,
	      type: obj.attr('method') || _v.settings.ajaxType,
	      beforeSend: function() {
	        var msg;
	        _v.ajaxValidate = true;
	        if (obj.attr('showrinfo') || $.isPlainObject(_v.settings[name]) && _v.settings[name].showrinfo || _v.settings.showrinfo) {
	          tipType = +tipType === 1 ? 2 : tipType;
	          msg = obj.attr('rinfo') || _v.settings[name].rinfo || _v.settings.rinfo || '检测中……';
	          if (/^\.[^\.]+/.test(msg)) {
	            _v.getMsgEle(obj, tipType, e, eData).addClass(msg.substring(0));
	            msg = _v.settings.rinfo || '检测中……';
	          }
	          return _v.showMsg(obj, msg, 1, tipType, submitTrigger, e, eData);
	        }
	      }
	    }).done(function(json) {
	      var msg, type;
	      data = $.parseJSON(json);

	      /*未通过的由服务器做出判断 */
	      type = data.status ? 2 : 0;
	      _v.pass(obj, type);
	      _v.settings[name] && $.isFunction(_v.settings[name].beforeShowMsg) && _v.settings[name].beforeShowMsg(obj, val, data, _v);
	      _v.getDisplay(obj, type, 'msg') && (msg = (_v.settings[name] && $.isFunction(_v.settings[name].remoteMsg) ? _v.settings[name].remoteMsg(obj, type, _v, e, eData) : data.msg) || _v.getMsg(obj, type, alias, tipType, e, eData));
	      _v.showMsg(obj, msg || '', type, tipType, submitTrigger, e, eData);
	      _v.ajaxValidate = null;
	      if (queue.length) {
	        queue.shift();
	        return $(_v.settings.submit).trigger('click.validate');
	      }
	    }).error(function(xhr, textStatus, err) {
	      if (err === 'abort') {
	        return false;
	      }
	      return _v.settings.errFn(xhr, textStatus, err, _v);
	    }).always(function() {
	      return _v.ajax = null;
	    });
	  } else {
	    return true;
	  }
	};


	/*获取数据 */

	getData = function(_v) {
	  var data;
	  if (!_v.form) {
	    return null;
	  }
	  if (_v.form[0].tagName.toLocaleLowerCase() === 'form') {
	    data = _v.form.serializeArray();
	  } else {
	    data = _v.form.wrap('<form/>').parent('form').serializeArray();
	    _v.form.unWrap();
	  }
	  if ($.isFunction(_v.settings.parseData)) {
	    data = _v.settings.parseData(data, _v);
	  }
	  return data;
	};


	/*解析地址 */

	parseUrl = function(url, arg) {
	  var l1, l2;
	  l1 = url.indexOf('?');
	  l2 = url.indexOf('#');
	  arg = l1 > -1 ? '&' : '?' + arg;
	  if (!(l2 > -1)) {
	    return url + arg;
	  } else {
	    return url.substring(0, l2) + arg + url.substring(l2);
	  }
	};


	/*提交数据  此处不管是否符合提交要求 */

	submit = function(_v) {
	  var ajaxType, data;
	  if ($.isFunction(_v.settings.beforeSubmit) && !_v.settings.beforeSubmit(_v)) {
	    return false;
	  }
	  _v.changeStatus(1);
	  if (!_v.settings.ajaxPost) {
	    if (!_v.form.attr('action') || _v.settings.forceUrl) {
	      _v.form.attr('action', _v.settings.url || location.href);
	      return true;
	    }
	  } else {
	    if (!_v.settings.url) {
	      _v.settings.url = _v.form.attr('action') || location.href;
	    }
	    data = getData(_v);
	    if (_v.settings.debug) {
	      console.info('表单数据全部通过检测，timestamp' + Date.now());
	      console.table(data);
	      return false;
	    }
	    ajaxType = _v.form.attr('method') || _v.settings.ajaxType;
	    _v.ajax = $.ajax({
	      url: _v.settings.url,
	      data: data,
	      type: ajaxType,
	      beforeSend: function(xhr, config) {
	        var _text, loading;
	        if (_v.settings.showProgressIcon) {
	          loading = $(_v.settings.showProgressIcon);
	          if (!loading.length) {
	            loading = $('<div class="' + _v.settings.showProgressIcon.substring(1) + '"></div>').appendTo(_v.form);
	          }
	          loading.show();
	        }
	        if (_v.settings.showProgressText) {
	          _text = _v.form.find(_v.settings.showProgressText);
	          _v._isSubmit = _text.is('input');
	          if (!_v._progressText) {
	            _v._progressText = _text[_v._isSubmit ? 'val' : 'text']();
	          }
	          _text[_v._isSubmit ? 'val' : 'text'](_v._progressText + '中…').addClass('s-tip');
	        }
	        if (typeof _v.settings.beforeSend === 'function' && _v.settings.beforeSend(xhr, config, _v) === false) {
	          return false;
	        }
	        return true;
	      }
	    }).done(function(json, textStatus, xhr) {
	      _v.settings.showProgressIcon && $(_v.settings.showProgressIcon).hide();
	      _v.settings.showProgressText && $(_v.settings.showProgressText)[_v._isSubmit ? 'val' : 'text'](_v._progressText).removeClass('s-tip');
	      return $.isFunction(_v.settings.succFn) && _v.changeStatus(2).settings.succFn(json, textStatus, xhr, _v);
	    }).error(function(xhr, textStatus, err) {
	      _v.settings.showProgressIcon && $(_v.settings.showProgressIcon).hide();
	      _v.settings.showProgressText && $(_v.settings.showProgressText)[_v._isSubmit ? 'val' : 'text'](_v._progressText).removeClass('s-tip');
	      if (err === 'abort') {
	        return false;
	      }
	      _v.changeStatus(0);
	      xhr.abort();
	      return $.isFunction(_v.settings.errFn) && _v.settings.errFn(xhr, textStatus, err, _v);
	    }).always(function(xhr, textStatus, err) {
	      _v.ajax = null;
	      return $.isFunction(_v.settings.alwaysFn) && _v.settings.alwaysFn(xhr, textStatus, err, _v);
	    });
	    return false;
	  }
	};

	$.fn.validate = function(conf) {
	  return new Validate($(this), conf);
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	
	/*
	* 表单检测规则
	 */
	var Rule, ele$, rules;

	ele$ = function(options) {
	  var element;
	  element = $('aaaa');
	  if (options.jquery && (options.is(':radio') || options.is(':checkbox'))) {
	    options = options.attr('name');
	  }
	  if (options.jquery) {
	    element = options;
	  } else if (options.element) {
	    element = $(options.element);
	  } else if (options) {
	    element = $('[name="' + options + '"]');
	  }
	  return element;
	};


	/** 创建一个Rule
	  * @class
	*
	 */

	Rule = function() {};


	/** 添加一条规则
	 * @memberof Rule
	 * @param {string} mark 规则的名称
	 * @param {(regExp|function)} rule 规则方法或正则
	 * @param {string}  message 未通过规则检测的提示信息,规则中有占位符{{placeholder}}, 内置占位符有label, again, verb, 其余都用元素的属性设置
	 * @param {string} message#{{label}} 当前选择的label
	 * @param {string} message#{{again}}  再次，用于再次输入密码
	 * @param {string} message#{{verb}} 输入或选择，用于复选框单选框 输入框
	*
	 */

	Rule.prototype.add = function(mark, rule, message) {
	  return this[mark] = [rule, message];
	};

	Rule.prototype.remove = function(mark) {
	  if (mark && this[mark]) {
	    return delete this[mark];
	  } else {
	    $.each(this, function(i, v) {
	      return this[i] = null;
	    });
	    return delete this;
	  }
	};

	rules = new Rule();

	rules.add('required', function(val, obj) {
	  var checked, element, t, tagName;
	  element = ele$(obj);
	  t = element.attr('type');
	  tagName = element[0].tagName.toLowerCase();
	  switch (t) {
	    case 'checkbox':
	    case 'radio':
	      checked = false;
	      element.each(function(i, item) {
	        if ($(item).prop('checked')) {
	          checked = true;
	          return false;
	        }
	      });
	      return checked;
	    default:
	      val = $.trim(element.val());
	      if (tagName === 'select') {
	        return Boolean(val && +val !== -1);
	      } else {
	        return Boolean(val);
	      }
	  }
	}, '请{{verb}}{{label}}');

	rules.add('password', /.*/, '请{{again}}输入密码');

	rules.add('number', /^[+-]?[1-9][0-9]*(\.[0-9]+)?([eE][+-][1-9][0-9]*)?$|^[+-]?0?\.[0-9]+([eE][+-][1-9][0-9]*)?$/, '{{label}}的格式不正确');

	rules.add('digits', /^\s*\d+\s*$/, '{{label}}的格式不正确');

	rules.add('email', /^\s*([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,20})\s*$/, '{{label}}的格式不正确');

	rules.add('url', /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/, '{{label}}的格式不正确');

	rules.add('date', /^\d{4}\-[01]?\d\-[0-3]?\d$|^[01]\d\/[0-3]\d\/\d{4}$|^\d{4}年[01]?\d月[0-3]?\d[日号]$/, '{{label}}的格式不正确');

	rules.add('min', function(val, obj) {
	  return Number(val) >= Number(obj.attr('min'));
	}, '{{label}}必须大于等于{{min}}');

	rules.add('max', function(val, obj) {
	  return Number(val) <= Number(obj.attr('max'));
	}, '{{label}}必须小于等于{{max}}');

	rules.add('maxlength', function(val, obj) {
	  return val.length <= Number(obj.attr('maxlength'));
	}, '{{label}}的长度必须不多于{{maxlength}}');

	rules.add('minlength', function(val, obj) {
	  return val.length >= Number(obj.attr('minlength'));
	}, '{{label}}的长度必须不少于{{minlength}}');

	rules.add('mobile', /^1\d{10}$/, '请输入正确的{{label}}');

	module.exports = rules;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./rule.coffee": 1
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 2;


/***/ }
/******/ ]);