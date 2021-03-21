import validate from "validate.js/validate";

import ResponseModel from "../models/response.model";

export const validateRequest = <INPUT>(
  values: INPUT,
  constraints: { [key in string]: unknown }
): Promise<INPUT> => {
  return new Promise<INPUT>((resolve, reject) => {
    const validation = validate(values, constraints);
    if (typeof validation === "undefined") {
      resolve(values);
    } else {
      reject(
        new ResponseModel({ validation }, 400, "required fields are missing")
      );
    }
  });
};

export const createChunks = <T>(data: T[], chunkSize: number): T[][] => {
  const urlChunks: T[][] = [];
  let batchIterator = 0;
  while (batchIterator < data.length) {
    urlChunks.push(data.slice(batchIterator, (batchIterator += chunkSize)));
  }
  return urlChunks;
};

export type DatabaseProp = {
  listTable: string;
  tasksTable: string;
};

export const databaseTables = (): DatabaseProp => {
  const { LIST_TABLE, TASKS_TABLE } = process.env;
  return {
    listTable: LIST_TABLE ?? "unknown-list-table",
    tasksTable: TASKS_TABLE ?? "unknown-tasks-table",
  };
};
