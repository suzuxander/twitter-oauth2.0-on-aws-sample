import { APIGatewayEvent, Callback } from 'aws-lambda';
import crypto from 'crypto';
import * as uuid from 'uuid';
import { putObject } from 'app/service/s3';
import config from 'app/config';
import { Scope } from 'app/enum';

const TWITTER_AUTHORIZE_URL = 'https://twitter.com/i/oauth2/authorize';

export const generateCodeVerifier = (length: number = 43) => {
  const char = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charLength = char.length;
  let codeVerifier = "";
  for(let i = 0; i<length; i++){
    codeVerifier += char[Math.floor(Math.random() * charLength)];
  }
  return codeVerifier;
};

export const generateCodeChallenge = (codeVerifier: string) => {
  const text = crypto
    .createHash('sha256')
    .update(codeVerifier.toString())
    .digest('base64');

  return text.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const generateRedirectUri = (state: string, code_challenge: string): string => {
  const params: {[p: string]: string | string[]} = {
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: [ Scope.TWEET_READ, Scope.USERS_READ ],
    state,
    code_challenge,
    code_challenge_method: 's256'
  };

  const paramsAry: string[] = [];
  Object.keys(params).forEach(key => {
    if (key === 'scope') {
      paramsAry.push(`${key}=${encodeURIComponent((params[key] as string[]).join(' '))}`);
    } else {
      paramsAry.push(`${key}=${encodeURIComponent(params[key] as string)}`);
    }
  });
  return `${TWITTER_AUTHORIZE_URL}?${paramsAry.join('&')}`;
};

export const handler = async (event: APIGatewayEvent, context: any, callback: Callback): Promise<void> => {
  const codeVerifier = generateCodeVerifier();
  const state = uuid.v4();

  await putObject(config.bucket, state, codeVerifier);

  const codeChallenge = generateCodeChallenge(codeVerifier);
  const redirectUrl = generateRedirectUri(state, codeChallenge);

  return callback(null, {
    statusCode: 302,
    headers: {
      Location: redirectUrl
    }
  });
};