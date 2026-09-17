FROM node:22-alpine AS build
WORKDIR /repo

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install --workspace=apps/web --include-workspace-root

COPY apps/web apps/web

ARG VITE_API_BASE_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_PAYPAL_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_PAYPAL_CLIENT_ID=$VITE_PAYPAL_CLIENT_ID

WORKDIR /repo/apps/web
RUN npm run build

FROM nginx:alpine AS runtime
ARG API_ORIGIN="http://localhost:4000 http://127.0.0.1:4000"
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
# CSP connect-src needs the real deployed API origin baked in at build time —
# substituted here rather than templated at container start so the CSP stays
# a real allowlist (see apps/web/nginx.conf).
RUN sed -i "s|__API_ORIGIN__|${API_ORIGIN}|" /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
