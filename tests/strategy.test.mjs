import test from 'node:test';
import assert from 'node:assert/strict';
import {
  identifyStrategyFamily,
  generateSpecializedOfflinePlan,
} from '../src/services/aiStrategy.js';

test('Strategy Family Identification: Correctly classifies different activity types', () => {
  // Launchpool / Staking
  assert.equal(
    identifyStrategyFamily({
      category: 'Launchpool',
      title: '质押 BNB 挖矿新币',
      description: '参与最新 Launchpool',
    }),
    'BORROW_HEDGE_STAKING'
  );

  // Trading Competition
  assert.equal(
    identifyStrategyFamily({
      category: '交易竞赛',
      title: '现货交易巅峰争霸赛',
      description: '根据累计交易量排名瓜分 2,000,000 USDT',
    }),
    'SPOT_FUTURES_REBATE'
  );

  // LP Liquidity
  assert.equal(
    identifyStrategyFamily({
      category: '流动性激励',
      title: 'OKX 美股与稳定币 LP 激励活动',
      description: '为指定交易对提供集中流动性做市',
    }),
    'DUAL_RANGE_LP'
  );

  // Airdrop / Web3
  assert.equal(
    identifyStrategyFamily({
      category: '新币空投',
      title: 'Gate Startup 免费代币空投',
      description: '连接 Web3 钱包参与认购',
    }),
    'SYBIL_PROOF_AIRDROP'
  );

  // Structured Earn
  assert.equal(
    identifyStrategyFamily({
      category: '理财加息',
      title: '鲨鱼鳍保本理财加息季',
      description: '年化最高 22% 结构化理财',
    }),
    'STRUCTURED_CARRY'
  );
});

test('Specialized Offline Playbooks: Returns distinct category-appropriate strategies', () => {
  // 1. Launchpool test
  const lpPlan = generateSpecializedOfflinePlan({
    id: 'test-lp',
    exchange: 'Binance',
    title: 'Launchpool 挖矿新币',
    category: 'Launchpool',
    rewardDisplay: '1,000,000 TOKEN',
    requirements: ['质押 BNB 或 FDUSD'],
    officialUrl: 'https://www.binance.com',
  });
  assert.equal(lpPlan.strategyFamily, 'BORROW_HEDGE_STAKING');
  assert.ok(lpPlan.summary.includes('借贷对冲质押'));
  assert.ok(lpPlan.arbitrageStrategy.coreConcept.includes('借币质押'));
  assert.ok(!lpPlan.summary.includes('美股'));

  // 2. Trading competition test
  const tradePlan = generateSpecializedOfflinePlan({
    id: 'test-trade',
    exchange: 'Bitget',
    title: 'KCGI 合约交易巅峰赛',
    category: '交易竞赛',
    rewardDisplay: '5,000,000 USDT',
    requirements: ['合约累计交易量达标'],
    officialUrl: 'https://www.bitget.com',
  });
  assert.equal(tradePlan.strategyFamily, 'SPOT_FUTURES_REBATE');
  assert.ok(tradePlan.summary.includes('期现/多空双向对冲'));
  assert.ok(tradePlan.arbitrageStrategy.coreConcept.includes('双向对冲'));

  // 3. Airdrop test
  const airdropPlan = generateSpecializedOfflinePlan({
    id: 'test-airdrop',
    exchange: 'OKX',
    title: 'Web3 钱包空投嘉年华',
    category: '新币空投',
    rewardDisplay: '300,000 USDT',
    requirements: ['完成 3 笔 Swap'],
    officialUrl: 'https://www.okx.com',
  });
  assert.equal(airdropPlan.strategyFamily, 'SYBIL_PROOF_AIRDROP');
  assert.ok(airdropPlan.summary.includes('多账号隔离防女巫'));
});
