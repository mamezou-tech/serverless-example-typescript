import "source-map-support/register";
import {
  Callback,
  CloudWatchLogsDecodedData,
  CloudWatchLogsEvent,
  CloudWatchLogsHandler,
  Context,
} from "aws-lambda";
import * as zlib from "zlib";

// triggered by subscription filter
export const handleApiGatewayLog: CloudWatchLogsHandler = (
  event: CloudWatchLogsEvent,
  _context: Context,
  callback: Callback
): void => {
  const decoded = Buffer.from(event.awslogs.data, "base64");
  zlib.gunzip(decoded, (e, result) => {
    if (e) {
      callback(e, null);
    } else {
      const json: CloudWatchLogsDecodedData = JSON.parse(
        result.toString("ascii")
      );
      json.logEvents.forEach((event) => {
        console.log("detail info", JSON.parse(event.message));
      });
      // TODO instead of logging, do useful things(mail, chat...)
      callback(null);
    }
  });
};

