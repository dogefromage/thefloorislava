import express, { Application, Request, Response, NextFunction } from "express";
const app: Application = express();
const port = process.env.PORT || 6969;

app.get('/', (req: Request, res: Response, next: NextFunction) => 
{
    res.send("aaa");
});

app.listen(port, () => console.log('server running on port ' + port));