import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { QueryItem } from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";
import requestConstraints from "../../constraints/list/get.constraint.json";

export const getList: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {

  const requestData = JSON.parse(event.body ?? "{}");
  const databaseService = new DatabaseService();
  const { listId } = requestData;
  const { listTable, tasksTable } = databaseTables();

  try {
    await validateAgainstConstraints(requestData, requestConstraints);
    const data = await databaseService.getItem({
      key: listId,
      tableName: listTable,
    });

    const params: QueryItem = {
      TableName: tasksTable,
      IndexName: "list_index",
      KeyConditionExpression: "listId = :listIdVal",
      ExpressionAttributeValues: {
        ":listIdVal": listId,
      },
    };

    const results = await databaseService.query(params);
    const tasks = results?.Items?.map((task) => {
      return {
        id: task.id,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    });

    // Set Success Response with data
    const response = new ResponseModel(
      {
        ...data.Item,
        taskCount: tasks?.length,
        tasks: tasks,
      },
      200,
      "To-do list successfully retrieved"
    );
    return response.generate();
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "To-do list not found");
    return response.generate();
  }
};
