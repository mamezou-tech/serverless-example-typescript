import "source-map-support/register";

import ListModel, { IListInterface } from "../../models/list.model";
import ResponseModel from "../../models/response.model";

import DatabaseService, { PutItem } from "../../services/database.service";
import { databaseTables, validateRequest } from "../../utils/util";

import requestConstraints from "../../constraints/list/create.constraint.json";
import { wrapAsRequest } from "../../utils/lambda-handler";

const createListHandler = async (
  body: IListInterface
): Promise<ResponseModel> => {
  try {
    await validateRequest(body, requestConstraints);
    const databaseService = new DatabaseService();

    const listModel = new ListModel(body);
    const data = listModel.toEntityMappings();
    const params: PutItem = {
      TableName: databaseTables().listTable,
      Item: {
        id: data.id,
        name: data.name,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
      },
    };
    await databaseService.create(params);
    return new ResponseModel(
      { listId: data.id },
      200,
      "TO-do list successfully created"
    );
  } catch (error) {
    return error instanceof ResponseModel
      ? error
      : new ResponseModel({}, 500, "To-do list cannot be created");
  }
};

export const createList = wrapAsRequest(createListHandler);
