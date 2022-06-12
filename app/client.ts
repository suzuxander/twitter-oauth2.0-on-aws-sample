import path from 'path';
import { config } from 'dotenv';
config({ path: path.join(__dirname, '../.env') });

import { getUsersMe } from 'app/service/twitter';


(async () => {
  const accesstoken = process.argv[2];
  if (!accesstoken) {
    console.error('You need access token!');
  }
  const res = await getUsersMe(accesstoken);
  console.log(res);
})();
