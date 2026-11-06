# 🎰 Lottery Wheel - Docker Setup

Interactive lottery wheel web application with casino-style animation and sequential player drawing.

## Features

- ✅ **Shareable live draws**: Each draw gets its own link; anyone with it joins and watches in real time
- ✅ **Host-controlled**: Only the person who created the link registers players and starts the draw
- ✅ **Synchronized spin**: The server drives the wheel, so every viewer sees it land on the same winner at the same time
- ✅ **Player Registration**: Add players with unique colors
- ✅ **Sequential Drawing**: Winners are drawn one by one, and the wheel spins to point at each one
- ✅ **Unique Colors**: Each player gets a distinct color on the wheel
- ✅ **Responsive Design**: Works on desktop and mobile
- ✅ **No database required**: Live rooms are kept in the server's memory

## How live draws work

1. On the home page, click **Create a new draw**. You become the host and get a shareable link such as `/draw/ab12cd34`.
2. Share that link. Anyone who opens it joins the room and watches live; the viewer count updates as people come and go.
3. As host, register players and set how many winners to draw, then press **Start Draw**. The wheel spins and lands on each winner in turn — synchronized across every open browser.

### Real-time + persistence notes

- **Transport**: live updates use Server-Sent Events (`/api/lotteries/[id]/stream`); the server orchestrates the draw timeline and broadcasts each step.
- **Storage**: rooms live in the Node process's memory. They are **lost on container restart** and are **not shared across multiple replicas**. This suits a single self-hosted container. To survive restarts or scale horizontally, back the store in `src/lib/lotteryStore.ts` with Redis (state + pub/sub).
- Run the container as a **single instance** (don't scale `lottery-wheel` to >1 replica) so all viewers hit the same in-memory store.

## Docker Deployment

### For Portainer

1. **Upload Files**: Upload the entire project folder to your server
2. **Deploy Stack**: In Portainer, create a new stack and paste the docker-compose.yml content
3. **Access App**: The app will be available at `http://your-server:3000`

### Manual Docker Commands

```bash
# Build the image
docker build -t lottery-wheel:latest .

# Run with docker-compose
docker-compose up -d

# Or run manually
docker run -d -p 3000:3000 --name lottery-wheel-app lottery-wheel:latest
```

## Portainer Stack Configuration

Copy the contents of `docker-compose.yml` into a new Portainer stack:

```yaml
version: '3.8'

services:
  lottery-wheel:
    build:
      context: .
      dockerfile: Dockerfile
    image: lottery-wheel:latest
    container_name: lottery-wheel-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    restart: unless-stopped
    networks:
      - lottery-network

networks:
  lottery-network:
    driver: bridge
```

## Configuration

- **Port**: Application runs on port 3000
- **Environment**: Production-ready with Node.js optimization
- **Restart Policy**: Container automatically restarts unless manually stopped
- **Network**: Uses bridge network for container isolation

## Usage

1. **Add Players**: Enter player names in the registration panel
2. **Set Draw Count**: Choose how many players to draw
3. **Start Draw**: Click "Start Draw" to begin the animation
4. **View Results**: Winners appear sequentially in the results panel

## Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technical Stack

- **Frontend**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: SVG-based wheel with CSS transitions
- **Container**: Multi-stage Docker build with Alpine Linux
- **Runtime**: Node.js 18 Alpine (optimized for production)

## Container Details

- **Base Image**: node:18-alpine
- **Build**: Multi-stage build for optimal size
- **User**: Runs as non-root user for security
- **Size**: ~150MB final image
- **Performance**: Standalone Next.js output for faster startup
