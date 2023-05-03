FROM node:lts-alpine

# Create app directory.
WORKDIR /app

ADD . .
RUN apk add git
RUN corepack enable
RUN yarn install

# 把 Port 放出去
EXPOSE 8787

CMD [ "yarn", "node", "dist" ]