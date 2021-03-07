import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";
import requestConstraints from "../../constraints/task/get.constraint.json";

export const getTask: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestData = JSON.parse(event.body || "{}");
  const databaseService = new DatabaseService();
  const { taskId, listId } = requestData;
  const { tasksTable } = databaseTables();

  try {
    await validateAgainstConstraints(requestData, requestConstraints);
    const data = await databaseService.getItem({
      key: taskId,
      hash: "listId",
      hashValue: listId,
      tableName: tasksTable,
    });
    const response = new ResponseModel(
      { ...data.Item },
      200,
      "Task successfully retrieved"
    );
    return response.generate();
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "Task not found");
    return response.generate();
  }
};
