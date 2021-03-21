import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { DeleteItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/task/delete.constraint.json";
import { QueryParams, wrapAsRequest } from "../../utils/lambda-handler";
import { StatusCode } from "../../enums/status-code.enum";

const deleteTaskHandler = async (
  _body: never,
  queryParams: QueryParams
): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { tasksTable } = databaseTables();

  try {
    await validateRequest(queryParams, requestConstraints);
    const { taskId, listId } = queryParams;
    const existsItem = await databaseService.existsItem({
      key: taskId!,
      hash: "listId",
      hashValue: listId!,
      tableName: tasksTable,
    });
    if (!existsItem) {
      return new ResponseModel(
        {},
        StatusCode.NO_CONTENT,
        "task has already been deleted"
      );
    }
    const params: DeleteItem = {
      TableName: tasksTable,
      Key: {
        id: taskId,
        listId: listId,
      },
    };
    await databaseService.delete(params);
    return new ResponseModel({}, StatusCode.NO_CONTENT, "Task successfully deleted");
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, StatusCode.ERROR, "Task could not be deleted");
  }
};

export const deleteTask = wrapAsRequest(deleteTaskHandler);
