import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult
} from "aws-lambda";
import "source-map-support/register";

import ListModel from "../../models/list.model";
import ResponseModel from "../../models/response.model";

import DatabaseService from "../../services/database.service";
import { validateAgainstConstraints } from "../../utils/util";

import requestConstraints from "../../constraints/list/create.constraint.json";

export const createList: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  let response: ResponseModel;

  const requestData = JSON.parse(event.body);
  return validateAgainstConstraints(requestData, requestConstraints)
    .then(async () => {
      const databaseService = new DatabaseService();
      const listModel = new ListModel(requestData);
      const data = listModel.toEntityMappings();
      const params = {
        TableName: process.env.LIST_TABLE,
        Item: {
          id: data.id,
          name: data.name,
          createdAt: data.timestamp,
          updatedAt: data.timestamp,
        }
      };
      await databaseService.create(params);
      return data.id;
    })
    .then((listId) => {
      response = new ResponseModel({listId}, 200, 'TO-do list successfully created');
    })
    .catch((error) => {
      response = (error instanceof ResponseModel) ? error : new ResponseModel({}, 500, "To-do list cannot be created");
    })
    .then(() => {
      return response.generate();
    });
};