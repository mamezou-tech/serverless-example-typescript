import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import TaskModel from "../../models/task.model";
import ResponseModel from "../../models/response.model";
import DatabaseService, { PutItem } from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";
import requestConstraints from "../../constraints/task/create.constraint.json";

export const createTask: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestData = JSON.parse(event.body ?? "{}");
  const databaseService = new DatabaseService();
  const { listTable, tasksTable } = databaseTables();

  try {
    await Promise.all([
      validateAgainstConstraints(requestData, requestConstraints),
      databaseService.getItem({
        key: requestData.listId,
        tableName: listTable,
      }),
    ]);
    const taskModel = new TaskModel(requestData);
    const data = taskModel.toEntityMapping();

    const params: PutItem = {
      TableName: tasksTable,
      Item: {
        id: data.id,
        listId: data.listId,
        description: data.description,
        completed: data.completed,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
      },
    };
    await databaseService.create(params);
    const response = new ResponseModel(
      { taskId: data.id },
      200,
      "Task successfully added"
    );
    return response.generate();
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "Task could not be added");
    return response.generate();
  }
};
