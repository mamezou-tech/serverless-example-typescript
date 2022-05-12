export default {
  // AlertTopic: {
  //   Type: "AWS::SNS::Topic",
  //   Properties: {
  //     TopicName: "${self:service}-${self:custom.stage}-alert-topic",
  //     DisplayName: "${self:service}-${self:custom.stage} Alert Topic",
  //     Subscription: [
  //       {
  //         Protocol: "email",
  //         Endpoint: "${self:custom.notificationMailAddress}",
  //       },
  //     ],
  //   },
  // } as CloudFormationResource,
  ThrottlingFilter: {
    DependsOn: ["ApiGatewayLogGroup"],
    Type: "AWS::Logs::MetricFilter",
    DeletionPolicy: "Delete",
    Properties: {
      FilterPattern: '{$.status = "429"}',
      LogGroupName: "/aws/api-gateway/${self:service}-${self:custom.stage}",
      MetricTransformations: [
        {
          DefaultValue: 0,
          MetricName: "throttlingCount",
          MetricNamespace: "${self:service}-${self:custom.stage}",
          MetricValue: "1",
        },
      ],
    },
  },
  ThrottlingAlarm: {
    Type: "AWS::CloudWatch::Alarm",
    DeletionPolicy: "Delete",
    Properties: {
      AlarmDescription:
        "${self:service}-${self:custom.stage} API Throttling Alarm",
      AlarmName: "${self:service}-${self:custom.stage}-apigw-throttling",
      AlarmActions: [{ Ref: "AwsAlertsAlarm" }],
      ComparisonOperator: "GreaterThanOrEqualToThreshold",
      Threshold: 5,
      DatapointsToAlarm: 1,
      EvaluationPeriods: 1,
      MetricName: "throttlingCount",
      Namespace: "${self:service}-${self:custom.stage}",
      Period: 60,
      Statistic: "Sum",
    },
  } ,
};
