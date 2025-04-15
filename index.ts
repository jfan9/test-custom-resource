import cdk = require('aws-cdk-lib');
import customResources = require('aws-cdk-lib/custom-resources');
import lambda = require('aws-cdk-lib/aws-lambda');
import { Construct } from 'constructs';

import path = require('path');
import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';


export class MyCustomResource extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const creatorFunction = new lambda.Function(this, 'LambdaCreator', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      timeout: cdk.Duration.minutes(5)
    });
    
    // Add permissions to create/delete Lambda functions
    creatorFunction.addToRolePolicy(new PolicyStatement({
      actions: ['lambda:CreateFunction', 'lambda:DeleteFunction'],
      resources: ['*']
    }));

    const provider = new customResources.Provider(this, 'Provider', {
      onEventHandler: creatorFunction,
    });

    const lambdaRole = new Role(this, 'CreatedLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    creatorFunction.addToRolePolicy(new PolicyStatement({
      actions: [
        '*'
      ],
      resources: ['*']
    }));

    // Add the PassRole permission specifically for the created Lambda's role
    creatorFunction.addToRolePolicy(new PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [lambdaRole.roleArn],  // Scope it to just the role we're passing
    }));

    const customResource = new cdk.CustomResource(this, 'CreateLambdaCustomResource', {
      serviceToken: provider.serviceToken,
      properties: {
        FunctionName: 'MyTestFunction',
        RoleArn: lambdaRole.roleArn
      }
    });

    const createdLambdaArn = customResource.getAtt('Result').toString();

    // Optional: Output the ARN
    new cdk.CfnOutput(this, 'CreatedLambdaArn', {
      value: createdLambdaArn
    });
    
  }
}

const app = new cdk.App();
new MyCustomResource(app, 'CustomResourceDemoStack');
app.synth();
