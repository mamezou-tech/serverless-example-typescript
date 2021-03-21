import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, {
  DeleteItem,
  QueryItem,
} from "../../services/database.service";
import {
  createChunks,
  databaseTables,
  validateRequest,
} from "../../utils/util";
import requestConstraints from "../../constraints/list/get.constraint.json";
import { wrapAsJsonRequest } from "../../utils/lambda-handler";

const deleteListHandler = async (body: {
  listId: string;
}): Promise<ResponseModel> => {
  const { listTable, tasksTable } = databaseTables();
  const databaseService = new DatabaseService();

  try {
    await validateRequest(body, requestConstraints);
    // check item exists
    const { listId } = body;
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
    return new ResponseModel({}, 200, "To-do list successfully deleted");
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, 500, "To-do list cannot be deleted");
  }
};

export const deleteList = wrapAsJsonRequest(deleteListHandler);
