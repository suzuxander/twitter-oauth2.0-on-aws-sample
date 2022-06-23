import { APIGatewayEvent, Callback } from 'aws-lambda';
import * as uuid from 'uuid';
import { putObject } from 'app/service/s3';
import config from 'app/config';
import { generateCodeChallenge, generateCodeVerifier } from 'app/util';
import { generateTwitterAuthorizeUrl } from 'app/service/twitter';

const main = async (): Promise<string> => {
  const codeVerifier = generateCodeVerifier();
  const state = uuid.v4();

  await putObject(config.bucket, state, codeVerifier);

  const codeChallenge = generateCodeChallenge(codeVerifier);

  return generateTwitterAuthorizeUrl(
    state, codeChallenge, config.callbackUri);
};

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  try {
    const redirectUrl = await main();

    return callback(null, {
      statusCode: 302,
      headers: {
        Location: redirectUrl
      }
    });
  } catch (e: any) {
    return callback(null, {
      statusCode: 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};