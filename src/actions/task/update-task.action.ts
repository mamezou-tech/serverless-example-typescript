import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { UpdateItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/task/update.constraint.json";
import { wrapAsRequest } from "../../utils/lambda-handler";

const updateTaskHandler = async (body: {
  listId: string;
  taskId: string;
  completed: string;
  description: string;
}): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { listId, taskId, completed, description } = body;
  const { listTable, tasksTable } = databaseTables();

  try {
    await Promise.all([
      validateRequest(body, requestConstraints),
      databaseService.getItem({ key: listId, tableName: listTable }),
    ]);
    const isCompletedPresent = typeof completed !== "undefined";

    const updateExpression = `set ${
      description ? "description = :description," : ""
    } ${
      typeof completed !== "undefined" ? "completed = :completed," : ""
    } updatedAt = :timestamp`;

    if (description || isCompletedPresent) {
      const params: UpdateItem = {
        TableName: tasksTable,
        Key: {
          id: taskId,
          listId: listId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ":timestamp": new Date().getTime(),
        },
        ReturnValues: "UPDATED_NEW",
      };
      if (description) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        params.ExpressionAttributeValues![":description"] = description;
      }
      if (isCompletedPresent) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        params.ExpressionAttributeValues![":completed"] = completed;
      }

      const results = await databaseService.update(params);
      return new ResponseModel(
        { ...results.Attributes },
        200,
        "Task successfully updated"
      );
    } else {
      return new ResponseModel({}, 400, "Invalid Request!");
    }
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, StatusCode.ERROR, "Task could not be updated");
  }
};

export const updateTask = wrapAsRequest(updateTaskHandler);
