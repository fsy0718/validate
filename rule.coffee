###
* 表单检测规则
###
define (require,exports)->
  getElement = (options)->
    element = $('aaaa')
    if options.jquery  and (options.is(':radio') or options.is(':checkbox'))
      options = options.attr('name')
    if options.jquery
      element = options
    else if options.element
      element = $(options.element)
    else if options
      element = $('[name="' + options + '"]')
    element
  Rule = ->
  Rule.prototype.add = (mark,rule,message)->
    @[mark] = [rule,message]

  Rule.prototype.remove = (mark)->
    if mark and @[mark]
      delete @[mark]
    else
      $.each @,(i,v)->
        @[i] = null
      delete @
  rules = new Rule()
  rules.add 'required', (val,obj)->
    element = getElement(obj)
    t = element.attr('type')
    tagName = element[0].tagName.toLowerCase()
    switch t
      when 'checkbox','radio'
        checked = false
        element.each (i,item)->
          if $(item).prop('checked')
            checked = true
            return false
        return checked
      else
        val = $.trim(element.val())
        if tagName is 'select'
          Boolean val and +val isnt -1
        else
          Boolean val
  , '请{{verb}}{{label}}'
  rules.add 'password', /.*/,'请{{again}}输入密码'
  rules.add 'number', /^[+-]?[1-9][0-9]*(\.[0-9]+)?([eE][+-][1-9][0-9]*)?$|^[+-]?0?\.[0-9]+([eE][+-][1-9][0-9]*)?$/, '{{label}}的格式不正确'
  rules.add 'digits', /^\s*\d+\s*$/, '{{label}}的格式不正确'
  rules.add 'email', /^\s*([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,20})\s*$/, '{{label}}的格式不正确'
  rules.add 'url', /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/, '{{label}}的格式不正确'
  rules.add 'date', /^\d{4}\-[01]?\d\-[0-3]?\d$|^[01]\d\/[0-3]\d\/\d{4}$|^\d{4}年[01]?\d月[0-3]?\d[日号]$/, '{{label}}的格式不正确'
  rules.add 'min',(val,obj)->
    Number(val) >= Number(obj.attr('min'))
  ,'{{label}}必须大于等于{{min}}'
  rules.add 'max',(val,obj)->
    Number(val) <= Number(obj.attr('max'))
  ,'{{label}}必须小于等于{{max}}'
  rules.add 'maxlength',(val,obj)->
    val.length <= Number(obj.attr('maxlength'))
  ,'{{label}}的长度必须不多于{{maxlength}}'
  rules.add 'minlength',(val,obj)->
    val.length >= Number(obj.attr('minlength'))
  ,'{{label}}的长度必须不少于{{minlength}}'
  rules.add 'mobile',/^1\d{10}$/,'请输入正确的{{label}}'

  exports.rules = rules