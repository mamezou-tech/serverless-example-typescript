import ResponseModel from "../models/response.model";

import { StatusCode } from "../enums/status-code.enum";
import { ResponseMessage } from "../enums/response-message.enum";

import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  DeleteCommand,
  DeleteCommandInput,
  DeleteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  UpdateCommand,
  UpdateCommandInput,
  UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";

type Item = Record<string, string>;

const { STAGE } = process.env;
const config: DynamoDBClientConfig = {
  region: "ap-northeast-1",
};

if (STAGE === "dev") {
  config.credentials = {
    accessKeyId: "dummy",
    secretAccessKey: "dummy",
  };
  config.endpoint = "http://localhost:8008";
  console.log("dynamodb-local mode", config);
} else {
  console.log("running dynamodb on aws", STAGE);
}

const dynamodbClient = new DynamoDBClient(config);
const documentClient = DynamoDBDocumentClient.from(dynamodbClient);

export default class DatabaseService {
  getItem = async ({
    key,
    hash,
    hashValue,
    tableName,
  }: Item): Promise<GetCommandOutput> => {
    const params = {
      TableName: tableName,
      Key: {
        id: key,
      },
    };
    if (hash) {
      params.Key[hash] = hashValue;
    }
    const results = await this.get(params);
    if (Object.keys(results).length) {
      return results;
    }
    console.log("item does not exist");
    throw new ResponseModel(
      { id: key },
      StatusCode.NOT_FOUND,
      ResponseMessage.GET_ITEM_ERROR
    );
  };

  existsItem = async ({
    key,
    hash,
    hashValue,
    tableName,
  }: Item): Promise<boolean> => {
    try {
      await this.getItem({ key, hash, hashValue, tableName });
      return true;
    } catch (e) {
      if (e instanceof ResponseModel) {
        return e.code !== StatusCode.NOT_FOUND;
      } else {
        throw e;
      }
    }
  };

  create = async (params: PutCommandInput): Promise<PutCommandOutput> => {
    try {
      return await documentClient.send(new PutCommand(params));
    } catch (error) {
      console.error("create-error", error);
      throw new ResponseModel({}, StatusCode.ERROR, `create-error: ${error}`);
    }
  };

  batchCreate = async (
    params: BatchWriteCommandInput
  ): Promise<BatchWriteCommandOutput> => {
    try {
      return await documentClient.send(new BatchWriteCommand(params));
    } catch (error) {
      throw new ResponseModel(
        {},
        StatusCode.ERROR,
        `batch-write-error: ${error}`
      );
    }
  };

  update = async (params: UpdateCommandInput): Promise<UpdateCommandOutput> => {
    try {
      return await documentClient.send(new UpdateCommand(params));
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `update-error: ${error}`);
    }
  };

  query = async (params: QueryCommandInput): Promise<QueryCommandOutput> => {
    try {
      return await documentClient.send(new QueryCommand(params));
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `query-error: ${error}`);
    }
  };

  get = async (params: GetCommandInput): Promise<GetCommandOutput> => {
    try {
      return await documentClient.send(new GetCommand(params));
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `get-error: ${error}`);
    }
  };

  delete = async (params: DeleteCommandInput): Promise<DeleteCommandOutput> => {
    try {
      return await documentClient.send(new DeleteCommand(params));
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `delete-error: ${error}`);
    }
  };
}
