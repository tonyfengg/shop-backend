'use strict';
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const shopModel = require('../models/shop.model');
const KeyTokenService = require('./keyToken.servece');
const { RoleShop } = require('../constants/roleShop.constans');
const { createTokenPair } = require('../auth/authUtils');
const { getInfoData } = require('../utils');

class AccessService {
  static signUp = async ({ name, email, password }) => {
    try {
      // step1: check email exist
      const holderShop = await shopModel.findOne({ email }).lean();
      if (holderShop) {
        return {
          code: 'zzzz',
          message: 'Shop already exist',
          status: 'error',
        };
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const newShop = await shopModel.create({
        name,
        email,
        password: passwordHash,
        roles: [RoleShop.SHOP],
      });
      if (newShop) {
        // create private key, public key
        // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        //   modulusLength: 4096,
        //   publicKeyEncoding: {
        //     type: 'pkcs1',
        //     format: 'pem',
        //   },
        //   privateKeyEncoding: {
        //     type: 'pkcs1',
        //     format: 'pem',
        //   },
        // });
        const privateKey = crypto.randomBytes(64).toString('hex'); // for node:crypto
        const publicKey = crypto.randomBytes(64).toString('hex'); // for node:crypto

        console.log({ privateKey, publicKey }); // save collection key store
        // const publicKeyString = await KeyTokenService.createKeyToken({ // comment for node:crypto
        const keyStore = await KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey,
          privateKey, // for node:crypto
        });
        // if (!publicKeyString) { // comment for node:crypto
        if (!keyStore) {
          return {
            code: '0000',
            message: 'keyStore error',
            status: 'error',
          };
        }
        // const publicKeyObject = crypto.createPublicKey(publicKeyString); // comment for node:crypto
        // console.log(`publicKeyObject::`, publicKeyObject);
        // create token pair
        // const tokens = await createTokenPair({ userId: newShop._id, email }, publicKeyObject, privateKey); // comment for node:crypto
        const tokens = await createTokenPair({ userId: newShop._id, email }, publicKey, privateKey);
        console.log(`Create token pair::`, tokens);
        return {
          code: 201,
          metadata: {
            shop: getInfoData({ fields: ['_id', 'name', 'email'], object: newShop }),
            tokens,
          },
        };
      }
      return {
        code: 200,
        metadata: null,
      };
    } catch (error) {
      return {
        code: 'zzzz',
        message: error.message,
        status: 'error',
      };
    }
  };
}

module.exports = AccessService;