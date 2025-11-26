import CryptoJS from "crypto-js";

const API_URL = "https://www.soliscloud.com:13333";
const SOLIS_API_ID = process.env.SOLIS_API_ID;
const SOLIS_API_SECRET = process.env.SOLIS_API_SECRET;

function getContentMD5(body) {
  const wordArray = CryptoJS.enc.Utf8.parse(body);
  const md5 = CryptoJS.MD5(wordArray);
  return CryptoJS.enc.Base64.stringify(md5);
}

function getGMTDate() {
  return new Date().toUTCString().replace("UTC", "GMT");
}

function getSignature(method, contentMD5, contentType, date, resource) {
  const signingString =
    method + "\n" +
    contentMD5 + "\n" +
    contentType + "\n" +
    date + "\n" +
    resource;

  console.log("SIGNING STRING:\n" + signingString);

  const hmac = CryptoJS.HmacSHA1(signingString, SOLIS_API_SECRET);
  return CryptoJS.enc.Base64.stringify(hmac);
}

export async function solisRequest(resource, bodyObj = {}) {
  const method = "POST";
  const contentType = "application/json";
  const body = JSON.stringify(bodyObj);

  const contentMD5 = getContentMD5(body);
  const date = getGMTDate();
  const signature = getSignature(method, contentMD5, contentType, date, resource);

  const headers = {
    "Content-MD5": contentMD5,
    "Content-Type": contentType,
    "Date": date,
    "Authorization": `API ${SOLIS_API_ID}:${signature}`,
  };

  console.log("HEADERS:", headers);

  const response = await fetch(API_URL + resource, {
    method,
    headers,
    body
  });

  return response.json();
}