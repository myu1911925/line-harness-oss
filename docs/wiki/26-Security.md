# 26. セキュリティ設計

LINE Harness のセキュリティ設計・実装方針・対応済み脆弱性の記録。

---

## 認証・認可

### API キー認証（Bearer トークン）

すべての管理 API は `Authorization: Bearer <api_key>` が必須。

```
GET /api/friends
Authorization: Bearer lh_xxxxxxxxxxxx
```

**認証の優先順位:**
1. `staff_members` テーブルの `api_key` カラムと照合（スタッフ認証）
2. Cloudflare Worker シークレット `API_KEY` と一致すればオーナー権限

**ロール:**
| ロール | 権限 |
|--------|------|
| `owner` | 全操作 |
| `admin` | スタッフ管理以外の全操作 |
| `staff` | 閲覧・チャット対応 |

### 認証スキップ対象エンドポイント

以下は署名検証または公開アクセスのため Bearer 不要:

| エンドポイント | 理由 |
|---------------|------|
| `POST /webhook` | LINE HMAC-SHA256 署名検証で代替 |
| `POST /api/integrations/stripe/webhook` | Stripe 署名検証で代替 |
| `POST /api/webhooks/incoming/:id/receive` | HMAC-SHA256 署名検証で代替 |
| `/api/liff/*` | LIFF 公開ページ |
| `/api/forms/:id/*` | 公開フォーム |
| `/auth/*` | LINE OAuth コールバック |
| `/t/`, `/r/`, `/images/` | 公開トラッキング・アセット |
| `/api/affiliates/click` | 公開アフィリエイトクリック |
| `/api/qr` | 公開 QR プロキシ |

---

## Webhook 署名検証

### LINE Webhook（`POST /webhook`）

`X-Line-Signature` ヘッダーを HMAC-SHA256 で検証。チャンネルシークレットは Cloudflare シークレットに保存。マルチアカウント対応のため、全アカウントのシークレットで順に照合。

### Stripe Webhook（`POST /api/integrations/stripe/webhook`）

`Stripe-Signature` ヘッダーを検証。`STRIPE_WEBHOOK_SECRET` シークレット未設定の場合は **500 を返して拒否**（開発環境フォールバックなし）。

### Incoming Webhook（`POST /api/webhooks/incoming/:id/receive`）

DB に `secret` が設定されている場合、`X-Webhook-Signature: sha256=<hmac>` ヘッダーを **タイミングセーフ**（`crypto.subtle.verify`）で検証。

```
X-Webhook-Signature: sha256=<HMAC-SHA256(request_body, wh.secret)>
```

外部システムからこのエンドポイントを呼ぶ場合は、DB に保存された `secret` で署名すること。

---

## CORS

管理フロントエンド（Vercel）のオリジンのみ許可。ワイルドカード（`*`）は使用しない。

```typescript
// apps/worker/src/index.ts
cors({
  origin: c.env.CORS_ORIGIN ?? 'https://line-harness-oss-web-virid.vercel.app',
  credentials: false,
})
```

Vercel の URL を変更した場合は Cloudflare Worker シークレット `CORS_ORIGIN` を更新すること。

---

## レート制限

`apps/worker/src/middleware/rate-limit.ts` でリクエスト数を制限。

| 対象 | 上限 | 単位 |
|------|------|------|
| 認証済みリクエスト | 1,000 回 | 分あたり・APIキーごと |
| 未認証リクエスト | 100 回 | 分あたり・IPごと |

---

## フロントエンド（管理画面）セキュリティ

### セキュリティヘッダー（`apps/web/vercel.json`）

Vercel CDN レベルで以下のヘッダーを付与:

| ヘッダー | 値 | 目的 |
|----------|---|------|
| `X-Frame-Options` | `DENY` | クリックジャッキング防止 |
| `X-Content-Type-Options` | `nosniff` | MIME スニッフィング防止 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | リファラー情報の制限 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ブラウザ機能の制限 |

### API キーの保管

管理画面ログイン後、API キーを `localStorage` に保存。クロスオリジン構成（Vercel + Cloudflare）のため httpOnly Cookie は使用していない。

XSS 対策として上記セキュリティヘッダーを適用。機密情報は `NEXT_PUBLIC_` 変数経由でバンドルに含めない。

---

## 機密情報の管理

### Cloudflare Worker シークレット

本番環境の機密値はすべて Cloudflare Worker シークレット（`wrangler secret put`）で管理。`wrangler.toml` にはシークレット値を記載しない。

| シークレット名 | 用途 |
|--------------|------|
| `API_KEY` | 管理画面オーナー認証キー |
| `LINE_CHANNEL_SECRET` | LINE Webhook 署名検証 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE メッセージ送信 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 署名検証 |
| `CORS_ORIGIN` | 許可する管理画面オリジン（省略時はデフォルト Vercel URL） |

### ローカル開発

機密情報は `.env.local` に記載し、git には絶対にコミットしない。

`.gitignore` で除外済み:
```
.env
.env.local
CREDENTIALS.md
*credentials*
*secret*
```

---

## 実装上の禁止事項

| 禁止事項 | 理由 |
|---------|------|
| Cloudflare Worker 内での `await import(...)` | バンドル環境でサイレント失敗するため |
| HMAC 検証に文字列比較（`===`）を使用 | タイミング攻撃を受けるため（`crypto.subtle.verify` を使うこと） |
| `cors({ origin: '*' })` | 任意オリジンからの API 呼び出しを許可してしまうため |
| Stripe Webhook の署名検証スキップ | フォールバックなし・シークレット未設定は 500 で拒否 |
| ソースコードへの機密情報ハードコード | Cloudflare シークレットまたは `.env.local` を使うこと |

---

## 過去の対応履歴

| 日付 | 対応内容 |
|------|---------|
| 2026-04-26 | CORS を `*` → Vercel URL 限定に変更 |
| 2026-04-26 | `/api/meet-callback` を認証スキップリストから削除（Bearer 必須に） |
| 2026-04-26 | Stripe Webhook 署名検証を必須化（開発フォールバック廃止） |
| 2026-04-26 | Incoming Webhook に HMAC-SHA256 署名検証を追加 |
| 2026-04-26 | HMAC 検証を `crypto.subtle.verify`（タイミングセーフ）に変更 |
| 2026-04-26 | Worker 内の `await import()` を static import に移行（stripe.ts / webhooks.ts） |
| 2026-04-26 | フロントエンドにセキュリティヘッダー追加（vercel.json） |
| 2026-04-26 | `CREDENTIALS.md` を git リポジトリ外に移動、`.gitignore` に追加 |
