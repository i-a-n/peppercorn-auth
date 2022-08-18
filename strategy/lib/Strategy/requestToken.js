"use strict";

const jwt = require("jsonwebtoken");
const { promisify } = require("../utils/promise");
const lookup = require("../utils/lookup");

const requestToken = async (strategy, req, options) => {
  // Get address from addressField
  console.log("requestToken - strat", strategy);
  console.log("requestToken - req.body", req.body);
  console.log("requestToken - req.query", req.query);
  console.log("requestToken - options", options);
  const addressField = strategy.deliver.addressField;
  console.log("addressField", addressField);
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

  // Generate JWT
  const createToken = promisify(jwt.sign);
  const token = await createToken(
    { user, iat: Math.floor(Date.now() / 1000) },
    strategy.secret,
    { expiresIn: strategy.ttl }
  ).catch((err) => strategy.error(err));

  // Deliver JWT
  await strategy.deliver
    .send(user, token, req)
    .catch((err) => strategy.error(err));

  // Pass without making a success or fail decision (No passport user will be set)
  // https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js#L329
  return strategy.pass({ message: "Token succesfully delivered" });
};

module.exports = requestToken;
