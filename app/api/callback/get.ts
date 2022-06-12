import { APIGatewayEvent, Callback } from 'aws-lambda';
import { GetCallbackResquest } from 'gen/sample';

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

    return callback(null, {
      statusCode: 200 ,
      body: JSON.stringify({
        state: params.state,
        code: params.code
      })
    });
  } catch (e: any) {
    console.log(e);
    return callback(null, {
      statusCode: e.response.status ?? 500 ,
      body: JSON.stringify(e.response.data)
    });
  }
};