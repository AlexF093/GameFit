FROM node:18

WORKDIR /app

RUN npm install -g http-server

COPY . .

EXPOSE 8080

CMD ["http-server", "-p", "8080"]
