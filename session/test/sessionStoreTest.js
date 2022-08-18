var expect = require('expect.js'),
    sessionStore = require('../lib/sessionstore');

describe('SessionStore', function() {

  describe('requiring sessionInterface', function() {

    it('it should return a valid session function', function() {

      var session = require('../lib/sessionInterface');
      expect(session).to.be.a('function');

    });

  });

  describe('calling createSessionStore', function() {

    describe('without options', function() {

      it('it should return with the in memory store', function() {

        var ss = sessionStore.createSessionStore();
        expect(ss).to.be.a('object');

      });

      describe('but with a callback', function() {

        it('it should callback with queue object', function(done) {

          sessionStore.createSessionStore(function(err, ss) {
            expect(err).not.to.be.ok();
            expect(ss).to.be.a('object');
            done();
          });

        });

      });

    });

    describe('with options of a non existing db implementation', function() {

      it('it should throw an error', function() {
        expect(function() {
          sessionStore.createSessionStore({ type: 'strangeDb' });
        }).to.throwError();
      });

      it('it should callback with an error', function(done) {
        expect(function() {
          sessionStore.createSessionStore({ type: 'strangeDb' }, function(err) {
            expect(err).to.be.ok();
            done();
          });
        }).to.throwError();
      });

    });

    describe('with options containing a type property with the value of', function() {

      var types = ['inmemory', 'mongodb', 'tingodb', 'redis', 'memcached', 'couchdb'];

      types.forEach(function(type) {

        describe('"' + type + '"', function() {

          var ss;

          describe('without callback', function() {

            afterEach(function(done) {
              ss.disconnect(done);
            });

            it('it should emit connect', function(done) {

              ss = sessionStore.createSessionStore({ type: type });
              ss.once('connect', done);

            });

            it('it should return with the correct store', function() {

              ss = sessionStore.createSessionStore({ type: type });
              expect(ss).to.be.a('object');
              expect(ss.set).to.be.a('function');
              expect(ss.get).to.be.a('function');
              expect(ss.destroy).to.be.a('function');
              expect(ss.clear).to.be.a('function');
              expect(ss.connect).to.be.a('function');
              expect(ss.disconnect).to.be.a('function');

            });

          });

          describe('with callback', function() {

            afterEach(function(done) {
              ss.disconnect(done);
            });

            it('it should return with the correct store', function(done) {

              sessionStore.createSessionStore({ type: type }, function(err, resSS) {
                ss = resSS;
                expect(ss).to.be.a('object');
                done();
              });

            });

          });

          describe('having connected', function() {

            describe('calling disconnect', function() {

              beforeEach(function(done) {
                sessionStore.createSessionStore({ type: type }, function(err, resSS) {
                  ss = resSS;
                  done();
                });
              });

              it('it should callback successfully', function(done) {

                ss.disconnect(function(err) {
                  expect(err).not.to.be.ok();
                  done();
                });

              });

              it('it should emit disconnect', function(done) {

                ss.once('disconnect', done);
                ss.disconnect();

              });

            });

            describe('using the store', function() {

              before(function(done) {
                sessionStore.createSessionStore({ type: type, ignoreConcurrency: true }, function(err, resSS) {
                  ss = resSS;
                  done();
                });
              });

              it('it should set and get a session', function(done) {

                // #set()
                ss.set('123', { cookie: { maxAge: 2000 }, name: 'joe' }, function(err) {
                  expect(err).not.to.be.ok();

                  // #get()
                  ss.get('123', function(err, data) {
                    expect(err).not.to.be.ok();
                    expect(data.name).to.be('joe');

                    // #set()
                    ss.set('123', { cookie: { maxAge: 2000 }, name: 'jimmy' }, function(err) {
                      expect(err).not.to.be.ok();

                      // #get()
                      ss.get('123', function(err, data) {
                        expect(err).not.to.be.ok();
                        expect(data.name).to.be('jimmy');
                        done();
                      });

                    });

                  });

                });

              });

              it('it should expire correctly', function(done) {

                // #set()
                ss.set('123shouldExpire', { cookie: { expires: new Date(Date.now() + 200) }, name: 'joe' }, function(err) {
                  expect(err).not.to.be.ok();

                  // #get()
                  ss.get('123shouldExpire', function(err, data) {
                    expect(err).not.to.be.ok();
                    expect(data.name).to.be('joe');

                    setTimeout(function () {
                      ss.get('123shouldExpire', function(err, data) {
                        expect(err).not.to.be.ok();
                        expect(data).not.to.be.ok();

                        done();
                      });
                    }, 1001);

                  });

                });

              });

              describe('having concurrent requests', function() {

                it('it should handle it correctly', function(done) {

                  // #set()
                  ss.set('my-session-1', { cookie: { maxAge: 2000 }, name: 'first' }, function(err) {
                    expect(err).not.to.be.ok();

                    // #get()
                    ss.get('my-session-1', function(err, data) {
                      expect(err).not.to.be.ok();
                      expect(data.name).to.be('first');

                      var sessionCopy = JSON.parse(JSON.stringify(data));
                      sessionCopy.name = 'first changed';

                      // #set()
                      ss.set('my-session-1', sessionCopy, function(err) {
                        expect(err).not.to.be.ok();

                        sessionCopy = JSON.parse(JSON.stringify(data));
                        sessionCopy.name = 'second changed';

                        // #set()
                        ss.set('my-session-1', sessionCopy, function(err) {
                          // expect(err).to.be.ok(); // ignoreConcurrency
                          expect(err).not.to.be.ok();

                          done();
                        });
                      });

                    });

                  });

                });

              });

              describe('calling destroy', function() {

                it('it should successfully destroy a session', function(done) {

                  ss.set('123', { cookie: { maxAge: 2000 }, name: 'gugus' }, function(err) {

                    ss.destroy('123', function(err) {
                      expect(err).not.to.be.ok();

                      ss.get('123', function(err, result) {
                        expect(err).not.to.be.ok();
                        expect(result).not.to.be.ok();
                        done();
                      });

                    });

                  });

                });

              });

              describe('calling clear', function() {

                it('it should remove all sessions', function(done) {

                  var setJobs = 0,
                      getJobs = 0;

                  function setJob() {
                    setJobs++;
                    if (setJobs === 3) {
                      check();
                    }
                  }

                  function getJob() {
                    getJobs++;
                    if (getJobs === 3) {
                      done();
                    }
                  }

                  ss.set('a', { cookie: { maxAge: 2000 }, name: 'a' }, function(err) {
                    expect(err).not.to.be.ok();
                    setJob();
                  });

                  ss.set('b', { cookie: { maxAge: 2000 }, name: 'b' }, function(err) {
                    expect(err).not.to.be.ok();
                    setJob();
                  });

                  ss.set('c', { cookie: { maxAge: 2000 }, name: 'c' }, function(err) {
                    expect(err).not.to.be.ok();
                    setJob();
                  });

                  function check() {
                    ss.clear(function(err) {
                      expect(err).not.to.be.ok();

                      ss.get('a', function(err, res) {
                        expect(err).not.to.be.ok();
                        expect(res).not.to.be.ok();
                        getJob();
                      });

                      ss.get('b', function(err, res) {
                        expect(err).not.to.be.ok();
                        expect(res).not.to.be.ok();
                        getJob();
                      });

                      ss.get('c', function(err, res) {
                        expect(err).not.to.be.ok();
                        expect(res).not.to.be.ok();
                        getJob();
                      });
                    });
                  }

                });

              });

            });

          });

        });
      });

    });

  });

});
