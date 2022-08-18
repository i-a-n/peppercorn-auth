'use strict';
// Borrowed from https://github.com/jaredhanson/passport-local

module.exports = (obj, field) => {
  console.log('obj', obj);
  console.log('field', field);
  if (!obj) {
    return null;
  }
  const chain = field
    .split(']')
    .join('')
    .split('[');
  for (let i = 0, len = chain.length; i < len; i++) {
    const prop = obj[chain[i]];
    if (typeof prop === 'undefined') {
      return null;
    }
    if (typeof prop !== 'object') {
      return prop;
    }
    obj = prop;
  }
  return null;
};
