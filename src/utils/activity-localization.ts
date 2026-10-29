import { Activity } from '../types/activity.js';

const TITLE_PREFIX_TRANSLATIONS: Partial<Record<Activity['exchange'], Array<[string, string]>>> = {
  Binance: [
    ['APAC Exclusive:', '亚太地区专属活动：'],
    ['Africa Exclusive:', '非洲地区专属活动：'],
    ['Binance Blockchain Week Starter Pack Challenge:', 'Binance 区块链周礼包挑战：'],
    ['Binance Launches KGST/USDT Zero Trading Fee Campaign', 'Binance 推出 KGST/USDT 零手续费活动'],
    ['Binance Lifestyle Cashback Campaign:', 'Binance 生活消费返现活动：'],
    ['Binance Lite Loan Promotion Extended:', 'Binance Lite 借贷优惠延期：'],
    ['Binance P2P Kenya:', 'Binance P2P 肯尼亚站：'],
    ['Binance Pay Exclusive:', 'Binance Pay 专属活动：'],
    ['Binance Presents The Blockchain 100 Award', 'Binance 区块链 100 榜单评选'],
    ['Binance Starter Carnival:', 'Binance 新手嘉年华：'],
    ['Community Voice:', '社区意见征集：'],
    ['Halloween Pumpkin Frenzy:', '万圣节南瓜狂欢：'],
    ['Hold RLUSD in Any Binance Accounts', '在任意 Binance 账户持有 RLUSD'],
    ['Introducing Binance Pick:', 'Binance Pick 预测活动：'],
    ['MET Trading Tournament:', 'MET 交易锦标赛：'],
    ['New User bStocks Convert Campaign:', '新用户 bStocks 兑换活动：'],
    ['New Users Exclusive:', '新用户专属活动：'],
    ['Next Stop - BBW:', '下一站：Binance 区块链周：'],
    ['Pick the Closing Price of the Magnificent 7', '预测“七巨头”收盘价'],
    ['Qafila 2026:', 'Qafila 2026 活动：'],
    ['Region-Exclusive Referral Rush 2026:', '指定地区专属邀请活动 2026：'],
    ['Region-Exclusive:', '指定地区专属活动：'],
    ['S16: Legends Assemble', 'S16：传奇集结'],
    ['South Asia Exclusive:', '南亚地区专属活动：'],
    ['The Binance Starter Carnival:', 'Binance 新手嘉年华：'],
    ['Trade Futures & Win:', '合约交易赢奖励：'],
  ],
  Bybit: [
    ['Bybit × XAUE Protocol:', 'Bybit × XAUE Protocol：'],
    ['Lucky Jackpot:', '幸运大奖抽奖：'],
    ['PIEVERSE Token Splash', 'PIEVERSE 代币奖励活动'],
    ['RLUSD Hold & Earn Phase', 'RLUSD 持有生息第'],
    ['SEA Festival of Lights:', 'SEA 灯光节活动：'],
    ['USD1 Hold & Earn Month', 'USD1 持有生息第'],
    ['[WSOT 2026]', '[WSOT 2026]'],
  ],
  Bitget: [
    ['Bitget Streamer Incentive Program:', 'Bitget 主播激励计划：'],
    ['Bitget AI Alliance rewards:', 'Bitget AI 联盟奖励：'],
  ],
  HTX: [
    ['Boost SOL ETF Approval:', 'SOL ETF 获批庆祝活动：'],
    ['Dive into Summer Fun on HTX:', 'HTX 夏日狂欢：'],
    ['Ethereum Turns 10:', '以太坊十周年：'],
    ['Exclusive for Futures Returning Users:', '合约回归用户专属活动：'],
    ['HTX Affiliate Exclusive:', 'HTX 合作伙伴专属活动：'],
    ['HTX Double 11 Spree Points Challenge', 'HTX 双 11 积分挑战'],
    ['HTX Mars Program Special Edition:', 'HTX 火星计划特别活动：'],
    ['HTX Spot Trading Rewards Week:', 'HTX 现货交易奖励周：'],
    ['HTX TradFi Trading Check-In Challenge:', 'HTX TradFi 交易签到挑战：'],
    ['Limited-Time Autumn Giveaway:', '限时秋季抽奖：'],
    ['Limited-Time Spot Grid Benefits:', '限时现货网格优惠：'],
    ['Points Contest II:', '积分竞赛 II：'],
    ['Power Up Your 2026:', '2026 能量加码活动：'],
    ['Summer Gift Season:', '夏日礼遇季：'],
    ['TRON Shining Globally!', 'TRON 闪耀全球！'],
    ['Trade and Earn This Summer:', '今夏交易赢奖励：'],
    ['USDe Bonanza Is Live!', 'USDe 奖励活动开启！'],
    ['[Hot Crypto Lucky Draw]', '[热门加密货币幸运抽奖]'],
    ['🍕Trade Your Way to Fine Spirits', '🍕交易赢名酒'],
  ],
  KuCoin: [
    ['Halloween Dual Investment Treats:', '万圣节双币投资礼遇：'],
    ['KuCoin Content Mining Rewards Distribution Notice', 'KuCoin 内容挖矿奖励发放公告'],
    ['KuCoin Upgrades VIP Earn Benefits:', 'KuCoin 升级 VIP 理财权益：'],
    ['KuMining Halloween', 'KuMining 万圣节活动'],
    ['NaoX Protocol (NAORIS) Listing Campaign', 'NaoX Protocol（NAORIS）上线活动'],
    ['Ritual (RITUAL) Listing Campaign', 'Ritual（RITUAL）上线活动'],
    ['Stablecoin Yield Boost', '稳定币收益加成活动'],
  ],
  MEXC: [
    ['ADI Carnival:', 'ADI 嘉年华：'],
    ['Airdrop+: Axis Robotics (AXIS) Listing', 'Airdrop+：Axis Robotics（AXIS）上线奖励'],
    ['Airdrop+: Kamirai (KAMIRAI) Listing', 'Airdrop+：Kamirai（KAMIRAI）上线奖励'],
    ['Airdrop+: NeoSoul (DNA) Listing', 'Airdrop+：NeoSoul（DNA）上线奖励'],
    ['Daily Check-In Rewards Program:', '每日签到奖励计划：'],
    ['Earnings Season Battle:', '理财收益季挑战：'],
    ['MEXC Earn Carnival:', 'MEXC 理财嘉年华：'],
    ['MEXC Trading Carnival:', 'MEXC 交易嘉年华：'],
    ['Midterm Market Rush:', '年中市场冲刺：'],
    ['PUFFER Carnival:', 'PUFFER 嘉年华：'],
  ],
};

const DYNAMIC_TITLE_RULES: Partial<Record<Activity['exchange'], Array<[RegExp, (match: RegExpMatchArray) => string]>>> = {
  Binance: [
    [/^Binance Alpha Trading Competition: Trade (.+?) \(([A-Z0-9]+)\) and Share \$([\d,.]+K?) Worth of Rewards(?: \(([^)]+)\))?/i, (m) => `Binance Alpha 交易赛：交易 ${m[1]}（${m[2]}），瓜分价值 ${m[3]} 美元的奖励${m[4] ? `（${m[4]}）` : ''}`],
    [/^Spot Trading Tournament Season (\d+): Trade to Share Up to ([\d,.]+) ([A-Z0-9]+) Token Vouchers/i, (m) => `现货交易锦标赛第 ${m[1]} 季：参与交易，瓜分最高 ${m[2]} ${m[3]} 代币券`],
    [/^Binance Earn: Enjoy Up to ([\d.]+)% APR (?:on|with) (.+?) Flexible Products/i, (m) => `Binance Earn：${m[2]} 活期产品年化收益最高 ${m[1]}%`],
    [/^Word of the Day: Test Your Knowledge on [“\"](.+?)[”\"] to Unlock ([A-Z]+) Rewards/i, (m) => `每日一词：完成“${m[1]}”知识问答，解锁 ${m[2]} 奖励`],
  ],
  Bybit: [
    [/^Bybit × XAUE Protocol: Earn ([\d.]+)% Fixed APR on (.+)$/i, (m) => `Bybit × XAUE Protocol：持有 ${m[2]}，享固定年化 ${m[1]}%`],
    [/^USD1 Hold & Earn Month (\d+): ([\d,.]+[KMB]?) ([A-Z]+) Rewards, Up to ([\d.]+)% APR$/i, (m) => `USD1 持有生息第 ${m[1]} 期：奖励 ${m[2]} ${m[3]}，年化最高 ${m[4]}%`],
    [/^RLUSD Hold & Earn Phase (\d+): Up to ([\d.]+)% APR on RLUSD & ([\d,.]+[KMB]?) XRP Rewards$/i, (m) => `RLUSD 持有生息第 ${m[1]} 期：RLUSD 年化最高 ${m[2]}%，另有 ${m[3]} XRP 奖励`],
  ],
  Bitget: [
    [/^Bitget Streamer Incentive Program: Incentive Program Streamer Ranking Announcement$/i, () => 'Bitget 主播激励计划：主播榜单公告'],
    [/^Bitget AI Alliance rewards: Get ([\d.]+)% cashback on deposits, with up to ([\d,.]+) USDT in airdrops$/i, (m) => `Bitget AI 联盟奖励：充值返现 ${m[1]}%，另有最高 ${m[2]} USDT 空投`],
  ],
};

const EXACT_ACTIVITY_TITLE_TRANSLATIONS: Partial<Record<Activity['exchange'], Record<string, string>>> = {
  Binance: {
    '7 Years of Binance P2P: 1 BTC Up for Grabs': 'Binance P2P 七周年：赢取 1 BTC 奖励',
    'Binance Blockchain Week Starter Pack Challenge: Win 1 of 20 Free Tickets to BBW 2026!': 'Binance 区块链周新手礼包挑战：赢取 20 张 2026 年活动门票之一',
    'APAC Exclusive: Win a Fully Hosted Trip to Binance Blockchain Week 2026': '亚太地区专属：赢取 Binance 区块链周 2026 全程包办行程',
    'Africa Exclusive: Merchant Referral Campaign - Earn 50 USDT Each on Binance P2P': '非洲地区专属：Binance P2P 商家邀请活动，每成功邀请一人可赚取 50 USDT',
    'Binance Lifestyle Cashback Campaign: Shop and Earn Up to 10 USDT Cashback!': 'Binance 生活消费返现活动：购物最高返现 10 USDT',
    'Binance Lite Loan Promotion Extended: Enjoy Simple Borrowing with 50% Off Service Fee!': 'Binance Lite 借贷优惠延期：服务费五折',
    'Binance P2P Kenya: Earn USDT Rewards with Lightning Instant M-pesa & Instant M-pesa Paybill': 'Binance P2P 肯尼亚站：使用 M-Pesa 快速支付赚取 USDT 奖励',
    'Binance Pay Exclusive: Get up to 20% Off Mobile Top-Ups in Selected Regions!': 'Binance Pay 专属活动：指定地区手机充值最高优惠 20%',
    'Binance Presents The Blockchain 100 Award 2026': 'Binance 区块链 100 榜单评选 2026',
    'Binance Starter Carnival: Trade bStocks to Share Up to 60,000 USDT in AAPLB & NVDAB!': 'Binance 新手嘉年华：交易 AAPLB 与 NVDAB，瓜分最高 60,000 USDT',
    'Community Voice: Give Feedback on DYOR to Share 500 USDC in Rewards': '社区意见征集：提交 DYOR 反馈，瓜分 500 USDC 奖励',
    'Community Voice: Share Binance AI Feedback and Share 500 USDC in Rewards': '社区意见征集：分享对 Binance AI 的反馈，瓜分 500 USDC 奖励',
    'Community Voice: Share Binance AI Feedback and Share 500 USDC!': '社区意见征集：分享对 Binance AI 的反馈，瓜分 500 USDC 奖励',
    'Earn 2% APR on USDC Held in Your Binance Futures and Portfolio Margin Accounts (2026-10-26)': '在 Binance 合约及组合保证金账户持有 USDC，享年化 2%（2026-10-26）',
    'Halloween Pumpkin Frenzy: Trade, Earn and Invite Friends to Share a $1.7M Prize Pool': '万圣节南瓜狂欢：交易、赚取奖励并邀请好友，瓜分 170 万美元奖池',
    'Hold RLUSD in Any Binance Accounts to Share 600,000 XRP Rewards': '在任意 Binance 账户持有 RLUSD，瓜分 600,000 XRP 奖励',
    'Introducing Binance Pick: Predict and Climb the Leaderboards to Share 1,000,000 USDC!': 'Binance Pick 预测活动：参与预测并登上排行榜，瓜分 1,000,000 USDC',
    'MET Trading Tournament: Trade to Share Up to 400 BNB Token Vouchers': 'MET 交易锦标赛：参与交易，瓜分最高 400 BNB 代币券',
    'New User bStocks Convert Campaign: Join and Share a Reward Pool of Up to 110 SPCXB': '新用户 bStocks 兑换活动：参与瓜分最高 110 SPCXB 奖励',
    'New Users Exclusive: Subscribe to USDT Simple Earn Flexible Products to Enjoy 30% Bonus APR!': '新用户专属：申购 USDT 活期简单赚币，享额外 30% 年化收益',
    'Next Stop - BBW: Bring Qualified Referrals to Earn Your Spot at Binance Blockchain Week 2026!': '下一站：Binance 区块链周。邀请符合条件的好友，赢取 2026 年活动席位',
    'Pick the Closing Price of the Magnificent 7 and Share 1,050 USDC!': '预测“七巨头”收盘价，瓜分 1,050 USDC',
    'Qafila 2026: Celebrate the Journey Together and Share $1,000,000 in USDC Token Vouchers!': 'Qafila 2026：共同庆祝，瓜分价值 1,000,000 美元的 USDC 代币券',
    'Region-Exclusive Referral Rush 2026: Invite Friends to Share $550,000 in USDT Token Vouchers': '指定地区专属邀请活动 2026：邀请好友瓜分价值 550,000 美元的 USDT 代币券',
    'Region-Exclusive: Invite Friends to Binance and Share a 30,000 USDT Prize Pool': '指定地区专属活动：邀请好友加入 Binance，瓜分 30,000 USDT 奖池',
    'S16: Legends Assemble Now Accessible on Binance Wallet – Predict LoL World Championship Matches and Share 150,000 USDT in Rewards!': 'S16：传奇集结登陆 Binance Wallet，预测英雄联盟全球总决赛赛果，瓜分 150,000 USDT',
    'South Asia Exclusive: Join the SpaceX Button Game and Win $10,000 Worth of SPCXB': '南亚专属活动：参加 SpaceX 按钮游戏，赢取价值 10,000 美元的 SPCXB',
    'The Binance Starter Carnival: Gold Edition Pack - Share $200,000 Worth of Rewards': 'Binance 新手嘉年华黄金礼包：瓜分价值 200,000 美元的奖励',
    'Trade Futures & Win: Complete Tasks to Share 200 BNB in Rewards!': '合约交易赢奖励：完成任务，瓜分 200 BNB',
  },
  Bybit: {
    'Lucky Jackpot: Spin to Win 8,888 USDT, iPhone 18 Pro Max, Gold 9999 & More': '幸运大奖抽奖：赢取 8,888 USDT、iPhone 18 Pro Max、足金等好礼',
    'PIEVERSE Token Splash— Grab a share of the 11000 PIEVERSE prize pool .': 'PIEVERSE 代币奖励活动：瓜分 11,000 PIEVERSE 奖池',
    'SEA Festival of Lights: Trade, Collect & Win!': 'SEA 灯光节：交易、收集并赢取奖励',
    '[WSOT 2026] Squad or Solo: Compete to Win Up to $10M!': '[WSOT 2026] 组队或单人参赛，赢取最高 1,000 万美元奖励',
  },
  HTX: {
    'Boost SOL ETF Approval: $100,000 in Airdrop Rewards and Solana Smartphones Up for Grabs!': '庆祝 SOL ETF 获批：赢取价值 100,000 美元的空投奖励及 Solana 手机',
    'Dive into Summer Fun on HTX: Grab Your Share of $60,000 Airdrops & Free LABUBU Blind Boxes!': 'HTX 夏日狂欢：瓜分价值 60,000 美元的空投并赢取 LABUBU 盲盒',
    'Ethereum Turns 10: Celebrate with $500,000 in Rewards on HTX!': '以太坊十周年：在 HTX 参与活动，瓜分价值 500,000 美元的奖励',
    'Exclusive for Futures Returning Users: Welcome Back! Log in for a Chance to Win Up to 1 BTC in Lucky Draw': '合约回归用户专属：欢迎回来！登录参与抽奖，赢取最高 1 BTC',
    'HTX Affiliate Exclusive: TradFi Trading Challenge for Invitees': 'HTX 合作伙伴专属：受邀用户 TradFi 交易挑战',
    'HTX Double 11 Spree Points Challenge Is Live! Collect Gold Coins and Redeem Dyson Products': 'HTX 双 11 积分挑战开启：收集金币兑换 Dyson 产品',
    'HTX Mars Program Special Edition: Five New Contenders Unveiled! The 12-Member Space Candidate Team Is Now Set!': 'HTX 火星计划特别版：五位新候选人亮相，12 人太空候选团队已确定',
    'HTX Mars Program Special Edition: Win a $6M Space Ticket and Journey into the Universe with Justin!': 'HTX 火星计划特别版：赢取价值 600 万美元的太空之旅，与 Justin 一同探索宇宙',
    'HTX Spot Trading Rewards Week: Enjoy 200% Maker Fee Rebates + Win a Huawei Mate 80 Pro Max!': 'HTX 现货交易奖励周：享 200% Maker 手续费返还，并有机会赢取 Huawei Mate 80 Pro Max',
    'HTX TradFi Trading Check-In Challenge: Join and Share a 100,000 USDT Prize Pool! I. Event Period': 'HTX TradFi 交易签到挑战：参与瓜分 100,000 USDT 奖池',
    'Limited-Time Autumn Giveaway: Win the Apple 2025 New Products in Our Lucky Draw': '限时秋季抽奖：赢取 Apple 2025 年新品',
    'Limited-Time Spot Grid Benefits: Trade XRP / DOGE / SOL and Enjoy 50% Fee Rebate': '限时现货网格优惠：交易 XRP、DOGE 或 SOL，享 50% 手续费返还',
    'Points Contest II: Collect New Year Lanterns & Redeem Gold Rewards': '积分竞赛 II：收集新年灯笼，兑换黄金奖励',
    'Power Up Your 2026: Earn Points and Redeem for Hermès Luxury on HTX': 'HTX 2026 能量加码活动：赚取积分兑换 Hermès 奢侈品',
    'Summer Gift Season: Join the Lucky Draw to Win a Xiaomi YU7 SUV and More!': '夏日礼遇季：参与抽奖赢取 Xiaomi YU7 汽车等好礼',
    'TRON Shining Globally! HTX Is Giving Away Massive Airdrops with Rewards for Everyone': 'TRON 闪耀全球：HTX 推出空投活动，人人有机会获得奖励',
    'Trade and Earn This Summer: $60,000 Up for Grabs!': '今夏交易赢奖励：瓜分 60,000 美元',
    'USDe Bonanza Is Live! Join Now to Share $10,000 in Rewards': 'USDe 奖励活动开启：立即参与瓜分 10,000 美元奖励',
    '[Hot Crypto Lucky Draw] Share $50,000 by Trading Trending Cryptos Spot - 100% Win': '[热门加密货币幸运抽奖] 交易热门现货币种，瓜分 50,000 美元，参与即有奖',
    '🍕Trade Your Way to Fine Spirits — Free Moutai Awaits! Points Contest III: Redeem World-Class Liquors with Pizza Points': '🍕交易赢名酒：免费茅台等你拿！积分竞赛 III，使用 Pizza 积分兑换名酒',
  },
  KuCoin: {
    'Halloween Dual Investment Treats: Earn Up to 250% APR + Get Up to 100% Bonus APR!': '万圣节双币投资礼遇：年化收益最高 250%，另享最高 100% 加息',
    'KuCoin Content Mining Rewards Distribution Notice (October 12 - October 18)': 'KuCoin 内容挖矿奖励发放公告（10 月 12 日至 10 月 18 日）',
    'KuCoin Upgrades VIP Earn Benefits: 6% APR for 30 Days and VIP Dual Investment Benefits': 'KuCoin 升级 VIP 理财权益：30 天年化 6%，并享 VIP 双币投资权益',
    'KuMining Halloween · Keep the Mine Lit — 50,000+ USDT in Rewards': 'KuMining 万圣节活动：点亮矿场，赢取 50,000+ USDT 奖励',
    'NaoX Protocol (NAORIS) Listing Campaign — 1,583,000 NAORIS Giveaway': 'NaoX Protocol（NAORIS）上线活动：赠送 1,583,000 NAORIS',
    'Ritual (RITUAL) Listing Campaign — 2,300,000 RITUAL Giveaway': 'Ritual（RITUAL）上线活动：赠送 2,300,000 RITUAL',
    'Stablecoin Yield Boost｜Earn Up to 7% APR with KCUSD': '稳定币收益加成：KCUSD 年化收益最高 7%',
  },
  MEXC: {
    'ADI Carnival: Deposit, Trade, and Spin for a Share of $50,000 in ADI': 'ADI 嘉年华：充值、交易并参与抽奖，瓜分 50,000 ADI',
    'Airdrop+: Axis Robotics (AXIS) Listing with 40,000 USDT in Rewards': 'Airdrop+：Axis Robotics（AXIS）上线活动，奖励 40,000 USDT',
    'Airdrop+: Kamirai (KAMIRAI) Listing with 40,000 USDT in Rewards': 'Airdrop+：Kamirai（KAMIRAI）上线活动，奖励 40,000 USDT',
    'Airdrop+: NeoSoul (DNA) Listing with 375,000 DNA & 10,000 USDT in Rewards': 'Airdrop+：NeoSoul（DNA）上线活动，奖励 375,000 DNA 和 10,000 USDT',
    'Daily Check-In Rewards Program: Keep Your Streak Alive & Redeem Exclusive Rewards': '每日签到奖励计划：连续签到，兑换专属奖励',
    'Earnings Season Battle: Join a Team & Share $100,000 in Rewards': '理财收益季挑战：加入团队，瓜分 100,000 美元奖励',
    'MEXC Earn Carnival: Deposit to Unlock More With Up to 600% APR': 'MEXC 理财嘉年华：充值解锁更多权益，年化收益最高 600%',
    'MEXC Trading Carnival: Chance to Win an iPhone Duo and Share $500,000': 'MEXC 交易嘉年华：赢取 iPhone 套装并瓜分 500,000 美元',
    'Midterm Market Rush: Trade the Buzz & Share $500,000 in Rewards': '年中市场冲刺：交易热门资产，瓜分 500,000 美元奖励',
    'PUFFER Carnival: Trade Daily, Climb the Leaderboard & Share 650,000 PUFFER': 'PUFFER 嘉年华：每日交易、冲击排行榜，瓜分 650,000 PUFFER',
  },
};

function translateSourceTitle(activity: Activity): string | null {
  const title = activity.title.trim();
  const exactEntries = Object.entries(EXACT_ACTIVITY_TITLE_TRANSLATIONS[activity.exchange] || {})
    .sort(([left], [right]) => right.length - left.length);
  const exactTranslation = exactEntries.find(([sourceTitle]) => title === sourceTitle || title.startsWith(sourceTitle));
  if (exactTranslation) return exactTranslation[1];
  for (const [pattern, translate] of DYNAMIC_TITLE_RULES[activity.exchange] || []) {
    const match = title.match(pattern);
    if (match) return translate(match);
  }
  const prefix = (TITLE_PREFIX_TRANSLATIONS[activity.exchange] || []).find(([english]) => title.startsWith(english));
  if (!prefix) return null;
  return `${prefix[1]}${title.slice(prefix[0].length).trim()}`.trim();
}

export function getChineseActivityTitle(activity: Activity): string | null {
  const sourceTranslation = translateSourceTitle(activity);
  if (sourceTranslation) return sourceTranslation;
  if (activity.exchange === 'Bitget') {
    const title = activity.title.trim();
    const alliance = title.match(/^Bitget AI Alliance rewards: Get ([\d.]+)% cashback on deposits, with up to ([\d,.]+) USDT in airdrops$/i);
    if (alliance) return `Bitget AI 联盟奖励：充值返现 ${alliance[1]}%，另有最高 ${alliance[2]} USDT 空投`;
    return null;
  }

  if (activity.exchange !== 'Merkl') return null;

  const title = activity.title.trim();
  const lendingMatch = title.match(/^(Lend|Borrow) (.+?) (on|from) (.+?)(?: \((.+)\))?$/i);
  if (lendingMatch) {
    const [, action, asset, relation, market, rawCondition] = lendingMatch;
    const condition = rawCondition?.includes('looping required')
      ? '（需要循环借贷）'
      : rawCondition?.includes('Self.xyz verified users only')
        ? '（仅限通过 Self.xyz 验证的用户）'
        : rawCondition ? `（${rawCondition}）` : '';
    if (action.toLowerCase() === 'borrow') {
      return relation.toLowerCase() === 'from'
        ? `从 ${market} 借入 ${asset}${condition}`
        : `在 ${market} 借入 ${asset}${condition}`;
    }
    return `在 ${market} 提供 ${asset}${condition}`;
  }

  const collateralMatch = title.match(/^Deposit (.+?) as collateral on (.+)$/i);
  if (collateralMatch) return `在 ${collateralMatch[2]} 将 ${collateralMatch[1]} 作为抵押品存入`;

  const depositMatch = title.match(/^Deposit (.+?) (on|in|into) (.+)$/i);
  if (depositMatch) return `在 ${depositMatch[3]} 存入 ${depositMatch[1]}`;

  const depositInMatch = title.match(/^Deposit in (.+)$/i);
  if (depositInMatch) {
    return `存入 ${depositInMatch[1].replace(/ - Verified users only$/i, '（仅限通过验证的用户）')}`;
  }

  const depositIntoMatch = title.match(/^Deposit into (.+)$/i);
  if (depositIntoMatch) return `存入 ${depositIntoMatch[1]}`;

  const holdMatch = title.match(/^Hold (.+?) on (.+)$/i);
  if (holdMatch) return `在 ${holdMatch[2]} 持有 ${holdMatch[1]}`;

  const liquidityMatch = title.match(/^Provide liquidity to (.+)$/i);
  if (liquidityMatch) return `为 ${liquidityMatch[1]} 流动性池提供流动性`;

  const shortUniswapTitle = title.match(/^Uniswap (.+)$/i);
  if (shortUniswapTitle) return `为 Uniswap ${shortUniswapTitle[1]} 流动性池提供流动性`;

  const supplyToMorphoVaultMatch = title.match(/^Supply to (?:the )?(.+?) vault on Morpho on (.+)$/i);
  if (supplyToMorphoVaultMatch) {
    return `在 ${supplyToMorphoVaultMatch[2]} 链的 Morpho 金库存入资产（${supplyToMorphoVaultMatch[1]}）`;
  }

  const supplyToMorphoViaCoinbaseMatch = title.match(/^Supply to (?:the )?(.+?) vault on Morpho from Coinbase$/i);
  if (supplyToMorphoViaCoinbaseMatch) {
    return `通过 Coinbase 向 Morpho 金库存入资产（${supplyToMorphoViaCoinbaseMatch[1]}）`;
  }

  const supplyToMorphoMatch = title.match(/^Supply to (?:the )?(.+?) on Morpho on (.+)$/i);
  if (supplyToMorphoMatch) {
    return `在 ${supplyToMorphoMatch[2]} 链的 Morpho 存入资产（${supplyToMorphoMatch[1]}）`;
  }

  const supplyMatch = title.match(/^Supply to (.+)$/i);
  if (supplyMatch) return `向 ${supplyMatch[1]} 存入资产`;

  const supplyToBorrowMatch = title.match(/^Supply (.+?) to borrow (.+?) on (.+)$/i);
  if (supplyToBorrowMatch) {
    return `在 ${supplyToBorrowMatch[3]} 供应 ${supplyToBorrowMatch[1]} 以借入 ${supplyToBorrowMatch[2]}`;
  }

  const supplyAssetMatch = title.match(/^Supply (.+?) on (.+)$/i);
  if (supplyAssetMatch) return `在 ${supplyAssetMatch[2]} 存入 ${supplyAssetMatch[1]}`;

  const stakeMatch = title.match(/^Stake into (.+)$/i);
  if (stakeMatch) return `在 ${stakeMatch[1]} 质押`;

  return null;
}

export function getChineseActivityDescription(activity: Activity): string | null {
  if (activity.exchange !== 'Merkl') return null;

  const description = activity.description || '';
  if (activity.protocolName === 'Aave' && /health factor at or below 2/i.test(description) && /borrow USDe/i.test(description)) {
    return '本活动属于 Ethena 在 Plasma 推出的 Liquid Leverage 计划，由 Merkl 分发奖励。需要在 Aave V3 供应 USDe，同时借入稳定币，并将健康因子维持在 2 或以下。只供应 USDe，或借入 USDe 的地址不符合奖励条件。';
  }

  const netPosition = description.match(/^Earn rewards on your net lending position \(([^)]+)\) on (.+?) on (.+?) 参与步骤/i);
  if (activity.protocolName === 'Aave' && netPosition) {
    const position = netPosition[1]
      .replace(/\s+supply minus\s+/i, ' 供应金额减去 ')
      .replace(/\s+borrows?/gi, ' 借入金额')
      .replace(/\s+supply\b/gi, ' 供应金额');
    return `本活动在 ${netPosition[3]} 链的 ${netPosition[2]} 市场发放借贷奖励，按净头寸计算：${position}。借入指定资产会减少计奖头寸。具体最低供应量和地址限制请查看官方规则。`;
  }

  const liquidity = description.match(/^Earn rewards by providing liquidity to the (.+?) pool on (.+?)(?:\s|$)/i);
  if (liquidity && ['Uniswap', 'PancakeSwap'].includes(activity.protocolName || '')) {
    return `本活动在 ${liquidity[2]} 链的 ${activity.protocolName} 流动性池提供奖励，目标池为 ${liquidity[1]}。参与前请核对官方页面列出的币对、价格区间、奖励期限和领取条件。`;
  }

  return null;
}
