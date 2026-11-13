FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production

EXPOSE 4000

CMD ["sh", "-c", "npm run prisma:migrate && npm run start"]
