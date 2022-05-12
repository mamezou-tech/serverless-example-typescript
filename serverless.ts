import type { AWS } from "@serverless/typescript";
import dynamoDbTables from "./resources/dynamodb-tables";
import cloudwatchAlarms from "./resources/cloudwatch-alarms";
import functions from "./resources/functions";

const serverlessConfiguration: AWS = {
  service: "todo-list",
  frameworkVersion: "3",
  plugins: [
    "serverless-esbuild",
    "serverless-dynamodb-local",
    "serverless-offline",
    "serverless-api-gateway-throttling",
    "serverless-plugin-subscription-filter",
    "serverless-plugin-aws-alerts",
  ],
  package: {
    individually: true,
  },
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    stage: "dev",
    region: "ap-northeast-1",
    logs: {
      restApi: {
        accessLogging: true,
        format: `{
"stage" : "$context.stage",
"requestId" : "$context.requestId",
"apiId" : "$context.apiId",
"resource_path" : "$context.resourcePath",
"resourceId" : "$context.resourceId",
"http_method" : "$context.httpMethod",
"sourceIp" : "$context.identity.sourceIp",
"userAgent" : "$context.identity.userAgent",
"caller" : "$context.identity.caller",
"user" : "$context.identity.user",
"requestTime": "$context.requestTime",
"status": "$context.status"
}`.replace(/(\r\n|\n)/gm, ""),
        executionLogging: true,
        level: "ERROR",
        fullExecutionData: false,
      },
      frameworkLambda: true,
    },
    apiGateway: {
      shouldStartNameWithService: true,
      minimumCompressionSize: 1024,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      REGION: "${self:custom.region}",
      STAGE: "${self:custom.stage}",
      LIST_TABLE: "${self:custom.listTable}",
      TASKS_TABLE: "${self:custom.tasksTable}",
    },
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:DescribeTable",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
            ],
            Resource: [
              { "Fn::GetAtt": ["ListTable", "Arn"] },
              { "Fn::GetAtt": ["TasksTable", "Arn"] },
              {
                "Fn::Join": [
                  "/",
                  [{ "Fn::GetAtt": ["TasksTable", "Arn"] }, "index", "list_index"],
                ],
              },
            ],
          },
        ]
      }
    },
  },
  custom: {
    region: "${opt:region, self:provider.region}",
    stage: "${opt:stage, self:provider.stage}",
    notificationMailAddress: "${opt:mail, 'noboru-kudo@mamezou.com'}",
    listTable: "${self:service}-list-table-${opt:stage, self:provider.stage}",
    tasksTable: "${self:service}-tasks-table-${opt:stage, self:provider.stage}",
    tableThroughputs: {
      prod: 5,
      default: 1,
    },
    tableThroughput:
      "${self:custom.tableThroughputs.${self:custom.stage}, self:custom.tableThroughputs.default}",
    dynamodb: {
      stages: ["dev"],
      start: {
        port: 8008,
        inMemory: true,
        heapInitial: "200m",
        heapMax: "1g",
        migrate: true,
        seed: true,
        convertEmptyValues: true,
      },
    },
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    "serverless-offline": {
      httpPort: 3000,
      babelOptions: {
        presets: ["env"],
      },
    },
    apiGatewayThrottling: {
      maxRequestsPerSecond: 10,
      maxConcurrentRequests: 5,
    },
    alerts: {
      stages: ["prod"],
      topics: {
        alarm: {
          topic: "${self:service}-${self:custom.stage}-alerts-alarm",
          notifications: [
            {
              protocol: "email",
              endpoint: "${self:custom.notificationMailAddress}",
            },
          ],
        },
      },
      alarms: ["functionErrors", "functionThrottles"],
    },
  },
  functions,
  resources: {
    Resources: {
      ...dynamoDbTables,
      ...cloudwatchAlarms,
    },
  },
};

module.exports = serverlessConfiguration;
