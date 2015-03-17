var crypto = require('crypto');

var debug = require('debug');
var log = debug('webot-example:log');
var verbose = debug('webot-example:verbose');
var error = debug('webot-example:error');

var _ = require('underscore')._;
var search = require('../lib/support').search;
var geo2loc = require('../lib/support').geo2loc;

var package_info = require('../package.json');
var meta = require("../lib/meta");
var hosts = "https://oj.leetcode.com" ;
var fs = require("fs");
var top = require("../lib/top");
var allfiles = fs.readdirSync(process.cwd()+"/data");
var tag = require("../lib/tag");
var tags = require("../lib/tags");
var appbase = "http://app.kuaibashi.com"

function tagconverter(tag){
  if(tag=="hashtable")return "Hash Table";
  if(tag=="dfs")return "Depth-first Search";
  if(tag=="bfs")return "Breadth-first Search";
  if(tag == "dp")return "Dynamic Programming";
  if(tag=="bit")return "Bit Manipulation";
  if(tag=="linkedlist")return "Linked List";
  var res = [];
  var arr = tag.split(" ");
  for(var i = 0;i<arr.length;i++){
    res.push(arr[i][0].toUpperCase()+arr[i].substring(1));
  }
  return res.join(" ")
}

function geturl(item){
  return appbase+"/problems/"+item["id"];
  //return hosts+item["url"]
}
/**
 * 初始化路由规则
 */
module.exports = exports = function(webot){
  var reg_help = /^(help|\?|h)$/i
  webot.set({
    // name 和 description 都不是必须的
    name: 'hello help',
    description: '获取使用帮助，发送 help',
    pattern: function(info) {
      //首次关注时,会收到subscribe event
      return info.is('event') && info.param.event === 'subscribe' || reg_help.test(info.text);
    },
    handler: function(info){
      var reply = {
        title: '感谢你关注leetcode公众账号',
        pic: 'https://raw.githubusercontent.com/aronica/webot-example/master/qrcode2.jpg',
        url: 'https://oj.leetcode.com',
        description: [
         '随时随地在手机上刷leetcode算法题',
         '帮助：',
         '[1].?,h,help返回此帮助',
         '[2].1,2,3,4...输入数字返回对于ID的题目',
         '[3].r,R 随机返回一道题目',
         '[4].top,Top返回热门列表',
         '[5].tag,Tag返回所有Tag',
         '[6].dp,string,hashtable,tree,math...返回指定标签下随机一道题'
        ].join('\n')
      };
      // 返回值如果是list，则回复图文消息列表
      return reply;
    }
  });

  // 更简单地设置一条规则
  webot.set(/^more$/i, function(info){
    var reply = _.chain(webot.gets()).filter(function(rule){
      return rule.description;
    }).map(function(rule){
      //console.log(rule.name)
      return '> ' + rule.description;
    }).join('\n').value();

    return ['我的主人还没教我太多东西,你可以考虑帮我加下.\n可用的指令:\n'+ reply,
      '没有更多啦！当前可用指令：\n' + reply];
  });

  webot.set("id",{
     description:"1,2,3,4...输入数字返回对于ID的题目",
     pattern:/^[0-9]*[1-9][0-9]*$/,
     handler:function(body){
        var info = body["text"];
        var data = meta[info];
        if (data && !data["ebook"]){
          var base = process.cwd();
           var content = fs.readFileSync(base+"/data/"+info+".txt","ascii");
           var reply = {title: info+"."+data["title"], description: content,
            pic: 'https://raw.githubusercontent.com/aronica/webot-example/master/qrcode2.jpg', url: geturl(data)};
           return reply;
        }else if(data&&data["ebook"]){
           return "问题"+info+"leetcode官方需要购买电子书才可以浏览";

        } else{
          return "沒有找到"+info+"对应的题目";
        }
     }
  });

  webot.set("top",{
    description:"返回leetcode热门Top10",
    pattern:/^top|Top/i,
    handler:function(){
        var content = [];
        for(var i = 0;i<top.length;i++){
          content.push(top[i]["id"]+". <a href='"+geturl(top[i])+"'>"+top[i]["title"]+"</a>");
        }
        content.push("带*的题目leetcode需要购买电子书才可以查看");
        return content.join("\n\n");
    }
  });

  webot.set("random",{
    description:"随机返回一道题",
    pattern:/^r\s*$|^random\s*$|^ran\s*$/i,
    handler:function(){
		var file =  allfiles[Math.floor(Math.random()*allfiles.length)];
        var data =meta[file.substring(0,file.indexOf("."))] ;
		var info = data["id"];
		if (data){
          var base = process.cwd();
           var content = fs.readFileSync(base+"/data/"+file,"ascii");
           var reply = {title: info+"."+data["title"], description: content,
            pic: 'https://raw.githubusercontent.com/aronica/webot-example/master/qrcode2.jpg', url:geturl(data)};
           return reply;
        } else{
          return "沒有找到"+info+"对应的题目或者该题需要购买leetcode电子书才可以浏览";
        }
    }
  });

  webot.set("tag",{
    description:"返回所有Tag列表",
    pattern:/^tag$/i,
    handler:function(){
      return tag.join("\n");
    }
  });

  webot.set("tags",{
      description:"返回所有Tag列表",
      pattern:/^(array|hashtable|linkedlist|math|pointer|string|binary search|device and conquer|dp|backtracking|stack|heap|greedy|sort|bit|tree|dfs|bfs|graph|data structure)\s*/i,
      handler:function(infos){
      while(true){
        var data = meta[tags[tagconverter(infos.param[1])][Math.floor(Math.random()*tags[tagconverter(infos.param[1])].length)]+""];
        var info = data["title"];
        if (data && !data["ebook"]){
          var base = process.cwd();
           var content = fs.readFileSync(base+"/data/"+data["id"]+".txt","ascii");
           var reply = {title: data["id"]+"."+data["title"], description: content,
            pic: 'https://raw.githubusercontent.com/aronica/webot-example/master/qrcode2.jpg', url: geturl(data)};
           return reply;
        }
        }
      }
    });


  webot.set('who_are_you', {
    description: '想知道我是谁吗? 发送: who?',
    // pattern 既可以是函数，也可以是 regexp 或 字符串(模糊匹配)
    pattern: /who|你是[谁\?]+/i,
    // 回复handler也可以直接是字符串或数组，如果是数组则随机返回一个子元素
    handler: ['我是神马机器人', '微信机器人']
  });

  // 正则匹配后的匹配组存在 info.query 中
  webot.set('your_name', {
    description: '自我介绍下吧, 发送: I am [enter_your_name]',
    pattern: /^(?:my name is|i am|我(?:的名字)?(?:是|叫)?)\s*(.*)$/i,

    // handler: function(info, action){
    //   return '你好,' + info.param[1]
    // }
    // 或者更简单一点
    handler: '你好,{1}'
  });

  // 简单的纯文本对话，可以用单独的 yaml 文件来定义
  require('js-yaml');
  webot.dialog(__dirname + '/dialog.yaml');

  // 等待下一次回复
  webot.set('guess my sex', {
    pattern: /是男.还是女.|你.*男的女的/,
    handler: '你猜猜看呐',
    replies: {
      '/女|girl/i': '人家才不是女人呢',
      '/男|boy/i': '是的，我就是翩翩公子一枚',
      'both|不男不女': '你丫才不男不女呢',
      '不猜': '好的，再见',
      // 请谨慎使用通配符
      '/.*/': function reguess(info) {
        if (info.rewaitCount < 2) {
          info.rewait();
          return '你到底还猜不猜嘛！';
        }
        return '看来你真的不想猜啊';
      },
    }

    // 也可以用一个函数搞定:
    // replies: function(info){
    //   return 'haha, I wont tell you'
    // }

    // 也可以是数组格式，每个元素为一条rule
    // replies: [{
    //   pattern: '/^g(irl)?\\??$/i',
    //   handler: '猜错'
    // },{
    //   pattern: '/^b(oy)?\\??$/i',
    //   handler: '猜对了'
    // },{
    //   pattern: 'both',
    //   handler: '对你无语...'
    // }]
  });

  // 定义一个 wait rule
  webot.waitRule('wait_guess', function(info) {
    var r = Number(info.text);

    // 用户不想玩了...
    if (isNaN(r)) {
      info.resolve();
      return null;
    }

    var num = info.session.guess_answer;

    if (r === num) {
      return '你真聪明!';
    }

    var rewaitCount = info.session.rewait_count || 0;
    if (rewaitCount >= 2) {
      return '怎么这样都猜不出来！答案是 ' + num + ' 啊！';
    }

    //重试
    info.rewait();
    return (r > num ? '大了': '小了') +',还有' + (2 - rewaitCount) + '次机会,再猜.';
  });

  webot.set('guess number', {
    description: '发送: game , 玩玩猜数字的游戏吧',
    pattern: /(?:game|玩?游戏)\s*(\d*)/,
    handler: function(info){
      //等待下一次回复
      var num = Number(info.param[1]) || _.random(1,9);

      verbose('answer is: ' + num);

      info.session.guess_answer = num;

      info.wait('wait_guess');
      return '玩玩猜数字的游戏吧, 1~9,选一个';
    }
  });

  webot.waitRule('wait_suggest_keyword', function(info, next){
    if (!info.text) {
      return next();
    }

    // 按照定义规则的 name 获取其他 handler
    var rule_search = webot.get('search');

    // 用户回复回来的消息
    if (info.text.match(/^(好|要|y)$/i)) {
      // 修改回复消息的匹配文本，传入搜索命令执行
      info.param[0] = 's nodejs';
      info.param[1] = 'nodejs';

      // 执行某条规则
      webot.exec(info, rule_search, next);
      // 也可以调用 rule 的 exec 方法
      // rule_search.exec(info, next);
    } else {
      info.param[1] = info.session.last_search_word;
      // 或者直接调用 handler :
      rule_search.handler(info, next);
      // 甚至直接用命名好的 function name 来调用：
      // do_search(info, next);
    }
    // remember to clean your session object.
    delete info.session.last_search_word;
  });
  // 调用已有的action
  webot.set('suggest keyword', {
    description: '发送: s nde ,然后再回复Y或其他',
    pattern: /^(?:搜索?|search|s\b)\s*(.+)/i,
    handler: function(info){
      var q = info.param[1];
      if (q === 'nde') {
        info.session.last_search_word = q;
        info.wait('wait_suggest_keyword');
        return '你输入了:' + q + '，似乎拼写错误。要我帮你更改为「nodejs」并搜索吗?';
      }
    }
  });

  function do_search(info, next){
    // pattern的解析结果将放在param里
    var q = info.param[1];
    log('searching: ', q);
    // 从某个地方搜索到数据...
    return search(q , next);
  }

  // 可以通过回调返回结果
  webot.set('search', {
    description: '发送: s 关键词 ',
    pattern: /^(?:搜索?|search|百度|s\b)\s*(.+)/i,
    //handler也可以是异步的
    handler: do_search
  });


  webot.waitRule('wait_timeout', function(info) {
    if (new Date().getTime() - info.session.wait_begin > 5000) {
      delete info.session.wait_begin;
      return '你的操作超时了,请重新输入';
    } else {
      return '你在规定时限里面输入了: ' + info.text;
    }
  });

  // 超时处理
  webot.set('timeout', {
    description: '输入timeout, 等待5秒后回复,会提示超时',
    pattern: 'timeout',
    handler: function(info) {
      info.session.wait_begin = new Date().getTime();
      info.wait('wait_timeout');
      return '请等待5秒后回复';
    }
  });

  /**
   * Wait rules as lists
   *
   * 实现类似电话客服的自动应答流程
   *
   */
  webot.set(/^ok webot$/i, function(info) {
    info.wait('list');
    return '可用指令：\n' +
           '1 - 查看程序信息\n' +
           '2 - 进入名字选择';
  });
  webot.waitRule('list', {
    '1': 'webot ' + package_info.version,
    '2': function(info) {
      info.wait('list-2');
      return '请选择人名:\n' +
             '1 - Marry\n' +
             '2 - Jane\n' +
             '3 - 自定义'
    }
  });
  webot.waitRule('list-2', {
    '1': '你选择了 Marry',
    '2': '你选择了 Jane',
    '3': function(info) {
      info.wait('list-2-3');
      return '请输入你想要的人';
    }
  });
  webot.waitRule('list-2-3', function(info) {
    if (info.text) {
      return '你输入了 ' + info.text;
    }
  });


  //支持location消息 此examples使用的是高德地图的API
  //http://restapi.amap.com/rgeocode/simple?resType=json&encode=utf-8&range=3000&roadnum=0&crossnum=0&poinum=0&retvalue=1&sid=7001&region=113.24%2C23.08
  webot.set('check_location', {
    description: '发送你的经纬度,我会查询你的位置',
    pattern: function(info){
      return info.is('location');
    },
    handler: function(info, next){
      geo2loc(info.param, function(err, location, data) {
        location = location || info.label;
        next(null, location ? '你正在' + location : '我不知道你在什么地方。');
      });
    }
  });

  //图片
  webot.set('check_image', {
    description: '发送图片,我将返回其hash值',
    pattern: function(info){
      return info.is('image');
    },
    handler: function(info, next){
      verbose('image url: %s', info.param.picUrl);
      try{
        var shasum = crypto.createHash('md5');

        var req = require('request')(info.param.picUrl);

        req.on('data', function(data) {
          shasum.update(data);
        });
        req.on('end', function() {
          return next(null, '你的图片hash: ' + shasum.digest('hex'));
        });
      }catch(e){
        error('Failed hashing image: %s', e)
        return '生成图片hash失败: ' + e;
      }
    }
  });

  // 回复图文消息
  webot.set('reply_news', {
    description: '发送news,我将回复图文消息你',
    pattern: /^news\s*(\d*)$/,
    handler: function(info){
      var reply = [
        {title: '微信机器人', description: '微信机器人测试帐号：webot', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'https://github.com/node-webot/webot-example'},
        {title: '豆瓣同城微信帐号', description: '豆瓣同城微信帐号二维码：douban-event', pic: 'http://i.imgur.com/ijE19.jpg', url: 'https://github.com/node-webot/weixin-robot'},
        {title: '图文消息3', description: '图文消息描述3', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'http://www.baidu.com'}
      ];
      // 发送 "news 1" 时只回复一条图文消息
      return Number(info.param[1]) == 1 ? reply[0] : reply;
    }
  });

  // 可以指定图文消息的映射关系
  webot.config.mapping = function(item, index, info){
    //item.title = (index+1) + '> ' + item.title;
    return item;
  };

  //所有消息都无法匹配时的fallback
  webot.set(/.*/, function(info){
    // 利用 error log 收集听不懂的消息，以利于接下来完善规则
    // 你也可以将这些 message 存入数据库
    log('unhandled message: %s', info.text);
    info.flag = true;
    return '你发送了「' + info.text + '」,可惜我太笨了,听不懂. 发送: help 查看可用的指令';
  });
};
