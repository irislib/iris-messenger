import { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {

  const joke = await fetch("https://icanhazdadjoke.com/", {
    "headers": {
      "Accept": "application/json"
    }
  });
  const jsonData = await joke.json();
  return Response.json(jsonData);
};