const CLIENT_ID = process.env.MISOCA_CLIENT_ID;
const CLIENT_SECRET = process.env.MISOCA_CLIENT_SECRET;
const REDIRECT_URI = "https://misoca-proxy.vercel.app/api/callback"; // ←固定URL
const TOKEN_URL = "https://app.misoca.jp/oauth2/token";
const GAS_URL = "https://script.google.com/a/macros/hershe.jp/s/AKfycbxRxqI4pfyBUOQjLMVAxP6caCogf7J8tu5ADk8dYJmJSF9u3JVlKYLzCZjeLab0p4HWIw/exec?action=saveToken"; // ←あなたのGAS URL

export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("❌ codeがありません");
  }

  try {
    // Misocaにアクセストークンをリクエスト
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Authorization":
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${encodeURIComponent(
        code
      )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    });

    const data = await response.json();
    console.log("Misoca token response:", data);

    if (data.access_token) {
      // ✅ 社内のGASに転送
      await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return res
        .status(200)
        .send("✅ Misoca認証成功。トークンを社内GASに保存しました。");
    } else {
      return res
        .status(500)
        .send("❌ トークン取得失敗: " + JSON.stringify(data));
    }
  } catch (err) {
    return res.status(500).send("❌ エラー: " + err.message);
  }
}
