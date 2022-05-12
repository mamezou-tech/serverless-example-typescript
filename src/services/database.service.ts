import * as AWS from "aws-sdk";

import ResponseModel from "../models/response.model";

import { StatusCode } from "../enums/status-code.enum";
import { ResponseMessage } from "../enums/response-message.enum";
import IConfig from "../interfaces/config.interface";

export type PutItem = AWS.DynamoDB.DocumentClient.PutItemInput;
export type PutItemOutput = AWS.DynamoDB.DocumentClient.PutItemOutput;

export type BatchWrite = AWS.DynamoDB.DocumentClient.BatchWriteItemInput;
export type BatchWriteOutput = AWS.DynamoDB.DocumentClient.BatchWriteItemOutput;

export type UpdateItem = AWS.DynamoDB.DocumentClient.UpdateItemInput;
export type UpdateItemOutput = AWS.DynamoDB.DocumentClient.UpdateItemOutput;

export type QueryItem = AWS.DynamoDB.DocumentClient.QueryInput;
export type QueryItemOutput = AWS.DynamoDB.DocumentClient.QueryOutput;

export type GetItem = AWS.DynamoDB.DocumentClient.GetItemInput;
export type GetItemOutput = AWS.DynamoDB.DocumentClient.GetItemOutput;

export type DeleteItem = AWS.DynamoDB.DocumentClient.DeleteItemInput;
export type DeleteItemOutput = AWS.DynamoDB.DocumentClient.DeleteItemOutput;

type Item = Record<string, string>;

const { STAGE } = process.env;
const config: IConfig = {
  region: "ap-northeast-1",
};

if (STAGE === "dev") {
  config.accessKeyId = "dummy";
  config.secretAccessKey = "dummy";
  config.endpoint = "http://localhost:8008";
  console.log("dynamodb-local mode", config);
} else {
  console.log("running dynamodb on aws on", STAGE);
}
AWS.config.update(config);

const documentClient = new AWS.DynamoDB.DocumentClient();

export default class DatabaseService {
  getItem = async ({
                     key,
                     hash,
                     hashValue,
                     tableName,
                   }: Item): Promise<GetItemOutput> => {
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
      {id: key},
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
      await this.getItem({key, hash, hashValue, tableName});
      return true;
    } catch (e) {
      if (e instanceof ResponseModel) {
        return e.code !== StatusCode.NOT_FOUND;
      } else {
        throw e;
      }
    }
  };

  create = async (params: PutItem): Promise<PutItemOutput> => {
    try {
      return await documentClient.put(params).promise();
    } catch (error) {
      console.error("create-error", error);
      throw new ResponseModel({}, StatusCode.ERROR, `create-error: ${error}`);
    }
  };

  batchCreate = async (params: BatchWrite): Promise<BatchWriteOutput> => {
    try {
      return await documentClient.batchWrite(params).promise();
    } catch (error) {
      throw new ResponseModel(
        {},
        StatusCode.ERROR,
        `batch-write-error: ${error}`
      );
    }
  };

  update = async (params: UpdateItem): Promise<UpdateItemOutput> => {
    try {
      return await documentClient.update(params).promise();
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `update-error: ${error}`);
    }
  };

  query = async (params: QueryItem): Promise<QueryItemOutput> => {
    try {
      return await documentClient.query(params).promise();
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `query-error: ${error}`);
    }
  };

  get = async (params: GetItem): Promise<GetItemOutput> => {
    try {
      return await documentClient.get(params).promise();
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `get-error: ${error}`);
    }
  };

  delete = async (params: DeleteItem): Promise<DeleteItemOutput> => {
    try {
      return await documentClient.delete(params).promise();
    } catch (error) {
      throw new ResponseModel({}, StatusCode.ERROR, `delete-error: ${error}`);
    }
  };
}
