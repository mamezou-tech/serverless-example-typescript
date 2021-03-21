import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { QueryItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/list/get.constraint.json";
import { QueryParams, wrapAsRequest } from "../../utils/lambda-handler";

const getListHandler = async (
  _body: never,
  queryParams: QueryParams
): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { listTable, tasksTable } = databaseTables();

  try {
    await validateRequest(queryParams, requestConstraints);
    const { listId } = queryParams;
    const data = await databaseService.getItem({
      key: listId!,
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

    return new ResponseModel(
      {
        ...data.Item,
        taskCount: tasks?.length,
        tasks: tasks,
      },
      200,
      "To-do list successfully retrieved"
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, 500, "To-do list not found");
  }
};

export const getList = wrapAsRequest(getListHandler);
