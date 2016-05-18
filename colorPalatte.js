/**
* colorPalatte.V1.0.js
* 本插件用于生成调色板并选取颜色，依赖 jquery1.9+
* Author: sam
* CreateDate: 2016-05-13
* Github: https://github.com/huangjunsen/colorPalatte
*/
;(function ($, window, document, undefined) {
    'use strict';
    // 要注册成为的 jq 插件名称
    var pluginName = 'colorPalatte';

    // 可调用的方法列表
    var MethodDict = {
        getColor: function(userObj, opts){
            return opts.color;
        },
        setColor: function(userObj, opts, userOpts){
            return opts._resetSelector(opts.ctx, opts.ringObj, opts.palatteObj, opts.sliderObj, userOpts);
        },
    };

    // 错误信息输出
    var logError = function(msg, res){
        console.error(msg);
        return res || false;
    };

    $.fn[pluginName] = function (method, userOptions) {
        // 全局变量
        var userObj = this;      // 用户自定义的对象，点击该对象就会出现调色板
        var gobalOpts = {};
        
        if(typeof method === "string") {
            // 传入为字符串，则使用方法列表中的方法
            var _this = $.data(this, pluginName);
            if (!_this) {
                return logError(pluginName+' was not initialized, can not call method: ' + method, undefined);
            };
            if (!$.isFunction(MethodDict[method]) || method.charAt(0) === '_') {
                return logError('No such method: ' + method, undefined);
            };
            return MethodDict[method](userObj, _this, userOptions);
        }else{
            // 否则，则传入的是一系列的参数，初始化参数并进行表格的初始化
            userOptions = method;
            var contanerObj,             // 调色板容器
                palatteObj,              // 画布对象
                ringSelectorObj,         // 色环选择器对象
                palatteSelectorObj,      // 色块选择器对象
                sliderSelectorObj,       // 透明度选择器对象
                colorResultObj,          // 色彩文本框对象
                colorConfirmObj,         // 确认按钮对象
                closeObj,                // 关闭按钮对象
                positionDict,            // 当前选中的三个位置属性 {ringPos:{x,y}, palattePos:{x,y}, sliderPos:{x,y}}
                ringDownFlag=false,      // 色环选择器按下标识
                palatteDownFlag=false,   // 色块选择器按下标识
                sliderDownFlag=false,    // 透明度选择器按下标识
                palatteCTX,              // 画布上下文
                options,                 // 可设置属性
                opt = {                  // 画布属性
                    width: 201,                         // 画布宽
                    height: 240,                        // 画布高
                    center: {x: 100, y: 100},           // 色环圆心坐标
                    radius: {outter: 99, inner:85},     // 色环外径、内径
                    wearProof: 0.5,                     // 色环细腻度(>0,越小越细腻)
                    DefaultColor: '#FF0000',            // 默认显示颜色
                    palattePos: {x: 50, y: 50},         // 方形灰度选择块左顶点坐标
                    palatteSize: {w: 100, h: 100},      // 方形灰度选择块宽高
                    sliderPos: {x: 60, y: 210},         // 透明度滑动条左顶点坐标
                    sliderSize: {w: 140, h: 20},        // 透明度滑动条宽高
                    previewPos: {x: 1, y: 210},         // 预览左顶点坐标
                    previewSize: {w: 50, h: 20},        // 预览宽高
                    ringSelectorSize: 8,                // 色环选择器宽高
                    palatteSelectorSize: 4,             // 色环选择器宽高
                    sliderSelectorSize: {w: 4, h: 18},  // 透明度选择器宽高
                },
            /**
            * 处理字符串类型的色彩，转化为 {R:#,G:#,B:#}
            * @params: baseColor string 十六进制色彩字符串
            * @returs: {R:#,G:#,B:#} dict #为对应的十进制数值
            */
            _colorStringToRGB = function(baseColor){
                var oriColor = baseColor;
                if( typeof baseColor === 'string' && baseColor.charAt(0) === '#' ){
                    // 形如 #FF0000 的色彩字符串
                    baseColor = baseColor.replace('#','');
                    if(baseColor.length != 3 && baseColor.length != 6){
                        console.error('Error HEX color string: '+oriColor);
                        return null;
                    };
                    if(baseColor.length == 3){
                        var tmpArr = baseColor.split('');
                        baseColor = '';
                        for (var i = 0; i < tmpArr.length; i++) {
                            baseColor += tmpArr[i]+tmpArr[i];
                        };
                    };
                    baseColor = {
                        R: parseInt(baseColor.slice(0,2), 16),
                        G: parseInt(baseColor.slice(2,4), 16),
                        B: parseInt(baseColor.slice(4,6), 16),
                    };
                }else if( typeof baseColor === 'string' && baseColor.slice(0, 3).toLowerCase() === 'rgb' ){
                    // 形如 rgb() / rgba()
                    var matchArr = baseColor.match(/rgba?\( *(\d+) *, *(\d+) *, *(\d+) *(?:, *(1|0\.\d+) *)?\)/i);
                    if(!matchArr)
                        return null;
                    baseColor = {
                        R: matchArr[1]*1,
                        G: matchArr[2]*1,
                        B: matchArr[3]*1,
                    };
                    if(matchArr[4] !== undefined)
                        baseColor.A = matchArr[4]*1;
                };
                return baseColor;
            },
            /**
            * 处理{R:#,G:#,B:#}，转化为字符串类型的色彩
            * @params: {R:#,G:#,B:#} dict #为对应的十进制数值
            * @returs: Color string 十六进制色彩字符串
            */
            _RGBToColorString = function(rgb){
                if( typeof rgb === 'object' && rgb.R !== undefined ){
                    var r, g, b, colorString;
                    // 形如 {R:#,G:#,B:#}
                    r = (rgb.R).toString(16);
                    r < 16 && (r = '0' + r);
                    g = rgb.G.toString(16);
                    g < 16 && (g = '0' + g);
                    b = rgb.B.toString(16);
                    b < 16 && (b = '0' + b);
                    colorString = '#' + r + g + b;
                    return colorString;
                };
                return rgb;
            },
            /**
            * 处理{R:#,G:#,B:#}/colorString，转化为 {H:#,S:#,V:#} 色彩值
            * @params: rgb dict/string
            * @returs: {H:#,S:#,V:#} dict
            */
            _RGBToHSV = function(rgb){
                var color
                if(typeof rgb == 'string' && rgb.charAt(0) == '#')
                    color = _colorStringToRGB(rgb);
                else if(typeof rgb === 'object' && rgb.R !== undefined)
                    color = rgb;
                else
                    return undefined;

                var r = color.R, g = color.G, b = color.B;
                var max = r>g?(r>b?r:b):(g>b?g:b),
                    min = r<g?(r<b?r:b):(g<b?g:b),
                    h, s, v;
                // rgb --> hsv(hsb)
                if(max == min){
                    h = 0;    // 定义里面应该是undefined的，不过为了简化运算，还是赋予0算了。
                }else if(max == r){
                    h = 60*(g-b)/(max-min);
                    if(g<b)
                        h += 360;
                }else if(max == g){
                    h = 60*(b-r)/(max-min)+120;
                }else if(max == b){
                    h = 60*(r-g)/(max-min)+240;
                };
                if( max == 0)
                    s = 0;
                else
                    s = (max - min)/max;
                v = max;
                return {H: h,S: s,V: v};
            },
            /**
            * 兼容各种浏览器的，获取鼠标在容器中的位置
            * @params: ev event windows 事件
            * @returs: {x:#,y:#}
            */
            _mousePosition = function(ev){
                var palattePos = _domPosition(palatteObj[0]); // 画布的位置（相对于body）
                if(!ev) ev=window.event;
                if(ev.pageX || ev.pageY){
                    return {
                        x: ev.pageX - palattePos.left,
                        y: ev.pageY - palattePos.top
                    };
                };
                return {
                    x: ev.clientX + document.documentElement.scrollLeft - document.body.clientLeft - palattePos.left,
                    y: ev.clientY + document.documentElement.scrollTop  - document.body.clientTop - palattePos.top
                };
            },
            /**
            * 兼容各种浏览器的，获取dom的坐标
            * @params: dom HTMLDOM
            * @returs: {top:#,left:#}
            */
            _domPosition = function(dom){
                var t = dom.offsetTop;
                var l = dom.offsetLeft;
                dom=dom.offsetParent;
                while (dom) {
                    t += dom.offsetTop;
                    l += dom.offsetLeft;
                    dom=dom.offsetParent;
                };
                return {top: t, left: l};
            },
            /**
            * 计算两点间的距离
            * @params: pos1 dict {x:#,y:#} 点1的位置
            * @params: pos2 dict {x:#,y:#} 点2的位置
            * @returs: length float
            */
            _poiontLength = function(pos1, pos2){
                return Math.sqrt((pos2.x-pos1.x)*(pos2.x-pos1.x)+(pos2.y-pos1.y)*(pos2.y-pos1.y))
            },
            /**
            * 产生色环
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: x float 圆心 x 坐标
            * @params: y float 圆心 y 坐标
            * @params: outterRadius float 圆的外径
            * @params: innerRadius float 圆的内径
            * @params: wearProof float 细腻度(>0,越小越细腻)
            * @returs: false
            */
            _colorRing = function(ctx, x, y, outterRadius, innerRadius, wearProof){
                for (var i = outterRadius; i >= innerRadius; i-=wearProof) {
                    var r=255,g=0,b=0,flag=1;    // rgb 对应红绿蓝三色的数值， flag 指色彩渐变过程序号
                    for (var j = 0; j < Math.PI*2; j+=Math.PI/720) {
                        ctx.strokeStyle = 'rgb('+r+','+g+','+b+')';
                        ctx.beginPath();
                        ctx.arc(x,y,i,j,j+Math.PI/720,false);
                        ctx.stroke();
                        // 变化规则
                        switch(flag){
                            case 1:
                                if(g>=255){g=255;r=254;flag=2;break;};
                                g++;break;
                            case 2:
                                if(r<=0){r=0;b=1;flag=3;break;};
                                r--;break;
                            case 3:
                                if(b>=255){b=255;g=254;flag=4;break;};
                                b++;break;
                            case 4:
                                if(g<=0){g=0;r=1;flag=5;break;};
                                g--;break;
                            case 5:
                                if(r>=255){r=255;b=254;flag=6;break;};
                                r++;break;
                            case 6:
                                if(b<=0){flag=null;break;};
                                b--;break;
                            default:break;
                        };
                    };
                };
                return false;
            },
            /**
            * 产生中间方形灰度选择块
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: x float 左上顶点 x 坐标
            * @params: y float 左上顶点 y 坐标
            * @params: w float 色块的宽
            * @params: h float 色块的高
            * @params: baseColor string/dict 定义基准色(右上角的色彩)，接受一个色彩字符串或者含有 R/G/B 元素的字典
            * @returs: false
            */
            _colorPalatte = function(ctx, x, y, w, h, baseColor){
                // 先清除原有的内容
                ctx.clearRect(x-1, y-1, w+2, h+2);
                // 画图
                var r,g,b;
                var unitI = h/255;
                baseColor = _colorStringToRGB(baseColor);    // 处理字符串类型的色彩，转化为 {R:#,G:#,B:#}
                if(!baseColor)
                    return false;
                for (var i = 0; i < h; i+=unitI) {
                    var lg6 = ctx.createLinearGradient(x,y,x+w,y);
                    r=g=b=Math.floor(255-i*255/h);    // 左侧边缘色彩
                    lg6.addColorStop(0,'rgb('+r+','+g+','+b+')');
                    r=baseColor.R-i*255/h;        // 右侧边缘色彩
                    g=baseColor.G-i*255/h;        // 因为i被等分了，
                    b=baseColor.B-i*255/h;        // 所以需要反转单位
                    r=r<0?0:r>255?255:r;g=g<0?0:g>255?255:g;b=b<0?0:b>255?255:b;    // 保证不能小于0，不能大于 255
                    r=Math.floor(r);g=Math.floor(g);b=Math.floor(b);    //rgb 函数只接受整数
                    lg6.addColorStop(1,'rgb('+r+','+g+','+b+')');
                    ctx.strokeStyle = lg6;
                    ctx.beginPath();
                    ctx.moveTo(x,y+i);
                    ctx.lineTo(x+w,y+i);
                    ctx.stroke();
                };
                return false;
            },
            /**
            * 产生透明度滑动条
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: x float 左上顶点 x 坐标
            * @params: y float 左上顶点 y 坐标
            * @params: w float 滑动条的宽
            * @params: h float 滑动条的高
            * @params: baseColor string/dict 定义基准色(右侧的色彩)，接受一个色彩字符串或者含有 R/G/B 元素的字典
            * @returs: false
            */
            _colorSlider = function(ctx, x, y, w, h, baseColor){
                baseColor = _colorStringToRGB(baseColor);    // 处理字符串类型的色彩，转化为 {R:#,G:#,B:#}
                if(!baseColor)
                    return false;
                // 先清除原有的内容
                ctx.clearRect(x-1, y-1, w+2, h+2);
                // 画背景透明方格
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                var _halfH = Math.floor(h/2),_gridCnt = Math.floor(w/_halfH);
                for (var i = 0; i < _gridCnt; i+=2) {
                    if( (x+i*_halfH) < (x+w) )
                        ctx.fillRect(x+i*_halfH,y,_halfH,_halfH);
                    if( (x+(i+1)*_halfH) < (x+w) )
                        ctx.fillRect(x+(i+1)*_halfH,y+_halfH,_halfH,_halfH);
                };
                // 产生透明条
                var lg6 = ctx.createLinearGradient(x,y,w,y);
                lg6.addColorStop(0,'rgba('+baseColor.R+','+baseColor.G+','+baseColor.B+',0)');
                lg6.addColorStop(1,'rgba('+baseColor.R+','+baseColor.G+','+baseColor.B+',1)');
                ctx.fillStyle = lg6;
                ctx.strokeStyle = '#000000';
                ctx.fillRect(x,y,w,h);
                ctx.strokeRect(x,y,w,h);
                return false;
            },
            /**
            * 产生预览
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: x float 左上顶点 x 坐标
            * @params: y float 左上顶点 y 坐标
            * @params: w float 预览的宽
            * @params: h float 预览的高
            * @params: currentColor string/dict 定义当前颜色，接受一个色彩字符串或者含有 R/G/B/A 元素的字典
            * @params: newColor string/dict 定义新选择的颜色，接受一个色彩字符串或者含有 R/G/B/A 元素的字典
            * @returs: false
            */
            _colorPreview = function(ctx, x, y, w, h, currentColor, newColor){
                // 如果没有传入 newColor ，则认为其实是没有传入 currentColor
                if( !newColor ){
                    newColor = currentColor;
                    currentColor = undefined;
                };

                // 产生预览（当前颜色）
                if( currentColor ){
                    ctx.clearRect(x,y,w/2,h);
                    // 画背景透明方格
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(x,y,w/4,h/2);
                    ctx.fillRect(x+w/4,y+h/2,w/4,h/2);
                    currentColor = _colorStringToRGB(currentColor);    // 处理字符串类型的色彩
                    ctx.fillStyle = 'rgba('+currentColor.R+','+currentColor.G+','+currentColor.B+','+(currentColor.A?currentColor.A:1)+')';
                    ctx.fillRect(x,y,w/2,h);
                };
                
                // 产生预览（新颜色）
                if( newColor ){
                    ctx.clearRect(x+w/2,y,w/2,h);
                    // 画背景透明方格
                    ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    ctx.fillRect(x+w/2,y,w/4,h/2);
                    ctx.fillRect(x+w*3/4,y+h/2,w/4,h/2);
                    newColor = _colorStringToRGB(newColor);    // 处理字符串类型的色彩，转化为 {R:#,G:#,B:#};
                    if(!newColor)
                        return false;
                    ctx.fillStyle = 'rgba('+newColor.R+','+newColor.G+','+newColor.B+','+(newColor.A!==undefined?newColor.A:1)+')';
                    ctx.fillRect(x+w/2,y,w/2,h);
                };

                // 边框
                ctx.strokeStyle = '#000000';
                ctx.strokeRect(x,y,w,h);
                return false;
            },
            /**
            * 重置颜色
            * 进行了任意一项设置之后，需要进行颜色重置
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: posDict dict {ringPos:{x,y}, palattePos:{x,y}, sliderPos:{x,y}} 均是相对于画布左上角的绝对坐标
            * @returs: newColor
            */
            _resetColor = function(ctx, posDict){
                if( !posDict.ringPos || !posDict.palattePos || !posDict.sliderPos )
                    return false;

                var newColor, x, y, w, h;
                // 计算色相环的值
                x = posDict.ringPos.x; y = posDict.ringPos.y;
                var b = x - opt.center.x, a = y - opt.center.y,
                    alpha, r, g, b;
                if(b === 0)
                    alpha = Math.PI/2;
                else
                    alpha = Math.abs(Math.atan(a/b));
                if(a>=0 && b>0 && alpha<=Math.PI/3){
                    r = 255;
                    g = alpha*255*3/Math.PI;
                    b = 0;
                }else if(a>0 && b>=0 && Math.PI/3<alpha){
                    r = 255*2 - alpha*255*3/Math.PI;
                    g = 255;
                    b = 0;
                }else if(a>0 && b<0 && Math.PI/3<alpha){
                    r = alpha*255*3/Math.PI - 255;
                    g = 255;
                    b = 0;
                }else if(a>=0 && b<0 && alpha<=Math.PI/3){
                    r = 0;
                    g = 255;
                    b = 255 - alpha*255*3/Math.PI;
                }else if(a<0 && b<0 && alpha<=Math.PI/3){
                    r = 0;
                    g = 255 - alpha*255*3/Math.PI;
                    b = 255;
                }else if(a<0 && b<0 && Math.PI/3<alpha){
                    r = alpha*255*3/Math.PI - 255;
                    g = 0;
                    b = 255;
                }else if(a<0 && b>=0 && Math.PI/3<alpha){
                    r = 255*2 - alpha*255*3/Math.PI;
                    g = 0;
                    b = 255;
                }else if(a<0 && b>0 && alpha<=Math.PI/3){
                    r = 255;
                    g = 0;
                    b = alpha*255*3/Math.PI;
                }
                r=Math.floor(r);g=Math.floor(g);b=Math.floor(b);
                newColor = {
                    R: r,
                    G: g,
                    B: b
                };
                // 重置方形色块
                _colorPalatte(ctx, opt.palattePos.x, opt.palattePos.y, opt.palatteSize.w, opt.palatteSize.h, newColor);
                
                // 计算方形色块色值
                x = posDict.palattePos.x - opt.palattePos.x; y = posDict.palattePos.y - opt.palattePos.y;
                w = opt.palatteSize.w; h = opt.palatteSize.h;
                // 计算右侧终点色值(newColor的y偏移)，此处的计算规则请参考 _colorPalatte
                r = newColor.R-y*255/h;
                g = newColor.G-y*255/h;
                b = newColor.B-y*255/h;
                r=r<0?0:r>255?255:r;g=g<0?0:g>255?255:g;b=b<0?0:b>255?255:b;
                r=Math.floor(r);g=Math.floor(g);b=Math.floor(b);
                // 计算 x 偏移色值
                var l = Math.floor(255-y*255/h);    // 这个是左侧的起点色值(白色的y偏移)
                r = l-(l-r)*x/w;
                g = l-(l-g)*x/w;
                b = l-(l-b)*x/w;
                r=Math.floor(r);g=Math.floor(g);b=Math.floor(b);
                newColor = {R: r, G: g, B: b};

                // 计算透明度
                x = posDict.sliderPos.x - opt.sliderPos.x;
                w = opt.sliderSize.w - opt.sliderSelectorSize.w/2 - 1;
                var a = (x/w).toFixed(2);
                a >= 0.99 && (a = 1);
                a <= 0.01 && (a = 0);
                if( a<1 )
                    newColor.A = a;

                // 生成预览颜色
                _colorPreview(ctx, opt.previewPos.x, opt.previewPos.y, opt.previewSize.w, opt.previewSize.h, newColor)
                // 生成透明度滑动条
                _colorSlider(ctx, opt.sliderPos.x, opt.sliderPos.y, opt.sliderSize.w, opt.sliderSize.h, newColor);
                return newColor;
            },
            /**
            * 重置所有选择器
            * @params: ringObj object ringSelector 对象
            * @params: palatteObj object ringSelector 对象
            * @params: sliderObj object ringSelector 对象
            * @params: color dict/string
            * @returs: false
            */
            _resetSelector = function(ctx, ringObj, palatteObj, sliderObj, color){
                // 转换成 HSV 色值
                var HSV = _RGBToHSV(color), x, y, posDict = positionDict;
                // 设置色相环选点位置
                var _halfR = (opt.radius.inner+opt.radius.outter)/2, _halfS = opt.ringSelectorSize/2 + 1;
                x = opt.center.x + _halfR*Math.cos(HSV.H*Math.PI/180);
                y = opt.center.y + _halfR*Math.sin(HSV.H*Math.PI/180);
                posDict.ringPos = {x: x, y: y};
                x -= _halfS; y -= _halfS;
                ringObj.css({left: x, top: y});
                // 设置饱和度/明度位置
                _halfS = opt.palatteSelectorSize/2 + 1;
                x = opt.palattePos.x + HSV.S*opt.palatteSize.w;
                y = opt.palattePos.y + (1-HSV.V/255)*opt.palatteSize.h;
                posDict.palattePos = {x: x, y: y};
                x -= _halfS; y -= _halfS;
                palatteObj.css({left: x, top: y});
                if( color.A !== undefined && color.A < 0.99 ){
                    x = opt.sliderPos.x + color.A*(opt.sliderSize.w - opt.sliderSelectorSize.w/2 - 1);
                    posDict.sliderPos = {x: x, y: 0};
                    sliderObj.css({left: x});
                };
                _resetColor(ctx, posDict);
                return false;
            },
            /**
            * 写入结果文本框
            * @params: color dict/string 颜色字符串
            * @returs: false
            */
            _writeColor = function(color){
                var colorString;
                if( color.A !== undefined ){
                    colorString = 'rgba('+color.R+','+color.G+','+color.B+','+color.A+')';
                }else{
                    colorString = _RGBToColorString(color).toUpperCase();
                };
                gobalOpts.color = colorString;    // 书写全局变量
                if( colorResultObj )
                    colorResultObj.val(colorString);
                return false;
            },
            /**
            * 移动 ringSelector
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: Obj object ringSelector 对象
            * @params: pos {x:#,y:#} 新的坐标
            * @returs: false
            */
            _moveRing = function(ctx, Obj, pos){
                var centerLength = _poiontLength(pos, opt.center);    // 鼠标位置距离圆心的距离
                // 需要计算距离最近的色环上的点的坐标
                // 采用平行线等比定理进行运算，同时需要减去 ringSelector 的 half size 和 1px border
                pos = {
                    x: (pos.x-opt.center.x)*((opt.radius.inner+opt.radius.outter)/2)/centerLength+opt.center.x-opt.ringSelectorSize/2-1,
                    y: (pos.y-opt.center.y)*((opt.radius.inner+opt.radius.outter)/2)/centerLength+opt.center.y-opt.ringSelectorSize/2-1,
                };
                Obj.css({
                    left: pos.x+'px',
                    top: pos.y+'px'
                });

                positionDict.ringPos = pos;
                var newColor = _resetColor(ctx, positionDict);
                _writeColor(newColor);
                return false;
            },
            /**
            * 移动 palatteSelector
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: Obj object palatteSelector 对象
            * @params: pos {x:#,y:#} 新的坐标
            * @returs: false
            */
            _movePalatte = function(ctx, Obj, pos){
                // 需要计算距离最近的色块上的点的坐标
                pos = {
                    x: pos.x<opt.palattePos.x ? opt.palattePos.x : pos.x>opt.palattePos.x+opt.palatteSize.w ? opt.palattePos.x+opt.palatteSize.w : pos.x,
                    y: pos.y<opt.palattePos.y ? opt.palattePos.y : pos.y>opt.palattePos.y+opt.palatteSize.h ? opt.palattePos.y+opt.palatteSize.h : pos.y,
                };

                // 未减去 palatteSelector 的 half size 前，先进行色彩重置
                positionDict.palattePos = {
                    x: pos.x,
                    y: pos.y,
                };
                var newColor = _resetColor(ctx, positionDict);
                _writeColor(newColor);

                // 同时需要减去 palatteSelector 的 half size 和 1px border
                pos = {
                    x: pos.x - opt.palatteSelectorSize/2 - 1,
                    y: pos.y - opt.palatteSelectorSize/2 - 1,
                };
                Obj.css({
                    left: pos.x+'px',
                    top: pos.y+'px'
                });
                return false;
            },
            /**
            * 移动 sliderSelector
            * @params: ctx canvas_context 已经初始化后的 canvas context
            * @params: Obj object sliderSelector 对象
            * @params: pos {x:#,y:#} 新的坐标
            * @returs: false
            */
            _moveSlider = function(ctx, Obj, pos){
                // 先减去 sliderSelector 的 half width 和 1px border
                pos = {
                    x: pos.x - opt.sliderSelectorSize.w/2 - 1,
                    y: opt.sliderPos.y
                };
                // 然后计算距离最近的滑动条上的点的 x 坐标
                pos.x = pos.x<opt.sliderPos.x ? opt.sliderPos.x : pos.x>opt.sliderPos.x+opt.sliderSize.w-opt.sliderSelectorSize.w ? opt.sliderPos.x+opt.sliderSize.w-opt.sliderSelectorSize.w-1 : pos.x-opt.sliderSelectorSize.w/2;
                Obj.css({
                    left: pos.x+'px',
                    top: pos.y+'px'
                });

                positionDict.sliderPos = {
                    x: pos.x,
                    y: 0,
                };
                var newColor = _resetColor(ctx, positionDict);
                _writeColor(newColor);
                return false;
            },
            /**
            * 绑定body事件
            */
            _bindGolbalEvent = function(){
                $('body').mousemove(function(e) {
                    if(ringDownFlag || palatteDownFlag || sliderDownFlag){
                        var mousePos = _mousePosition(e);
                        if(ringDownFlag){
                            // 色环选中ing
                            _moveRing(palatteCTX, ringSelectorObj, mousePos);
                        }else if(palatteDownFlag){
                            // 色块选中ing
                            _movePalatte(palatteCTX, palatteSelectorObj, mousePos);
                        }else if(sliderDownFlag){
                            // 滑动条选中ing
                            _moveSlider(palatteCTX, sliderSelectorObj, mousePos);
                        };
                    };
                }).mouseup(function(e) {
                    ringDownFlag=palatteDownFlag=sliderDownFlag=false;
                    _unbindGolbalEvent();
                });
            },
            /**
            * 解绑body事件
            */
            _unbindGolbalEvent = function(){
                $('body').unbind('mousemove').unbind('mouseup');
            };

            // main 执行期
            options = $.extend({}, $.fn[pluginName].defaults, userOptions);
            // 生成画布并初始化上下文
            var _HtmlStr = '<div name="colorPalatte" style="display:none;background:#D3D3D3;width:'+opt.width+'px;height:'+(opt.height+37)+'px;margin-top:5px;border-radius:5px;border:2px #333 solid;position:relative;cursor:crosshair;-webkit-user-select:none;-moz-user-select:none;">'
                + '<div name="ringSelector" style="border:1px solid #000;background:rgba(255,255,255,0.7);width:'+opt.ringSelectorSize+'px;height:'+opt.ringSelectorSize+'px;border-radius:'+opt.ringSelectorSize+'px;position:absolute;z-index:10;left:'+(opt.center.x+(opt.radius.outter+opt.radius.inner)/2-opt.ringSelectorSize/2-1)+'px;top:'+(opt.center.y-opt.ringSelectorSize/2-1)+'px;"></div>'
                + '<div name="palatteSelector" style="border:1px solid #000;background:rgba(255,255,255,0.7);width:'+opt.palatteSelectorSize+'px;height:'+opt.palatteSelectorSize+'px;border-radius:'+opt.palatteSelectorSize+'px;position:absolute;z-index:10;left:'+(opt.palattePos.x+opt.palatteSize.w-opt.palatteSelectorSize/2-1)+'px;top:'+(opt.palattePos.y-opt.palatteSelectorSize/2-1)+'px;"></div>'
                + '<div name="sliderSelector" style="border:1px solid #000;background:rgba(255,255,255,0.7);width:'+opt.sliderSelectorSize.w+'px;height:'+opt.sliderSelectorSize.h+'px;position:absolute;z-index:10;left:'+(opt.sliderPos.x+opt.sliderSize.w-opt.sliderSelectorSize.w-1)+'px;top:'+(opt.sliderPos.y)+'px;"></div>'
                + '<canvas width="'+opt.width+'px" height="'+opt.height+'px" style="position:absolute;z-index:5;left:0;top:0;"></canvas>'
                + '<input name="Result" type="text" style="line-height:1.42857143;padding:6px;color:#555;background:#FFF;border:1px solid #CCC;width:140px;position:absolute;z-index:5;left:0;top:'+opt.height+'px;" value="#FF0000"/>'
                + '<button name="confirm" type="button" style="line-height:1.42857143;padding:6px;color:#FFF;background:#337AB7;border:1px solid #CCC;position:absolute;z-index:5;left:160px;top:'+opt.height+'px;border-radius:5px;cursor:pointer;">确认</button>'
                // + opt.closeBtn?('<div name="close" type="button" style="color:#777;background:transparent;position:absolute;z-index:5;right:2px;top:2px;cursor:pointer;">&times;</div>'):''
                + '<div name="close" type="button" style="color:#777;background:transparent;position:absolute;z-index:5;right:2px;top:2px;cursor:pointer;">&times;</div>'
                + '</div>';
            
            userObj.after(_HtmlStr);
            contanerObj = userObj.next('div[name="colorPalatte"]');
            palatteObj = contanerObj.children('canvas');
            palatteCTX = palatteObj[0].getContext('2d');
            ringSelectorObj = contanerObj.children('div[name="ringSelector"]');
            palatteSelectorObj = contanerObj.children('div[name="palatteSelector"]');
            sliderSelectorObj = contanerObj.children('div[name="sliderSelector"]');
            colorResultObj = contanerObj.children('input[name="Result"]');
            colorConfirmObj = contanerObj.children('button[name="confirm"]');
            closeObj = contanerObj.children('div[name="close"]');
            gobalOpts.color = opt.DefaultColor;

            // 防止选中
            contanerObj[0].onselectstart = function(){return false;};
            contanerObj[0].oncontextmenu = function(){return false;};

            // 产生色环
            _colorRing(palatteCTX, opt.center.x, opt.center.y, opt.radius.outter, opt.radius.inner, opt.wearProof);
            // 产生中间方形灰度选择块
            _colorPalatte(palatteCTX, opt.palattePos.x, opt.palattePos.y, opt.palatteSize.w, opt.palatteSize.h, opt.DefaultColor);
            // 产生透明度滑动条
            _colorSlider(palatteCTX, opt.sliderPos.x, opt.sliderPos.y, opt.sliderSize.w, opt.sliderSize.h, opt.DefaultColor);
            // 产生预览
            _colorPreview(palatteCTX, opt.previewPos.x, opt.previewPos.y, opt.previewSize.w, opt.previewSize.h, opt.DefaultColor, opt.DefaultColor);
            // 定义初始化后的三个位置参数
            positionDict = {
                ringPos: {x: (opt.center.x+(opt.radius.outter+opt.radius.inner)/2), y: opt.center.y},
                palattePos: {x: opt.palattePos.x+opt.palatteSize.w, y: 0},
                sliderPos: {x: opt.sliderPos.x+opt.sliderSize.w-opt.sliderSelectorSize.w, y: 0},
            };
            // 根据 DefaultColor 重置颜色
            _resetSelector(palatteCTX, ringSelectorObj, palatteSelectorObj, sliderSelectorObj, opt.DefaultColor);

            // 绑定色环按下事件
            palatteObj.mousedown(function(e) {
                var mousePos = _mousePosition(e);     // 鼠标位置
                if(0<mousePos.x && mousePos.x<opt.radius.outter*2
                    && 0<mousePos.y && mousePos.y<opt.radius.outter*2){
                    // 点击色环/色块部分
                    var centerLength = _poiontLength(mousePos, opt.center);    // 点击的点距离圆心的距离
                    if( opt.radius.inner <= centerLength && centerLength <= opt.radius.outter ){
                        // 如果处于色环带，则激活 ringSelector 的移动策略
                        _moveRing(palatteCTX, ringSelectorObj, mousePos);
                        ringDownFlag = true;
                        _bindGolbalEvent();
                    }else if(opt.palattePos.x<mousePos.x && mousePos.x<opt.palattePos.x+opt.palatteSize.w
                        && opt.palattePos.y<mousePos.y && mousePos.y<opt.palattePos.y+opt.palatteSize.h){
                        // 点击色块部分，则激活 palatteSelector 的移动策略
                        _movePalatte(palatteCTX, palatteSelectorObj, mousePos);
                        palatteDownFlag = true;
                        _bindGolbalEvent();
                    };
                }else if(opt.sliderPos.x<mousePos.x && mousePos.x<opt.sliderPos.x+opt.sliderSize.w 
                    && opt.sliderPos.y<mousePos.y && mousePos.y<opt.sliderPos.y+opt.sliderSize.h ){
                    // 透明度滑动条部分
                    _moveSlider(palatteCTX, sliderSelectorObj, mousePos);
                    sliderDownFlag = true;
                    _bindGolbalEvent();
                };
            });
            ringSelectorObj.mousedown(function(e) {
                var mousePos = _mousePosition(e);     // 鼠标位置
                _moveRing(palatteCTX, $(this), mousePos);
                ringDownFlag = true;
                _bindGolbalEvent();
            });
            palatteSelectorObj.mousedown(function(e) {
                var mousePos = _mousePosition(e);     // 鼠标位置
                _movePalatte(palatteCTX, $(this), mousePos);
                palatteDownFlag = true;
                _bindGolbalEvent();
            });
            sliderSelectorObj.mousedown(function(e) {
                var mousePos = _mousePosition(e);     // 鼠标位置
                _moveSlider(palatteCTX, $(this), mousePos);
                sliderDownFlag = true;
                _bindGolbalEvent();
            });

            // 绑定输入框数据变化事件
            colorResultObj.on('input propertychange', function(event) {
                var thisVal = $(this).val(),
                    color;
                if( thisVal.charAt(0) == '#' && (thisVal.length == 4 || thisVal.length == 7) ){
                    color = thisVal;
                }else if(thisVal.slice(0, 3).toLowerCase() == 'rgb' && thisVal.charAt(thisVal.length-1)==')'){
                    color = _colorStringToRGB(thisVal);
                    if( !color )
                        return false;
                }else{
                    return false;
                };
                _resetSelector(palatteCTX, ringSelectorObj, palatteSelectorObj, sliderSelectorObj, color);
            });

            // 绑定用户对象点击事件
            userObj.click(function(event) {
                _colorPreview(palatteCTX, opt.previewPos.x, opt.previewPos.y, opt.previewSize.w, opt.previewSize.h, gobalOpts.color, gobalOpts.color)
                if(options.showMethod == 'slide')
                    contanerObj.slideDown(options.delay);
                else if(options.showMethod == 'fade')
                    contanerObj.fadeIn(options.delay);
            });
            colorConfirmObj.click(function(event) {
                var thisColor = colorResultObj.val();
                var tObj;
                // 检查颜色字符串是否符合规范
                if(thisColor && thisColor.charAt(0) == '#' && (thisColor.length == 4 || thisColor.length == 7)){
                    // 通过， 是十六进制字符串
                }else if(thisColor && thisColor.test(/rgba?\( *(\d+) *, *(\d+) *, *(\d+) *(?:, *(1|0\.\d+) *)?\)/i)){
                    // 通过， 是 rgb(a) 字符串
                }else{
                    return false;
                }
                gobalOpts.color = thisColor;    // 全局变量赋值
                // 检查是否有赋予目标
                if( !options.targetObj ){
                    tObj = userObj;
                }else if( options.targetObj.length ){
                    tObj = options.targetObj;
                }else{
                    return false;
                };
                // 根据 resultFormat 参数将结果赋予目标
                if( thisColor && options.resultFormat == 'string' ){
                    // 将颜色值文本赋予目标
                    if( ('|input|textarea|').indexOf(userObj[0].tagName.toLowerCase())>0 ){
                        tObj.val(thisColor);
                    }else if( ('|div|p|a|i|u|b|s|span|button|li|td|dl|dt|header|footer|nav|article|aside|').indexOf(userObj[0].tagName.toLowerCase())>0 ){
                        tObj.html(thisColor);
                    };
                }else if(thisColor && (options.resultFormat == 'background' || options.resultFormat == 'color')){
                    // 将色彩直接赋予目标
                    tObj.css(options.resultFormat, thisColor);
                };
                // 执行用户自定义回调函数
                if( options.confirm )
                    options.confirm();
                contanerObj.fadeOut(options.delay);
            });
            closeObj.click(function(event) {
                if(options.showMethod == 'slide')
                    contanerObj.slideUp(options.delay);
                else if(options.showMethod == 'fade')
                    contanerObj.fadeOut(options.delay);
            });

            // 传入私有函数
            gobalOpts.ctx = palatteCTX;
            gobalOpts.ringObj = ringSelectorObj;
            gobalOpts.palatteObj = palatteSelectorObj;
            gobalOpts.sliderObj = sliderSelectorObj;
            gobalOpts._resetSelector = _resetSelector;

            // 保存缓存数据
            $.data(this, pluginName, gobalOpts);
            return userObj;
        };
    };
    $.fn[pluginName].defaults = {
        targetObj: '',             // jq object, 获取颜色/色值字符串后将赋予哪个对象， 默认为当前对象
        resultFormat: 'string',    // string [null|'string'|'background'|'color'], 填充结果的方式，默认把颜色字符串赋值，选择background赋背景色，color赋前景色， null则不进行任何操作
        delay: 300,                // int(ms), 显示/隐藏时的淡入/淡出效果延时时间，单位毫秒
        closeBtn: true,            // bool, 是否显示关闭按钮
        showMethod: 'slide',       // string ['slide'|'fade'], 显示/隐藏方式
        confirm: null,             // function, 可以定义点击确认按钮后的回调函数
    };
}(window.jQuery));
