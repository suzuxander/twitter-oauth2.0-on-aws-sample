# twitter-oauth2-sample
## 概要
TwitterのOAuth2.0を使用したTwitter API v2を実行するプロジェクトのサンプル。  
API Gateway + Lambda関数を使用して認可等を行う。  
AWSリソースのデプロイはCDKにより行う。

## 前提
以下はインストール済みとする。
- NodeJS 16くらい
- Java 8くらい (openapi-generatorを実行する際に必要)

## セットアップ
### Twitter Developer Potalの設定
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)にてProject or Appを追加し、以下設定を行う。
- OAuth2.0を有効化する
- "Type of App"は`Public Client`と`Confidential Client`の2種類あるが、`Confidential Client`を選択する (`Public Client`でも問題ないはず)
- "Callback URI / Redirect URL"はこの時点では適当な値を設定しておく
- Saveした際に生成される`Client ID`、`Client Secret`などのクレデンシャル情報は必ずメモしておく

### 必要なライブラリのインストール
```
$ npm run init
```
### CDKデプロイ用の環境変数を設定
```
$ vim .env
ACCOUNT_ID={ACCOUNT_ID} >> cdk/.env
REGION={REGION} >> cdk/.env
BUCKET={BUCKET} >> cdk/.env                 # code_verifierを保存するバケット
CLIENT_ID={CLIENT_ID} >> cdk/.env           # "Twitterの設定 1"でメモした値
CLIENT_SECRET={CLIENT_SECRET} >> cdk/.env   # "Twitterの設定 1"でメモした値
```
### CDKデプロイ
```
$ npm run deploy

twitter-oauth2-sample: creating CloudFormation changeset...

 ✅  twitter-oauth2-sample

✨  Deployment time: 38.67s

Outputs:
twitter-oauth2-sample.ApiEndpoint00000000 = https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/

```
### リダイレクトURLの変更
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)で`Callback URI / Redirect URL`の値をデプロイで生成されたAPIのエンドポイント + `public/callback`に変更する。  
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/callback
```

### 動作確認
1. デプロイで生成されたAPIの以下エンドポイントにブラウザからアクセスする
   ```
   https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/
   ```
1. 「Twitterアカウントへのアクセスを求めています.」という画面が表示されるので、「アプリにアクセスを許可」をクリックする
1. 以下のようにレスポンスの内容が表示されれば、Twitterの認証ページからのコールバックが受け取れている
   ```json
   {"state":"{STATE}","code":"{CODE}"}
   ```
1. 以下のURLにブラウザからアクセスする (curlでもOK)
   `state`、`code`はコールバックで受け取った値を入れる
   ```
   https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/accesstoken?state={STATE}&cpde={CODE}
   ```
   以下のようにレスポンスが表示されればアクセストークンの取得が成功している
   ```json
   {"token_type":"bearer","expires_in":7200,"access_token":"{ACCESS_TOKEN}","scope":"users.read tweet.read"}
   ```
1. 以下のコマンドを実行する。
   このコマンドではTwitter APIの[GET /2/users/me](https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-me#tab1)に対してリクエストを送信している。  
   以下のようなレスポンスが返ってきたら正常にAPIを実行できている。
   ```bash
   $ npm run build
   $ node dist/client.js {ACCESS_TOKEN}
   {
   id: 'ID',
   name: '{NAME}',
   username: '{USERNAME}'
   }
   ```

## APIの説明
### [GET /](./app/api/redirect/get.ts)  
Twitterの認証ページのURLを生成し、リダイレクトさせるエンドポイント。  
認証ページのパラメータとしていくつかの情報が必要であるため、それらをこのAPI内で生成している。  
code_verifierは認証ページからコールバックされた後でaccess_tokenの取得の際に必要となるためS3バケットに保存している。
  
### [GET /callback](./app/api/callback/get.ts) 
Twitterの認証ページでアクセス許可が行われた際にリダイレクトされるエンドポイント。  
Twitterの認証ページから受け取ったパラメータを返却しているだけ。
  
### [GET /accesstoken](./app/api/accesstoken/get.ts)
access_tokenを取得するためのエンドポイント。  
callbackで受け取ったstateとcodeをパラメータで付与してリクエストをくることでaccess_tokenを取得する。
  
## Twitter OAuth2.0
https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code

<div align="center">
  <img src="https://cdn.cms-twdigitalassets.com/content/dam/developer-twitter/docs/OAuth.png.twimg.1920.png" alt="twitter" width="70%"/>
  <div>
  引用:&nbsp;<a href="https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code">developer.twitter.com</a>
  </div>
</div>

### Authorization Requestの各パラメータ
- response_type  
  `code`固定。
- client_id  
  Developer Portalで確認したクライアント識別子。
- redirect_uri  
  Developer Portalで登録したいずれかのURL。
- scope  
  要求するアクセス範囲を明示するパラメーター。[こちら](https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code)から選択。
- state  
  CSRF対策用のパラメーター。ランダムな値を指定。
- code_challenge  
  code_verifierを後述の[code_challenge_method](https://datatracker.ietf.org/doc/html/rfc7636#section-4.2)で計算したパラメーター。
  code_verifierは推測不可能なランダムな文字列であり、43文字から128文字の範囲で指定する必要がある。
- code_challenge_method  
  code_verifierからcode_challengeを導出する際に利用するアルゴリズム。"plain"または"s256"が指定可能。
