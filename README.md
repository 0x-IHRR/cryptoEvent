# 交易所活动榜

React、Vite、TypeScript 和 Express 项目，目标是整理交易所、钱包及链上协议的活动。

## 当前数据状态

活动只会来自人工核验记录或成功读取的官方来源。Bybit、Bitget、KuCoin 使用公开公告 API；Binance 使用官方 Latest Activities 页面数据接口；Gate、HTX 读取官方活动分类页面；MEXC 读取官方 Ongoing Events 分类页。Gate 当前在本地采集环境没有返回可识别的活动详情链接，健康页会标记为受限并保留人工补录入口。HTX 和 Binance 列表未提供活动起止时间时，记录会标为“待核实”，不计入进行中活动。OKX Wallet 监控 X Trade、X Launch、X Stake 页面接口，并解析 X Liquidity 页面当前公开的活动池和动态 APY；该页面接口未列入 OKX 公开 API 文档。Paradex、Aster 和 Lighter 通过官方 Perp DEX 积分规则页监控持续中的积分活动。

链上奖励通过 Merkl 官方分页 API 接入，当前覆盖 Uniswap、PancakeSwap、Aave、Morpho、Compound、Curve、Balancer、Aerodrome 和 Venus 的公开激励活动。Merkl 是外部活动聚合与奖励分发接口，活动可能由协议、项目方或第三方发起，不代表协议官方统一承诺奖励。页面使用 API 给出的活动说明、参与步骤、campaign 时间和奖励 token 配置；APR 与每日奖励属于动态值，奖池只在能从 campaign 配置准确换算时展示。池子直达链接只接受预设的协议官方域名，无法验证时回退到协议官网入口并标注。该接入不表示覆盖了所有链上协议或链上未被 Merkl 收录的激励。

已接入的 Perp DEX 激励包括 Paradex Season 3、Aster Convergence Stage 6、Lighter on Robinhood Chain Points。钱包活动目前接入 OKX Wallet Boost 页面及可识别的钱包类交易所公告；这不代表已覆盖所有钱包活动。旧种子记录保存在 `data/unverified-seed-activities.json`，不会作为真实活动展示。

长驻服务器启动时采集一次，并每 30 分钟自动刷新。`GET /api/refresh` 仅供携带 `CRON_SECRET` 的定时调用；页面的手动刷新使用 `POST /api/refresh`。公开行情 API 连通性检查与活动采集状态分别展示。

## Run Locally

**Prerequisites:** Node.js


1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local` to enable structured-field AI analysis.
3. Start the app: `npm run dev`

Gemini API usage is subject to model-specific free quotas and rate limits. The AI currently analyzes saved activity fields only; it does not fetch official pages or X posts.
