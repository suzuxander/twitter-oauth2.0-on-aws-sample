# twitter-oauth2-sample
## 概要
TwitterのOAuth2.0を使用するプロジェクトのサンプル。  
API Gateway + Lambda関数を使用して認証認可を行う。

## 前提
以下はインストール済みとする。
- NodeJS 16くらい
- Java 8くらい (openapi-generatorを実行する際に必要)

## セットアップ
### Twitterの設定 1
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)でAppの追加し、OAuth2.0を有効化する。  
Client IDなどのクレデンシャル情報は必ずメモしておく。`Callback URI / Redirect URL`は一旦適当な値を設定しておく。

### 必要なライブラリのインストール
```
$ npm run init
```
### CDKデプロイ用の環境変数を設定
```
$ echo ACCOUNT_ID={ACCOUNT_ID} >> cdk/.env
$ echo REGION={REGION} >> cdk/.env

# "Twitterの設定 1"でメモした値
$ echo CLIENT_ID={CLIENT_ID} >> cdk/.env
$ echo CLIENT_SECRET={CLIENT_SECRET} >> cdk/.env
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
### Twitterの設定 2
Twitterの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)で`Callback URI / Redirect URL`の値をデプロイで生成されたAPIのエンドポイント + `callback`に変更する。  
```
https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/callback
```

### 動作確認
1. デプロイで生成されたAPIの以下エンドポイントにブラウザからアクセスする
   ```
   https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev/
   ```
1. 「Twitterアカウントへのアクセスを求めています.」という画面が表示されるので、「アプリにアクセスを許可」をクリックする
1. 以下のようにアカウントの内容が表示されればOK
   ```json
   {"id":"0000000000000000000","name":"suzuxander.developer","username":"suzuxander_developer"}
   ```

## APIの説明
### [GET /](./app/api/redirect/get.ts)  
Twitterの認証ページのURLを生成し、リダイレクトさせるエンドポイント。  
認証ページのパラメータとしていくつかの情報が必要であるため、それらをこのAPI内で生成している。  
code_verifierは認証ページからコールバックされた後でaccess_tokenの取得の際に必要となるためS3バケットに保存している。
  
### [GET /callback](./app/api/callback/get.ts) 
Twitterの認証ページでアクセス許可が行われた際にリダイレクトされるエンドポイント。  
リダイレクト時に付与されてきたパラメータを元にaccess_tokenをを取得し、TwitterAPIを実行してその結果を返却する。
  
## Twitter OAuth2.0
https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code

<div align="center">
  <img src="https://cdn.cms-twdigitalassets.com/content/dam/developer-twitter/docs/OAuth.png.twimg.1920.png" alt="twitter" width="70%"/>
  <div>
  引用:&nbsp;<a href="https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code">developer.twitter.com</a>
  </div>
</div>
