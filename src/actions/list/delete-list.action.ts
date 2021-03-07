import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { DeleteItem, QueryItem } from "../../services/database.service";
import { validateAgainstConstraints, createChunks, databaseTables } from "../../utils/util";
import requestConstraints from "../../constraints/list/get.constraint.json";

export const deleteList: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestData = JSON.parse(event.body ?? "{}");
  const { listId } = requestData;
  const { listTable, tasksTable } = databaseTables();
  const databaseService = new DatabaseService();

  try {
    await validateAgainstConstraints(requestData, requestConstraints);
    // check item exists
    await databaseService.getItem({ key: listId, tableName: listTable });

    const params: DeleteItem = {
      TableName: listTable,
      Key: { id: listId },
    };
    await databaseService.delete(params); // Delete to-do list

    const taskParams: QueryItem = {
      TableName: tasksTable,
      IndexName: "list_index",
      KeyConditionExpression: "listId = :listIdVal",
      ExpressionAttributeValues: {
        ":listIdVal": listId,
      },
    };
    const results = await databaseService.query(taskParams);

    if (results?.Items && results?.Items.length) {
      const taskEntities = results?.Items?.map((item) => {
        return { DeleteRequest: { Key: { id: item.id } } };
      });

      if (taskEntities.length > 25) {
        const taskChunks = createChunks(taskEntities, 25);
        await Promise.all(
          taskChunks.map((tasks) => {
            return databaseService.batchCreate({
              RequestItems: {
                [tasksTable]: tasks,
              },
            });
          })
        );
      } else {
        await databaseService.batchCreate({
          RequestItems: {
            [tasksTable]: taskEntities,
          },
        });
      }
    }
    const response = new ResponseModel(
      {},
      200,
      "To-do list successfully deleted"
    );
    return response.generate();
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "To-do list cannot be deleted");
    return response.generate();
  }
};
