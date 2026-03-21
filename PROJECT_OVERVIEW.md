# DomainKeeper 项目总览

## 当前仓库结构

这个仓库现在只维护一套 Cloudflare Worker 版本：

```text
domainkeeper/
├── domainkeeper.js      # 唯一维护中的 Worker 入口
├── README.md            # 项目说明与部署文档
├── wrangler.toml        # Wrangler 配置
└── corn.svg             # 项目图标
```

旧的简单版和自托管版已经从 GitHub 主仓库移除，只保留本地归档，不再作为公开版本维护。

## 当前架构

- 运行平台：Cloudflare Workers
- 数据存储：Cloudflare KV（绑定名必须为 `DOMAIN_INFO`）
- 数据来源：Cloudflare Zone 列表 + 多渠道 WHOIS 查询
- 页面形态：前台展示页 + 后台管理页
- 维护方式：单文件部署，避免多版本分叉

## 核心能力

- 自动同步 Cloudflare 顶级域名
- 支持维护 CF 二级域名与自定义域名
- 前台支持按列排序和筛选
- 后台支持行内编辑与批量保存
- 后台支持全局更新 WHOIS
- 页面内展示 WHOIS 查询链路、命中渠道和原始 WHOIS
- 支持 GitHub Star 和可选奶茶赞助入口

## 部署入口

请直接参考 [README.md](./README.md)。

标准部署命令：

```bash
npx wrangler deploy
```

## 说明

- GitHub 仓库默认不包含旧版本代码
- 默认不启用隐藏统计或跨站遥测
- 如果后续需要集中统计，建议做成显式开关，并在 README 和页面里明确告知
