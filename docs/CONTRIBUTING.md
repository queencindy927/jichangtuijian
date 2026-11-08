# 内容维护说明

本目录是一份可独立使用的Markdown资料库，作为独立Git仓库维护。入口为[README.md](../README.md)，不依赖父项目的资源或运行环境。

## 修改资料的顺序

1. 编辑[机场资料](maintenance/airports.json)中的价格、周期、设备、入口和选购说明。
2. 在仓库根目录运行`node docs/maintenance/build.mjs`，同步机场详情、场景和对比表。
3. 首页README由维护者手动维护，标题、介绍、表格和入口不会被生成器覆盖；资料变化时手动同步对应内容。
4. 运行`node docs/maintenance/check.mjs`，检查目录自包含、Markdown链接、机场顺序、官网入口、表格与星级。
5. 检查生成结果，将实际变更记入[CHANGELOG.md](CHANGELOG.md)。

需要Node.js 18或以上，无第三方npm依赖，不需要安装包。也可运行`npm --prefix docs/maintenance run build`与`npm --prefix docs/maintenance run check`。

## 简洁的仓库首页

```text
README.md         首页入口，手动维护
docs/             全部测评、指南、问答与维护资料
images/           横幅图片
```

阅读文档平铺在docs中，通过文件名前缀区分类型；数据与脚本单独放在docs/maintenance中，不占仓库首页文件列表。使用[内容导航](README.md)查找具体文章。

## 哪些文件自动生成

- `docs/airports.md`目录与`docs/airport-*.md`机场测评。
- `docs/recommendation-*.md`的4篇场景推荐。
- `docs/compare-*.md`的3篇对比表。
- `docs/README.md`内容导航。

生成页面的结构修改应在[生成器](maintenance/build.mjs)中完成。根README、`docs/guide-*.md`、FAQ、资料说明、体验模板与更新记录直接维护，不会在build时被覆盖。

## 入口与资料约定

- 官网入口统一为二级标题中的“👉 点击进入官网”文字链接。
- 保留完整邀请参数与URL hash，修改一家的入口不连带改动其他机场。
- Flybit的go入口是本版本明确覆盖值，不因主项目的其他域名覆盖回来。
- 推广活动内容不纳入本版本；价格与套餐规格按已有资料展示。
- 记录资料来源与适用范围，不把编排日期当作全部价格的核实日期。
- 对没有证据的速度、在线率、节点地区、库存与稳定性不补写保证。
- 排序由维护者固定指定；星级仅表示套餐计费偏好，不重新计算综合评分。
- 保持一个主标题，自然使用“机场推荐”“机场测评”等主题，不堆叠重复关键词。
- 首页每家尽量展示约8档，优先覆盖3至4档月付、至少2档不限时和1至2档季付／年付；根据实际资料选取，不补造缺少明确价格的周期。
- 独立测评中的精简代表表与已收录套餐表分别展示，不折叠套餐表。
- 每家机场的图片路径记录在资料的image字段中，WebP与JPG分别放在images/webp和images/jpg。
- 首页图片手动维护；独立测评图片由生成器同步，均使用picture展示、WebP优先与JPG回退，不为图片添加跳转入口。

## 发布与复制

整体复制本目录即可保留内部链接，根README中的图片为本地SVG，不依赖远程按钮图片。制作本目录不等于发布或修改其他远程仓库。

在GitHub仓库的内容入口使用根README；[docs/README.md](README.md)提供全部导航。纯Markdown仓库不添加网页head或JSON-LD脚本，不将README当作可直接上传的完整网页。

## 目录结构的参考

初次整理时原参考地址未能读取，曾参考同主题仓库的目录组织；后续已重新核对任务指定的[参考仓库](https://github.com/jichangyyds/jichang-tuijian)，并将选购、使用和排查说明直接展开到首页。本版本内容按本项目资料重新编写，不采用参考仓库的机场数据、测速结论、风险名单或评分。
