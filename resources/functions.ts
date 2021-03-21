// import { AwsFunctionHandler } from "serverless/plugins/aws/provider/awsProvider";
//
// declare module "serverless" {
//   export interface Event {
//     subscriptionFilter: any;
//   }
// }

export default {
  createList: {
    handler: "handler.createList",
    events: [
      {
        http: {
          method: "POST",
          path: "list",
          cors: true,
          throttling: {
            maxRequestsPerSecond: 2,
            maxConcurrentRequests: 1,
          },
        },
      },
    ],
  },
  deleteList: {
    handler: "handler.deleteList",
    events: [
      {
        http: {
          method: "DELETE",
          path: "list",
          cors: true,
        },
      },
    ],
  },
  getList: {
    handler: "handler.getList",
    events: [
      {
        http: {
          method: "GET",
          path: "list",
          cors: true,
        },
      },
    ],
  },
  updateList: {
    handler: "handler.updateList",
    events: [
      {
        http: {
          method: "PUT",
          path: "list",
          cors: true,
        },
      },
    ],
  },
  createTask: {
    handler: "handler.createTask",
    events: [
      {
        http: {
          method: "POST",
          path: "task",
          cors: true,
        },
      },
    ],
  },
  deleteTask: {
    handler: "handler.deleteTask",
    events: [
      {
        http: {
          method: "DELETE",
          path: "task",
          cors: true,
        },
      },
    ],
  },
  getTask: {
    handler: "handler.getTask",
    events: [
      {
        http: {
          method: "GET",
          path: "task",
          cors: true,
        },
      },
    ],
  },
  updateTask: {
    handler: "handler.updateTask",
    events: [
      {
        http: {
          method: "PUT",
          path: "task",
          cors: true,
        },
      },
    ],
  },
  handleApiGatewayLog: {
    handler: "ops-handler.handleApiGatewayLog",
    events: [
      {
        subscriptionFilter: {
          stage: "${self:custom.stage}",
          logGroupName: "/aws/api-gateway/${self:service}-${self:custom.stage}",
          filterPattern:
            '{$.status = "429" || $.status = "502" || $.status = "504"}',
        },
      } as any,
    ],
  },
};
