// Generated by CoffeeScript 1.7.1

/**
 rule规则，规则三部分组成  规则别名，规则详情，规则信息提示【未通过，通过，为空提示】
  用户自行在config中以name为key进行的索引rule规则：
   --- 可以是一个字符串，如果是字符串，包含内容必须是内置规则名，可以是多个规则的组合
   --- 可以是一个对象，对象的key为rule别名，value为一个数组，规则详情，规则信息提示
   --- 也可以是一个函数，会去提取默认错误信息
   --- 也可以是一个正则，会去提取默认错误信息
   --- 可以是一个数组，数组规则为 ['a','b',funtion(){},["c","d"]] 数组元素只能是字符串，数组【同样符合外部数组规则】，函数，正则
 */
(function($,undefined){
  var Validate, buildConf, buildRule, logFn, msgAttr, msgClass, msgTip, pass, queue, rClass, rNumber, status;
  msgAttr = ['succ', 'null', 'fail'];
  msgClass = ['s-succ', 's-warn', 's-error', ''];
  status = ['normal', 'posting', 'posted'];
  pass = ['passed', 'noPass'];
  msgTip = ['{{label}}通过检测', '请{{verb}}{{label}}'];
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
    postOnce: true,
    ignoreHidden: false,
    showAllError: true,
    trigger: 'blur',
    showNull: true,
    showSucc: false,
    debug: false
  };
  Validate = function(config) {
    var self;
    self = this;
    self.settings = $.extend(true, buildConf, config);
    self.status = status[0];
    self.form = typeof self.form === 'object' && self.form.jquery ? self.form : $(self.settings.form);
    self.form.on(self.settings.trigger + '.validate', '[check]', function() {
      return self.check($(this));
    });
    if (!$(self.settings.submit).length) {
      self.settings.submit = ':submit';
    }
    self.form.on('click.validate', self.settings.submit, function(e) {
      e.preventDefault();
      return self.submitForm();
    });
    return this;
  };
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
  Validate.prototype.changeStatus = function(num) {
    !rNumber.test(num) && (num = 0);
    this.status = status[num];
    return this;
  };
  Validate.prototype.getMsg = function(obj, type, alias, tipType) {
    var msgKey, _msg, _msgPrefix, _name;
    _msg = void 0;
    if (!rNumber.test(type) || tipType === 1) {
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
      _msg = this.settings[_name] && (this.settings[_name][alias][1] || this.settings[_name][_msgPrefix]) || (type < 2 ? msgTip[type] : buildRule[alias][1]);
    }
    _msg = Validate.tool.parseMsg.call(this, _msg, obj);
    obj.attr(msgKey, _msg);
    return _msg;
  };
  Validate.prototype.getTipType = function(obj) {
    var name, tipType;
    obj = Validate.tool.parseObj(obj, this.form).eq(0);
    name = obj.attr('name');
    tipType = obj.attr('tipType') || this.settings[name] && this.settings[name].tipType || this.settings.tipType;
    if (tipType) {
      return +tipType;
    }
  };
  Validate.prototype.showMsg = function(obj, msg, type, tipType) {
    var msgPlace, newClassName, oldClassName, par;
    obj = Validate.tool.parseObj(obj, this.form);
    if (tipType === 1) {
      oldClassName = obj.attr('class') || '';
      newClassName = $.trim(oldClassName.replace(rClass, '') + ' ' + msgClass[type]);
      return obj.attr('class', newClassName);
    } else if (tipType === 2) {
      par = obj.parents('.form-item');
      msgPlace = par.find('.input-msg');
      if (!msgPlace.length) {
        msgPlace = $('<span class="input-msg"/>').appendTo(par);
      }
      oldClassName = msgPlace.attr('class') || '';
      if (rClass.test(oldClassName) || /1|2/.test(type)) {
        newClassName = $.trim(oldClassName.replace(rClass, '') + ' ' + msgClass[type]);
        return msgPlace.text(msg).attr('class', newClassName);
      }
    } else if (tipType === 3) {
      return require.async('lib/layer/layer', function(layer) {
        return layer.alert({
          'title': '表单校验提示',
          cont: {
            "class": msgClass[type],
            msg: msg
          }
        });
      });
    }
  };
  Validate.prototype.check = function(obj) {
    var msg, name, passed, reg, result, self, tipType, type, val;
    self = this;
    type = obj.attr('type');
    if (/button|rest|submit|file/.test(type)) {
      return true;
    }
    val = self.getVal(obj, obj.is(':password') ? false : true);
    if (obj.attr('ignore') === 'ignore' && !val || obj.data('lastVal') === val || obj.is(':hidden') && self.settings.ignoreHidden) {
      self.settings.debug && console.log(obj.attr('name') + ' 通过检测;timestamp:' + Date.now());
      return true;
    } else if (!val && (obj.attr('showNull') || self.settings.showNull)) {
      self.pass(obj, 1);
      tipType = self.getTipType(obj);
      self.settings.debug && console.error(obj.attr('name') + ' 未通过检测; 原因:未填写内容; timestamp:' + Date.now());
      return self.showMsg(obj, self.getMsg(obj, 1, null, tipType), 1, tipType);
    } else if (val) {
      name = obj.attr('name');
      obj.data('lastVal', val);
      if (self.settings[name] && $.isFunction(self.settings[name]['check'])) {
        return self.settings[name]['check'].call(self, self.settings[name], val, obj, buildRule);
      }
      reg = self.getReg(obj);
      result = Validate.tool.check.call(self, reg, val, obj);
      tipType = self.getTipType(obj);
      if (result.passed) {
        passed = 0;
      } else {
        passed = 2;
      }
      self.pass(obj, passed);
      if (obj.attr('ajaxurl') && !passed) {
        return true;
      }
      if (passed === 0 && !(obj.attr('showSucc') || self.settings.showSucc)) {
        msg = '';
        passed = 3;
      } else if (obj.attr('rcheck')) {

        /*TODO 需要兼容提示两次不一致的情形 */
        msg = '两次输入不一致';
      } else {
        msg = self.getMsg(obj, passed, result.alias, tipType);
      }
      self.showMsg(obj, msg, passed, tipType);
      if (passed) {
        if (self.settings.showAllError) {
          return true;
        } else {
          return false;
        }
      }
    }
  };
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
  Validate.prototype.submitForm = function() {
    var self;
    self = this;
    if (self.status === 'posting' || self.settings.postOnce && self.status === 'posted') {
      return false;
    } else if (self.ajaxValidate) {
      queue.push('submit');
      return false;
    } else if (self.settings.ignoreValidate) {
      return Validate.tool.submit.call(self);
    }
    $('[check]').trigger(self.settings.trigger + '.validate');
    if (!$("[pass='noPass']").length) {
      return Validate.tool.submit.call(self);
    }
  };
  Validate.prototype.pass = function(obj, status) {
    return obj.attr('pass', pass[status] || 'noPass');
  };
  Validate.tool = {
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
      } else if (typeof alias === 'object') {
        return _alias;
      }
    },
    parseAlias: function(alias) {
      var r2, r3;
      r2 = /RegExp|Function/;
      r3 = /\/.+\//g;
      if (r2.test(Object.prototype.toString.call(alias)) || r3.test(alias) || typeof alias === 'string' && buildRule[alias]) {
        return alias;
      }
    },
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
          reg: this.settings[name] && this.settings[name].rule[reg] || buildRule[reg] && buildRule[reg][0]
        };
      } else {
        rule = null;
      }
      return rule;
    },
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
            if (obj.is(':text') || obj.is('textarea')) {
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
    _check: function(alias, val, obj) {
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
    check: function(reg, val, obj) {
      var alias, checkResult, dtp, eithor, self;
      self = this;
      alias = Validate.tool.parseReg(reg);
      if (Object.prototype.toString.call(alias) === '[object Array]') {
        eithor = 0;
        while (eithor < alias.length) {
          dtp = 0;
          while (dtp < alias[eithor].length) {
            checkResult = Validate.tool._check.call(self, alias[eithor][dtp], val, obj);
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
          checkResult = Validate.tool._check.call(self, rule, val, obj);
          rule = null;
          if (!checkResult) {
            return false;
          }
        });
      } else {
        checkResult = Validate.tool._check.call(self, alias, val, obj);
      }
      if (checkResult.passed) {
        checkResult.passed = Validate.tool.enhanceCheck.call(self, obj, val, checkResult.alias);
      }
      return checkResult;
    },
    enhanceCheck: function(obj, val, alias) {
      var data, name, referVal, self, url;
      self = this;
      if (name = obj.attr('rcheck')) {
        referVal = self.getVal($(name));
        if (referVal === val) {
          return true;
        } else {
          return false;
        }
      } else if (url = obj.attr('ajaxurl')) {
        url = Validate.tool.parseUrl(url, 't=' + Math.random());
        data = {};
        data[obj.attr('name')] = val;
        return self.ajax = $.ajax({
          url: url,
          data: data,
          beforeSend: function() {
            self.ajaxValidate = true;
            return self.showMsg(obj, '正在远程检测数据，请稍等……', 1, 2);
          }
        }).done(function(json) {
          var msg, tipType, type;
          data = $.parseJSON(json);
          type = data.status ? 2 : 0;
          msg = data.msg;
          tipType = self.getTipType(obj);
          self.pass(obj, type);
          if (!msg) {
            msg = self.getMsg(obj, type, alias, tipType);
          }
          self.showMsg(obj, msg, type, tipType);
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
    submit: function() {
      var data, self;
      self = this;
      if (typeof self.settings.beforeSubmit === 'function' && !self.settings.beforeSubmit.call(self)) {
        return false;
      }
      self.changeStatus(1);
      if (!self.settings.ajaxPost) {
        if (!self.form.attr('action') || self.settings.forceUrl) {
          self.form.attr('action', self.settings.url || location.href);
          return self.form.submit();
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
        return self.ajax = $.post(self.settings.url, data).done(function(json) {
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
          return self.ajax = null;
        });
      }
    }
  };
  $.fn.validate = function(conf) {
    return new Validate(conf);
  };
})(jquery)
  



