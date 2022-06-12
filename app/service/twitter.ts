import {
  Configuration,
  DefaultApi,
  GetUsersMeResponseData,
  PostAccessTokenResponse
} from 'gen/twitter';
import config from 'app/config';
import { Scope } from 'app/enum';

const TWITTER_AUTHORIZE_URL = 'https://twitter.com/i/oauth2/authorize';

export const generateTwitterAuthorizeUrl = (state: string, code_challenge: string, redirectUri: string): string => {
  const params: {[p: string]: string | string[]} = {
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: redirectUri,
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

export const getAccessToken = async (code: string, codeVerifier: string): Promise<PostAccessTokenResponse> => {
  const client = new DefaultApi();
  const response = await client._2oauth2TokenPost(
    code,
    config.clientId,
    'authorization_code',
    config.redirectUri,
    codeVerifier,
    {
      auth: {
        username: config.clientId,
        password: config.clientSecret
      }
    }
  );
  return response.data;
};

export const getUsersMe = async (accessToken: string): Promise<GetUsersMeResponseData> => {
  const client = new DefaultApi({ accessToken } as Configuration);
  const res = await client._2usersMeGet();
  return res.data.data;
};
