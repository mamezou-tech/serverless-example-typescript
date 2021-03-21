import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import ResponseModel from "src/models/response.model";
import "source-map-support/register";

export type LambdaHandler = (
  event: APIGatewayEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export type PostRequestHandler<REQ> = (
  body: REQ,
  context: Context
) => Promise<ResponseModel>;

export const wrapAsJsonRequest = <REQ>(
  handler: PostRequestHandler<REQ>
): LambdaHandler => {
  return async (
    event: APIGatewayEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const requestData: REQ = JSON.parse(event.body ?? "{}");
    const response = await handler(requestData, context);
    return response.generate();
  };
};
