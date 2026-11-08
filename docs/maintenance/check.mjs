import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const data=JSON.parse(await readFile(path.join(root,'docs/maintenance/airports.json'),'utf8'));
const expected=['flybit','xiyou','cocoduck','xingchen-cloud','feiniao-speed','feiniaoyun','miaomiao-cloud','wgetcloud','jisu-cloud','mojie','dage-cloud','yangfanyun'];
const airports=[...data.airports].sort((a,b)=>a.order-b.order);
assert.deepEqual(airports.map(a=>a.id),expected,'机场顺序或范围不正确');
assert.deepEqual(airports.map(a=>a.order),expected.map((_,i)=>i+1));
assert.equal(airports[0].referral_url,'https://goflybit.com/register?code=m4qRDLA1');
assert.equal(airports[1].referral_url,'https://e.xiyou666.xyz/?code=s7S4hVxm');
assert.equal(airports[3].referral_url,'https://xc1.luniu8.com/?code=det68imC');
const referralUrls=new Set(airports.map(a=>a.referral_url));
for(const a of airports){
  assert.equal(new URL(a.referral_url).protocol,'https:',a.id);
  assert(a.featured.length>0&&a.featured.length<=6,a.id);
  assert.equal(new Set(a.featured).size,a.featured.length,a.id);
  for(const index of a.featured)assert(a.plans[index],`${a.id}: 代表套餐不存在`);
  for(const p of a.plans){
    assert(Number.isFinite(p.price)&&p.price>0,`${a.id}: 价格不正确`);
    assert(p.name&&p.billing&&p.traffic&&p.devices&&p.route,`${a.id}: 套餐字段不完整`);
    if(p.kind==='monthly')assert.equal(p.stars,5,a.id);
    else if(p.kind==='quarterly')assert.equal(p.stars,4,a.id);
    else if(p.kind==='annual')assert.equal(p.stars,2,a.id);
    else if(['one-time','paid-trial'].includes(p.kind))assert([4,5].includes(p.stars),a.id);
    else assert.equal(p.stars,null,a.id);
  }
}
const files=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){
  if(item.name==='.git')continue;
  assert(!item.isSymbolicLink(),'不应依赖外部软链接');
  const target=path.join(dir,item.name);
  if(item.isDirectory())await walk(target);else files.push(target);
}}
await walk(root);
const markdown=new Map();
// Keep excluded campaign wording out of delivered content and data.
const excluded=new RegExp(String.raw`\u514d\u8d39.{0,8}\u8bd5\u7528|\u4f18\u60e0\u7801|\u0056\u0050\u004e\u004f\u004f\u004c|\b\u0032GB\b`,'i');
for(const file of files){
  if(/\.(?:jpe?g|webp|png|gif)$/i.test(file))continue;
  const text=await readFile(file,'utf8');
  assert(!excluded.test(text),`${path.relative(root,file)}: 出现不应纳入的活动文案`);
  if(!file.endsWith('.md'))continue;
  assert.equal((text.match(/^# /gm)||[]).length,1,`${file}: 应有一个主标题`);
  assert(!/<details\b/i.test(text),`${file}: 表格应直接展示`);
  assert(!/<script\b|application\/ld\+json/i.test(text),`${file}: Markdown不应插入网页脚本`);
  let inCode=false;
  const rendered=[];
  for(const line of text.split(/\r?\n/)){
    if(line.startsWith('```')){inCode=!inCode;continue;}
    if(!inCode)rendered.push(line);
  }
  assert(!inCode,`${file}: 代码块未闭合`);
  const visible=rendered.join('\n');
  const anchors=new Set([...visible.matchAll(/<a\s+id="([^"]+)"/g)].map(m=>m[1]));
  const headingCounts=new Map();
  for(const [,heading] of visible.matchAll(/^#{1,6}\s+(.+)$/gm)){
    const slug=heading.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu,'').replace(/\s/g,'-');
    const count=headingCounts.get(slug)||0;headingCounts.set(slug,count+1);anchors.add(slug+(count?`-${count}`:''));
  }
  const lines=visible.split('\n');
  for(let i=0;i<lines.length;i++){
    if(!/^\|[-: |]+\|$/.test(lines[i]))continue;
    const columns=line=>line.split('|').length-2;
    const count=columns(lines[i]);
    assert.equal(columns(lines[i-1]),count,`${file}: 表头列数不一致`);
    for(let j=i+1;j<lines.length&&lines[j].startsWith('|');j++)assert.equal(columns(lines[j]),count,`${file}:${j+1}: 表格列数不一致`);
    if(lines[i-1].includes('推荐指数'))assert(lines[i].endsWith(':---:|'),`${file}: 星级未居中`);
  }
  markdown.set(file,{visible,anchors});
}
let localLinks=0,officialEntries=0;
for(const [file,{visible}] of markdown){
  const targets=[...visible.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)\)/g),...visible.matchAll(/<(?:img|source)\b[^>]*\b(?:src|srcset)="([^"]+)"/g)];
  for(const [,raw] of targets){
    if(/^https?:/.test(raw)){new URL(raw);continue;}
    const [url,fragment]=raw.split('#');
    const target=url?path.resolve(path.dirname(file),decodeURIComponent(url)):file;
    assert(target===root||target.startsWith(root+path.sep),`${file}: 链接超出本目录 ${raw}`);
    assert((await stat(target)).isFile(),`${file}: 目标不是文件 ${raw}`);
    if(fragment)assert(markdown.get(target)?.anchors.has(decodeURIComponent(fragment)),`${file}: 锚点不存在 ${raw}`);
    localLinks++;
  }
  for(const [,url] of visible.matchAll(/^## \[👉 点击进入官网\]\((https:[^)]+)\)$/gm)){
    assert(referralUrls.has(url),`${file}: 官网入口与资料库不一致`);officialEntries++;
  }
}
for(const a of airports){
  const file=path.join(root,`docs/airport-${a.id}.md`);
  assert(markdown.get(file)?.visible.includes(`## [👉 点击进入官网](${a.referral_url})`),`${a.id}: 缺少统一官网入口`);
}
const homepage=markdown.get(path.join(root,'README.md')).visible;
const homepageIds=[...homepage.matchAll(/<a id="([^"]+)"/g)].map(m=>m[1]).filter(id=>expected.includes(id));
assert.deepEqual(homepageIds,expected,'首页机场顺序不一致');
assert.equal((markdown.get(path.join(root,'docs/faq.md')).visible.match(/^### \d+\./gm)||[]).length,32);
assert.equal(officialEntries,31,'首页、详情和场景官网入口数量不正确');
console.log(`检查通过：${files.length}个文件、${markdown.size}篇Markdown、12家机场、${airports.reduce((n,a)=>n+a.plans.length,0)}条套餐、${localLinks}个本地链接、${officialEntries}个统一官网入口。`);
