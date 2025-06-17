# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files and directories from the root
COPY App.tsx ./App.tsx
COPY index.tsx ./index.tsx
COPY vite.config.ts ./vite.config.ts
COPY tsconfig.json ./tsconfig.json
COPY index.html ./index.html
COPY components ./components
COPY services ./services
COPY constants.tsx ./constants.tsx
COPY types.ts ./types.ts
# Add any other necessary files or directories here

# List files in /app to debug
RUN ls -la /app
RUN ls -la /app/components
RUN ls -la /app/services

# Ensure GEMINI_API_KEY is available at build time
ARG GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
