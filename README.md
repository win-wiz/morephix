# svg-to-png

> A Next.js application

## 🚀 Tech Stack

- Next.js 16+
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Drizzle ORM
- Turso
- Cloudflare Workers
- superpowers-zh

## 🛠️ Quick Start

```bash
npm install
cp .env.example .env.local
npm run db:generate && npm run db:migrate

npm run dev
```

Open http://localhost:3000

## 📁 Structure

```
svg-to-png/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── features/
│   │   └── layout/
│   └── lib/
│       ├── db.ts
│       ├── drizzle/
│       └── utils.ts
└── public/
```

## 🤖 Superpowers

Integrated with [superpowers-zh](https://github.com/jnMetaCode/superpowers-zh).

Use in Kilo:
```
/brainstorming
/test-driven-development
```

## 📝 Scripts

- `npm run dev` - Development server
- `npm run db:*` - Database commands

- `npm run deploy` - Deploy to Cloudflare


---

MIT © 2026
