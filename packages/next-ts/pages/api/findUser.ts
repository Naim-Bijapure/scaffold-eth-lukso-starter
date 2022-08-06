import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  data?: number[];
  message?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>): Promise<any> {
  if (req.method !== "POST") {
    res.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  console.log("req.body: ", req.body["data"]);
  res.status(200).json({ data: [1] });
}
