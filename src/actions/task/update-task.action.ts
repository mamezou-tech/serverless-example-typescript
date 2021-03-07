import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult,
} from "aws-lambda";
import "source-map-support/register";

import ResponseModel from "../../models/response.model";
import DatabaseService, { UpdateItem } from "../../services/database.service";
import { databaseTables, validateAgainstConstraints } from "../../utils/util";
import requestConstraints from "../../constraints/task/update.constraint.json";

export const updateTask: APIGatewayProxyHandler = async (
  event: APIGatewayEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestData = JSON.parse(event.body ?? "{}");
  const databaseService = new DatabaseService();
  const { listId, taskId, completed, description } = requestData;
  const { listTable, tasksTable } = databaseTables();

  try {
    await Promise.all([
      // Validate against constraints
      validateAgainstConstraints(requestData, requestConstraints),
      // Get item from the DynamoDB table
      databaseService.getItem({ key: listId, tableName: listTable }),
    ]);
    const isCompletedPresent = typeof completed !== "undefined";

    // Initialise the update expression
    const updateExpression = `set ${
      description ? "description = :description," : ""
    } ${
      typeof completed !== "undefined" ? "completed = :completed," : ""
    } updatedAt = :timestamp`;

    // Ensures at least one optional parameter is present
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
      // Set optional values only if present
      if (description) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        params.ExpressionAttributeValues![":description"] = description;
      }
      if (isCompletedPresent) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        params.ExpressionAttributeValues![":completed"] = completed;
      }

      const results = await databaseService.update(params);
      const response = new ResponseModel(
        { ...results.Attributes },
        200,
        "Task successfully updated"
      );
      return response.generate();
    } else {
      return new ResponseModel({}, 400, "Invalid Request!").generate();
    }
  } catch (error) {
    const response =
      error instanceof ResponseModel
        ? error
        : new ResponseModel({}, 500, "Task could not be updated");
    return response.generate();
  }
};
