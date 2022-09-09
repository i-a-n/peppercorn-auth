### peppercorn-auth

authentication module for the peppercorn recipe app

### auth architecture

- expressjs to serve static website
- express-session to interface with sessions, set cookies
- passportjs to configure an auth strategy
- passport-zero to handle the requesting/retrieving of tokens
- twilio for sending the sms

the resulting user flow is that a user requests a login token by entering their phone number, a short token is generated, stored in elasticsearch alongside their user data, and texted to the phone number. visiting the link in the SMS will retrieve the token in the URL, and attach the appropriate `user` data to that user's session, logging them in indefinitely.

### modules in this package

peppercorn uses elasticserach 7 to store recipes, so to avoid using multiple services, we are using elastic to also handle

- (a) express-session sessions, as configured in the `sessionStore`, `type: "elasticsearch",` imported from the `session` dir here
- (b) passport-zero request/verify token strategy, which needed bugfixes and was updated to simply store token/user data in elastisearch (instead of as JWTs), imported from `strategy` dir
- (c) passport-zero token storage, which does the actual getting/setting of tokens from elasticsearch, imported from the `storage` dir

additionally, we don't care about emailing the tokens, just SMS, so we are

- (d) sending short tokens via sms, imported from the 'sending' dir

background story on each of the above:

- (a) was forked from `sessionstore`, and pulled in a PR that upgraded the `elasticsearch` strategy, along with bug fixes. then, pruned to only accept the ES strategy.
- (b) was forked from `passport-zero` and added bug fixes and try/catches as to not crash the app all the time
- (c) just a generic getter/setter class that conforms to what `passport-zero` is expecting for token checking
- (d) uses twilio to send SMS messages

### env vars

you'll need the following environment variables exported in the consuming application:

```
export TWILIO_AUTH_TOKEN="foo"
export TWILIO_ACCOUNT_SID="bar"
export TWILIO_PHONE_NUMBER="+1234567890"
```

### portability

this was purpose-built for a single application and currently is not meant to be portable. although if it ever were to be made portable, this would just require any hard-coded defaults (like elasticsearch index names, for example) be made into configurable options, and then the development of an expressjs example app that documents how to import from each of these modules appropriately.
