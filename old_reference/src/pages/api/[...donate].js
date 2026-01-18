// src/pages/api/[...donate].js

import fetch from "node-fetch";

export default async function handler(req, res) {
  const URL = process.env.NEXT_PUBLIC_ROUTE_DOMAIN_URL + "donate";
  const response = await fetch(URL);
  const html = await response.text();
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
