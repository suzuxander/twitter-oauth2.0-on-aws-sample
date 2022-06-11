#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';
import * as jsYaml from 'js-yaml';
import * as fs from 'fs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { config } from 'dotenv';

config();

interface OpenApi {
  paths: {
    [path: string]: {
      [method: string]: {
        description: string
        'x-amazon-apigateway-integration': {
          uri: string
        }
      }
    }
  }
}

const ACCOUNT_ID = process.env.ACCOUNT_ID;
if (!ACCOUNT_ID) throw new Error('process.env.ACCOUNT_ID is required.');

const REGION = process.env.REGION ?? 'ap-northeast-1';
const DEPLOY_STAGE = process.env.DEPLOY_STATGE ?? 'dev';

const createOpenApiYaml = (input: string, output: string): OpenApi => {
  const yaml = fs.readFileSync(input).toString()
    .replace(/\{ACCOUNT_ID}/g, ACCOUNT_ID)
    .replace(/\{REGION}/g, REGION);
  fs.writeFileSync(output, yaml);
  return jsYaml.load(yaml) as OpenApi;
};

const kebabToCamel = (str: string): string => {
  const _str = str.replace(/-./g, (v) => v.charAt(1).toUpperCase())
  return _str.replace(/^./, _str.charAt(0).toUpperCase());
};

const app = new cdk.App();
const stack = new CdkStack(app, 'twitter-oauth2-sample', { env: { region: REGION } });

const outputOpenapiName = 'openapi.yaml';
const openapi = createOpenApiYaml('../openapi/openapi.yaml', './cdk.out/' + outputOpenapiName);

const bucket = stack.bucket('CodeVerifierStoreBucket', {
  bucketName: 'twitter-oauth2-sample-code-verifier-store-' + cdk.Aws.ACCOUNT_ID
});

const api = stack.api('Api', {
  name: 'twitter-oauth2-sample-api',
  definitionPath: './cdk.out/' + outputOpenapiName,
  stageName: DEPLOY_STAGE,
});

const role = stack.lambdaServiceRole('LambdaServiceRole', {
  roleName: 'twitter-oauth2-sample-lambda-service-role',
  policies: [
    new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [ bucket.attrArn, bucket.attrArn + '/*' ],
      actions: [ 's3:*' ]
    })
  ]
});

Object.keys(openapi.paths).forEach(path => {
  Object.keys(openapi.paths[path]).forEach(method => {
    const { uri } = openapi.paths[path][method]['x-amazon-apigateway-integration'];
    const functionName = (uri.split(':').pop() as string).split('/').shift() as string;

    const func = stack.lambdaFunction((kebabToCamel(functionName)).replace(/-/g, ''), {
      functionName,
      entry: openapi.paths[path][method].description,
      runtime: Runtime.NODEJS_16_X,
      handler: 'handler',
      role,
      environment: {
        CLIENT_ID: process.env.CLIENT_ID as string,
        BUCKET: bucket.bucketName as string,
        REDIRECT_URI: `https://${api.restApiId}.execute-api.${cdk.Aws.REGION}.${cdk.Aws.URL_SUFFIX}/${api.deploymentStage.stageName}/callback`,
      }
    });
    func.addPermission('Permission', {
      action: 'lambda:InvokeFunction',
      sourceArn: api.arnForExecuteApi(method.toUpperCase(), path, 'dev'),
      principal: new ServicePrincipal('apigateway.amazonaws.com', ),
    });
  });
});