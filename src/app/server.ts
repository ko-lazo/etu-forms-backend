import { createApp } from "./app.js";

export function startServer() {
  const app = createApp();

  const port = 3000;

  return app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
