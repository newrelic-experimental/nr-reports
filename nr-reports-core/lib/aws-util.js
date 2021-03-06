'use strict'

// eslint-disable-next-line node/no-missing-require
const S3 = require('aws-sdk/clients/s3'),
  // eslint-disable-next-line node/no-missing-require
  SecretsManager = require('aws-sdk/clients/secretsmanager')

// Create an Amazon S3 service client object.
const s3 = new S3(),
  secretsManager = new SecretsManager()

function getSecretValue(secretName, secretKey) {
  const getParams = {
    SecretId: secretName,
  }

  return new Promise((resolve, reject) => {
    secretsManager.getSecretValue(getParams, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      let secret

      // Decrypts secret using the associated KMS CMK.
      // Depending on whether the secret is a string or binary, one of these fields will be populated.
      if ('SecretString' in data) {
        secret = data.SecretString
      } else {
        const buff = Buffer.from(data.SecretBinary, 'base64')

        secret = buff.toString('ascii')
      }

      if (!secretKey) {
        resolve(secret)
        return
      }

      const secretObj = JSON.parse(secret)

      resolve(secretObj[secretKey])
    })
  })
}

function getS3Object(bucket, key) {
  const getParams = {
    Bucket: bucket, // your bucket name,
    Key: key, // path to the object you're looking for
  }

  return new Promise((resolve, reject) => {
    s3.getObject(getParams, (err, data) => {

      // Handle any error and exit
      if (err) {
        reject(err)
        return
      }

      resolve(data)
    })
  })
}

async function getS3ObjectAsString(bucket, key) {
  const data = await getS3Object(bucket, key)

  // Convert Body from a Buffer to a String
  return data.Body.toString('utf-8')
}

function putS3Object(bucket, key, content) {
  const putParams = {
    Body: content,
    Bucket: bucket,
    Key: key,
  }

  return new Promise((resolve, reject) => {
    s3.putObject(putParams, (err, data) => {

      // Handle any error and exit
      if (err) {
        reject(err)
        return
      }

      resolve(data)
    })
  })
}

module.exports = {
  getSecretValue,
  getS3Object,
  getS3ObjectAsString,
  putS3Object,
}
