var Segment = require('node-segment').Segment;
// 创建实例
var segment = new Segment();
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault();

var text = "他曾被邀请代言某食品广告；2、球场上他反应敏捷、但却经常失误；3、他曾上场比赛前常接受队友的亲吻";
console.log("切词：",segment.doSegment(text));

