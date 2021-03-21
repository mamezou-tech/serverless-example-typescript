import "source-map-support/register";

import TaskModel, { ITaskInterface } from "../../models/task.model";
import ResponseModel from "../../models/response.model";
import DatabaseService, { PutItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/task/create.constraint.json";
import { wrapAsRequest } from "../../utils/lambda-handler";
import { StatusCode } from "../../enums/status-code.enum";

const createTaskHandler = async (
  body: ITaskInterface
): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { listTable, tasksTable } = databaseTables();

  try {
    await Promise.all([
      validateRequest(body, requestConstraints),
      databaseService.getItem({
        key: body.listId,
        tableName: listTable,
      }),
    ]);
    const taskModel = new TaskModel(body);
    const data = taskModel.toEntityMapping();

    const params: PutItem = {
      TableName: tasksTable,
      Item: {
        id: data.id,
        listId: data.listId,
        description: data.description,
        completed: data.completed,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
      },
    };
    await databaseService.create(params);
    return new ResponseModel(
      { taskId: data.id },
      StatusCode.CREATED,
      "Task successfully added"
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, StatusCode.ERROR, "Task could not be added");
  }
};

export const createTask = wrapAsRequest(createTaskHandler);
