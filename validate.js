/*
* Validate component for jQuery ( CMD Module )
*
* Copyright (c) 2014 Shaoyong Fan
* Released under the MIT Licenses
*
* Mail : fsy0718@163.com
* Date : 2014-10-11
 */

/**
 rule规则，规则三部分组成  规则别名，规则详情，规则信息提示【未通过，为空提示，通过】
  用户自行在config中以name为key进行的索引rule规则：
   --- 可以是一个字符串，如果是字符串，包含内容必须是内置规则名，可以是多个规则的组合
   --- 可以是一个对象，对象的key为rule别名，value为一个数组，规则详情，规则信息提示
   --- 也可以是一个函数，会去提取默认错误信息
   --- 也可以是一个正则，会去提取默认错误信息
   --- 可以是一个数组，数组规则为 ['a','b',funtion(){},["c","d"]] 数组元素只能是字符串，数组【同样符合外部数组规则】，函数，正则
 */
define(function(require, exports) {
  var Validate, buildConf, buildRule, logFn, msgAttr, msgClass, msgTip, pass, queue, rClass, rNumber, status;
  buildRule = require('./rule');
  msgAttr = ['succ', 'null', 'fail'];

  /*信息提示类名， 0 -> 成功提示  1 -> 为空警告  2-> 错误提示  3->为空 */
  msgClass = ['s-succ', 's-warn', 's-error', ''];
  status = ['normal', 'posting', 'posted'];
  pass = ['passed', 'noPass'];
  msgTip = ['{{label}}通过检测', '请{{verb}}{{label}}', '{{label}}不合格式要求'];
  logFn = ['error', 'log', 'warn'];
  rNumber = /^[012]$/;
  rClass = /\bs\-(succ|warn|error)\b/g;
  queue = [];
  buildConf = {
    form: '.J_validate-form',
    submit: '.J_submit-form',
    tipType: 1,
    label: '.form-label',
    ajaxPost: true,
    ajaxType: 'post',
    postOnce: true,
    ignoreHidden: false,
    showAllError: true,
    showProgressIcon: '.J_loading-box',
    showProgressText: '.J_submit-form',
    trigger: 'blur',
    showNull: true,
    showSucc: false,
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
    self.form.on(self.settings.trigger + '.validate', '[check]', function() {
      return self.check($(this));
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
    self.form.on('click.validate', self.settings.submit, function(e) {
      e.preventDefault();
      return self.form.trigger('submit');
    });
    self.form.attr('hasValidate', 'true');
    return this;
  };

  /* 获取表单元素的值 可以配置复选框值的分隔符及是否去掉前后空格[密码不需要] */
  Validate.prototype.getVal = function(obj, trim) {
    var self, val;
    val = '';
    self = this;
    obj = Validate.tool.parseObj(obj, self.form);
    if (obj.is(':radio')) {
      val = $(':radio[name="' + obj.attr('name') + '"]:checked', self.form).val();
    } else if (obj.is(':checkbox')) {
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
    var name, self, _reg;
    self = this;
    obj = Validate.tool.parseObj(obj, self.form);
    _reg = obj.data('rule');
    if (!_reg) {
      name = obj.attr('name');
      if (self.settings[name]) {
        _reg = self.settings[name].rule;
      }
      if (!_reg) {
        _reg = 'required';
      }
    }
    return _reg;
  };

  /*改变当前表单的状态 */
  Validate.prototype.changeStatus = function(num) {
    !rNumber.test(num) && (num = 0);
    this.status = status[num];
    return this;
  };

  /*获取表单项信息  type表示状态值 0 -> 成功   1 -> 空值信息  2 -> 错误信息
  		查询顺序：行内各种提示信息 -> 别名提示信息  -> 默认错误提示  -> 内置别名提示  -> 默认提示
   */
  Validate.prototype.getMsg = function(obj, type, alias, tipType) {
    var E, e, msgKey, _msg, _msgPrefix, _name;
    _msg = '';
    if (!rNumber.test(type) || +tipType === 1) {
      return _msg;
    }
    if (type < 2) {
      alias = '';
    }
    _msgPrefix = alias + msgAttr[+type];
    msgKey = _msgPrefix + 'msg';
    _msg = obj.attr(msgKey);
    if (!_msg) {
      _name = obj.attr('name');
      try {
        _msg = this.settings[_name][alias][3 - type];
      } catch (_error) {
        e = _error;
        try {
          _msg = this.settings[_name][msgKey];
        } catch (_error) {
          E = _error;
          _msg = buildRule[alias] && buildRule[alias][3 - type];
        }
      }
      _msg || (_msg = msgTip[type]);
    }
    _msg = Validate.tool.parseMsg.call(this, _msg, obj);
    obj.attr(msgKey, _msg);
    return _msg;
  };

  /*获取提示信息显示位置  1  将当前input变色  2  在当前表单项中加上 3 在当前检测表单项上指定位置显示【优先显示错误及空提示】  4  弹框显示   字符串，指定显示位置的选择器 */
  Validate.prototype.getTipType = function(obj) {
    var name;
    obj = Validate.tool.parseObj(obj, this.form).eq(0);
    name = obj.attr('name');
    return obj.attr('tipType') || this.settings[name] && this.settings[name].tipType || this.form.attr('tipType') || this.settings.tipType || 1;
  };

  /* type  表示状态值 0 -> 成功   1 -> 空值信息  2 -> 错误信息 3-> 隐藏提示信息 */
  Validate.prototype.showMsg = function(obj, msg, type, tipType, submitTrigger) {
    var msgPlace, name, par, parPostion, tipName;
    obj = Validate.tool.parseObj(obj, this.form);
    if (+tipType === 4) {
      if (this.settings.checkSubmit) {
        this.settings.showAllError = false;
        if (!submitTrigger) {
          return this;
        }
      }
      require.async('lib/layer/layer', function(layer) {
        return layer.alert(msg, {
          'title': '表单校验提示',
          cont: {
            "class": msgClass[type]
          }
        });
      });
      return this;
    } else if (+tipType === 1) {
      msgPlace = obj;
    } else if (/^[23]$/.test(tipType)) {
      par = obj.parents('.form-item');
      msgPlace = par.find('.input-msg');
      if (!msgPlace.length) {
        msgPlace = $('<span class="input-msg"/>').appendTo(par);
      }
      if (+tipType === 3) {
        parPostion = par.css('position');
      }
    } else {
      msgPlace = $(tipType + ':eq(0)');
      tipName = msgPlace.data('tipName');
      name = obj.attr('name');
      if (/^1|2$/.test(type)) {
        msgPlace.data('tipName', name);
      }
      if (/0|3/.test(type)) {
        if (tipName === name) {
          msgPlace.data('tipName', null);
        } else if (tipName && name) {
          return;
        }
      }
    }
    Validate.tool.parseTipClass(msgPlace, type);
    +tipType !== 1 && msgPlace.html(msg);
    if (this.settings.checkSubmit && !submitTrigger) {
      msgPlace.css('visibility', 'hidden');
    } else {
      msgPlace.css('visibility', 'visible');
    }
    return this;
  };

  /*检测 submitTrigger表示提交时触发检测 */
  Validate.prototype.check = function(obj, submitTrigger) {
    var msg, name, reg, result, self, tipType, type, val, _msgPrefix, _r;
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
      result = self.settings[name]['check'].call(self, val, obj, buildRule, submitTrigger);
      val = self.getVal(obj, obj.is(':password') ? false : true);
      try {
        result.passed;
      } catch (_error) {
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
        result = Validate.tool.check.call(self, reg, val, obj, submitTrigger);
      }
    }
    type = result.passed ? 0 : !val || obj.is('select') && +val === -1 ? 1 : 2;
    self.pass(obj, type);
    tipType = self.getTipType(obj);
    obj.data('lastVal', val);
    if (obj.attr('ajaxurl') && !type) {
      return true;
    }
    msg = void 0;
    if (type === 2 && (_r = obj.attr('rcheck'))) {
      _msgPrefix = obj.attr('rcheckLabel') || self.getLabel($('input[name="' + _r + '"]'));
      msg = _msgPrefix + '输入不一致';
    } else if (type === 2 || (type === 1 && (obj.attr('showNull') || self.settings.showNull)) || (!type && (obj.attr('showSucc') || self.settings.showSucc))) {
      msg = self.getMsg(obj, type, result.alias, tipType);
    } else if (!type && !(obj.attr('showSucc') || self.settings.showSucc)) {
      type = 3;
      msg = ' ';
    }
    msg !== void 0 && self.showMsg(obj, msg, type, tipType, submitTrigger);
    if (/1|2/.test(type) && !self.settings.showAllError) {
      return false;
    } else {
      return true;
    }
  };

  /*自动生成提示信息头 */
  Validate.prototype.getLabel = function(obj) {
    var label, _label;
    obj = Validate.tool.parseObj(obj, this.settings.form);
    label = obj.attr('label');
    if (!label) {
      _label = obj.parents('.form-item').find(this.settings.label);
      label = (_label.text() || '').replace(/^\s*\**|[:：]\s*$/g, '');
    }
    return label;
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
      return Validate.tool.submit.call(self);
    }

    /*逐个用check方法检测，便于随时停止检测 */
    $('[check]', self.form).each(function() {
      return self.check($(this), true);
    });
    if (!$("[pass='noPass']", self.form).length) {
      return Validate.tool.submit.call(self);
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
      return self.showMsg(that, '', 3, tipType, false);
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
  Validate.tool = {

    /*解析jquery对象 */
    parseObj: function(obj, context) {
      if (obj.jquery && (obj.is(':radio') || obj.is(':checkbox'))) {
        obj = obj.attr('name');
      }
      if (obj.jquery) {
        return obj;
      } else {
        return $('[name="' + obj + '"]', context);
      }
    },

    /*解析规则，若规则是一个字符串，组合成数组或字符串，若是一个数组，对象 不作处理，若是一个函数 正则，不作处理，并将别名置空 */
    parseReg: function(reg) {
      var alias, m, n, r1, result, sepor, _alias;
      r1 = /\/.+?\/[mgi]*(?=(,|$|\||\s))|[\w\*-]+/g;
      if (typeof reg === 'string') {
        alias = reg.match(r1);
        if (alias) {
          _alias = Validate.tool.parseAlias(alias[0]);
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
              _alias = Validate.tool.parseAlias(alias[n + 1]);
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
    },

    /*解析别名,若是字符串，则先判断是否为正则，若是，不做处理，若不是，解析成别名，并判断是否存在规则详情，不存在，直接清除，若是正则或函数，不做任何处理，其余类型，直接删除 */
    parseAlias: function(alias) {
      var r2, r3;
      r2 = /RegExp|Function/;
      r3 = /\/.+\//g;
      if (r2.test(Object.prototype.toString.call(alias)) || r3.test(alias) || typeof alias === 'string' && buildRule[alias]) {
        return alias;
      }
    },

    /*将索引解析成函数或者正则,返回规则别名，规则详情 */
    parseRule: function(reg, obj) {
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
          reg: this.settings[name] && this.settings[name].rule && this.settings[name].rule[reg] || buildRule[reg] && buildRule[reg][0]
        };
      } else {
        rule = null;
      }
      return rule;
    },
    parseTipClass: function(obj, type) {
      var newClassName, oldClassName;
      oldClassName = obj.attr('class') || '';
      if (rClass.test(oldClassName) || type < 3) {
        newClassName = $.trim(oldClassName.replace(rClass, '')) + ' ' + msgClass[type];
        obj.attr('class', newClassName);
      }
      return obj;
    },

    /*解析消息  将基本的占位符替换 */
    parseMsg: function(msg, obj, context) {
      var reg, self;
      reg = /\{\{(\w+?)\}\}/g;
      self = this;
      obj = Validate.tool.parseObj(obj, context);
      if (reg.test(msg)) {
        msg = msg.replace(reg, function(a, b) {
          if (b === 'label') {
            return self.getLabel(obj);
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
    },

    /*单个检测函数,引入的检测是规则别名，需要进行处理成规则详情 */
    _check: function(alias, val, obj, submitTrigger) {
      var passed, rule, self;
      self = this;
      if (obj.attr('ajaxurl')) {
        if (self.ajax) {
          self.ajax.abort();
          if (self.status === 'posting') {
            self.changeStatus(0);
            queue.push('submit');
          }
        }
      }
      if ($.isPlainObject(alias)) {
        rule = alias;
      } else {
        rule = Validate.tool.parseRule.call(self, alias, obj);
      }
      if (rule) {
        if ($.isFunction(rule.reg)) {
          passed = rule.reg(val, obj, self);
        } else if (Object.prototype.toString.call(rule.reg) === '[object RegExp]') {
          passed = rule.reg.test(val);
        }
        self.settings.debug && console[logFn[+passed]](obj.attr('name') + ': 检测规则别名为：' + rule.alias + ';timestamp:' + Date.now());
        return {
          passed: passed,
          alias: rule.alias
        };
      }
    },

    /*检测函数 */
    check: function(reg, val, obj, submitTrigger) {
      var alias, checkResult, dtp, eithor, self;
      self = this;
      alias = Validate.tool.parseReg(reg);
      if (Object.prototype.toString.call(alias) === '[object Array]') {
        eithor = 0;
        while (eithor < alias.length) {
          dtp = 0;
          while (dtp < alias[eithor].length) {
            checkResult = Validate.tool._check.call(self, alias[eithor][dtp], val, obj, submitTrigger);
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
          checkResult = Validate.tool._check.call(self, rule, val, obj, submitTrigger);
          rule = null;
          if (!checkResult) {
            return false;
          }
        });
      } else {
        checkResult = Validate.tool._check.call(self, alias, val, obj, submitTrigger);
      }
      if (checkResult.passed) {
        checkResult.passed = Validate.tool.enhanceCheck.call(self, obj, val, checkResult.alias, submitTrigger);
      }
      return checkResult;
    },

    /*加强检测 TODO 需要对fe进行检测 */
    enhanceCheck: function(obj, val, alias, submitTrigger) {
      var data, name, referVal, self, tipType, url;
      self = this;
      if (name = obj.attr('rcheck')) {
        referVal = self.getVal($('[name="' + name + '"]', self.form));
        if (referVal === val) {
          return true;
        } else {
          return false;
        }
      } else if (url = obj.attr('ajaxurl')) {
        tipType = self.getTipType(obj);
        url = Validate.tool.parseUrl(url, 't=' + Math.random());
        data = {};
        data[obj.attr('name')] = val;
        if (typeof self.settings.beforeRemoteCheck === 'function') {
          data = self.settings.beforeRemoteCheck(data, self);
        }
        return self.ajax = $.ajax({
          url: url,
          data: data,
          type: obj.attr('method') || self.settings.ajaxType,
          beforeSend: function() {
            return self.ajaxValidate = true;
          }
        }).done(function(json) {
          var msg, type;
          data = $.parseJSON(json);

          /*未通过的由服务器做出判断 */
          type = data.status ? 2 : 0;
          name = obj.attr('name');
          self.pass(obj, type);
          if (self.settings[name] && typeof self.settings[name].remoteMsg === 'function') {
            msg = self.settings[name].remoteMsg.call(self, obj, type);
          } else {
            msg = data.msg;
          }
          if (!msg) {
            msg = self.getMsg(obj, type, alias, tipType);
          }
          self.showMsg(obj, msg, type, tipType, submitTrigger);
          self.ajaxValidate = null;
          if (queue.length) {
            queue.shift();
            return $(self.settings.submit).trigger('click.validate');
          }
        }).error(function(xhr, textStatus, err) {
          if (err === 'abort') {
            return false;
          }
          return self.settings.errFn(xhr, textStatus, err);
        }).always(function() {
          return self.ajax = null;
        });
      } else {
        return true;
      }
    },

    /*获取数据 */
    getData: function(form) {
      var data;
      if (!form) {
        return null;
      }
      if (form[0].tagName.toLocaleLowerCase() === 'form') {
        data = form.serializeArray();
      } else {
        data = form.wrap('<form/>').parent('form').serializeArray();
        form.unWrap();
      }
      if ($.isFunction(this.settings.parseData)) {
        data = this.settings.parseData.call(this, data, form);
      }
      return data;
    },

    /*解析地址 */
    parseUrl: function(url, arg) {
      var l1, l2;
      l1 = url.indexOf('?');
      l2 = url.indexOf('#');
      arg = l1 > -1 ? '&' : '?' + arg;
      if (!(l2 > -1)) {
        return url + arg;
      } else {
        return url.substring(0, l2) + arg + url.substring(l2);
      }
    },

    /*提交数据  此处不管是否符合提交要求 */
    submit: function() {
      var ajaxType, data, self;
      self = this;
      if (typeof self.settings.beforeSubmit === 'function' && !self.settings.beforeSubmit.call(self)) {
        return false;
      }
      self.changeStatus(1);
      if (!self.settings.ajaxPost) {
        if (!self.form.attr('action') || self.settings.forceUrl) {
          self.form.attr('action', self.settings.url || location.href);
          return true;
        }
      } else {
        if (!self.settings.url) {
          self.settings.url = self.form.attr('action') || location.href;
        }
        data = Validate.tool.getData.call(self, self.form);
        if (self.settings.debug) {
          console.info('表单数据全部通过检测，timestamp' + Date.now());
          console.table(data);
          return false;
        }
        ajaxType = self.form.attr('method') || self.settings.ajaxType;
        self.ajax = $.ajax({
          url: self.settings.url,
          data: data,
          type: ajaxType,
          beforeSend: function(xhr, config) {
            var loading, _text;
            if (self.settings.showProgressIcon) {
              loading = $(self.settings.showProgressIcon);
              if (!loading.length) {
                loading = $('<div class="' + self.settings.showProgressIcon.substring(1) + '"></div>').appendTo(self.form);
              }
              loading.show();
            }
            if (self.settings.showProgressText) {
              _text = self.form.find(self.settings.showProgressText);
              self._isSubmit = _text.is('input');
              if (!self._progressText) {
                self._progressText = self._isSubmit ? _text.val() : _text.text();
              }
              _text[self._isSubmit ? 'val' : 'text'](self._progressText + '中…').addClass('s-tip');
            }
            if (typeof self.settings.beforeSend === 'function' && self.settings.beforeSend.call(self, xhr, config) === false) {
              return false;
            }
            return true;
          }
        }).done(function(json) {
          if ($.isFunction(self.settings.succFn)) {
            return self.changeStatus(2).settings.succFn.call(self, json);
          }
        }).error(function(xhr, textStatus, err) {
          if (err === 'abort') {
            return false;
          }
          self.changeStatus(0);
          xhr.abort();
          if ($.isFunction(self.settings.errFn)) {
            return self.settings.errFn.call(self, xhr, textStatus, err);
          }
        }).always(function() {
          self.ajax = null;
          self.settings.showProgressIcon && $(self.settings.showProgressIcon).hide();
          return self.settings.showProgressText && $(self.settings.showProgressText)[self._isSubmit ? 'val' : 'text'](self._progressText).removeClass('s-tip');
        });
        return false;
      }
    }
  };
  return $.fn.validate = function(conf) {
    return new Validate($(this), conf);
  };
});


/** change log
  2014-09-11 新增表单项指定位置显示提示信息
  2014-09-15 为多个form表单实例化
  2014-11-17 去除多个表单实例化
 */
