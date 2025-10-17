# Stage 1: Build static assets with Vite
FROM node:18-alpine AS builder
WORKDIR /app
ENV CI=1

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build-time CloudBase env id used by Vite
ARG VITE_TCB_ENV_ID
ENV VITE_TCB_ENV_ID=${VITE_TCB_ENV_ID}

# Build for production
RUN npm run build

# Stage 2: Serve static files with Node 'serve'
FROM node:18-alpine AS runner
WORKDIR /app
RUN npm i -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 80
CMD ["serve", "-s", "dist", "-l", "80"]