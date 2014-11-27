#表单检测#
###
* Validate component for jQuery ( CMD Module )
*
* Copyright (c) 2014 Shaoyong Fan
* Released under the MIT Licenses
*
* Mail : fsy0718@163.com
* Date : 2014-10-11
###

###*
 rule规则，规则三部分组成  规则别名，规则详情，规则信息提示【未通过，为空提示，通过】
  用户自行在config中以name为key进行的索引rule规则：
   --- 可以是一个字符串，如果是字符串，包含内容必须是内置规则名，可以是多个规则的组合
   --- 可以是一个对象，对象的key为rule别名，value为一个数组，规则详情，规则信息提示
   --- 也可以是一个函数，会去提取默认错误信息
   --- 也可以是一个正则，会去提取默认错误信息
   --- 可以是一个数组，数组规则为 ['a','b',funtion(){},["c","d"]] 数组元素只能是字符串，数组【同样符合外部数组规则】，函数，正则
###
define (require,exports)->
  buildRule = require './rule'
  msgAttr = ['succ','null','fail']
  ###信息提示类名， 0 -> 成功提示  1 -> 为空警告  2-> 错误提示  3->为空###
  msgClass = ['s-succ','s-warn','s-error','']
  status = ['normal','posting','posted']
  pass = ['passed','noPass']
  msgTip = ['{{label}}通过检测','请{{verb}}{{label}}','{{label}}不合格式要求']
  logFn = ['error','log','warn']
  rNumber = /^[012]$/
  rClass = /(\bs\-(succ|warn|error)\b)?(\bvalidate-(succ|null|fail)\b)?/g
  queue = []
  buildConf =
    submit: '.J_submit-form'
    tipType: 1
    label: '.form-label'
    ajaxPost: true
    ajaxType: 'post'
    postOnce: true
    ignoreHidden: false
    showProgressIcon: '.J_loading-box'
    showProgressText: '.J_submit-form'
    trigger: 'blur'
    icons: [true,true,true]  #显示提示信息图标
    msgs: [true,true,true]
    showAllError: true
    ###
    showNullIcon: true #显示空图标
    showNullText: true #显示空信息
    showErrorIcon: true  #显示错误图标
    showErrorText: true #显示错误信息
    showSuccText: false  #显示成功信息
    showSuccIcon: true  #显示成功图标
    ###

    checkSubmit: false #只在提交时验证 默认为false
    debug: false   #调试用

      
  Validate = (form,config)->
    self = @
    self.form = form
    if self.form.attr('hasValidate') is 'true'  #TODO 后期需要返回已被实例的对象
      return self
    self.settings = $.extend true,{},buildConf,config
    self.status = status[0] #表单状态

    self.form.on self.settings.trigger + '.validate','[check]',-> #添加实时检测事件，如果showAllError为false，则检测但不显示错误
      self.check($(@))

    self.form.find('input[rcheck]').each -> #加强输两次时的比较
      _this = $(@)
      _inputCompare = $('input[name="' + _this.attr('rcheck') + '"]',self.form)
      _inputCompare.on self.settings.trigger + '.rcheck',->
        val = self.getVal(_this)
        if val
          _this.data('lastVal','').trigger(self.settings.trigger + '.validate')

    self.form.on 'submit',->
      self.submitForm()

    unless $(self.settings.submit).length
      self.settings.submit = ':submit'

    self.form.on 'click.validate', self.settings.submit,(e)->
      e.preventDefault()
      self.form.trigger('submit')
    self.form.attr('hasValidate','true')
    self

  ### 获取表单元素的值 可以配置复选框值的分隔符及是否去掉前后空格[密码不需要]###
  Validate::getVal = (obj,trim)->
    self = @
    obj = parseObj(obj,self)
    if obj.is ':radio'
      val = $(':radio[name="' + obj.attr('name') + '"]:checked',self.form).val()
    else if obj.is ':checkbox'
      val = ''
      $(':checkbox[name="' + obj.attr('name') + '"]:checked',self.form).each ->
        val += $(@).val() + (self.settings.delimiter || ',')
    else
      val = obj.val()
    trim and val = $.trim val
    val

  ###获取检测规则【字符串，正则，函数，对象】，寻找顺序  行内 ->  单个配置 ->  自动加上require###
  Validate::getReg = (obj)->
    obj = parseObj(obj,@)
    _reg = obj.data('rule')
    unless _reg
      name = obj.attr('name')
      if @.settings[name]
        _reg = @.settings[name].rule
      unless _reg
        _reg = 'required'
    _reg

  ###改变当前表单的状态###
  Validate::changeStatus = (num)->
    !rNumber.test(num) and num = 0
    @.status = status[num]
    @

  ###获取表单项信息  type表示状态值 0 -> 成功   1 -> 空值信息  2 -> 错误信息
		查询顺序：行内各种提示信息 -> 别名提示信息  -> 默认错误提示  -> 内置别名提示  -> 默认提示
  ###
  Validate::getMsg = (obj,type,alias,tipType)->
    _msg = ''
    if  !rNumber.test(type) or +tipType is 1
      return _msg
    if type < 2
      alias = ''
    _msgPrefix = alias + msgAttr[+type]
    msgKey = _msgPrefix + 'msg'
    _msg = obj.attr(msgKey)
    unless _msg
      _name = obj.attr('name')
      try
        _msg = @.settings[_name][alias][3 - type]
      catch e
        try
          _msg = @.settings[_name][msgKey]
        catch E
          _msg = buildRule[alias] and buildRule[alias][3 - type]
      _msg ||= msgTip[type]
    _msg = parseMsg(_msg,obj,@)
    obj.attr(msgKey,_msg)
    _msg

  ###获取提示信息显示位置  1  将当前input变色  2  在当前表单项中加上 3 在当前检测表单项上指定位置显示【优先显示错误及空提示】  4  弹框显示   字符串，指定显示位置的选择器###
  Validate::getTipType = (obj)->
    obj = parseObj(obj,@).eq(0) #选择第一个 因为有checkbox 及 radio
    name = obj.attr('name')
    obj.attr('tipType') || @.settings[name] and @.settings[name].tipType || @.form.attr('tipType') ||  @.settings.tipType || 1

  ### type  表示状态值 0 -> 成功   1 -> 空值信息  2 -> 错误信息 3-> 隐藏提示信息 ###
  Validate::showMsg = (obj,msg,type,tipType,submitTrigger)->
    obj = parseObj(obj,@) #选择第一个 因为有checkbox 及 radio
    _class = ''
    if +tipType is 4 #弹框显示
      if @.settings.checkSubmit
        @.settings.showAllError = false #如果只在检测结果时显示结果，那么只显示一个 TODO  需要处理成功时的弹框
        unless submitTrigger
          return @
      require.async 'layer',(layer)->
        layer.alert msg,
          'title': '表单校验提示'
          cont:
            class: msgClass[type]
      return @
    else if +tipType is 1
      msgPlace = obj
    else
      _class = @.getDisplay(obj,type,'icon') and 'validate-' + msgAttr[type] || ''
      if /^[23]$/.test tipType
        par = obj.parents('.form-item')
        msgPlace = par.find('.input-msg')
        unless msgPlace.length
          msgPlace = $('<span class="input-msg"/>').appendTo(par)
        if +tipType is 3  #3需要单独做处理  TODO 需要确定显示的位置
          parPostion = par.css('position')
      else
        msgPlace = $(tipType + ':eq(0)') #只显示在第一个匹配的位置
        tipName = msgPlace.data('tipName')  #此处需要判断 优先显示错误提示信息
        name = obj.attr('name')
        if /0|3/.test(type)
          msgPlace.data('tipName',null)
        else if /^1|2$/.test(type)
          if tipName is name
            return
          else
            msgPlace.data('tipName',name)
    parseTipClass(msgPlace,type)
    +tipType isnt 1 and msgPlace.html(msg).addClass(_class)
    if @.settings.checkSubmit and !submitTrigger
      msgPlace.css 'visibility','hidden'
    else
      msgPlace.css 'visibility','visible'
    return @

  ###检测 submitTrigger表示提交时触发检测###
  Validate::check = (obj,submitTrigger)->
    self = @
    type = obj.attr('type')
    if /button|rest|submit|file/.test type
      return true
    #先获取值
    val = self.getVal(obj,if obj.is(':password') then false else true)
    ###有ignore标识 值未变化 设置不检测hidden的不用检测 TODO 需要对ignore可以进行配置 ###
    if obj.attr('ignore') is 'ignore' and !val or submitTrigger and obj.attr('pass') is 'passed' or !submitTrigger and obj.data('lastVal') is val or obj.is(':hidden') and self.settings.ignoreHidden
      self.settings.debug and console.log obj.attr('name') + ' 通过检测;timestamp:' + Date.now()
      return true
    name = obj.attr('name')
    ###用户自定义检测函数,并且返回检测结果###
    if self.settings[name] and $.isFunction self.settings[name]['check']
      result = self.settings[name]['check'](val,obj,buildRule,submitTrigger,self) # result.pass = true | false result.alias = ''
      val = self.getVal(obj,if obj.is(':password') then false else true) #可能会对val进行一些操作
      try
        result.passed
      catch
        result =
          passed: result
          alias: ''
    else
      if !val or obj.is('select') and +val is -1
        result =
          passed: false
      else
        reg = self.getReg(obj)
        result = check(reg,val,obj,submitTrigger,self)  #工具函数检测
    type = if result.passed then 0 else if !val or obj.is('select') and +val is -1 then 1 else 2
    self.pass(obj,type)
    obj.data('lastVal',val)
    if obj.attr('ajaxurl') and !type  #ajax验证结果不在此处显示 TODO  此处需要修正
      return true
    tipType = self.getTipType(obj)
    if self.getDisplay(obj,type,'msg')
      msg = self.getMsg(obj,type,result.alias,tipType)
    else
      msg = ''
    self.showMsg(obj,msg,type,tipType,submitTrigger)
    return if /1|2/.test(type) and !self.settings.showAllError then false else true

    ###if type is 2 and _r = obj.attr('rcheck')
      _msgPrefix = obj.attr('rcheckLabel') ||  self.getLabel($('input[name="' + _r + '"]'))
      msg = _msgPrefix + '输入不一致'
    else if type is 2 or (type is 1 and (obj.attr('showNull') || self.settings.showNull)) or (!type and (obj.attr('showSucc') or self.settings.showSucc))
      msg = self.getMsg(obj,type,result.alias,tipType)
    else if !type and !(obj.attr('showSucc') or self.settings.showSucc)
      msg = ' '
    msg isnt undefined and self.showMsg(obj,msg,type,tipType,submitTrigger)
    if /1|2/.test(type) and !self.settings.showAllError then return false else return true###

  ###自动生成提示信息头###
  Validate::getLabel = (obj)->
    obj = parseObj(obj,@)
    label = obj.attr('label')
    unless label
      _label = obj.parents('.form-item').find(@.settings.label)
      label = (_label.text() || '').replace(/^\s*\**|[:：]\s*$/g,'')
    label



  Validate::getDisplay = (obj,testType,type)->
    obj = parseObj(obj,@)
    _icon = 'show' + msgAttr[testType] + type
    result = @.settings[type + 's'][testType]
    if obj.attr(_icon) isnt undefined
      result = obj.attr(_icon)
    else if @.settings.name and $.isPlainObject(@.settings.name)
      result = @.settings.name[_icon]
    result is 'false' and result = false
    result

  ###提交表单准备工作###
  Validate::submitForm = ->
    self = @
    if self.status is 'posting' or self.settings.postOnce and self.status is 'posted'
      return false
    else if self.ajaxValidate
      ###标识正在ajax验证###
      queue.push('submit')
      return false
    else if self.settings.ignoreValidate
      return submit(self)
    ###逐个用check方法检测，便于随时停止检测###
    $('[check]',self.form).each ->
      self.check($(@),true)
    unless $("[pass='noPass']",self.form).length
      submit(self)
    else
      return false

  Validate::resetForm = ->
    self = @
    self.form[0].reset()
    $('[pass]').attr('pass',null)
    $('[check]').each ->
      that = $(@)
      that.data('lastVal',null)
      tipType = self.getTipType(that)
      self.showMsg(that,'',3,tipType,false)
    self
  ###检测结果存储###
  Validate::pass = (obj,status)->
    obj.attr('pass',pass[status] || 'noPass')
    @

  Validate::destroy = ->
    self = @
    self.resetForm()
    self.off('click.validate')
    self.off(self.settings.trigger + '.validate')
    self.off('submit')
    self.form = null
    self = null

  ###解析jquery对象###
  parseObj = (obj,_v)->
    if obj.jquery  and (obj.is(':radio') or obj.is(':checkbox'))
        obj = obj.attr('name')
    if obj.jquery then obj else $('[name="' + obj + '"]',_v.form)

  ###解析规则，若规则是一个字符串，组合成数组或字符串，若是一个数组，对象 不作处理，若是一个函数 正则，不作处理，并将别名置空###
  parseReg = (reg,_v)->
    r1 = /\/.+?\/[mgi]*(?=(,|$|\||\s))|[\w\*-]+/g #多规则
    if typeof reg is 'string'
      alias = reg.match r1
      if alias
        _alias = parseAlias(alias[0])
        if alias.length is 1 and _alias
          return _alias
        else if alias.length > 1
          sepor = reg.replace(r1,'').replace(/\s*/g,'').split('')
          result = []
          m = 0
          result[0] = []
          if _alias
            result[0].push(_alias)
          n = 0
          while n < sepor.length
            if sepor[n] is '|'
              m++
              result[m] = []
            _alias = parseAlias(alias[n+1])
            if _alias
              result[m].push _alias
              _alias = null
            n++
          return result
    else #/Object|RegExp|Function|Array/.test Object::toString.call(alias)
      return reg

  ###解析别名,若是字符串，则先判断是否为正则，若是，不做处理，若不是，解析成别名，并判断是否存在规则详情，不存在，直接清除，若是正则或函数，不做任何处理，其余类型，直接删除###
  parseAlias = (alias)->
    r2 = /RegExp|Function/
    r3 = /\/.+\//g
    return alias if r2.test(Object::toString.call(alias)) or r3.test(alias)  or typeof alias is 'string' and buildRule[alias]

  ###将索引解析成函数或者正则,返回规则别名，规则详情###
  parseRule = (reg,obj,_v)->
    r2 = /RegExp|Function/
    r3 = /\/.+\//g
    rule = {}
    if r2.test(Object::toString.call(reg))
      rule =
        alias: ''
        reg: reg
    else if r3.test(reg)
      regstr = reg.match(r3)[0].slice(1,-1)
      param = reg.replace(r3,'')
      rule =
        alias: ''
        reg : RegExp regstr,param
    else if typeof reg is 'string'
      name = obj.attr('name')
      rule =
        alias: reg
        reg : _v.settings[name] and _v.settings[name].rule and _v.settings[name].rule[reg] || buildRule[reg] and buildRule[reg][0]
    else
      rule = null
    rule

  parseTipClass = (obj,type)->
    oldClassName = obj.attr('class') || ''
    if rClass.test(oldClassName) or type < 3
      newClassName = $.trim(oldClassName.replace rClass,'') + ' ' + msgClass[type]
      obj.attr('class',newClassName)
    obj

  ###解析消息  将基本的占位符替换###
  parseMsg = (msg,obj,_v)->
    reg = /\{\{(\w+?)\}\}/g
    obj = parseObj(obj,_v)
    if reg.test(msg)
      msg = msg.replace reg,(a,b)->
        if b is 'label'
          return _v.getLabel(obj)
        else if b is 'again'  #输两次兼容
          return if obj.attr('rcheck') then '再次' else ''
        else if b is 'verb'  #分输入框和选择框
          if obj.is(':text') or obj.is('textarea') or obj.is(':password') then '输入' else '选择'
        else
          obj.attr(b)
    msg


  ###单个检测函数,引入的检测是规则别名，需要进行处理成规则详情###
  _check = (alias,val,obj,submitTrigger,_v)->
    if obj.attr('ajaxurl')
      if _v.ajax  #正在提交数据时变更远程验证值，打断远程值
        _v.ajax.abort()
        if _v.status is 'posting'  #正在提交过程中修改远程验证值，需要把提交事件加到队列中
          _v.changeStatus(0)  #此处需要更改当前表单状态
          queue.push('submit')
    if $.isPlainObject(alias)
      rule = alias
    else
      rule = parseRule(alias,obj,_v)
    if rule
      if $.isFunction rule.reg
        passed = rule.reg(val,obj,_v)
      else if Object::toString.call(rule.reg) is '[object RegExp]'
        passed = rule.reg.test(val)
      _v.settings.debug and console[logFn[+passed]] obj.attr('name') + ': 检测规则别名为：' + rule.alias + ';timestamp:' + Date.now()
      passed: passed
      alias: rule.alias

  ###检测函数###
  check = (reg,val,obj,submitTrigger,_v)->
    alias = parseReg(reg)
    if $.isArray(alias)
      eithor = 0
      while eithor < alias.length
        dtp = 0
        while dtp < alias[eithor].length
          checkResult = _check(alias[eithor][dtp],val,obj,submitTrigger,_v)
          break unless checkResult.passed
          dtp++
        break if checkResult.passed
        eithor++
    else if  $.isPlainObject(reg)
      $.each reg,(j,k)->
        rule =
          alias: j
          reg: k
        checkResult = _check(rule,val,obj,submitTrigger,_v)
        rule = null
        return false unless checkResult
    else
      checkResult = _check(alias,val,obj,submitTrigger,_v)
    if checkResult.passed
      checkResult.passed = enhanceCheck(obj,val,checkResult.alias,submitTrigger,_v)
    return checkResult

  ###加强检测 TODO 需要对fe进行检测###
  enhanceCheck = (obj,val,alias,submitTrigger,_v)->
    if name = obj.attr('rcheck')
      referVal = _v.getVal($('[name="' + name + '"]',_v.form))
      if referVal is val then return true else return false
    else if url = obj.attr('ajaxurl')  #ajax直接在这开始显示信息
      #如果在提交过程中进行了修改,需要中止当前提交数据
      tipType = _v.getTipType(obj)
      name = obj.attr('name')
      url = parseUrl(url,'t='+Math.random())
      data = {}
      data[name] = val
      if _v.settings[name] and $.isFunction(_v.settings[name].beforeRemoteCheck)  #组装远程调用数组
        data = _v.settings[name].beforeRemoteCheck(data,_v)
      _v.ajax = $.ajax(
        url: url
        data: data
        type: obj.attr('method') || _v.settings.ajaxType
        beforeSend: ->
          _v.ajaxValidate = true
          #tipType = if +tipType is 1 then 2 else tipType  不需要实时显示检测状态
          #self.showMsg(obj,'检测中……',1,tipType,submitTrigger)
      ).done (json)->
        data = $.parseJSON(json)
        ###未通过的由服务器做出判断###
        type = if data.status then 2 else 0
        _v.pass(obj,type)
        if _v.settings[name] and $.isFunction(_v.settings[name].remoteMsg)
          msg = _v.settings[name].remoteMsg(obj,type,_v)
        else
          msg = data.msg
        unless msg
          msg = _v.getMsg(obj,type,alias,tipType)
        _v.showMsg(obj,msg,type,tipType,submitTrigger)
        _v.ajaxValidate = null
        if queue.length #提交表单
          queue.shift()
          $(_v.settings.submit).trigger('click.validate')
      .error (xhr,textStatus,err)->
        if err is 'abort'  #abort
          return false
        _v.settings.errFn(xhr,textStatus,err,_v)
      .always ->
        _v.ajax = null
    else
      return true

  ###获取数据###
  getData = (_v)->
    unless _v.form
      return null
    if _v.form[0].tagName.toLocaleLowerCase() is 'form'
      data = _v.form.serializeArray()
    else
      data = _v.form.wrap('<form/>').parent('form').serializeArray()
      _v.form.unWrap()
    if $.isFunction _v.settings.parseData
      data = _v.settings.parseData(data,_v)
    data

  ###解析地址###
  parseUrl = (url,arg)->
    l1 = url.indexOf('?')
    l2 = url.indexOf('#')
    arg = if l1 > -1 then '&' else '?' + arg
    unless l2 > -1
      return url + arg
    else
      return url.substring(0,l2) + arg + url.substring(l2)

  ###提交数据  此处不管是否符合提交要求###
  submit = (_v)->
    if $.isFunction(_v.settings.beforeSubmit) and !_v.settings.beforeSubmit(_v)
      return false
    _v.changeStatus(1) #更改状态
    unless _v.settings.ajaxPost
      if !_v.form.attr('action') or _v.settings.forceUrl  #强制更改提交地址
        _v.form.attr('action',_v.settings.url || location.href)
        return true
    else
      unless _v.settings.url
        _v.settings.url = _v.form.attr('action') || location.href
      data = getData(_v)
      if _v.settings.debug
        console.info '表单数据全部通过检测，timestamp' + Date.now()
        console.table data
        return false
      ajaxType = _v.form.attr('method') || _v.settings.ajaxType
      _v.ajax = $.ajax
        url: _v.settings.url
        data:data
        type: ajaxType
        beforeSend: (xhr,config)->
          if _v.settings.showProgressIcon
            loading = $(_v.settings.showProgressIcon)
            unless loading.length
              loading = $('<div class="' + _v.settings.showProgressIcon.substring(1) + '"></div>').appendTo(_v.form)
            loading.show()
          if _v.settings.showProgressText
            _text = _v.form.find(_v.settings.showProgressText)
            _v._isSubmit = _text.is('input')
            unless _v._progressText
              _v._progressText =  _text[if _v._isSubmit then 'val' else 'text']()
            _text[if _v._isSubmit then 'val' else 'text'](_v._progressText + '中…').addClass('s-tip')
          return false if typeof _v.settings.beforeSend is 'function' and _v.settings.beforeSend(xhr,config,_v) is false
          return true
      .done (json,textStatus,xhr)->  #需要先清除进度标识，避免成功函数调用时，还存在进度图标
        _v.settings.showProgressIcon and $(_v.settings.showProgressIcon).hide()
        _v.settings.showProgressText and $(_v.settings.showProgressText)[if _v._isSubmit then 'val' else 'text'](_v._progressText).removeClass('s-tip')
        if  $.isFunction _v.settings.succFn
          _v.changeStatus(2).settings.succFn(json,textStatus,xhr,_v)
      .error (xhr,textStatus,err)->
        _v.settings.showProgressIcon and $(_v.settings.showProgressIcon).hide()
        _v.settings.showProgressText and $(_v.settings.showProgressText)[if _v._isSubmit then 'val' else 'text'](_v._progressText).removeClass('s-tip')
        if err is 'abort'  #abort自动处理掉
          return false
        _v.changeStatus(0) #abort不改变状态，需要通知ajax远程检测当前表单状态
        xhr.abort()
        if $.isFunction _v.settings.errFn
          _v.settings.errFn(xhr,textStatus,err,_v)
      .always ->
        _v.ajax = null

      return false

  $.fn.validate = (conf)->
    new Validate($(@),conf)




###* change log
  2014-09-11 新增表单项指定位置显示提示信息
  2014-09-15 为多个form表单实例化
  2014-11-17 去除多个表单实例化
###