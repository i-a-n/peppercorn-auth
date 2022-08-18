const send = async (user, token, req) => {
  console.log(
    "we're in peppercorn-auth/sending. eventually this will send an SMS to user " +
      user
  );
  console.log("but for now, we'll just console.log the token: \n", token);
};

module.exports = send;
