FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Build args for Next.js (baked into client at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Production build
RUN npm run build

EXPOSE 3000

# Production mode (pre-compiled, much faster)
CMD ["npm", "run", "start"]
