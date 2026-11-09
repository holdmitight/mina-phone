/**
 * Fictional 2015 LINE messages between Mina and A, from Mina's own phone.
 * Mina's messages are on the RIGHT; A's messages are on the LEFT.
 * The last message is from A, intentionally unanswered.
 */
export type LineMemoryMessage = {
  id: string;
  day: string;
  time: string;
  from: "mina" | "a";
  text: string;
  translation?: string;
};

export const minaLineThreadName = "A ♡";

export const minaLineMemories: LineMemoryMessage[] = [
  { id:"2015-06-16-01", day:"2015-06-16", time:"17:48", from:"a", text:"今日はありがとう！\nあの回転、何度やってもできなくて…", translation:"今天谢谢你！那个旋转我怎么练都练不好……" },
  { id:"2015-06-16-02", day:"2015-06-16", time:"17:51", from:"mina", text:"さっきよりずっと上手だったよ。\n焦らなくて大丈夫☺️", translation:"已经比刚才进步很多啦。不要着急☺️" },
  { id:"2015-06-16-03", day:"2015-06-16", time:"17:53", from:"a", text:"南、明日もレッスン来る？", translation:"南，明天还来上课吗？" },
  { id:"2015-06-16-04", day:"2015-06-16", time:"17:55", from:"mina", text:"うん。終わったら一緒に帰ろう？", translation:"嗯。结束以后一起回家吧？" },
  { id:"2015-06-16-05", day:"2015-06-16", time:"17:56", from:"a", text:"約束ね！", translation:"约好了！" },
  { id:"2015-06-16-06", day:"2015-06-16", time:"17:57", from:"mina", text:"約束 ♡", translation:"约好了 ♡" },

  { id:"2015-07-04-rain-01", day:"2015-07-04", time:"20:56", from:"a", text:"雨が大きいね！☔️", translation:"雨好大呀！☔️（A 用错了日语）" },
  { id:"2015-07-04-rain-02", day:"2015-07-04", time:"20:57", from:"mina", text:"ふふ、「雨が大きい」じゃなくて「雨が強い」だよ☺️", translation:"呵呵，不是「雨很大（大きい）」，要说「雨下得很大（強い）」哦☺️" },
  { id:"2015-07-04-rain-03", day:"2015-07-04", time:"20:58", from:"a", text:"あっ！雨が強い！\\n日本語、難しい……🥲", translation:"啊！雨が強い！日语好难……🥲" },
  { id:"2015-07-04-rain-04", day:"2015-07-04", time:"20:59", from:"mina", text:"ちゃんと伝わったよ。\\nかわいい間違いだった。笑", translation:"我听懂了呀。犯的错还挺可爱的，哈哈。" },
  { id:"2015-07-04-rain-05", day:"2015-07-04", time:"21:01", from:"a", text:"じゃあ、これからも南先生に教えてもらおうかな ♡", translation:"那以后也让南老师教我好不好 ♡" },
  { id:"2015-07-04-rain-06", day:"2015-07-04", time:"21:02", from:"mina", text:"うん、何度でも。\\nでも今は、雨に気をつけて帰ってね。", translation:"嗯，教多少次都可以。不过现在要小心下雨，好好回家哦。" },

  { id:"2015-07-04-01", day:"2015-07-04", time:"21:06", from:"mina", text:"雨、まだ降ってるね。帰れた？", translation:"还在下雨呢。你到家了吗？" },
  { id:"2015-07-04-02", day:"2015-07-04", time:"21:08", from:"a", text:"帰ったよ！\nでも南が傘を貸してくれたから、南が濡れたでしょ？", translation:"到家啦！可是你把伞借给我，自己不是淋雨了吗？" },
  { id:"2015-07-04-03", day:"2015-07-04", time:"21:09", from:"mina", text:"少しだけ。大丈夫だよ。", translation:"就一点点。没关系。" },
  { id:"2015-07-04-04", day:"2015-07-04", time:"21:12", from:"a", text:"風邪ひいたら、私が看病するからね。", translation:"如果感冒了，我来照顾你哦。" },
  { id:"2015-07-04-05", day:"2015-07-04", time:"21:16", from:"mina", text:"じゃあ、ちょっとだけ風邪ひきたいかも。", translation:"那我可能有一点点想感冒了。" },
  { id:"2015-07-04-06", day:"2015-07-04", time:"21:17", from:"a", text:"ばか！笑", translation:"笨蛋！哈哈" },

  { id:"2015-07-18-01", day:"2015-07-18", time:"22:31", from:"a", text:"今日、手をつないだのって……どういう意味？", translation:"今天牵我的手……是什么意思？" },
  { id:"2015-07-18-02", day:"2015-07-18", time:"22:35", from:"mina", text:"嫌だった？", translation:"你不喜欢吗？" },
  { id:"2015-07-18-03", day:"2015-07-18", time:"22:36", from:"a", text:"ううん。すごくうれしかった。", translation:"没有。我特别开心。" },
  { id:"2015-07-18-04", day:"2015-07-18", time:"22:39", from:"mina", text:"私、Aのことが好き。", translation:"我喜欢 A。" },
  { id:"2015-07-18-05", day:"2015-07-18", time:"22:41", from:"a", text:"私も。南が好き。", translation:"我也是。我喜欢南。" },
  { id:"2015-07-18-06", day:"2015-07-18", time:"22:43", from:"mina", text:"明日、会いたい。", translation:"明天想见你。" },

  { id:"2015-08-09-01", day:"2015-08-09", time:"16:22", from:"a", text:"今日のおもちゃ屋さん、楽しかったね。\nいつか一緒にレゴ作ろう。", translation:"今天的玩具店真好玩。以后我们一起拼乐高吧。" },
  { id:"2015-08-09-02", day:"2015-08-09", time:"16:27", from:"mina", text:"何を作りたい？", translation:"想拼什么？" },
  { id:"2015-08-09-03", day:"2015-08-09", time:"16:29", from:"a", text:"指輪！笑\nダイヤよりレゴの指輪がいいな。", translation:"戒指！哈哈。比起钻戒，我更喜欢乐高戒指。" },
  { id:"2015-08-09-04", day:"2015-08-09", time:"16:31", from:"mina", text:"子どもみたい。笑\nでも、覚えておくね。", translation:"像小孩子一样。哈哈。不过我会记住的。" },
  { id:"2015-08-09-05", day:"2015-08-09", time:"16:33", from:"a", text:"じゃあ、南が作ってね ♡", translation:"那就由南来拼吧 ♡" },
  { id:"2015-08-09-06", day:"2015-08-09", time:"16:35", from:"mina", text:"うん。いつか、絶対。", translation:"嗯。总有一天，一定。" },

  { id:"2015-08-26-01", day:"2015-08-26", time:"20:14", from:"mina", text:"A、話したいことがある。", translation:"A，我有话想告诉你。" },
  { id:"2015-08-26-02", day:"2015-08-26", time:"20:15", from:"a", text:"どうしたの？", translation:"怎么了？" },
  { id:"2015-08-26-03", day:"2015-08-26", time:"20:19", from:"mina", text:"韓国に戻ることになった。\nデビューの準備で、しばらく日本には帰れないと思う。", translation:"我要回韩国了。因为要准备出道，我想很长一段时间都回不了日本。" },
  { id:"2015-08-26-04", day:"2015-08-26", time:"20:23", from:"a", text:"そっか……夢が叶うんだね。\nおめでとう、南。", translation:"这样啊……你的梦想要实现了呢。恭喜你，南。" },
  { id:"2015-08-26-05", day:"2015-08-26", time:"20:26", from:"mina", text:"ありがとう。\nでも、Aと離れたくない。", translation:"谢谢你。可是，我不想和 A 分开。" },
  { id:"2015-08-26-06", day:"2015-08-26", time:"20:29", from:"a", text:"大丈夫。待ってるよ。\n離れてても、私たちは私たちでしょ？", translation:"没关系。我会等你的。就算分开了，我们还是我们，对吧？" },
  { id:"2015-08-26-07", day:"2015-08-26", time:"20:34", from:"mina", text:"うん。毎日連絡する。\n約束する。", translation:"嗯。我会每天联系你。我保证。" },

  { id:"2015-09-13-01", day:"2015-09-13", time:"23:48", from:"a", text:"今日の練習、どうだった？\nちゃんとご飯食べた？", translation:"今天练习怎么样？有好好吃饭吗？" },
  { id:"2015-09-14-01", day:"2015-09-14", time:"01:12", from:"mina", text:"今終わったよ。ごめんね。\nAも無理しないでね。", translation:"刚刚结束。对不起。A 也别太勉强自己。" },
  { id:"2015-09-14-02", day:"2015-09-14", time:"01:13", from:"a", text:"声、聞きたいな。少しだけでも。", translation:"想听听你的声音。哪怕一会儿也好。" },
  { id:"2015-09-14-03", day:"2015-09-14", time:"01:17", from:"mina", text:"今日はもう寝ないと……\n明日、電話するね。", translation:"今天必须睡了……明天给你打电话。" },
  { id:"2015-09-14-04", day:"2015-09-14", time:"01:19", from:"a", text:"うん。おやすみ。", translation:"嗯。晚安。" },

  { id:"2015-10-11-01", day:"2015-10-11", time:"22:06", from:"a", text:"昨日も今日も、電話できなかったね。", translation:"昨天和今天，我们都没能打电话。" },
  { id:"2015-10-11-02", day:"2015-10-11", time:"23:37", from:"mina", text:"ごめん。\n今、本当に余裕がなくて……", translation:"对不起。我现在真的有点喘不过气……" },
  { id:"2015-10-11-03", day:"2015-10-11", time:"23:40", from:"a", text:"怒ってるわけじゃないよ。\nでも、私ばっかり会いたがってる気がする。", translation:"我不是在生气。只是感觉，好像只有我一个人在想见你。" },
  { id:"2015-10-11-04", day:"2015-10-11", time:"23:52", from:"mina", text:"そんなことない。\n好きだよ、A。", translation:"不是那样的。我喜欢你，A。" },
  { id:"2015-10-11-05", day:"2015-10-11", time:"23:54", from:"a", text:"それなら、ちゃんと言ってほしい。\n私、いつまで待てばいい？", translation:"如果是这样，就好好告诉我啊。我到底要等到什么时候？" },

  { id:"2015-10-19-01", day:"2015-10-19", time:"23:56", from:"mina", text:"明日、デビューするよ。\n怖いけど、頑張るね。", translation:"明天就要出道了。虽然害怕，但我会努力的。" },
  { id:"2015-10-19-02", day:"2015-10-19", time:"23:59", from:"a", text:"ずっと応援してる。\n南の夢、叶ってよかった。", translation:"我会一直支持你。你的梦想能实现，真好。" },
  { id:"2015-10-20-01", day:"2015-10-20", time:"00:01", from:"mina", text:"ありがとう。\n一番に伝えたかった。", translation:"谢谢你。我最想第一个告诉的人就是你。" },

  { id:"2015-11-02-01", day:"2015-11-02", time:"21:16", from:"a", text:"南、今日も忙しい？\n最近、何を送っても返事がないから……", translation:"南，今天也很忙吗？最近无论我发什么，都等不到回复……" },
  { id:"2015-11-02-02", day:"2015-11-02", time:"23:47", from:"mina", text:"ごめんね。\n会いたいけど、今は何も約束できない。", translation:"对不起。我也想见你，可是现在什么都没办法答应。" },
  { id:"2015-11-02-03", day:"2015-11-02", time:"23:50", from:"a", text:"じゃあ、私たちはどうなるの？", translation:"那我们会变成什么样？" },
  { id:"2015-11-02-04", day:"2015-11-02", time:"23:57", from:"mina", text:"……Aには、もっと幸せになってほしい。", translation:"……我希望 A 能过得更幸福。" },
  { id:"2015-11-03-01", day:"2015-11-03", time:"00:02", from:"a", text:"それって、別れたいってこと？", translation:"你的意思是想分手吗？" },
  { id:"2015-11-03-02", day:"2015-11-03", time:"00:08", from:"mina", text:"ごめん。", translation:"对不起。" },
  { id:"2015-11-03-03", day:"2015-11-03", time:"00:12", from:"a", text:"我不需要你替我决定什么才是幸福。", translation:"" },
  { id:"2015-11-03-04", day:"2015-11-03", time:"00:17", from:"a", text:"你真的走了吗？", translation:"" },
];

export const minaLineLastMessage = minaLineMemories[minaLineMemories.length - 1];
