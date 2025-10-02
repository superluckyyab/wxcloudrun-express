const express = require('express');
const fetch = require('node-fetch');
const app = express();

const { WX_APPID, WX_SECRET } = process.env;

// 获取公众号 access_token
async function getAccessToken() {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j.access_token) throw new Error('getToken failed: ' + JSON.stringify(j));
  return j.access_token;
}

// 提供 /mp/articles 接口
app.get('/mp/articles', async (_req, res) => {
  try {
    const token = await getAccessToken();
    const r = await fetch(`https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'news', offset: 0, count: 10 })
    });
    const data = await r.json();

    const list = (data.item || [])
      .flatMap(it => it.content?.news_item || [])
      .map(n => ({
        title: n.title,
        digest: n.digest,
        cover: n.thumb_url,
        url: n.url,
        publishTime: n.update_time || n.create_time,
        source: 'wechat_mp'
      }));

    res.json({ ok: true, list });
  } catch (e) {
    res.status(500).json({ ok: false, msg: e.message });
  }
});

// 健康检查
app.get('/', (_, res) => res.send('ok'));

app.listen(process.env.PORT || 8080);