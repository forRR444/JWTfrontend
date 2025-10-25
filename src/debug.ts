// デバッグ用のヘルパー関数

/** ローカルストレージ内のトークン情報を表示 */
export function showTokenInfo() {
  const token = localStorage.getItem("access_token");
  const expires = localStorage.getItem("access_token_expires");
  const user = localStorage.getItem("current_user");

  if (!token) {
    console.log("トークンが見つかりません（未ログイン）");
    return;
  }

  const expiresNum = parseInt(expires || "0", 10);
  const expiresDate = new Date(expiresNum * 1000);
  const nowSec = Math.floor(Date.now() / 1000);
  const remainingSec = expiresNum - nowSec;
  const remainingMin = Math.floor(remainingSec / 60);

  console.log("トークン情報");
  console.log("トークン:", token.substring(0, 50) + "...");
  console.log("有効期限:", expiresDate.toLocaleString());
  console.log("残り時間:", `${remainingMin}分${remainingSec % 60}秒`);
  console.log("ユーザー:", user);

  if (remainingSec < 0) {
    console.log("警告: トークンの有効期限が切れています！");
  } else if (remainingSec < 60) {
    console.log("警告: トークンの有効期限が1分以内です！");
  } else {
    console.log("トークンは有効です");
  }
}

/** Cookie内のリフレッシュトークン有無を確認 */
export function showCookieInfo() {
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const refreshTokenCookie = cookies.find((c) =>
    c.startsWith("refresh_token=")
  );

  console.log("Cookie情報");
  if (refreshTokenCookie) {
    console.log("refresh_token Cookie が見つかりました");
    console.log("※ HttpOnly属性のため、値は表示できません（正常動作）");
  } else {
    console.log("refresh_token Cookie が見つかりません");
    console.log("注意: HttpOnly属性のCookieはJavaScriptから見えません");
    console.log("開発者ツールの Application > Cookies で確認してください");
  }
}

/** 次のトークン自動更新予定時刻を表示 */
export function showNextRefreshTime() {
  const expires = localStorage.getItem("access_token_expires");
  if (!expires) {
    console.log("トークン情報が見つかりません");
    return;
  }

  const expiresNum = parseInt(expires, 10);
  const nowSec = Math.floor(Date.now() / 1000);
  const secondsUntilExpiry = expiresNum - nowSec;
  const refreshBeforeExpiry = secondsUntilExpiry > 120 ? 60 : 30;
  const secondsUntilRefresh = secondsUntilExpiry - refreshBeforeExpiry;

  if (secondsUntilRefresh <= 0) {
    console.log("次の自動更新: すぐに実行されます！");
  } else {
    const refreshTime = new Date((nowSec + secondsUntilRefresh) * 1000);
    const min = Math.floor(secondsUntilRefresh / 60);
    const sec = secondsUntilRefresh % 60;

    console.log("次の自動更新");
    console.log("実行時刻:", refreshTime.toLocaleTimeString());
    console.log("残り時間:", `${min}分${sec}秒`);
  }
}

/** 認証関連情報をまとめて表示 */
export function debugAuth() {
  console.log("認証情報の完全チェック");
  console.log("");
  showTokenInfo();
  console.log("");
  showCookieInfo();
  console.log("");
  showNextRefreshTime();
}

// ブラウザのコンソールから直接実行できるようにグローバルに公開
if (typeof window !== "undefined") {
  (window as any).showTokenInfo = showTokenInfo;
  (window as any).showCookieInfo = showCookieInfo;
  (window as any).showNextRefreshTime = showNextRefreshTime;
  (window as any).debugAuth = debugAuth;

  console.log("デバッグ用の関数がロードされました:");
  console.log("  - showTokenInfo() : トークン情報を表示");
  console.log("  - showCookieInfo() : Cookie情報を表示");
  console.log("  - showNextRefreshTime() : 次の自動更新時刻を表示");
  console.log("  - debugAuth() : すべての情報を一括表示");
}
