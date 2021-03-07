import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { UpdateItem } from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";
import requestConstraints from "../../constraints/list/update.constraint.json";

export const updateList: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestData = JSON.parse(event.body ?? "{}");
  const databaseService = new DatabaseService();
  const { listTable } = databaseTables();
  const { listId, name } = requestData;

  try {
    await Promise.all([
      validateAgainstConstraints(requestData, requestConstraints),
      databaseService.getItem({ key: listId, tableName: listTable }),
    ]);

    const params: UpdateItem = {
      TableName: listTable,
      Key: {
        id: listId,
      },
      UpdateExpression: "set #name = :name, updatedAt = :timestamp",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":timestamp": new Date().getTime(),
      },
      ReturnValues: "UPDATED_NEW",
    };
    const results = await databaseService.update(params);
    const response = new ResponseModel(
      { ...results.Attributes },
      200,
      "To-do list successfully updated"
    );
    return response.generate();
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "To-do list cannot be updated");
    return response.generate();
  }
};
