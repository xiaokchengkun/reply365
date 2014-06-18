var Segment = require('node-segment').Segment;
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();

var text = "前德国足球运动员，司职前锋，因打法极具侵略性，加上天生一头金发，故绰号“金色轰炸机”。2本届世界杯美国队主教练";

console.log("切词：",segment.doSegment(text));

