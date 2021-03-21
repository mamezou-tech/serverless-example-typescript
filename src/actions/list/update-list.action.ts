import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { UpdateItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";
import requestConstraints from "../../constraints/list/update.constraint.json";
import { wrapAsRequest } from "../../utils/lambda-handler";

const updateListHandler = async (body: {
  listId: string;
  name: string;
}): Promise<ResponseModel> => {
  const databaseService = new DatabaseService();
  const { listTable } = databaseTables();
  const { listId, name } = body;

  try {
    await Promise.all([
      validateRequest(body, requestConstraints),
      databaseService.getItem({ key: listId, tableName: listTable }),
    ]);

    const params: UpdateItem = {
      TableName: listTable,
      Key: {
        id: listId,
      },
      UpdateExpression: "set #name = :name, updatedAt = :timestamp",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":name": name,
        ":timestamp": new Date().getTime(),
      },
      ReturnValues: "UPDATED_NEW",
    };
    const results = await databaseService.update(params);
    return new ResponseModel(
      { ...results.Attributes },
      200,
      "To-do list successfully updated"
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, 500, "To-do list cannot be updated");
  }
};

export const updateList = wrapAsRequest(updateListHandler);
