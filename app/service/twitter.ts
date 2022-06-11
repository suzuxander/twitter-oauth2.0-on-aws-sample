import {
  Configuration,
  DefaultApi,
  GetUsersMeResponseData,
  PostAccessTokenResponse
} from 'gen/twitter';
import config from 'app/config';

export const getAccessToken = async (code: string, codeVerifier: string): Promise<PostAccessTokenResponse> => {
  const client = new DefaultApi();
  const response = await client._2oauth2TokenPost(
    code,
    config.clientId,
    'authorization_code',
    config.redirectUri,
    codeVerifier,
  );
  return response.data;
};

export const getUsersMe = async (accessToken: string): Promise<GetUsersMeResponseData> => {
  const client = new DefaultApi({ accessToken } as Configuration);
  const res = await client._2usersMeGet();
  return res.data.data;
};
