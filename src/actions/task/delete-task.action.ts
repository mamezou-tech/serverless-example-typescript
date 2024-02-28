import "source-map-support/register";

import ResponseModel from "~/models/response.model";
import DatabaseService from "~/services/database.service";
import { databaseTables, validateRequest } from "~/utils/util";
import requestConstraints from "~/constraints/task/delete.constraint.json";
import { QueryParams, wrapAsRequest } from "~/utils/lambda-handler";
import { StatusCode } from "~/enums/status-code.enum";
import { ResponseMessage } from "~/enums/response-message.enum";
import { DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

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
        ResponseMessage.DELETE_TASK_NOTFOUND
      );
    }
    const params: DeleteCommandInput = {
      TableName: tasksTable,
      Key: {
        id: taskId,
        listId: listId,
      },
    };
    await databaseService.delete(params);
    return new ResponseModel(
      {},
      StatusCode.NO_CONTENT,
      ResponseMessage.DELETE_TASK_SUCCESS
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel(
          {},
          StatusCode.ERROR,
          ResponseMessage.DELETE_TASK_FAIL
        );
  }
};

export const deleteTask = wrapAsRequest(deleteTaskHandler);
