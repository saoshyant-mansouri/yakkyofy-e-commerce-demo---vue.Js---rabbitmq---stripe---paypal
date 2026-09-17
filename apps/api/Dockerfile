FROM node:22-alpine AS base
WORKDIR /repo

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install --workspace=apps/api --include-workspace-root --omit=dev

COPY apps/api apps/api

WORKDIR /repo/apps/api
EXPOSE 4000
# Run as the unprivileged user the node image ships with, not root.
USER node
CMD ["node", "src/server.js"]
