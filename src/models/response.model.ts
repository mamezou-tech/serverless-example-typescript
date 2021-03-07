import { Status } from "../enums/status.enum";

type ResponseHeader = { [header: string]: string | number | boolean };

interface IResponseBody {
  data: any;
  message: string;
  status?: string;
}

interface IResponse {
  statusCode: number;
  headers: ResponseHeader;
  body: string;
}

const STATUS_MESSAGES = {
  200: Status.SUCCESS,
  400: Status.BAD_REQUEST,
  500: Status.ERROR
};

const RESPONSE_HEADERS: ResponseHeader = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true
};

export default class ResponseModel {
  private readonly body: IResponseBody;

  constructor(data = {}, readonly code = 402, message = '') {
    this.body = {
      data,
      message,
      status: STATUS_MESSAGES[code]
    };
    this.code = code;
  }

  setBodyVariable = (variable: string, value: string): void => {
    this.body[variable] = value;
  };

  get message(): string {
    return this.body.message;
  }

  get data(): any {
    return this.body.data;
  }

  generate = (): IResponse => {
    return {
      statusCode: this.code,
      headers: RESPONSE_HEADERS,
      body: JSON.stringify(this.body),
    };
  };
}
