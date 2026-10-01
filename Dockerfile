FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Render injects PORT; keep a local default for docker run.
ENV PORT=4000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY src ./src
COPY scripts ./scripts
RUN chmod +x scripts/render-start.sh
EXPOSE 4000
CMD ["sh", "scripts/render-start.sh"]
