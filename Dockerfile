FROM node:14-alpine

WORKDIR /app

COPY . .
RUN npm install && \
ln crontab /etc/crontabs/root -f

CMD ["crond", "-f", "-l", "2"]
