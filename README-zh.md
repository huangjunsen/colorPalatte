# colorPalatte
============

这是一个可以创建一个调色板的 jquery 插件，显示效果类似软件 "painter" 的调色板。  
我是一个中国人，所以这个插件被用在了几个基于中文的项目中，如果你比较喜欢看英文，请看： [readme_in_en](README.md)  

### 依赖:  
jquery1.9+

### 浏览器支持:
* IE9+
* Firefox (最新)
* Safari (最新)
* Chrome (最新)
* Opera (最新)  
注意: Opera 浏览器并没有进行全面的测试，不过理论上是可以正常运行此插件的。  

### 预览:
![](https://github.com/huangjunsen/colorPalatte/raw/master/Snapshot/01.jpg)

### 属性及默认值:
属性|默认值|值类型|描述
---|---|---|---
targetObj|''|jquery object|获取颜色/色值字符串后将赋予哪个对象， 默认为当前对象
resultFormat|'string'|null/tring|可选: [null/'string'/'background'/'color']  填充结果的方式，默认把颜色字符串赋值，选择background赋背景色，color赋前景色， null则不进行任何操作。
delay|300|int(ms)|显示/隐藏时的淡入/淡出效果延时时间，单位毫秒。
closeBtn|true|bool|是否显示关闭按钮。
showMethod|'slide'|string|optional:['slide'/'fade']  显示/隐藏方式。
confirm|null|function|可以用户自定义点击确认按钮后的回调函数。

### 方法:
只有在 colorPalatte 对象初始化之后才可以调用方法。  
初始化方式:
var Palette = $('Selector').colorPalatte();  

* getColor:  
获取当前颜色值   
eg:  
Palette.colorPalatte('getColor');
* setColor:  
设置当前颜色值  
第二个参数可以是：16进制颜色字符串/rgb(r,g,b)字符串/rgba(r,g,b,a)字符串  
eg:  
Palette.colorPalatte('setColor', '#0F0');

### 版本 & wiki:
日期|版本|描述
---|---|---
2016-05-18|V1.0|原始版本建立。
