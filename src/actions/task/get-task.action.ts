import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/task/get.constraint.json";
import { QueryParams, wrapAsRequest } from "../../utils/lambda-handler";

const getTaskHandler = async (
  _body: never,
  queryParams: QueryParams
): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { tasksTable } = databaseTables();

  try {
    await validateRequest(queryParams, requestConstraints);
    const { taskId, listId } = queryParams;
    const data = await databaseService.getItem({
      key: taskId!,
      hash: "listId",
      hashValue: listId!,
      tableName: tasksTable,
    });
    return new ResponseModel(
      { ...data.Item },
      200,
      "Task successfully retrieved"
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, 500, "Task not found");
  }
};

export const getTask = wrapAsRequest(getTaskHandler);
