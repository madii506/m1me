// M1me · fetches a coin's picture so the browser can splice it (a canvas cannot read pictures from other sites).
// only image hosts that coin pictures live on; nothing is stored.
const OK = [/(^|\.)dexscreener\.com$/, /(^|\.)ipfs\.io$/, /(^|\.)cf-ipfs\.com$/, /(^|\.)mypinata\.cloud$/, /(^|\.)pinata\.cloud$/, /(^|\.)arweave\.net$/, /(^|\.)nftstorage\.link$/, /(^|\.)ipfs\.dweb\.link$/, /(^|\.)pump\.fun$/, /(^|\.)irys\.xyz$/, /(^|\.)twimg\.com$/, /(^|\.)w3s\.link$/];
module.exports = async (req, res) => {
  try {
    const u = new URL(String((req.query && req.query.u) || ''));
    if (u.protocol !== 'https:' || !OK.some(r => r.test(u.hostname))) { res.statusCode = 400; return res.end('host not allowed'); }
    const r = await fetch(u, { headers: { 'user-agent': 'm1me/1.0', accept: 'image/*' }, signal: AbortSignal.timeout(9000), redirect: 'follow' });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\//.test(type)) { res.statusCode = 502; return res.end('no image'); }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 6e6) { res.statusCode = 413; return res.end('too big'); }
    res.setHeader('content-type', type); res.setHeader('cache-control', 'public, max-age=86400, s-maxage=86400'); res.setHeader('x-content-type-options', 'nosniff');
    res.end(buf);
  } catch { res.statusCode = 400; res.end('bad url'); }
};
