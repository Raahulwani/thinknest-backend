# Minimal runtime image that self-contains a tiny Node server
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Create a minimal app inside the image (no local src required)
RUN printf '{\n  "name": "thinknest-app",\n  "version": "1.0.0",\n  "private": true,\n  "main": "server.js",\n  "type": "module",\n  "scripts": { "start": "node server.js" }\n}\n' > package.json \
 && printf 'import http from "node:http";\nconst port = process.env.PORT || 3000;\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { "Content-Type": "text/plain" });\n  res.end("Thinknest app is running\\n");\n});\nserver.listen(port, () => console.log(`Server listening on ${port}`));\n' > server.js

EXPOSE 3000
CMD ["node", "server.js"]
