const clientId = process.env.CLIENT_ID;
if (!clientId) throw new Error('process.env.CLIENT_ID is required.');

const bucket = process.env.BUCKET;
if (!bucket) throw new Error('process.env.BUCKET is required.');

const redirectUri = process.env.REDIRECT_URI;
if (!redirectUri) throw new Error('process.env.REDIRECT_URI is required.');

const config = {
  clientId,
  bucket,
  redirectUri
};

export default config;
