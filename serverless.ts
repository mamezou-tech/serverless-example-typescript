import type { Serverless } from 'serverless/aws';
import dynamoDbTables from "./resources/dynamodb-tables";
import functions from "./resources/functions";

const serverlessConfiguration: Serverless = {
  service: 'todo-list',
  frameworkVersion: '2',
  custom: {
    region: '${opt:region, self:provider.region}',
    stage: '${opt:stage, self:provider.stage}',
    listTable: '${self:service}-list-table-${opt:stage, self:provider.stage}',
    tasksTable: '${self:service}-tasks-table-${opt:stage, self:provider.stage}',
    tableThroughputs: {
      prod: 5,
      default: 1,
    },
    tableThroughput: '${self:custom.tableThroughputs.${self:custom.stage}, self:custom.tableThroughputs.default}',
    dynamodb: {
      stages: ['dev'],
      start: {
        port: 8008,
        inMemory: true,
        heapInitial: '200m',
        heapMax: '1g',
        migrate: true,
        seed: true,
        convertEmptyValues: true,
        // Uncomment only if you already have a DynamoDB running locally
        // noStart: true
      }
    },
    'serverless-offline': {
      httpPort: 3000,
      babelOptions: {
        presets: ["env"]
      }
    },
    // bundle: {
    //   disableForkTsChecker: true,
    // },
  },
  // Add the serverless-webpack plugin
  plugins: [
    'serverless-bundle',
    'serverless-dynamodb-local',
    'serverless-offline',
    'serverless-dotenv-plugin'
  ],
  package: {
    individually: true,
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    logs: {
      restApi: true,
      frameworkLambda: true,
    },
    apiGateway: {
      shouldStartNameWithService: true,
      minimumCompressionSize: 1024,
    },
    stage: 'dev',
    region: "ap-northeast-1",
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      REGION: '${self:custom.region}',
      STAGE: '${self:custom.stage}',
      LIST_TABLE: '${self:custom.listTable}',
      TASKS_TABLE: '${self:custom.tasksTable}',
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          'dynamodb:DescribeTable',
          'dynamodb:Query',
          'dynamodb:Scan',
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem'
        ],
        Resource: [
          {"Fn::GetAtt": ['ListTable', 'Arn']},
          {"Fn::GetAtt": ['TasksTable', 'Arn']}
        ]
      }
    ]
  },
  functions,
  resources: {
    Resources: dynamoDbTables
  }
};

module.exports = serverlessConfiguration;
