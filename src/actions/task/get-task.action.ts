import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/task/get.constraint.json";
import { wrapAsJsonRequest } from "../../utils/lambda-handler";

const getTaskHandler = async (body: {
  taskId: string;
  listId: string;
}): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { taskId, listId } = body;
  const { tasksTable } = databaseTables();

  try {
    await validateRequest(body, requestConstraints);
    const data = await databaseService.getItem({
      key: taskId,
      hash: "listId",
      hashValue: listId,
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

export const getTask = wrapAsJsonRequest(getTaskHandler);
