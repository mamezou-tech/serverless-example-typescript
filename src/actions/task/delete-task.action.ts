import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { DeleteItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/task/delete.constraint.json";
import { wrapAsJsonRequest } from "../../utils/lambda-handler";

const deleteTaskHandler = async (body: {
  taskId: string;
  listId: string;
}): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { taskId, listId } = body;
  const { tasksTable } = databaseTables();

  try {
    await validateRequest(body, requestConstraints);
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
    return new ResponseModel({}, 200, "Task successfully deleted");
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, 500, "Task could not be deleted");
  }
};

export const deleteTask = wrapAsJsonRequest(deleteTaskHandler);
