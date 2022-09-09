// twilio config data. see: https://www.twilio.com/docs/sms/quickstart/node?code-sample=code-respond-to-an-incoming-text-message&code-language=Node.js&code-sdk-version=3.x
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const smsPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = require("twilio")(accountSid, authToken);

const send = async (user, token, req) => {
  // console.log short token, for easy reading
  console.log("here's the token: \n", token);

  // send via twilio SMS
  await client.messages
    .create({
      body: `sign in to peppercorn: https://peppercorn.union.io/auth?tokenField=${token}`,
      from: smsPhoneNumber,
      to: `+1${user.phone}`,
    })
    .then((message) =>
      console.log(
        "sms sending completed, for more info see message #",
        message.sid
      )
    );
};

module.exports = send;
