
const getEnvironment = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`process.env.${key} is required.`);
  return value;
};

const config = {
  clientId: getEnvironment('CLIENT_ID'),
  clientSecret: getEnvironment('CLIENT_SECRET'),
  bucket: getEnvironment('BUCKET'),
  callbackUri: getEnvironment('CALLBACK_URI')
};

export default config;
