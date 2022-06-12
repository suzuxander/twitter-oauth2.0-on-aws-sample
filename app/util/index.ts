import crypto from 'crypto';

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
