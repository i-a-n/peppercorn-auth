const { Client } = require("@elastic/elasticsearch");

class ElasticTokenStorage {
  constructor(options) {
    this.tokens = new Map();
    this.index = "one-time-tokens";
    this.client = new Client({
      node: options.api_url,
      auth: { apiKey: options.api_key },
      apiVersion: "7.17",
      ...this.options,
    });
  }

  async getToken(client, index, key) {
    console.log("we are getting the token", index);
    console.log("key", key);
    return new Promise(async (resolve, reject) => {
      try {
        let res = await client.get({
          index: `${index}`,
          id: key,
        });

        console.log("strategy.storage.get > getToken: ", res);
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

  async set(key, val) {
    try {
      let res = await this.client.index({
        index: `${this.index}`,
        id: key,
        body: { token: val, shortcode: "foo" },
        refresh: true,
      });
      console.log("tried to set a key", res);
      return res;
    } catch (err) {
      console.trace("sessionstore, error setting key", err);
      return err;
    }
  }

  //touch: function (sid, sess, callback) {
  //  this.set(sid, sess, callback);
  //},

  async get(key) {
    try {
      let sess = await this.getToken(this.client, this.index, key);
      if (!sess) {
        console.trace("sessionstore, error getting key");
        return false;
      }
      console.log("got sess", sess);
      return sess.token;
    } catch (err) {
      console.trace("sessionstore, error getting key", err);
      return callback(err);
    }
  }

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
