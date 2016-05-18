# colorPalatte
============

This is a jquery plugin which can create a color pallatte like "painter".  
Since I am a Chinese, so this plugin is write for some Chinese base project, If your are feel more comfortable reading in Chinese, try this: [中文文档](README-zh.md)  

### Base on:  
jquery1.9+

### Browner support:
* IE9+
* Firefox (latest)
* Safari (latest)
* Chrome (latest)
* Opera (latest)  
Note: Opera has not been test, but this plugin would work well theoretically.  

### Preview:
![](https://github.com/huangjunse/colorPalatte/raw/master/Snapshot/01.jpg)

### Options and default value:
option|default|type|Description
---|---|---|---
targetObj|''|jquery object|When confirm btn has been click, which target object will be given an color.
resultFormat|'string'|null/tring|optional: [null/'string'/'background'/'color']  Target assignment format, will assign color 'string' to target in default;  background: will assign target css with background;  color: will assign target css with color;  null will do nothing
delay|300|int(ms)|Show/hide time delay.
closeBtn|true|bool|Show the close button or not.
showMethod|'slide'|string|optional:['slide'/'fade']  Show/hide method
confirm|null|function|Call back function that you can defined yourself, this will be excute after confirm button has been click.

### Method:
Method can only be call after the plugin has been initialize.  
Way to initialize:
var Palette = $('Selector').colorPalatte();  

* getColor:  
Get current color.   
eg:  
Palette.colorPalatte('getColor');
* setColor:  
Set color to the color given.  
Mind that the second param can be a HEX color string / a rgb(r,g,b) string / a rgba(r,g,b,a) string.  
eg:  
Palette.colorPalatte('setColor', '#0F0');

### Version & wiki:
Date|version|Description
---|---|---
2016-05-18|V1.0|original version create.
