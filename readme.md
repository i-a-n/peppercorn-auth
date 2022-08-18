### peppercorn-auth

authentication module for the peppercorn recipe app

### auth architecture

- expressjs to serve static website
- express-session to interface with sessions, set cookies
- passportjs to configure an auth strategy
- passport-zero to handle the requesting/verifying of tokens
- [tbd] for sending the sms
- [tbd] for shortening the link

the resulting user flow is that a user requests a login token by entering their phone number, the `strategy` module uses `passport-zero` logic to generate a jwt token which contains their user data and a secret, and that token (as a param on a link that's been shortened via the `shortURL` module) is sent via SMS to the phone number (via the `sending` dir). following the link verifies the token, confirms it has not already been used (via the `storage` module here) and sets the user data on the session (via the `session` module here). this keeps the user logged in indefinitely on that device.

### modules in this package

peppercorn uses elasticserach 7 to store recipes, so to avoid using multiple services, we are using elastic to also handle

- (a) express-session sessions, as configured in the `sessionStore`, `type: "elasticsearch",` imported from the `session` dir here
- (b) passport-zero request/verify token strategy, which technically does not need elasticsearch but does need bugfixes, imporred from `strategy` dir
- (c) passport-zero token storage, which essentially only needs to set and check for used tokens, imported from the `storage` dir

additionally, we don't care about emailing the tokens, just SMS, so we are

- (d) sending via sms, imported from the 'sending' dir
- (e) short urls that can be used instead of the full token, so the login URLs are viable on SMS, imported from the 'shortURL' dir

background story on each of the above:

- (a) was forked from `sessionstore`, and pulled in a PR that upgraded the `elasticsearch` strategy, along with bug fixes. then, pruned to only accept the ES strategy.
- (b) was forked from `passport-zero` and added bug fixes and try/catches as to not crash the app all the time
- (c) just a generic getter/setter class that conforms to what `passport-zero` is expecting for token checking
- (d) [not currently developed - tokens and users generated manually]
- (e) [not currently developed - shortURLs generated manually]

### portability

this was purpose-built for a single application and currently is not meant to be portable. although if it ever were to be made portable, this would just require any hard-coded defaults (like elasticsearch index names, for example) be made into configurable options, and then the development of an expressjs example app that documents how to import from each of these modules appropriately.
