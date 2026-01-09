# Build Angular app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist/coreui-free-angular-admin-template /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
