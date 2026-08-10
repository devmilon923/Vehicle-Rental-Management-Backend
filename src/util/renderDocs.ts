import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const renderDocsHandler = (req: Request, res: Response) => {
  try {
    const readmePath = path.join(process.cwd(), "README.md");
    const readmeContent = fs.readFileSync(readmePath, "utf-8");

    if (req.headers.accept && req.headers.accept.includes("text/plain")) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(readmeContent);
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vehicle Rental Management API Documentation</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.0/github-markdown-dark.min.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #0d1117;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 980px;
      padding: 45px;
    }
    @media (max-width: 767px) {
      .container {
        padding: 15px;
      }
    }
    .markdown-body {
      background-color: #0d1117 !important;
    }
  </style>
</head>
<body>
  <div class="container markdown-body">
    <div id="content"></div>
  </div>
  <script>
    const markdown = ${JSON.stringify(readmeContent)};
    document.getElementById('content').innerHTML = marked.parse(markdown);
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    res.status(500).send("Unable to load documentation.");
  }
};

export default renderDocsHandler;
