import { APIGatewayEvent, Callback } from 'aws-lambda';
import { GetCallbackResquest } from 'gen/sample';
import { getObject } from 'app/service/s3';
import config from 'app/config';
import { getAccessToken } from 'app/service/twitter';
import { PostAccessTokenResponse } from 'gen/twitter';

const main = async (state: string, code: string): Promise<PostAccessTokenResponse> => {
  // s3に保存していたcode_verifierを取得
  const codeVerifier = await getObject(config.bucket, state);

  // access_tokenを発行
  return await getAccessToken(code, codeVerifier.toString());
};

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  try {
    const params = (event.queryStringParameters ?? {}) as GetCallbackResquest;
    if (!params.code || !params.state) {
      return callback(null, {
        statusCode: 400,
        body: JSON.stringify({
          message: 'queryStringParameters required.'
        })
      });
    }

    const result = await main(params.state, params.code);

    return callback(null, {
      statusCode: 200 ,
      body: JSON.stringify(result)
    });
  } catch (e: any) {
    console.log(e);
    return callback(null, {
      statusCode: e.response.status ?? 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};