# Changelog

## v0.3.0 (2026-04-21)

### New Features
- **カルーセルメッセージ対応** — `messageType: 'carousel'` を追加。LINE Flex Carousel を配信・シナリオで使用可能
- **カルーセルビルダー** — 管理画面でビジュアルにカルーセルを作成。最大10コマ、画像・テキスト・ボタンURL・UTM自動付与
- **カルーセル編集時の初期値読み込み** — 保存済みのFlex JSONをカルーセルビルダーのフォームに自動復元
- **配信コピー** — 一覧の「コピー」ボタンで既存配信を複製して新規下書きを作成
- **配信インサイト** — 送信済み配信の開封率・クリック率をLINE APIから取得・表示

### UI Improvements
- 予約済みバッジを赤系（`bg-red-100 text-red-700`）に変更して視認性向上
- 配信一覧の日時列を統合（予約日時・送信完了日時を1列に）
- ステータスバッジに `whitespace-nowrap` 追加

## v0.2.0 (2026-03-25)

### Breaking Changes
- **DB Schema**: `line_account_id` column added to `friends`, `scenarios`, `broadcasts`, `reminders`, `automations`, `chats`
- **DB Schema**: `login_channel_id`, `login_channel_secret`, `liff_id` columns added to `line_accounts`
- **Timestamps**: All timestamps standardized to JST (+09:00). Existing UTC data is compatible via epoch comparison.

### Upgrade
```bash
wrangler d1 execute line-crm --file=packages/db/migrations/008_multi_account.sql --remote
```

### New Features
- **Multi-account support** — Webhook routing, cron delivery, and admin UI per LINE account
- **Account switcher UI** — Global dropdown in sidebar, all pages filter by selected account
- **Cross-provider UUID linking** — `?uid=` param in `/auth/line` for automatic identity linking across providers
- **Template variable expansion** — `{{name}}`, `{{uid}}`, `{{auth_url:CHANNEL_ID}}` in scenario messages
- **Delivery window** — 9:00-23:00 JST enforcement, per-user preferred hour via "配信時間はN時"
- **replyMessage for welcome** — First step (delay=0) uses free replyMessage instead of pushMessage
- **Bot profile in admin** — Account cards show LINE profile picture, display name, basic ID
- **Account stats** — Per-account friend count, active scenarios, monthly message count
- **GitHub Actions CI/CD** — Auto-deploy Worker on push to main
- **OAuth direct redirect** — `/auth/line` redirects to LINE Login OAuth directly (no LIFF needed)
- **Friend-add redirect** — After OAuth callback, auto-redirect to `line.me/R/ti/p/{basicId}`

### Bug Fixes
- JST timestamp standardization (was UTC, causing wrong delivery times)
- Auth unification (affiliates page + login fallback URL)
- Calendar slot time calculation (was offset by 9 hours)
- ID token verification using correct login channel for multi-account

## v0.1.0 (2026-03-22)

### Initial Release
- Step delivery (scenarios with delay_minutes timing)
- Broadcasts (scheduled, segmented, batch sending)
- Tag-based segmentation
- Rich menu management
- Forms & LIFF
- Tracked links
- Reminders
- Lead scoring
- IF-THEN automation engine
- Webhooks (incoming/outgoing) + notifications
- Operator chat + auto-reply
- Conversion tracking + affiliate system
- Multi-account tables (line_accounts)
- TypeScript SDK (41 tests)
- OpenAPI/Swagger docs
- Admin panel (Next.js 15)
