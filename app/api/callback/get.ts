import { APIGatewayEvent, Callback } from 'aws-lambda';
import { GetCallbackResquest } from 'gen/sample';
import config from 'app/config';
import { getObject } from 'app/service/s3';
import { getAccessToken, getUsersMe } from 'app/service/twitter';

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
    // s3に保存していたcode_verifierを取得
    const codeVerifier = await getObject(config.bucket, params.state);
    // access_tokenを発行
    const accessToken = await getAccessToken(params.code, codeVerifier.toString());
    // twitter apiを実行
    const usersMe = await getUsersMe(accessToken.access_token);

    return callback(null, {
      statusCode: 200 ,
      body: JSON.stringify(usersMe)
    });
  } catch (e: any) {
    return callback(null, {
      statusCode: 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};