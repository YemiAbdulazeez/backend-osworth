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
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install tsx@4.20.5 --no-save
COPY --from=build /app/dist ./dist
COPY src ./src
COPY scripts ./scripts
RUN chmod +x scripts/render-start.sh
EXPOSE 4000
CMD ["sh", "scripts/render-start.sh"]
