# Serverless example with typescript

AWS serverless(lambda, dynamodb) example(to-do list app) using serverless framework.

## Install

```shell
npm install
```

## How to run

Sample Requests is placed under `/check`.

### local

```shell
# install dynamodb-local
npm run dynamodb:install

# run serverless-offline
npm run start:offline
```

### AWS

First, set up your AWS settings and run the following command.

Serverless framework deploy lambda, api gateway, dynamodb and other resources.

```shell
npm run deploy:prod
```

## TODO
- [ ] add sample ui(vue/react/angular..)
- [ ] implements authentication
- [ ] add unit-test
- [ ] add functional-test

## Thanks

- https://levelup.gitconnected.com/creating-a-simple-serverless-application-using-typescript-and-aws-part-1-be2188f5ff93