"use strict";

const lookup = require("../utils/lookup");

const acceptToken = async (strategy, req, options) => {
  // retrieve shortened token from tokenField
  const tokenField = strategy.deliver.tokenField;
  const token = options.allowPost
    ? lookup(req.body, tokenField) || lookup(req.query, tokenField)
    : lookup(req.query, tokenField);

  if (!token) {
    console.log("no token found", token);
    // Pass without making a success or fail decision (No passport user will be set)
    // https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js#L329
    // Next middleware can check req.user object
    return strategy.pass({ message: `No token found in ${tokenField}` });
  }

  // get user info via token
  console.log("verifying token");

  // TODO: error handling
  const tokenObject = await strategy.storage.get(token);

  // Dont Allow reuse
  const allowReuse = options.allowReuse || false;
  if (!allowReuse) {
    // TODO: confirm this works
    if (tokenObject.used) {
      return strategy.fail(
        new Error(options.tokenAlreadyUsedMessage || "Token was already used"),
        400
      );
    }
    // TODO: consider implementing a "prune" of expired tokens here
    // Object.keys(usedTokens).forEach((token) => {
    //   const expiration = usedTokens[token];
    //   if (expiration <= Date.now()) {
    //     delete usedTokens[token];
    //   }
    // });

    // mark token as used
    await strategy.storage.set(token, { ...tokenObject, used: Date.now() });
  }

  // Pass setting a passport user
  // Next middleware can check req.user object
  return strategy.success(tokenObject);
};

module.exports = acceptToken;
