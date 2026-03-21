# <img src="./corn.svg" alt="玉米图标" width="28" valign="middle" /> DomainKeeper

DomainKeeper 是一个基于 Cloudflare Workers + KV 的域名面板，用来集中展示：

- 顶级域名
- Cloudflare 二级域名
- 自定义域名
- 注册商、注册日期、到期时间、剩余天数
- WHOIS 查询链路和原始 WHOIS

当前仓库只维护这一套 Worker 版本：

- 入口文件：[domainkeeper.js](./domainkeeper.js)

旧的简单版和自托管版已经不再作为 GitHub 主仓库内容维护，只做本地归档。

![DomainKeeper 界面预览](https://github.com/user-attachments/assets/bbd9b5ec-f3c6-4593-9a08-2f894b32c9ab)

## 功能概览

- 自动同步 Cloudflare 账户下的顶级域名
- 支持手动添加和维护自定义域名
- 前台按表格展示，支持按列排序和筛选
- 后台支持行内编辑、批量保存
- 后台支持全局更新 WHOIS
- 后台支持页内查看 WHOIS 查询过程、最终来源和完整原始 WHOIS
- 二级域名支持分开维护一级域名和二级域名的注册/到期时间
- WHOIS 结果缓存到 Cloudflare KV
- 网站和 README 内置玉米图标
- 页面内直接提供 GitHub、Star 和可选的“奶茶支持”入口
- 支持默认开启、可手动关闭的统计中心，只统计部署数、访问 IP、最近在线时间

## 部署要求

- Cloudflare Workers
- 一个 KV Namespace，绑定名必须为 `DOMAIN_INFO`
- Cloudflare API Token
- Wrangler 或 Cloudflare Dashboard

当前 Worker 使用了：

- `cloudflare:sockets` 直连 WHOIS
- Cloudflare KV 保存域名数据和 WHOIS 缓存

## 快速部署

### 1. 准备 KV

创建一个 KV Namespace，并绑定到 Worker：

- Binding 名称：`DOMAIN_INFO`

如果缺少这个绑定，Worker 会直接报错：

```txt
Missing DOMAIN_INFO binding
```

### 2. 配置环境变量 / Secrets

当前版本从 Worker 运行时读取以下变量：

| 变量名 | 必填 | 说明 |
|---|---|---|
| `CF_API_KEY` | 是 | Cloudflare API Token，用于读取 Zone 列表 |
| `ADMIN_PASSWORD` | 是 | 后台登录密码，同时用于后台接口鉴权 |
| `ACCESS_PASSWORD` | 否 | 前台访问密码；留空则首页可直接访问 |
| `DONATE_URL` | 否 | 网页“请我喝杯奶茶”按钮的跳转地址 |
| `TELEMETRY_CENTER_ENABLED` | 否 | 当前实例作为统计中心时设为 `true` |
| `TELEMETRY_OPT_IN` | 否 | 默认开启；设为 `false` 时关闭上报 |
| `TELEMETRY_SERVER_URL` | 否 | 指向你的统计中心 Worker 地址 |
| `TELEMETRY_TOKEN` | 否 | 统计中心和客户端共用的上报 Token |
| `TELEMETRY_DEPLOYMENT_ID` | 否 | 自定义部署标识；不填则默认使用当前 host |
| `TELEMETRY_DEPLOYMENT_LABEL` | 否 | 统计中心里展示的部署名称 |
| `TENCENTCLOUD_SECRET_ID` | 否 | 腾讯云 API SecretId，用于 DNSPod `DescribeDomainWhois` |
| `TENCENTCLOUD_SECRET_KEY` | 否 | 腾讯云 API SecretKey，用于 DNSPod `DescribeDomainWhois` |
| `APIHZ_USER_ID` | 否 | APIHZ 开发者 ID |
| `APIHZ_KEY` | 否 | APIHZ 开发者 Key |
| `APIHZ_PREFERRED_TLDS` | 否 | 逗号分隔；这些后缀优先走 APIHZ，默认含 `ua` |
| `WHOIS_PROXY_URL` | 否 | HTTP WHOIS 代理地址 |
| `ENABLE_WHOIS_PROXY_FALLBACK` | 否 | `true` 时，普通后缀在直连 / RDAP 失败后回退到代理 |
| `WHOIS_PROXY_PREFERRED_TLDS` | 否 | 逗号分隔；这些后缀优先走代理，默认含 `uy` |
| `ONEFOUR_LOOKUP_URL` | 否 | 额外 WHOIS HTTP 查询源 |
| `ONEFOUR_LOOKUP_PREFERRED_TLDS` | 否 | 逗号分隔；这些后缀优先走该查询源 |

建议把所有敏感配置都放进 Worker Secret，不要写进源码。

### 3. 配置 Cloudflare API Token

`CF_API_KEY` 实际上建议使用 Cloudflare API Token，而不是 Global API Key。

最少建议包含：

- `Zone:Read`

如果你只同步指定账号或指定 Zone，建议把权限继续收窄。

### 4. 部署

仓库里已经包含 [wrangler.toml](./wrangler.toml)，可直接部署：

```bash
npx wrangler deploy
```

部署后默认可访问：

- `/`：前台页面
- `/login`：前台登录
- `/admin`：后台页面
- `/admin-login`：后台登录
- `/whois/example.com`：返回结构化 WHOIS 查询结果

## WHOIS 查询策略

当前版本不是单一来源，而是按域名情况走多级回退。

优先链路大致包括：

- Worker 直连 WHOIS
- 权威 RDAP
- `rdap.org`
- `.xyz` 专用补源
- HTTP WHOIS 代理
- APIHZ
- 腾讯云 DNSPod `DescribeDomainWhois`

注意：

- 腾讯云 DNSPod 这条接口并不是所有域名后缀都支持
- 例如标准主域名通常可返回结果，但像某些特殊层级域名会直接判定无效
- 所以它在当前项目里是“额外查询渠道”，不是唯一来源

### 二级域名策略

对于 `a.b.example.tld` 这类域名，Worker 会优先尝试：

1. 查当前域名
2. 沿父域名链回溯
3. 根据可用结果补一级域名信息
4. 二级域名自己的时间优先展示，父域名时间作为兜底

## 缓存策略

- WHOIS 正常结果默认缓存 1 小时
- 查询失败缓存 10 分钟后重试
- 页面渲染时优先使用 KV 中已有结果
- 后台点“全局更新 WHOIS”时会立即刷新
- WHOIS 失败不会覆盖已有有效注册商 / 日期

## 前后台说明

### 前台

- 顶级域名、CF 二级域名、自定义域名分开展示
- 支持按列排序
- 支持按列筛选
- 默认按“剩余天数升序”展示

### 后台

- 行内编辑注册商和日期
- 日期输入统一为 `YYYYMMDD`
- 空值会高亮提示补录
- 支持“保存全部修改”
- 支持“同步 Cloudflare 域名”
- 支持“全局更新 WHOIS”
- 支持单条“查询 WHOIS”
- WHOIS 查询结果在页面内展示，不用浏览器弹窗
- 开启统计中心后，会在后台显示部署数、访问 IP 和最近在线时间

## GitHub / Star / 奶茶支持

网页里现在直接提供：

- GitHub 仓库按钮
- GitHub Star 按钮
- 可选的“请我喝杯奶茶”按钮

如果要启用奶茶支持按钮，只需要给 Worker 配置：

```txt
DONATE_URL=https://your-donate-page.example.com
```

## 统计与隐私

- 统计中心支持默认开启，也支持手动关闭
- 如果某个实例不想上报，显式设置 `TELEMETRY_OPT_IN=false` 即可
- 只统计部署数、访问 IP、最近在线时间

### 统计中心用法

把你自己的 Worker 作为统计中心：

```txt
TELEMETRY_CENTER_ENABLED=true
TELEMETRY_TOKEN=your-shared-token
```

客户实例默认会上报；如果你要显式配置，可写成：

```txt
TELEMETRY_SERVER_URL=https://your-center.example.workers.dev
TELEMETRY_TOKEN=your-shared-token
TELEMETRY_DEPLOYMENT_ID=my-site-01
TELEMETRY_DEPLOYMENT_LABEL=My Site 01
```

如果某个实例不想上报，增加：

```txt
TELEMETRY_OPT_IN=false
```

默认情况下，客户端访问 `/`、`/login`、`/admin`、`/admin-login` 时会把最近访问 IP 和在线时间上报到你的中心 Worker。你的后台页面会多出“统计中心”面板。

## 自定义标题

如果你要修改网站标题，编辑 [domainkeeper.js](./domainkeeper.js) 顶部常量：

```javascript
const CUSTOM_TITLE = "培根的玉米大全";
```

## 安全建议

- `ADMIN_PASSWORD` 使用强密码
- 所有密钥都放 Worker Secret
- 不要把真实密钥提交到 Git
- 如果密钥曾经明文出现在聊天、截图或日志里，请及时轮换
- `TELEMETRY_TOKEN` 不要和后台密码共用

## 交流群

- TG 群：<https://t.me/+UI8Yf3M7bB8yMmVl>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ypq123456789/domainkeeper&type=Date)](https://star-history.com/#ypq123456789/domainkeeper&Date)
