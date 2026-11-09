# MINA 的手机 · 夜の余白

`mina-after-hours`，revision 1。2026-11-09，21:09。

这是一部非官方同人虚构手机故事。玩家是名井南的恋人，所有关系、聊天、行程、购物记录和通话均为作者创作，并非真实私人资料。作品内的 `note-about` 也保留这一说明。

## 内容与语言

- 24 个安装应用，包含 KakaoTalk、LINE、bubble、Instagram、X、五个购物应用，以及系统应用。
- 12 个聊天会话，92 条消息。恋人、Sana、Momo 与 LINE 家庭会话使用日语；Nayeon、Jeongyeon、Jihyo、TWICE 群、经纪人与 bubble 使用韩语。机主发出的消息由编译器生成 `outgoing: true`。
- 购物应用每个包含 4 条商品、收藏或虚构订单；`meta` 提供价格、币种、状态、分类、预计配送与品牌字段。
- 个人备忘录、照片说明与个人动态主要使用日语。说明页与部分系统记录使用中文，便于中文玩家理解。

## 游玩与分支

锁屏密码为 `0324`，开始通知中以生日提示说明。应用默认可自由浏览，普通聊天不会弹出强制选择。

读 `note-pinned`（「君へのピン留め」）或 `kaka-you-last`（恋人最后一条消息），只会解锁 `note-draft`。玩家主动用 `0324` 打开这份「君だけのページ」，才会出现今晚的选择。

两条结局分别为一起看电影与晚安电话。电话分支通过 `callAnswered`、`callEnded` 触发；拒接也有温柔的替代落点。四条脚本测试覆盖两种入口、密码、隐藏内容、购物跨应用线索、接听和拒接。

## 稳定的资源标记

图片由集成步骤填入安全的内嵌图片数据；原始素材选择保存在 `meta.imageKey` 中：`portrait`、`lifestyle1` 至 `lifestyle5`。这里的照片说明属于虚构故事，不是对人物现实活动、恋爱关系或真实照片背景的陈述。

请保留 `note-about` 与项目资源署名。剧情正文修改应递增 `revision`，并运行：

```sh
npm run story:validate
npm run story:test
npm run build
```
