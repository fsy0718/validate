/*
* 表单检测规则
 */
define(function(require, exports) {
  var Rule, getElement, rules;
  getElement = function(options) {
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
  Rule = function() {};
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
    element = getElement(obj);
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
  return exports.rules = rules;
});
