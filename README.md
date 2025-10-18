# Transaction Calendar

A beautiful, interactive calendar application for visualizing and managing financial transactions. Built with React, TypeScript, Express, and Vite.

## Features

- 📅 Interactive calendar view with transaction aggregation
- 💰 Currency-aware display
- 📊 Visual insights and analytics
- 📁 CSV file upload support (Revolut format)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔍 Transaction filtering and search
- 📱 Mobile-friendly design
- ⚡ Real-time updates

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- React Query (TanStack Query)
- Wouter (routing)
- Recharts (data visualization)

### Backend
- Node.js 20
- Express.js
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- PostgreSQL database (or Neon serverless Postgres)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Quisharoo/revolut-calendar.git
cd revolut-calendar
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run db:push` - Push database schema changes

### Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                # Backend Express application
│   ├── index.ts          # Main server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database interactions
│   └── vite.ts           # Vite middleware
├── shared/               # Shared code between client and server
│   └── schema.ts         # Zod schemas and types
├── api/                  # Vercel serverless function entry
└── dist/                 # Built files (gitignored)
```

## Deployment

This application is configured for seamless deployment on Vercel.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Quisharoo/revolut-calendar)

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions, including:

- Vercel configuration
- Environment variables setup
- CI/CD with GitHub Actions
- Custom domain configuration
- Monitoring and logging

### Automatic Deployments

- **Production**: Automatically deploys when you push to `main` branch
- **Preview**: Automatically creates preview deployments for all pull requests

### Environment Variables

Set these in your Vercel project settings:

```env
NODE_ENV=production
DATABASE_URL=your_postgres_connection_string
# Add other environment variables as needed
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode during development:

```bash
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## CSV Format Support

The application supports CSV uploads in Revolut format with the following columns:

- Type
- Product
- Started Date
- Completed Date
- Description
- Amount
- Fee
- Currency
- State
- Balance

## Architecture

### Frontend Architecture

- Component-based React application
- Type-safe with TypeScript
- Tailwind CSS for styling
- React Query for server state management
- Radix UI for accessible components

### Backend Architecture

- Express.js REST API
- Serverless-ready architecture
- Drizzle ORM for database access
- Zod for runtime validation
- Session management with express-session

### Deployment Architecture

- Vercel serverless functions for API
- CDN-served static assets
- PostgreSQL database (Neon)
- Automatic preview deployments for PRs

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Acknowledgments

- Built with [Replit](https://replit.com)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Deployed on [Vercel](https://vercel.com)

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/Quisharoo/revolut-calendar/issues)
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment-specific questions

---

Built with ❤️ using modern web technologies

## Offline / flaky registry — quick recovery

If your network or npm registry access is flaky, use the included retry script to run pnpm install with exponential backoff:

```bash
chmod +x scripts/pnpm-install-retry.sh
./scripts/pnpm-install-retry.sh 6 2
```

This will attempt `pnpm install` up to 6 times, starting with a 2s delay and doubling each retry. After a successful install:

- Run `pnpm test` and `pnpm typecheck` to validate changes.
- Inspect and commit `pnpm-lock.yaml` if it changed.

If you prefer an npm script, run:

```bash
npm run install:retry
```

