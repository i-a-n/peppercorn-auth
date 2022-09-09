const { Client } = require("@elastic/elasticsearch");

class ElasticTokenStorage {
  constructor(options) {
    // hard-code index name for now
    this.index = "one-time-tokens";
    this.client = new Client({
      node: options.api_url,
      auth: { apiKey: options.api_key },
      apiVersion: "7.17",
      ...this.options,
    });
  }

  // helper method, just retrieves a document nicely
  async getToken(client, index, key) {
    console.log("retrieving token", key);
    return new Promise(async (resolve, reject) => {
      try {
        let res = await client.get({
          index: `${index}`,
          id: key,
        });

        if (
          typeof res == "undefined" ||
          typeof res.body == "undefined" ||
          !res.body.found
        ) {
          resolve(null);
        }
        resolve(res.body._source);
      } catch (err) {
        reject(err);
      }
    });
  }

  // simple setter method. used to both set a new login token and
  // update a token to be "used".
  async set(key, val) {
    try {
      let res = await this.client.index({
        index: `${this.index}`,
        id: key,
        body: val,
        refresh: true,
      });
      console.log("tried to set a key", res);
      return res;
    } catch (err) {
      console.trace("sessionstore, error setting key", err);
      return err;
    }
  }

  // TODO: confirm we will never need `touch` method, and delete this
  //touch: function (sid, sess, callback) {
  //  this.set(sid, sess, callback);
  //},

  // simple getter method, for now only gets tokens
  async get(key) {
    try {
      let token = await this.getToken(this.client, this.index, key);
      if (!token) {
        console.trace("sessionstore, did not find key ", key);
        return false;
      }
      console.log("got token", token);
      return token;
    } catch (err) {
      console.trace("sessionstore, error getting key", err);
      return callback(err);
    }
  }

  // TODO: hook this up, confirm this works
  async delete(key) {
    this.client.delete(
      {
        index: this.index,
        id: key,
      },
      function(err, res) {
        if (err && err.message.toLowerCase().indexOf("not found") >= 0) {
          err = null;
        }
        return res || err;
      }
    );
  }
}

module.exports = ElasticTokenStorage;
