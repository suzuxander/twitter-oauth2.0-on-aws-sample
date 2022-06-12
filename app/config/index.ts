
const getEnvironment = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`process.env.${key} is required.`);
  return value;
};

const config = {
  clientId: getEnvironment('CLIENT_ID'),
  clientSecret: getEnvironment('CLIENT_SECRET'),
  bucket: getEnvironment('BUCKET'),
  redirectUri: getEnvironment('REDIRECT_URI')
  // redirectUri: {
  //   confidential: getEnvironment('REDIRECT_URI_CONFIDENTIAL'),
  //   public: getEnvironment('REDIRECT_URI_PUBLIC'),
  // }
};

export default config;
