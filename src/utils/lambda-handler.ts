import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import ResponseModel from "src/models/response.model";
import "source-map-support/register";

type LambdaHandler = (
  event: APIGatewayEvent,
  context: Context
) => Promise<APIGatewayProxyResult>;

export type PostRequestHandler = (body: string, context: Context) => Promise<ResponseModel>;

export const wrapPost = (handler: PostRequestHandler): LambdaHandler => {
  return async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const requestData = JSON.parse(event.body ?? "{}");
    const response = await handler(requestData, context);
    return response.generate();
  };
};

