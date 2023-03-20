Express server setup to recieve incoming twitch API post requests of a user going live, then take that information and create an embeded discord post using webhook. 

Currently the Twitch EventSub is initiated using the Twitch CLI before using this server to process the Post requests.

This project uses an NGROK secure tunnel to recieve the Twitch Post requests.

The project needs the following environmental constants setup before running:

- PORT
> Defined port the server will be listening on, if using NGROK tunnel this should match the same port set for the tunnel

- TWITCH_SIGNING_SECRET
> Unique string that is used to verify any incoming post requests

- TWITCH_CLIENT_ID
> ID from [Twitch Developer](https://dev.twitch.tv/console) application that you create.

- TWITCH_CLIENT_SECRET
> Secret from [Twitch Developer](https://dev.twitch.tv/console) application that you create.

- DISCORD_WEBSOCKET_URL
> Discord websocket URL used to post the notification to

- TWITCH_BROADCASTER_ID
> Unique ID of broadcaster, this can be found using [Twitch CLI](https://dev.twitch.tv/docs/cli/) tool

- NGROK_URL
> Unique Ngrok tunnel URL that should point to PORT on the local host

In works:

- Incorporating the ability to initiate a Twitch stream.online EventSub in express server
- See active Twitch event subscriptions
- Disable Twitch event subscriptions
