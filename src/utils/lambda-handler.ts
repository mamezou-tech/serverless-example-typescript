import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import ResponseModel from "src/models/response.model";
import "source-map-support/register";

export type LambdaHandler = (
  event: APIGatewayEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export type RequestHandler<REQ> = (
  body: REQ,
  params: QueryParams,
  context: Context
) => Promise<ResponseModel>;

export type QueryParams = Record<string, string | undefined>;

export const wrapAsRequest = <REQ = unknown>(
  handler: RequestHandler<REQ>
): LambdaHandler => {
  return async (
    event: APIGatewayEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const requestData: REQ = event.body ? JSON.parse(event.body) : undefined;
    const params = Object.keys(event.queryStringParameters || {}).reduce(
      (acc, cur) => {
        acc[cur] = event.queryStringParameters?.[cur];
        return acc;
      },
      {}
    );
    const response = await handler(requestData, params, context);
    return response.generate();
  };
};
