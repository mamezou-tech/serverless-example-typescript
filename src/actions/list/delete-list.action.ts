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
import { QueryParams, wrapAsRequest } from "../../utils/lambda-handler";
import { StatusCode } from "../../enums/status-code.enum";

const deleteListHandler = async (
  _body: never,
  queryParams: QueryParams
): Promise<ResponseModel> => {
  const { listTable, tasksTable } = databaseTables();
  const databaseService = new DatabaseService();

  try {
    await validateRequest(queryParams, requestConstraints);
    const { listId } = queryParams;

    // check item exists
    const existsItem = await databaseService.existsItem({
      key: listId!,
      tableName: listTable,
    });
    if (!existsItem) {
      return new ResponseModel(
        {},
        StatusCode.NO_CONTENT,
        "item has already been deleted"
      );
    }

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
    return new ResponseModel(
      {},
      StatusCode.NO_CONTENT,
      "To-do list successfully deleted"
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, StatusCode.ERROR, "To-do list cannot be deleted");
  }
};

export const deleteList = wrapAsRequest(deleteListHandler);
