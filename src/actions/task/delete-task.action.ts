import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { DeleteItem } from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";
import requestConstraints from "../../constraints/task/delete.constraint.json";

export const deleteTask: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestData = JSON.parse(event.body || "{}");
  const databaseService = new DatabaseService();
  const { taskId, listId } = requestData;
  const { tasksTable } = databaseTables();

  try {
    await validateAgainstConstraints(requestData, requestConstraints);
    await databaseService.getItem({
      key: taskId,
      hash: "listId",
      hashValue: listId,
      tableName: tasksTable,
    });
    const params: DeleteItem = {
      TableName: tasksTable,
      Key: {
        id: taskId,
        listId: listId,
      },
    };
    await databaseService.delete(params);
    const response = new ResponseModel({}, 200, "Task successfully deleted");
    return response.generate();
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "Task could not be deleted");
    return response.generate();
  }
};
