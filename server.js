require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { ApiClient } = require("twitch");
const { ClientCredentialsAuthProvider } = require("twitch-auth");
const fetch = require("node-fetch");
const authProvider = new ClientCredentialsAuthProvider(
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_SECRET
);
const twitch = new ApiClient({ authProvider });
const twitchSigningSecret = process.env.TWITCH_SIGNING_SECRET;
const app = express();
const port = process.env.PORT;
const discordURL = process.env.DISCORD_WEBSOCKET_URL;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const verifyTwitchSignature = (req, res, buf, encoding) => {
  const messageId = req.header("Twitch-Eventsub-Message-Id");
  const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
  const messageSignature = req.header("Twitch-Eventsub-Message-Signature");
  const time = Math.floor(new Date().getTime() / 1000);
  console.log(`Message ${messageId} Signature: `, messageSignature);

  if (Math.abs(time - timestamp) > 600) {
    // needs to be < 10 minutes
    console.log(
      `Verification Failed: timestamp > 10 minutes. Message Id: ${messageId}.`
    );
    throw new Error("Ignore this request. Request is older than 10 minutes.");
  }

  if (!twitchSigningSecret) {
    console.log(`Twitch signing secret is empty.`);
    throw new Error("Twitch signing secret is empty.");
  }

  const computedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", twitchSigningSecret)
      .update(messageId + timestamp + buf)
      .digest("hex");
  console.log(`Message ${messageId} Computed Signature: `, computedSignature);

  if (messageSignature !== computedSignature) {
    throw new Error("Invalid signature.");
  } else {
    console.log("Verification successful");
  }
};

app.use(express.json({ verify: verifyTwitchSignature }));

const sendOnline = async (event) => {
  const stream = await twitch.helix.streams.getStreamByUserId(
    event.broadcaster_user_id
  );
  const game = await stream.getGame();
  const streamer = event.broadcaster_user_name;
  const streamTitle = stream.title;
  const streamLink = `https://www.twitch.tv/${event.broadcaster_user_login}`;
  const helixUser = await stream.getUser();
  const profilePic = helixUser.profilePictureUrl;
  const streamPreview = stream.thumbnailUrl;

  var discordBody = {
    content: `<@&993631628012298312> ${streamer} is live!`,
    embeds: [
      {
        title: streamTitle,
        url: streamLink,
        color: 16767485,
        thumbnail: {
          url: profilePic,
        },
        description:
          "**I am live everybun, please hop on by if you are free!**",
        fields: [
          {
            name: "Game:",
            value: game.name,
            inline: false,
          },
        ],
        image: {
          url: streamPreview,
        },
      },
    ],
  };

  fetch(discordURL, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify(discordBody),
  })
    .then((res) => {
      console.log(`Online notification for ${streamer} sent.`, res);
    })
    .catch((err) => console.log(err.message));
};

app.post("/webhook/callback", async (req, res) => {
  const messageType = req.header("Twitch-Eventsub-Message-Type");
  if (messageType === "webhook_callback_verification") {
    console.log("Verifying Webhook");
    return res.status(200).send(req.body.challenge);
  }

  if (type === "stream.online") {
    try {
      sendOnline(event);
    } catch (ex) {
      console.log(
        `An error occurred sending the Online notification for ${event.broadcaster_user_name}: `,
        ex
      );
    }
  }

  const { type } = req.body.subscription;
  const { event } = req.body;

  console.log(
    `Receiving ${type} request for ${event.broadcaster_user_name}: `,
    event
  );

  res.status(200).end();
});

const listener = app.listen(port, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
