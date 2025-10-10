# Eco-Leveling

## Client
To view web application on browser open terminal: 
```bash
cd frontend
bun install
bun run dev
```
Open http://localhost:5173/ to see results.

## Server

### Prerequisites

Install the `bun` JavaScript runtime:

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Getting Started

Create a file named `.env` to store all your secrets:

```env
URI_MONGO=<Insert connection string here>
```

For example:

```env
URI_MONGO=mongodb+srv://username:password@dev-aws-oregon-1.jh47pzc.mongodb.net/?retryWrites=true&w=majority&appName=dev-aws-oregon-1
```

To start the development server run:

```powershell
cd backend
bun install
bun run dev
```

Server is hosted on http://localhost:3000.

OpenAPI/Swagger is supported at http://localhost:3000/openapi.