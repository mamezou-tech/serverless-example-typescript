import { Context } from "aws-lambda";
import "source-map-support/register";

import ListModel from "../../models/list.model";
import ResponseModel from "../../models/response.model";

import DatabaseService, { PutItem } from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";

import requestConstraints from "../../constraints/list/create.constraint.json";
import { PostRequestHandler, wrapPost } from "../../utils/lambda-handler";

const createList: PostRequestHandler = async (
  body: string,
  _context: Context
): Promise<ResponseModel> => {
  try {
    await validateAgainstConstraints(body as any, requestConstraints);
    const databaseService = new DatabaseService();
    const listModel = new ListModel(body as any);
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

const wrappedCreateList = wrapPost(createList);
export { wrappedCreateList as createList };
