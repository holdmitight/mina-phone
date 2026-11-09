# MINA 的手机 · AFTER HOURS

名井南主题的同人互动手机，基于 [FoundPhone Studio](https://github.com/keoyyo85/FoundPhone-Studio) 开源框架定制。保留原手机运行时、应用、剧情引擎、存档和 MIT 许可。

## 当前外观

手机界面使用日语。Instagram 显示名为 `im not sharon`，没有帖子、快拍或预设私信。壁纸使用用户提供的东京微缩场景照片，原图未修改。

## 内容与语言

- 机主：名井南 / MINA；用户视角为恋人／暧昧对象。
- Nayeon、定延、志效与 TWICE 群聊使用韩语。
- Sana、Momo、家人及与你的聊天使用日语。
- 软件包括 X、Instagram、JYP bubble、KakaoTalk、LINE、Amazon 日本、乐天、Qoo10、Coupang、MUSINSA，以及系统应用。
- Bubble、购物袋与收藏是本地互动，不向外部服务发送消息、不产生订单。

人物聊天、日程、社交内容与购物记录属于同人创作，不是真实私人记录。肖像采用公开活动照片；静物为故事氛围配图，来源与许可位于 `public/mina-media/credits.json` 和 `credits.html`。

## 运行与验证

使用 Node.js 22 或更新版本。

```sh
npm ci
npm run story:validate
npm run story:test
npm test
npm run typecheck
npm run dev
```

正式构建与本地预览：

```sh
npm run build
npm run preview
```

静态成品位于 `dist/`。GitHub Actions 工作流 `.github/workflows/ci.yml` 会在推送到 `main` 和创建拉取请求时验证类型、代码规范、测试、剧情与构建，只检查源码，不部署网站。

源码可保存在私有 GitHub 仓库。若后续需要使用 GitHub Pages，可参考 [部署文档](docs/GITHUB_PAGES.md)，另行手动配置 Pages 设置和部署工作流；当前未配置 Pages 自动发布。源码不会自动向 GitHub 推送。

## 主要文件

- `stories/template/story.json`：人物、聊天、应用内容与剧情分支。
- `src/skins/MinaApps.tsx`：新增的 bubble 与五个购物应用皮肤。
- `src/skins/mina-apps.css`：新增应用样式。
- `src/runtime/mina.css`：主题壁纸及外部页面样式。
- `src/skins/MinaApps.test.ts`：新增应用的状态与内容测试。

锁屏密码为 `0324`，剧情内也有生日提示。存档按作品 ID 与修订号保存；大幅改动剧情后递增 `revision`。

## 来源与许可

上游说明完整保留在 [UPSTREAM_README](docs/UPSTREAM_README.md)。源码采用 [MIT License](LICENSE)，保留上游版权及依赖声明。公开分发时包含 `THIRD_PARTY_LICENSES.txt`、`BRAND_NOTICE.txt`、`licenses/` 和肖像许可说明。
