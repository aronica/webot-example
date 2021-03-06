var express = require('express');
var webot = require('weixin-robot');

var log = require('debug')('webot-example:log');
var verbose = require('debug')('webot-example:verbose');
var swig = require("swig");
var fs = require("fs");
var meta = require("./lib/meta");
var cpp = require("./lib/cpp");
var tags = require("./lib/tags");
// 启动服务
var app = express();

// 实际使用时，这里填写你在微信公共平台后台填写的 token
var wx_token = process.env.WX_TOKEN || 'google';
var wx_token2 = process.env.WX_TOKEN_2 || 'weixinToken2';

// 建立多个实例，并监听到不同 path ，
var webot2 = new webot.Webot();

// 载入webot1的回复规则
require('./rules')(webot);
// 为webot2也指定规则
webot2.set('hello', 'hi.');

// 启动机器人, 接管 web 服务请求
webot.watch(app, { token: wx_token, path: '/wechat' });
// 若省略 path 参数，会监听到根目录
// webot.watch(app, { token: wx_token });

// 后面指定的 path 不可为前面实例的子目录
webot2.watch(app, { token: wx_token2, path: '/wechat_2' });

// 如果需要 session 支持，sessionStore 必须放在 watch 之后
app.use(express.cookieParser());
// 为了使用 waitRule 功能，需要增加 session 支持
app.use(express.session({
  secret: 'abced111',
  store: new express.session.MemoryStore()
}));

// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });

var mapping = {
                       "sort":"Sort",
                       "data-structure":"Data Structure",
                       "dynamic-programming":"Dynamic Programming",
                       "divide-and-conquer":"Divide and Conquer",
                       "heap":"Heap",
                       "two-pointers":"Two Pointers",
                       "graph":"Graph",
                       "tree":"Tree",
                       "greedy":"Greedy",
                       "bit-manipulation":"Bit Manipulation",
                       "linked-list":"Linked List",
                       "breadth-first-search":"Breadth-first Search",
                       "backtracking":"Backtracking",
                       "hash-table":"Hash Table",
                       "binary-search":"Binary Search" ,
                       "array":"Array" ,
                       "depth-first-search":"Depth-first Search",
                       "stack":"Stack",
                       "math":"Math",
                       "string":"String" }

app.get('/problems/:id', function (req, res) {
var info = req.params.id;
var title = meta[info];
if(title&&(!title["ebook"]||title["ebook"]!="true")){
   var base = process.cwd();
              var content = fs.readFileSync(base+"/html/"+info+".txt","ascii");
   var pre = {},next = {};
   if(info!="1"){
    pre = meta[parseInt(info)-1]||{};
   }
   next = meta[parseInt(info)+1];
   var cppcontent = cpp[info]||"";
   if(cppcontent){
    cppcontent = cppcontent.replace(/\/blob/i,"");
   }
   res.render('index', {title:title["title"],content:content,id:info,acceptance:title["rate"],level:title["level"],pre:pre,next:next,cpp:cppcontent});
}else{
     res.render('index', {title:"没有了",content:"沒有找到"+info+"题目或者该题需要购买leetcode电子书才可以浏览",id:info,acceptance:"100%",level:"None"});
}

});

app.get('/tag/:tag',function(req,res){
    var tag = req.params.tag;
    tag = mapping[tag];
    if(tag){
        var ids = tags[tag];
        var problems = [];
        for(var i = 0;i<ids.length;i++){
            problems.push(meta[ids[i]]);
        }
        res.render('list', {problems:problems,tag:tag});
    }else{
       res.render('list', {problems:[],tag:tag});
    }
});
;



// 在生产环境，你应该将此处的 store 换为某种永久存储。
// 请参考 http://expressjs.com/2x/guide.html#session-support

// 在环境变量提供的 $PORT 或 3000 端口监听
var port = process.env.PORT || 3000;
app.listen(port, function(){
  log("Listening on %s", port);
});

// 微信接口地址只允许服务放在 80 端口
// 所以需要做一层 proxy
app.enable('trust proxy');

// 当然，如果你的服务器允许，你也可以直接用 node 来 serve 80 端口
// app.listen(80);

if(!process.env.DEBUG){
  console.log("set env variable `DEBUG=webot-example:*` to display debug info.");
}
