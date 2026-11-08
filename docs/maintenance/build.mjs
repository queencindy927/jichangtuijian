import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const data=JSON.parse(await readFile(path.join(root,'docs/maintenance/airports.json'),'utf8'));
const airports=[...data.airports].sort((a,b)=>a.order-b.order);
const byId=id=>airports.find(a=>a.id===id);
const cell=value=>String(value??'待确认').replace(/\|/g,'／').replace(/\r?\n/g,' ');
const table=(head,rows,align=[])=>`| ${head.join(' | ')} |\n|${head.map((_,i)=>align[i]||'---').join('|')}|\n${rows.map(row=>`| ${row.map(cell).join(' | ')} |`).join('\n')}`;
const stars=p=>p.stars?'⭐'.repeat(p.stars):'—';
const unit=p=>({monthly:'月',quarterly:'季',annual:'年',biennial:'两年','half-year':'半年','one-time':'次','paid-trial':'次',addon:'次（加油包）'}[p.kind]);
const price=p=>`¥${p.price}/${unit(p)}`;
const monthly=a=>a.plans.filter(p=>p.kind==='monthly').sort((a,b)=>a.price-b.price)[0];
const onetime=a=>a.plans.filter(p=>p.kind==='one-time').sort((a,b)=>a.price-b.price)[0];
const entry=a=>`## [👉 点击进入官网](${a.referral_url})`;
const anchor=id=>`<a id="${id}"></a>`;
const escapeAttribute=value=>String(value).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const illustration=(a,prefix='')=>a.image?`<p align="center">
  <picture>
    <source type="image/webp" srcset="${escapeAttribute(prefix+a.image.webp)}">
    <img src="${escapeAttribute(prefix+a.image.jpg)}" alt="${escapeAttribute(a.name)}横幅" width="100%" loading="lazy" decoding="async">
  </picture>
</p>`:'';
const footer=(prefix='')=>`<sub>${data.meta.affiliate_note} 资料仅供参考、学习与工作使用，请遵循所在地法律法规。价格、节点、线路与平台支持以服务方当前规则及个人实际使用为准。查看[资料与测评说明](${prefix}docs/methodology.md)。</sub>`;
const nav=(prefix='../../')=>`[🏠 机场推荐首页](${prefix}README.md) · [全部机场测评](${prefix}docs/airports/README.md) · [选购指南](${prefix}docs/README.md) · [常见问题](${prefix}docs/faq.md)`;
// Templates retain their content categories; publish them as flat filenames.
function outputPath(file){
 if(file==='docs/airports/README.md')return 'docs/airports.md';
 if(file==='assets/cover.svg')return 'images/banner.svg';
 if(file==='CHANGELOG.md'||file==='CONTRIBUTING.md')return `docs/${file}`;
 const categories={airports:'airport',scenarios:'recommendation',comparisons:'compare',guides:'guide',templates:'template'};
 return file.replace(/^docs\/([^/]+)\//,(_,category)=>`docs/${categories[category]||category}-`);
}
async function save(file,text){
 if(file==='README.md')throw new Error('首页由维护者手动维护，生成器不可覆盖');
 const destination=outputPath(file);
 const targetUrl=url=>{
  if(/^(?:https?:|mailto:|#)/.test(url))return url;
  const [pathname,fragment]=url.split('#');
  const target=outputPath(path.posix.normalize(path.posix.join(path.posix.dirname(file),pathname)));
  return path.posix.relative(path.posix.dirname(destination),target)+(fragment?`#${fragment}`:'');
 };
 const content=text.replace(/(!?\[[^\]\n]*\]\()([^\s)]+)(\))/g,(_,before,url,after)=>before+targetUrl(url)+after)
  .replace(/(<(?:img|source)\b[^>]*\b(?:src|srcset)=")([^"]+)(")/g,(_,before,url,after)=>before+targetUrl(url)+after);
 await mkdir(path.dirname(path.join(root,destination)),{recursive:true});
 await writeFile(path.join(root,destination),content.trim()+'\n','utf8');
}
function plansTable(plans){return table(['套餐','价格与周期','流量','设备／在线限制','线路与规则标注','推荐指数'],plans.map(p=>[p.name,price(p),p.traffic,p.devices,p.route,stars(p)]),['---','---:','---','---','---',':---:']);}
const scenarios=[
 {id:'value',title:'性价比机场推荐',emoji:'🚀',ids:['flybit','xiyou'],lead:'性价比先看自己会用到的配置。Flybit适合优先比较IEPL标注和多设备，西游云适合先压低月费，再决定是否升级专线。两家是备选关系，按需求选一家即可。',rows:[['flybit','¥15/月 · 128GB','IEPL标注、不限设备，日常专线方向'],['xiyou','¥9/月 · 120GB；¥16/月 · 200GB','预算优先看9元，专线权限看16元']],checks:['先用一个月的实际流量判断额度是否够用，不只看每GB价格。','同样写专线，也要确认常用地区和节点权限。','设备数量、协议支持与退款条件一起比较。'],guide:'choose-airport'},
 {id:'budget',title:'便宜量大机场推荐',emoji:'🍜',ids:['xiyou','xingchen-cloud'],lead:'便宜量大关注月度预算和流量额度。西游云9元120GB适合预算优先；星辰云最低8元80GB，更推荐比较9.9元100GB与17元200GB两档。',rows:[['xiyou','¥9/月 · 120GB','5台设备；16元200GB档标注精品IEPL'],['xingchen-cloud','¥8/月 · 80GB；¥9.9/月 · 100GB','8元档限2台且无客服；17元200GB档标注IEPL']],checks:['最低价格档不一定包含高档专线。','年付折算价不等于可单独按月购买。','星辰8元档与西游9元档的设备、售后和线路权限分别核对。'],guide:'monthly-or-onetime'},
 {id:'premium',title:'高端机场推荐',emoji:'💎',ids:['cocoduck','wgetcloud'],lead:'高端场景按节点配置与预算分开选择：CocoDuck资料侧重家宽落地，WgetCloud侧重老牌专线与分档配置。高价格、家宽名称或专线标签都不能单独证明本地体验。',rows:[['cocoduck','¥17/月 · 100GB','家宽落地方向；常规套餐标注全部节点、不限设备'],['wgetcloud','¥99/月 · 230GB','老牌高端专线方向；留意在线IP、连接数和节点分层']],checks:['先确认目标平台与所需地区，再核对节点权限。','WgetCloud在线IP限制不直接等于设备数量。','CocoDuck加油包不能作为独立不限时订阅购买。'],guide:'streaming-and-ai'},
 {id:'pay-as-you-go',title:'按量付费机场推荐',emoji:'🎒',ids:['flybit'],lead:'本篇按量首选Flybit。36元128GB不限时包适合低频使用或备用，资料标注IEPL、不限设备。按量包购买的是总流量，用完再续，不是每月到账。',rows:[['flybit','¥36/次 · 128GB；¥68/次 · 256GB','IEPL标注、按总量使用，适合不固定使用频率']],checks:['核对有效期、账号有效期、节点倍率与同套餐叠加规则。','不限时不等于服务方承诺永久经营。','持续高流量使用时，重新比较月付总成本。'],guide:'traffic-multiplier'}
];

// README.md is maintained by hand; only supporting documents are generated.
for(const a of airports){
 const selected=a.featured.map(i=>a.plans[i]);
 const regular=a.plans.filter(p=>p.kind!=='addon');
 const addons=a.plans.filter(p=>p.kind==='addon');
 const nearby=airports.filter(x=>x.id!==a.id).slice(Math.max(0,a.order-3),Math.max(0,a.order-3)+3);
 await save(`docs/airports/${a.id}.md`,`# ${a.name}机场测评｜${a.headline}

${nav()}

${illustration(a,'../../')}

${a.intro}

${entry(a)}

${anchor('overview')}

## ${a.emoji} 一眼看懂这家机场

${table(['项目','资料与选购判断'],[['月付门槛',monthly(a)?`${price(monthly(a))} · ${monthly(a).traffic}`:'未收录月付；常规按量包见下表'],['按量门槛',onetime(a)?`${price(onetime(a))} · ${onetime(a).traffic}`:'当前没有可核对价格的常规按量包'],['关注配置',a.focus],['线路与IP',a.route],['客户端要求',a.client],['适合人群',a.audience]])}

${anchor('analysis')}

## 🔎 机场测评分析：优势与取舍

**先看配置是否用得上。** ${a.route}。比较时，把节点权限与价格放在一起，不因为套餐名称带有专线、旗舰或大流量，就推定所有节点都有相同能力。

**再看购买方式是否合适。** ${a.advice}

**最后看使用门槛。** ${a.client} 对常用平台的支持，应按具体地区和节点确认；地区、运营商与时段都会影响最终体验。

${anchor('recommended-plans')}

## 💰 代表套餐｜先比较这几档

${plansTable(selected)}

星级为套餐选购偏好，按计费方式展示，不是机场速度或质量分数。完整规则见[资料与测评说明](../methodology.md)。

${anchor('all-plans')}

## 📋 已收录套餐清单

${a.id==='jisu-cloud'?'极速云目前只收录下列代表套餐，不将其称为商店全部套餐。':'以下为本版本已有明确价格的套餐资料，不表示当前库存或所有可售方案。'}

${plansTable(regular)}

${addons.length?`### ⛽ 配套加油包

加油包需要已有常规套餐，不能当作独立的按量机场订阅；有效期和叠加规则以后台为准。

${plansTable(addons)}

`:''}${anchor('checklist')}

## ⚠️ 购买前要确认的事项

${a.questions.map(q=>`- ${q}`).join('\n')}

${anchor('who')}

## 🎯 适合与不适合的情况

**适合：** ${a.audience}

**先做确认：** 如果你必须使用指定平台、指定客户端或特定地区，先核对对应节点与限制。重要工作用途可使用[个人测试记录模板](../templates/personal-test.md)记录常用节点体验，再决定后续续费。

## 📚 继续比较机场

${nearby.map(x=>`- [${x.name}机场测评](${x.id}.md)：${x.headline}`).join('\n')}
- [全部机场推荐与清单](../../README.md#ranking)
- [月付与按量怎么选](../guides/monthly-or-onetime.md)
- [机场节点倍率怎么算](../guides/traffic-multiplier.md)

${footer('../../')}`);
}

await save('docs/airports/README.md',`# 机场测评目录｜12家机场套餐与选购分析

${nav()}

按本篇推荐顺序排列。每家包含官网入口、配置分析、代表套餐、已收录套餐与购买前检查事项。

${table(['顺位','机场测评','主要关注'],airports.map(a=>[a.order,`[${a.name}机场测评](${a.id}.md)`,a.headline]),[':---:','---','---'])}

${footer('../../')}`);

for(const s of scenarios){await save(`docs/scenarios/${s.id}.md`,`# ${s.title}｜按预算与使用频率选机场

${nav()}

${s.lead}

## ${s.emoji} 本场景机场清单

${table(['推荐机场','优先比较','选择重点'],s.rows.map(([id,p,n])=>[`[${byId(id).name}机场测评](../airports/${id}.md)`,p,n]))}

${s.ids.map(id=>{const a=byId(id);return`## ${a.name}怎么选

${a.advice}

${entry(a)}

${plansTable(a.featured.slice(0,3).map(i=>a.plans[i]))}

[继续阅读${a.name}完整机场测评](../airports/${a.id}.md)`;}).join('\n\n')}

## 🧾 下单前检查

${s.checks.map(t=>`- ${t}`).join('\n')}

## 📚 继续阅读

- [全部12家机场推荐](../../README.md#ranking)
- [月付机场价格对比](../comparisons/monthly-price.md)
- [按量与不限时机场对比](../comparisons/pay-as-you-go.md)
- [相关选购指南](../guides/${s.guide}.md)

${footer('../../')}`);}

const monthlySorted=airports.filter(a=>monthly(a)).sort((a,b)=>monthly(a).price-monthly(b).price||a.order-b.order);
await save('docs/comparisons/monthly-price.md',`# 月付机场价格对比｜按实际月付门槛筛选机场

${nav()}

这里只比较可以单独按月购买的最低已收录方案，不把年付折算价格、一次性体验或加油包当作月付起价。按价格升序展示，和首页推荐顺序分开。

## 💰 最低月付价格表

${table(['机场测评','套餐','价格','流量','设备／在线限制'],monthlySorted.map(a=>{const p=monthly(a);return[`[${a.name}](../airports/${a.id}.md)`,p.name,price(p),p.traffic,p.devices];}),['---','---','---:','---','---'])}

## 怎么使用这张表

- 先排除不满足设备和客户端要求的套餐，再比较价格。
- 极速云标称1200GB在6倍倍率下约可传输200GB，不和其他1200GB直接当作同等流量。
- 魔戒未收录月付套餐，出现在[按量机场对比](pay-as-you-go.md)中。
- 套餐标注的节点权限可能分档，低价并不自动包含高端专线。

${footer('../../')}`);

const oneTimeRows=airports.flatMap(a=>a.plans.filter(p=>p.kind==='one-time').map(p=>[`[${a.name}](../airports/${a.id}.md)`,p.name,price(p),p.traffic,p.devices,stars(p)]));
await save('docs/comparisons/pay-as-you-go.md',`# 按量付费机场对比｜不限时流量包价格与规则

${nav()}

本篇省流推荐的按量选择为[Flybit](../scenarios/pay-as-you-go.md)。下表同时列出其他机场已收录的常规一次性包，按首页机场顺序展示，不将付费体验或配套加油包混入常规起步价格。

## 🎒 已收录常规按量套餐

${table(['机场测评','套餐','一次性价格','总流量','设备限制','推荐指数'],oneTimeRows,['---','---','---:','---','---',':---:'])}

## 按量机场购买前看什么

| 检查项目 | 为什么要确认 |
|---|---|
| 倍率 | 极速云1000GB标称总量按6倍约可传输166.7GB；其他机场也要核对所用节点当前倍率 |
| 叠加与覆盖 | 魔戒资料提示同套餐可能覆盖原流量；不可默认所有机场叠加 |
| 有效期 | 流量不限时不代表账号、节点权限与服务本身永远有效 |
| 配置门槛 | 飞鸟云需自行配置IPv6；飞鸟加速是另一家服务 |
| 不提供的方案 | 大哥云没有已收录按量包；扬帆云未提供可核对的按量档位与价格 |
| 加油包 | CocoDuck加油包依附常规套餐，不属于独立不限时订阅 |

[月付与不限时如何选择](../guides/monthly-or-onetime.md) · [节点倍率计算](../guides/traffic-multiplier.md)

${footer('../../')}`);

await save('docs/comparisons/devices-and-routes.md',`# 机场设备与线路对比｜专线权限、IP与客户端要求

${nav()}

路线名称、IP类型和客户端协议是不同维度。表中均为已收录资料，不将“标注专线”直接解释为速度保证。

## 📱 配置与限制对照

${table(['机场测评','线路与IP资料','最低月付设备／在线限制','客户端要求'],airports.map(a=>[`[${a.name}](../airports/${a.id}.md)`,a.route,monthly(a)?.devices||'无已收录月付；按量规则见详情',a.client]))}

## 最容易看错的三件事

1. **设备数、在线IP与连接数分开看。** WgetCloud三种限制的含义不同，同一网络下的多台设备也不直接等于多个公网IP。
2. **低价档与高档不自动同线。** 西游轻量型、星辰入门档、扬帆LV1不能默认有高档专线权限。
3. **客户端名称不代表所有协议都兼容。** 飞鸟云需确认Hysteria2及IPv6，其他机场同样要检查订阅格式和内核版本。

[IEPL、IPLC、中转与家宽怎么区分](../guides/routes-and-ip.md) · [机场订阅导入](../guides/subscription-import.md)

${footer('../../')}`);

await save('docs/README.md',`# 机场推荐内容导航｜测评、对比、选购指南与问答

[返回机场推荐首页](../README.md)

## 📖 12家机场测评

${airports.map(a=>`- [${a.name}机场测评](airports/${a.id}.md)：${a.headline}`).join('\n')}

## ⚡ 场景机场推荐

${scenarios.map(s=>`- [${s.title}](scenarios/${s.id}.md)`).join('\n')}

## 📊 横向对比

- [月付机场价格对比](comparisons/monthly-price.md)
- [按量与不限时套餐对比](comparisons/pay-as-you-go.md)
- [设备、线路与客户端限制](comparisons/devices-and-routes.md)

## 🧩 机场选购指南

- [机场是什么](guides/what-is-airport.md)
- [机场怎么选](guides/choose-airport.md)
- [月付、年付与不限时](guides/monthly-or-onetime.md)
- [IEPL、IPLC、中转与家宽](guides/routes-and-ip.md)
- [机场节点倍率怎么算](guides/traffic-multiplier.md)
- [流媒体与AI节点选择](guides/streaming-and-ai.md)
- [机场订阅与客户端入门](guides/subscription-import.md)
- [节点超时与晚高峰排查](guides/troubleshooting.md)

## 🗂️ 问答与资料

- [机场选购FAQ](faq.md)
- [资料与机场测评说明](methodology.md)
- [个人测试记录模板](templates/personal-test.md)
- [本版本更新记录](../CHANGELOG.md)
- [内容维护说明](../CONTRIBUTING.md)

${footer('../')}`);

console.log(`已生成12篇机场测评、4篇场景推荐、3篇对比与2个目录；保留手动维护的首页。共${airports.length}家、${airports.reduce((n,a)=>n+a.plans.length,0)}条套餐资料。`);
