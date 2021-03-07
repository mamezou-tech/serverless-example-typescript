import {
  APIGatewayProxyHandler,
  APIGatewayEvent,
  Context,
  APIGatewayProxyResult
} from 'aws-lambda';
import 'source-map-support/register';

// Models
import ResponseModel from "../../models/response.model";

// Services
import DatabaseService from "../../services/database.service";

// utils
import { validateAgainstConstraints, createChunks } from "../../utils/util";

// Define the request constraints
import requestConstraints from '../../constraints/list/get.constraint.json';


export const deleteList: APIGatewayProxyHandler = async (event: APIGatewayEvent, _context: Context): Promise<APIGatewayProxyResult> => {
  // Initialize response variable
  let response;

  // Parse request parameters
  const requestData = JSON.parse(event.body);

  // Destructure request data
  const { listId } = requestData;

  // Destructure process.env
  const { LIST_TABLE, TASKS_TABLE } = process.env;

  // Initialise database service
  const databaseService = new DatabaseService();

  // Validate against constraints
  return validateAgainstConstraints(requestData, requestConstraints)
    .then(() => {
      // Get item from the DynamoDB table
      return databaseService.getItem({ key: listId, tableName: LIST_TABLE });
    })
    .then(async () => {
      // Initialise DynamoDB DELETE parameters
      const params = {
        TableName: LIST_TABLE,
        Key: { id: listId },
      };
      return databaseService.delete(params); // Delete to-do list
    })
    .then(async () => {
      // Initialise DynamoDB QUERY parameters
      const taskParams = {
        TableName: TASKS_TABLE,
        IndexName : 'list_index',
        KeyConditionExpression : 'listId = :listIdVal',
        ExpressionAttributeValues : {
          ':listIdVal' : listId
        }
      };
      // Find tasks in list
      const results = await databaseService.query(taskParams);

      // Validate tasks exist
      if (results?.Items.length) {

        // create batch objects
        const taskEntities = results?.Items?.map((item) => {
          return { DeleteRequest: { Key: { id: item.id } } };
        });

        // Tasks more than 25
        // Delete in chunks
        if (taskEntities.length > 25) {
          // Create chunks if tasks more than 25
          // BATCH WRITE has a limit of 25 items
          const taskChunks = createChunks(taskEntities, 25);
          return Promise.all(taskChunks.map((tasks) => {
            return databaseService.batchCreate({
              RequestItems: {
                [TASKS_TABLE]: tasks, // Batch delete task items
              }
            });
          }));
        }
        // Batch delete task items
        return databaseService.batchCreate({
          RequestItems: {
            [TASKS_TABLE]: taskEntities,
          }
        });
      }
    })
    .then(() => {
      // Set Success Response
      response = new ResponseModel({}, 200, 'To-do list successfully deleted');
    })
    .catch((error) => {
      // Set Error Response
      response = (error instanceof ResponseModel) ? error : new ResponseModel({}, 500, 'To-do list cannot be deleted');
    })
    .then(() => {
      // Return API Response
      return response.generate();
    });
};