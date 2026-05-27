# TaskFlow

カンバン形式でタスクを直感的に管理できる、フルスタックWebアプリです。
Flutter 6年のエンジニアが、TypeScript・Node.js・Next.js を独学で習得しながら
設計・実装・本番デプロイまで一人で完走したポートフォリオ作品です。

---

## 🔗 リンク

- **デモURL（本番）**: https://taskflow-frontend-sepia.vercel.app
- **バックエンドAPI**: https://taskflow-backend-jc0o.onrender.com/health

> **デモアカウント**
> Email: `demo@example.com`
> Password: `password123`

---

## 📸 スクリーンショット

<!-- デプロイ後のスクリーンショットをここに貼る -->

| ログイン画面              | カンバンボード              |
| ------------------------- | --------------------------- |
| <img src="https://github.com/user-attachments/assets/a8c60f75-6f12-409a-aa19-7476d2345f0e" width="500" /> | <img src="https://github.com/user-attachments/assets/3bf6e95a-7e73-4818-ac94-15bdfd3d2632" width="500" />
---

## ✨ 機能一覧

- **ユーザー認証** — 新規登録・ログイン・ログアウト（JWT認証）
- **タスク管理** — 作成・編集・削除（CRUD）
- **カンバンボード** — 未着手 / 進行中 / 完了 の3カラム
- **ドラッグ&ドロップ** — カラム間をドラッグしてステータスを変更
- **優先度設定** — 高 / 中 / 低 の3段階
- **期日設定** — タスクに期日を設定
- **レスポンシブ対応** — スマホ・タブレット・PCに対応
- **データ永続化** — ログアウト後も再ログインでデータが保持される

---

## 🛠 技術スタック

### フロントエンド

| 技術            | バージョン        | 用途                         |
| --------------- | ----------------- | ---------------------------- |
| Next.js         | 15 (App Router)   | フレームワーク・SSR          |
| TypeScript      | 5.x (strict mode) | 型安全な実装                 |
| Tailwind CSS    | 4.x               | スタイリング                 |
| shadcn/ui       | latest            | UIコンポーネント             |
| TanStack Query  | 5.x               | サーバー状態管理・楽観的更新 |
| @dnd-kit        | latest            | ドラッグ&ドロップ            |
| react-hook-form | 7.x               | フォーム管理                 |
| Zod             | 3.x               | バリデーション               |
| axios           | latest            | HTTPクライアント             |

### バックエンド

| 技術         | バージョン | 用途                             |
| ------------ | ---------- | -------------------------------- |
| Hono         | latest     | 軽量TypeScript Webフレームワーク |
| Prisma       | 7.x        | 型安全ORM                        |
| PostgreSQL   | 15         | データベース                     |
| JWT + bcrypt | -          | 認証・パスワードハッシュ化       |

### インフラ（すべて無料）

| サービス                      | 用途                       |
| ----------------------------- | -------------------------- |
| Vercel                        | フロントエンドホスティング |
| Render（Singaporeリージョン） | バックエンドホスティング   |
| Supabase（Tokyoリージョン）   | PostgreSQL マネージドDB    |
| GitHub Actions                | Supabase Keep-Alive 自動化 |

---

## 🏗 アーキテクチャ

```
┌─────────────────────────────────┐
│  ブラウザ                         │
│  Next.js 15 (Vercel)            │
│  ・App Router / SSR             │
│  ・TanStack Query（状態管理）     │
│  ・shadcn/ui（UIコンポーネント）  │
└────────────┬────────────────────┘
             │ HTTPS / JSON
             │ JWT Bearer Token
┌────────────▼────────────────────┐
│  API サーバー                     │
│  Hono (Render / Singapore)      │
│  ・REST API                     │
│  ・JWT認証ミドルウェア            │
│  ・Zodバリデーション              │
└────────────┬────────────────────┘
             │ Prisma ORM
             │ コネクションプーリング
┌────────────▼────────────────────┐
│  データベース                     │
│  PostgreSQL (Supabase / Tokyo)  │
└─────────────────────────────────┘
```

---

## ✨ 技術的な工夫

### 1. 型安全なAPIレイヤー

Zodスキーマをバックエンドのバリデーションとフロントの型定義で共有しています。
フロント・バック間の型の不一致によるバグを構造的に防いでいます。

```typescript
// バックエンド：Zodでリクエストを検証
const createTaskSchema = z.object({
  title: z.string().min(1).max(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

// フロントエンド：同じ型定義を使い回す
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
```

### 2. JWT認証の自前実装

外部ライブラリに頼らず、JWT発行・検証・ミドルウェアを一から実装しています。
認証の仕組みを深く理解した上での実装です。

```typescript
// 認証ミドルウェア：すべてのタスクAPIに適用
export const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const token = c.req.header("Authorization")?.split(" ")[1];
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  c.set("jwtPayload", payload);
  await next();
};
```

### 3. 楽観的更新（Optimistic Update）

TanStack Query の Optimistic Update を実装しています。
ドラッグ&ドロップ時にAPIの結果を待たずに画面を先に更新するため、
ユーザーは遅延を感じません。

```typescript
onMutate: async ({ id, data }) => {
  // APIを待たずに先にUIを更新
  queryClient.setQueryData<Task[]>(['tasks'], (old) =>
    old?.map((task) => task.id === id ? { ...task, ...data } : task) ?? []
  )
},
```

### 4. Prisma 7 × Supabase の接続設計

Prisma 7 の新しい設定方式（`prisma.config.ts`）に対応し、
アプリ用（コネクションプーリング）とマイグレーション用（直接接続）を
適切に使い分けています。

```
DATABASE_URL → Supabase Pooler経由（アプリの通常リクエスト）
DIRECT_URL   → Supabase 直接接続（マイグレーション専用）
```

### 5. ユーザーごとの完全なデータ分離

JWTのpayloadに含まれる `userId` を使って、
すべてのDBクエリにユーザーフィルターをかけています。
他のユーザーのデータには一切アクセスできない設計です。

```typescript
// 必ず userId でフィルタリング
const tasks = await prisma.task.findMany({
  where: { userId }, // 自分のタスクだけ取得
});
```

### 6. Supabase 自動停止対策

GitHub Actions で3日ごとに自動pingを送り、
無料プランの7日間非アクティブによる停止を防いでいます。

---

## 📁 プロジェクト構成

```
taskflow/                          # monorepo ルート
├── .github/
│   └── workflows/
│       └── keep-alive.yml         # Supabase Keep-Alive
├── apps/
│   ├── frontend/                  # Next.js 15
│   │   └── src/
│   │       ├── app/
│   │       │   ├── login/         # ログインページ
│   │       │   ├── register/      # 新規登録ページ
│   │       │   └── dashboard/     # カンバンボード
│   │       ├── components/
│   │       │   ├── ui/            # shadcn/ui（自動生成）
│   │       │   ├── kanban-board.tsx
│   │       │   ├── task-card.tsx
│   │       │   └── create-task-dialog.tsx
│   │       ├── lib/
│   │       │   ├── api.ts         # axiosインスタンス・インターセプター
│   │       │   ├── auth-context.tsx # 認証状態管理
│   │       │   ├── use-tasks.ts   # タスクAPI カスタムフック
│   │       │   └── query-provider.tsx
│   │       └── types/
│   │           └── index.ts       # 共通型定義
│   └── backend/                   # Hono API
│       ├── prisma/
│       │   └── schema.prisma      # DBスキーマ
│       ├── prisma.config.ts       # Prisma 7 設定
│       └── src/
│           ├── index.ts           # サーバーエントリーポイント
│           ├── routes/
│           │   ├── auth.ts        # 認証API
│           │   └── tasks.ts       # タスクCRUD API
│           ├── middleware/
│           │   └── auth.ts        # JWT認証ミドルウェア
│           └── lib/
│               └── prisma.ts      # Prisma Clientシングルトン
└── pnpm-workspace.yaml
```

---

## 🚀 ローカルでの起動方法

### 前提条件

- Node.js v20以上
- pnpm
- Supabaseアカウント（無料）

### セットアップ

```bash
# 1. リポジトリをクローン
git clone https://github.com/your-name/taskflow.git
cd taskflow

# 2. 依存関係のインストール
pnpm install

# 3. バックエンドの環境変数を設定
cp apps/backend/.env.example apps/backend/.env
# DATABASE_URL, DIRECT_URL, JWT_SECRET を設定

# 4. DBマイグレーション
cd apps/backend
pnpm prisma migrate dev

# 5. サーバー起動（別々のターミナルで）
pnpm dev:backend   # http://localhost:3001
pnpm dev:frontend  # http://localhost:3000
```

### 環境変数

**`apps/backend/.env`**

```bash
# Supabase Pooler URL（アプリ用）
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase Direct URL（マイグレーション用）
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# JWT署名キー
JWT_SECRET="your-secret-key"

# フロントエンドURL（CORS設定）
FRONTEND_URL="http://localhost:3000"
```

**`apps/frontend/.env.local`**

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 📡 API 仕様

### 認証

| メソッド | エンドポイント   | 説明                   |
| -------- | ---------------- | ---------------------- |
| POST     | `/auth/register` | ユーザー登録           |
| POST     | `/auth/login`    | ログイン・JWT発行      |
| GET      | `/auth/me`       | ログイン中ユーザー取得 |

### タスク（要認証）

| メソッド | エンドポイント | 説明           |
| -------- | -------------- | -------------- |
| GET      | `/tasks`       | タスク一覧取得 |
| POST     | `/tasks`       | タスク作成     |
| PATCH    | `/tasks/:id`   | タスク更新     |
| DELETE   | `/tasks/:id`   | タスク削除     |

---

## 🌱 今後の拡張予定

- [ ] タスクの編集ダイアログ
- [ ] タスクの検索・フィルター
- [ ] ダークモード
- [ ] ユニットテスト（Vitest）
- [ ] E2Eテスト（Playwright）

---

## 👨‍💻 開発者について

Flutter エンジニアとして6年間、モバイルアプリ開発に従事してきました。
サーバーサイド・Webフロントエンドの経験を積むため、
TypeScript / Next.js / Node.js を独学でキャッチアップ中です。

**得意領域**

- Flutter / Dart（6年）
- モバイルアプリ設計・実装
- 状態管理（Riverpod / Provider）
- TypeScript / Next.js / Hono（学習中）

---

## 📝 開発で学んだこと

このポートフォリオを通じて、モバイル開発者として以下のWeb特有の概念を習得しました。

| 概念                              | Flutterとの対応                                  |
| --------------------------------- | ------------------------------------------------ |
| HTTP通信（REST API）              | `dio` パッケージと同じ考え方                     |
| JWT認証                           | `SharedPreferences` にトークンを保存するのと同じ |
| CORS                              | Webならではの概念（ネイティブアプリには不要）    |
| SSR（サーバーサイドレンダリング） | Flutterにはない概念                              |
| ORM（Prisma）                     | `sqflite` のマイグレーションと同じ考え方         |
| サーバー状態管理                  | Riverpod の `AsyncNotifier` と同じ考え方         |
| コネクションプーリング            | DBへの接続を使い回す仕組み                       |
