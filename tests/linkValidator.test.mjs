import test from 'node:test';
import assert from 'node:assert/strict';
import { validateActivityUrl } from '../src/services/linkValidator.js';

test('Link Validator: Validates official exchange domains and blocks non-whitelisted domains', async () => {
  // 1. Whitelisted Binance URL
  const binanceResult = await validateActivityUrl(
    'https://www.binance.com/zh-CN/activity',
    'Binance'
  );
  assert.equal(binanceResult.isValidDomain, true);
  assert.equal(binanceResult.domain, 'www.binance.com');
  assert.ok(binanceResult.status === 'verified_live' || binanceResult.status === 'verified_portal' || binanceResult.status === 'cloudflare_protected');

  // 2. Cross-exchange domain mismatch should be blocked as invalid_domain
  const mismatchResult = await validateActivityUrl(
    'https://www.okx.com/campaigns',
    'Binance'
  );
  assert.equal(mismatchResult.isValidDomain, false);
  assert.equal(mismatchResult.status, 'invalid_domain');

  // 3. Phishing domain should be blocked
  const phishingResult = await validateActivityUrl(
    'https://binance-fake-login.com/activity',
    'Binance'
  );
  assert.equal(phishingResult.isValidDomain, false);
  assert.equal(phishingResult.status, 'invalid_domain');
});
