import { GoogleGenAI } from '@google/genai';
import { Activity } from '../types/activity.js';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        timeout: 18_000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ArbitrageAnalysisResult {
  analysisSource?: 'gemini';
  analysisNote?: string;
  activityId: string;
  strategyFamily: 'BORROW_HEDGE_STAKING' | 'SPOT_FUTURES_REBATE' | 'DUAL_RANGE_LP' | 'SYBIL_PROOF_AIRDROP' | 'STRUCTURED_CARRY' | 'BONUS_ARBITRAGE';
  summary: string;
  ruleBreakdown: string[];
  arbitrageStrategy: {
    coreConcept: string;
    steps: Array<{ step: number; title: string; detail: string }>;
    dualPositionTips?: string;
  };
  frictionAnalysis: {
    feesNote: string;
    slippageRisk: string;
    timingWarning: string;
  };
  capitalRecommendation: {
    minCapital: string;
    optimalVolume: string;
    marginalCutoff: string;
  };
  disclaimer: string;
}

/**
 * Determine the arbitrage paradigm based on activity category and text keywords.
 */
export function identifyStrategyFamily(activity: Activity): ArbitrageAnalysisResult['strategyFamily'] {
  const cat = (activity.category || '').toLowerCase();
  const title = (activity.title || '').toLowerCase();
  const desc = (activity.description || '').toLowerCase();
  const combined = `${cat} ${title} ${desc}`;

  if (combined.includes('launchpool') || combined.includes('挖矿') || combined.includes('poolx') || combined.includes('burningdrop') || combined.includes('质押')) {
    return 'BORROW_HEDGE_STAKING';
  }
  if (combined.includes('lp') || combined.includes('流动性') || combined.includes('做市') || combined.includes('uniswap') || combined.includes('amm')) {
    return 'DUAL_RANGE_LP';
  }
  if (combined.includes('空投') || combined.includes('airdrop') || combined.includes('web3') || combined.includes('startup') || combined.includes('cryptopedia')) {
    return 'SYBIL_PROOF_AIRDROP';
  }
  if (combined.includes('理财') || combined.includes('加息') || combined.includes('鲨鱼鳍') || combined.includes('shark') || combined.includes('earn')) {
    return 'STRUCTURED_CARRY';
  }
  if (combined.includes('迎新') || combined.includes('新手') || combined.includes('新人') || combined.includes('体验金')) {
    return 'BONUS_ARBITRAGE';
  }
  // Default to trading tournament / futures contest
  return 'SPOT_FUTURES_REBATE';
}

/**
 * Specialized deterministic offline strategy generator for each category.
 * Prevents hardcoding a single LP strategy for all activities.
 */
export function generateSpecializedOfflinePlan(activity: Activity): ArbitrageAnalysisResult {
  const family = identifyStrategyFamily(activity);

  switch (family) {
    case 'BORROW_HEDGE_STAKING':
      return {
        activityId: activity.id,
        strategyFamily: family,
        summary: `【借贷对冲质押套利】借入质押资产 + 1x 做空对冲币价，零敞口套取新代币首发高年化`,
        ruleBreakdown: [
          `质押分配机制: 按个人质押权重占总池份额每小时快照结算，奖池 ${activity.rewardDisplay}`,
          `核心风险识别: 质押资产（如 BNB/BGB/KCS）在挖矿期间可能大幅回撤，直接买币质押常导致“赚了利息亏了本金”`,
          `解法: 采用借贷（Aave / 币安借币）借入质押资产，并在永续合约以 1x 比例开空，实现 Delta 中性（零价格波动风险）`,
        ],
        arbitrageStrategy: {
          coreConcept: '借币质押 + 衍生品等量对冲：彻底消除标的代币下跌风险，仅承担固定借贷利息，纯享 Launchpool 新币收益。',
          steps: [
            {
              step: 1,
              title: '借出质押代币 (锁定低息成本)',
              detail: '使用 USDT 抵押至交易所质押借贷或链上借贷市场，借入活动指定代币（年化利率通常在 2%~5% 区间，日息约万一）。',
            },
            {
              step: 2,
              title: '质押入池 + 永续 1x 对冲',
              detail: '将借入代币质押至官方池；若借币为浮动利息且有现货敞口，在合约市场开设同等面值 1x 永续空单锁定资产净值。',
            },
            {
              step: 3,
              title: '新代币首发分批止盈与还本',
              detail: '活动每小时发放新代币至现货账户。新币上线开盘前 15 分钟往往出现估值溢价，分批挂单卖出，最后赎回本金偿还借贷。',
            },
          ],
          dualPositionTips: '保持借贷健康度质押率 (LTV) ≤ 65%，防止突发剧烈行情触发强平；做空资金账户预留 20% 保证金应对资金费率波动。',
        },
        frictionAnalysis: {
          feesNote: '主要磨损为借贷利息（按天计息）及合约开平仓费（约万二），需确保新币挖矿预估 APY 大于借币成本 2.5 倍以上。',
          slippageRisk: '新币开盘前 5 分钟波动极大，建议使用分批限价单（Iceberg/Limit Order）而非市价单（Market Order）。',
          timingWarning: '注意借贷平台在 Launchpool 公布后 1 小时内借币利率可能飙升，尽量在公告前或利用冷门借贷协议提前锁单。',
        },
        capitalRecommendation: {
          minCapital: '1,000 - 3,000 USDT',
          optimalVolume: '5,000 - 15,000 USDT 质押规模',
          marginalCutoff: '当全网借币年化利率升至 18% 以上，或新币盘前预估 FDV 跌破资金成本边界时立即撤资还币。',
        },
        disclaimer: '借币质押套利受资金费率与借贷利息浮动影响，请保持充足保证金以防爆仓。',
      };

    case 'SPOT_FUTURES_REBATE':
      return {
        activityId: activity.id,
        strategyFamily: family,
        summary: `【期现/多空双向对冲与返佣套利】现货买入 + 永续 1x 做空零持仓风险，Maker 0 费率冲刺奖池`,
        ruleBreakdown: [
          `排名晋升规则: 奖池 ${activity.rewardDisplay}，阶梯奖励呈现高边际递减特征（如第 1-3 名奖金丰厚，随后每档递减）`,
          `核心门槛要求: ${activity.requirements?.join('；') || '需累计交易量达标'}`,
          `磨损陷阱: 盲目刷量会导致 Taker 手续费（万五）远超活动奖金，必须通过期现对冲与 Maker 返佣实现低/负磨损`,
        ],
        arbitrageStrategy: {
          coreConcept: '跨期现或跨账户 1:1 双向对冲：在主流低波动币对（BTC/ETH/SOL）以 Maker 限价单撮合，完全对冲行情敞口，最小化刷量成本。',
          steps: [
            {
              step: 1,
              title: '选择最小点差流动性币对',
              detail: '锁定 BTC/USDT 或 ETH/USDT 盘口买一卖一价差为最小 Tick（0.01U）的现货与永续市场，确保零滑点。',
            },
            {
              step: 2,
              title: '期现 1:1 挂单对冲制造有效交易量',
              detail: '在现货挂买单买入 1 个 BTC 的同时，在永续合约挂卖单 1x 做空 1 个 BTC；两端均使用 Post-Only（只做 Maker）享受手续费减免或返佣。',
            },
            {
              step: 3,
              title: '计算边际排位 ROI 及时止盈',
              detail: '实时监控排行榜前沿位次差额，计算“提升 1 个排位所需刷量手续费磨损 vs 目标名次奖金增量”，在边际收益拐点立即停手。',
            },
          ],
          dualPositionTips: '现货与合约仓位保持等值匹配，单笔挂单规模不超过当前盘口前 3 档深度的 15%，避免被大单直接穿透击穿对冲。',
        },
        frictionAnalysis: {
          feesNote: '利用交易所 VIP 等级或推荐返佣（通常返还 20%~40% 手续费），将万分之四的基础费率压缩至万分之二以下。',
          slippageRisk: '严格禁止市价单（Market Order），对冲单未成交前暂停后续刷量，防止单边裸奔。',
          timingWarning: '避开美国 CPI、非农数据公布及美股开盘前后 30 分钟的高波动窗口，在流动性最平稳的亚洲白天时段操作。',
        },
        capitalRecommendation: {
          minCapital: '2,000 - 5,000 USDT',
          optimalVolume: '50,000 - 200,000 USDT 累计交易量',
          marginalCutoff: '当“冲击上一梯队所需预估手续费消耗 > 目标奖金差额的 60%”时，锁定当前名次不再增加交易量。',
        },
        disclaimer: '对冲交易需严格遵守各交易所交易竞赛合规规则，避免在同一账户内自成交或异常频率报撤单。',
      };

    case 'DUAL_RANGE_LP':
      return {
        activityId: activity.id,
        strategyFamily: family,
        summary: `【双仓位做市流动性模型】1~2U 宽底仓保快照资格 + 极窄主力仓占领池子手续费分成`,
        ruleBreakdown: [
          `快照机制拆解: 若活动规则规定“任一快照时点持仓为 0 则丧失整期奖励”，绝不能频繁撤仓重加`,
          `分配权重算法: 奖励按 LP 手续费收益占全池比例瓜分，浅池子中极小资金即可撬动 50%+ 份额`,
          `奖池额度: 官方预算 ${activity.rewardDisplay}，优先挑选全池有效深度小于 500U 的冷门受激励币对`,
        ],
        arbitrageStrategy: {
          coreConcept: '双仓位分离法：用 1~2U 极小宽区间底仓（±10%）永久驻留池中守住快照资格；主力资金在最小 Tick 极窄区间自成交吃满手续费。',
          steps: [
            {
              step: 1,
              title: '建立快照防出界底仓',
              detail: '使用 1~2 USDT 配置 ±10% 宽区间流动性，防止短时波动将仓位甩出区间导致快照判定为 0 丢失整小时资格。',
            },
            {
              step: 2,
              title: '主力窄仓抢占做市份额',
              detail: '将 800~1,500 USDT 主力资金集中在当前现价对应的极窄区间（1~2 个最小 Tick），在浅流动性池占据 60% 以上做市深度。',
            },
            {
              step: 3,
              title: '低滑点自成交循环与边际止步',
              detail: '利用第二交易账户进行买卖交易，LP 获得 75% 手续费分成（净磨损仅 25%），按小时计算边际奖励，达标后顺延至下个周期。',
            },
          ],
          dualPositionTips: '在每个小时结束前 10 分钟加仓，若价格未偏移可顺延跨入下一小时，单次调仓摩擦参与两个周期的奖励结算。',
        },
        frictionAnalysis: {
          feesNote: '需区分交易所前端界面费与底层资金池协议费，确保自成交手续费的大部分（≥70%）通过 LP 份额回收。',
          slippageRisk: '自成交单笔金额不得超过当前窄区间深度，否则多余量会滑入外部大池导致手续费外流被套。',
          timingWarning: '若激励资产为美股代币化资产（RWA），必须在北京时间 21:00 美股开盘前撤掉主力窄仓，避开高波动。',
        },
        capitalRecommendation: {
          minCapital: '800 - 2,000 USDT',
          optimalVolume: '1,500 - 3,000 USDT 自成交量 / 小时',
          marginalCutoff: '当池内已有自然交易量超过 5,000U，或外部竞争做市资金超过 3,000U 时，投入产出比锐减，建议切池。',
        },
        disclaimer: '集中流动性做市存在无常损失风险，非单边行情中建议严格控制持仓时间。',
      };

    case 'SYBIL_PROOF_AIRDROP':
      return {
        activityId: activity.id,
        strategyFamily: family,
        summary: `【多账号隔离防女巫与极速保本撤回】低 Gas 窗口批量交互，完成任务立即撤回本金`,
        ruleBreakdown: [
          `空投任务类型: Web3 钱包交互 / 新代币首发空投，总奖池 ${activity.rewardDisplay}`,
          `防女巫与资格检测: 重点核验独立钱包地址、独立 IP 指纹、资金来源隔离（不能从同一主地址分发/归集）`,
          `免 KYC / 钱包直连: ${activity.kycRequired ? '需基础认证' : '去中心化免KYC，多地址矩阵可复制性极高'}`,
        ],
        arbitrageStrategy: {
          coreConcept: '环境物理隔离 + 低 Gas 时段批量流水线 + 极速撤出本金：用最小 Gas 磨损撬动确定性代币盲盒空投。',
          steps: [
            {
              step: 1,
              title: '环境与资金链路隔离配置',
              detail: '每个参与钱包使用独立 RPC 与独立代理 IP，资金从不同交易所（如 OKX / Binance / Bybit）子账户分别提币，切断链上关联。',
            },
            {
              step: 2,
              title: '选择低 Gas 窗口批量交互',
              detail: '在北京时间周六/周日清晨或以太坊/Layer2 网络 Gas 最低点（Gwei < 12）统一批量执行官方指定的 Swap、Stake 或借贷任务。',
            },
            {
              step: 3,
              title: '完成核验后立即本金撤回归集',
              detail: '确认活动页面任务状态标记为【已完成/Qualified】后，迅速解除质押或 Swap 回稳定币，提回中心化交易所锁定零本金沉淀。',
            },
          ],
          dualPositionTips: '主账号配置 70% 资产长期留存以满足随机突击快照（防御性资格），子号矩阵仅留存满足门槛的最小金额（50~100U）。',
        },
        frictionAnalysis: {
          feesNote: '跨链桥费与链上 Gas 为主要成本，优先选择 Arbitrum、Base、Optimism 等手续费低于 0.05U 的低成本路径。',
          slippageRisk: 'DEX Swap 任务设置滑点保护 ≤ 0.5%，避免在低流动性池中因滑点被套。',
          timingWarning: '注意活动快照截止时间，避免在最后 1 小时因网络拥堵导致交易卡池错过截止时间。',
        },
        capitalRecommendation: {
          minCapital: '200 - 500 USDT (单号 50-100U 循环复用)',
          optimalVolume: '完成任务最低达标量即可，不盲目追加无奖交易量',
          marginalCutoff: '单钱包综合 Gas 与桥接损耗若超过 2.5 USDT，或高于预期代币空投估值的 20% 时应立即停止批量。',
        },
        disclaimer: '请严格遵守活动条款，严禁脚本恶意挤占节点或恶意攻击智能合约。',
      };

    case 'STRUCTURED_CARRY':
      return {
        activityId: activity.id,
        strategyFamily: family,
        summary: `【保本结构化利差与跨期套息】锁定高额加息券，利用反向衍生品对冲出界低息`,
        ruleBreakdown: [
          `收益结构拆解: 标的处于特定价格区间内享受超额加息（如年化 18%~22%），出界则退回基础活期利率`,
          `奖池额度: 官方补贴 ${activity.rewardDisplay}，本金保本属性为最大优势`,
          `核心痛点: 行情单边剧烈突破导致掉入低息区间，丧失加息红利`,
        ],
        arbitrageStrategy: {
          coreConcept: '保本产品做底仓 + 极轻仓反向期权/永续对冲：在享受高额保本加息的同时，对冲掉行情的单边突围风险。',
          steps: [
            {
              step: 1,
              title: '申购核心加息产品',
              detail: '存入 USDT 申购看涨或看跌鲨鱼鳍、双币或加息券理财，确保申购金额满足最高收益阶梯门槛。',
            },
            {
              step: 2,
              title: '在突破边界挂设防御性对冲单',
              detail: '若申购看涨加息产品（区间如 62,000~66,000），在 66,000 关键敲出边界以极小资金购买看跌期权或挂设保护性止损空单。',
            },
            {
              step: 3,
              title: '期满自动赎回与资金轮动',
              detail: '结算日资金自动归还至资金账户，扣除微量对冲保费后净赚年化利差，将本金立即无缝申购下一期活动。',
            },
          ],
          dualPositionTips: '80% 资金置于保本理财，20% 资金保留在活期账户作为随时调仓或对冲的机动头寸。',
        },
        frictionAnalysis: {
          feesNote: '理财产品无申购与赎回手续费，唯一损耗为轻仓防御对冲的微量期权费或滑点。',
          slippageRisk: '保本型产品本金无清算风险，仅存在出界后收益率回退为基础利息（~2%）的机会成本。',
          timingWarning: '注意申购截止时间（通常在周三或周五下午），避免资金闲置在零利息状态。',
        },
        capitalRecommendation: {
          minCapital: '1,000 - 5,000 USDT',
          optimalVolume: '5,000 - 20,000 USDT',
          marginalCutoff: '若全网同期限无风险借贷利率超过 8%，保本理财吸引力下降，建议重新测算利差。',
        },
        disclaimer: '结构化产品保本仅针对基础代币本金，不规避代币本身的法币贬值风险。',
      };

    case 'BONUS_ARBITRAGE':
    default:
      return {
        activityId: activity.id,
        strategyFamily: family,
        summary: `【体验金与迎新礼无风险收割】双账号多空对开，无损提取体验金净利润`,
        ruleBreakdown: [
          `奖励形式: 赠送体验金/抵扣金 ${activity.rewardDisplay}，体验金本金不可提现但交易盈利可全额提取`,
          `门槛条件: ${activity.requirements?.join('；') || '完成初次充值与交易'}`,
          `变现机制: 利用主号与副号在相同合约币对同时开多与开空，平仓后将盈利锁定在其中一方提取变现`,
        ],
        arbitrageStrategy: {
          coreConcept: '多空双向对开收割体验金：用零本金风险的赠金与极小自有资金对冲，将不可提现的体验金 100% 转化为可提现真金白银。',
          steps: [
            {
              step: 1,
              title: '达标激活体验金',
              detail: '充值最低要求金额（通常 50~100U），在福利中心激活合约体验金券至赠金账户。',
            },
            {
              step: 2,
              title: '双向对开完全锁定盈亏',
              detail: '使用体验金账号以 5x~10x 杠杆做多 BTC/USDT，同时使用自有资金账号同等保证金与倍数做空 BTC/USDT。',
            },
            {
              step: 3,
              title: '行情波动后平仓提现',
              detail: '无论行情上涨或下跌，亏损方亏损的是平台赠送的体验金，盈利方盈利的是真金白银，平仓后净赚 45%~90% 的体验金面值。',
            },
          ],
          dualPositionTips: '选择具有确定性日内振幅的主流币对（如 BTC/ETH），杠杆倍数控制在 5x~10x，避免因单次插针导致双边同时爆仓。',
        },
        frictionAnalysis: {
          feesNote: '合约开平仓手续费优先使用体验金或赠送的抵扣券冲抵，自有资金端仅支付标准 Maker 费率。',
          slippageRisk: '两边平仓必须在同一秒内同时点击市价平仓或预先设定相同价位止盈止损单。',
          timingWarning: '务必在体验金有效期内（通常为发放后 7~14 天）完成操作，过期作废。',
        },
        capitalRecommendation: {
          minCapital: '100 - 500 USDT (对冲配资)',
          optimalVolume: '完全匹配体验金面值额度',
          marginalCutoff: '单次对冲净收益率达到体验金面值的 70% 即可平仓锁定，不贪婪博取单边。',
        },
        disclaimer: '严禁违规多开或脚本批量薅取迎新礼，需严格遵循各交易所合规指引。',
      };
  }
}

/**
 * Analyze structured activity fields with Gemini. No official page content is fetched here.
 */
export async function generateActivityArbitragePlan(
  activity: Activity,
  userNotes?: string
): Promise<ArbitrageAnalysisResult> {
  const family = identifyStrategyFamily(activity);

  try {
    const ai = getAiClient();

    const systemInstruction = `
你是一名谨慎的活动规则分析助手。你只能根据输入中的结构化字段分析，当前请求没有读取官方链接正文或外部资料。
不得建议刷量、自成交、女巫、多账号规避规则、绕过地区限制或其他违反活动条款的行为。不得把未提供的费率、门槛、奖池分配、活动真实性或地区资格当作事实。缺少依据时明确写“待查官方规则”，将建议标记为假设，不承诺收益。当前输入没有官方页面正文，不能称为规则核验或真实调研。活动分类为（${activity.category}），标题为（${activity.title}）。

请以严格的 JSON 格式输出，不要包含 markdown 标记代码块（如 \`\`\`json）：
{
  "activityId": "${activity.id}",
  "strategyFamily": "${family}",
  "summary": "一句话高度概括针对该类型活动的实战套利方案与对冲逻辑",
  "ruleBreakdown": ["规则核心点1（分配机制）", "规则核心点2（潜在陷阱与资格防踏空）", "规则核心点3（盈利突破口）"],
  "arbitrageStrategy": {
    "coreConcept": "套利核心思路与数学/对冲逻辑阐述",
    "steps": [
      { "step": 1, "title": "步骤1标题", "detail": "具体如何开仓/借贷/配置环境与参数" },
      { "step": 2, "title": "步骤2标题", "detail": "执行对冲、做量、挂单或交互的具体节奏与方法" },
      { "step": 3, "title": "步骤3标题", "detail": "收益提取、还本平仓、止盈与边际控制" }
    ],
    "dualPositionTips": "针对该活动的双仓位/多账号/跨市场对冲参数配置建议"
  },
  "frictionAnalysis": {
    "feesNote": "手续费、借币利息或 Gas 磨损测算与减免途径",
    "slippageRisk": "滑点、波动或无常损失风控应对措施",
    "timingWarning": "最佳参与时段与必须避开的风险时间窗口"
  },
  "capitalRecommendation": {
    "minCapital": "建议起步本金",
    "optimalVolume": "建议最优单次/累计交易或质押量",
    "marginalCutoff": "边际收益临界点（超过该点则投入产出比不划算，应立即停手）"
  },
  "disclaimer": "风险提示"
}
`;

    const prompt = `
活动信息：
- 交易所: ${activity.exchange}
- 活动标题: ${activity.title}
- 活动类别: ${activity.category}
- 奖池规模: ${activity.rewardDisplay} (数量: ${activity.rewardAmount || '未注'}, 币种: ${activity.rewardCurrency})
- 时间范围: ${activity.startsAt} 至 ${activity.endsAt} (状态: ${activity.status})
- KYC要求: ${activity.kycRequired ? '记录标记为需要 KYC' : '记录未标记需要 KYC；不能据此推断免 KYC'}
- 官方规则要点: ${activity.requirements?.join('; ') || '未提供'}
- 地区限制: ${activity.regionNote || '未提供'}
- 官方链接: ${activity.officialUrl}
- 用户补充需求: ${userNotes || '仅根据已提供的信息分析，并列出仍待官方核验的项目'}

请输出专业的套利方案 JSON。
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const raw = response.text || '{}';
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.ruleBreakdown) || !parsed.ruleBreakdown.every((item: unknown) => typeof item === 'string') ||
      !Array.isArray(parsed.arbitrageStrategy?.steps) ||
      !parsed.arbitrageStrategy.steps.every((item: any) => typeof item?.title === 'string' && typeof item?.detail === 'string') ||
      typeof parsed.arbitrageStrategy?.coreConcept !== 'string' ||
      typeof parsed.frictionAnalysis?.feesNote !== 'string' ||
      typeof parsed.frictionAnalysis?.slippageRisk !== 'string' ||
      typeof parsed.frictionAnalysis?.timingWarning !== 'string' ||
      typeof parsed.capitalRecommendation?.minCapital !== 'string' ||
      typeof parsed.capitalRecommendation?.optimalVolume !== 'string' ||
      typeof parsed.capitalRecommendation?.marginalCutoff !== 'string' ||
      typeof parsed.disclaimer !== 'string'
    ) {
      throw new Error('AI 返回内容缺少必需字段');
    }

    return {
      analysisSource: 'gemini',
      analysisNote: 'Gemini 根据当前记录的结构化字段生成；本次没有读取官方链接正文或外部来源。请先核对官方规则。',
      activityId: activity.id,
      strategyFamily: parsed.strategyFamily || family,
      summary: parsed.summary,
      ruleBreakdown: parsed.ruleBreakdown,
      arbitrageStrategy: parsed.arbitrageStrategy,
      frictionAnalysis: parsed.frictionAnalysis,
      capitalRecommendation: parsed.capitalRecommendation,
      disclaimer: parsed.disclaimer,
    };
  } catch (err: any) {
    console.warn(`[AI Strategy] Gemini call failed:`, err?.message);
    throw new Error(`AI 分析失败：${err?.message || '未知错误'}`);
  }
}
