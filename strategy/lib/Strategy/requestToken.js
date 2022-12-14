"use strict";

const crypto = require("crypto");
const lookup = require("../utils/lookup");

const requestToken = async (strategy, req, options) => {
  // Get address from addressField
  const addressField = strategy.deliver.addressField;
  const address = options.allowPost
    ? lookup(req.body, addressField) || lookup(req.query, addressField)
    : lookup(req.query, addressField);

  if (!address) {
    console.log("no address");
    return strategy.fail(
      new Error(options.badRequestMessage || `Missing ${addressField}`),
      400
    );
  }

  // Verify user
  try {
    const user = await strategy
      .verify(address)
      .catch((err) => strategy.fail(err));
    if (!user) {
      console.log("no user found");
      return strategy.fail(
        new Error(options.authMessage || `No user found`),
        400
      );
    }

    // generate shortcode
    const token = crypto.randomBytes(8).toString("base64url");
    console.log("short token generated: ", token);

    // TODO: error handling
    // push code + user info to elastic
    await strategy.storage.set(token, {
      ...user,
      iat: Date.now(),
      timestamp: new Date().toISOString(),
      expiresIn: strategy.ttl,
    });

    // Deliver token
    await strategy.deliver
      .send(user, token, req)
      .catch((err) => strategy.error(err));

    // Pass without making a success or fail decision (No passport user will be set)
    // https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js#L329
    return strategy.pass({ message: "Token succesfully delivered" });
  } catch (err) {
    console.log("error in strategy try/catch", err);
    return strategy.fail(new Error(err || `No user found`), 400);
  }
};

module.exports = requestToken;
