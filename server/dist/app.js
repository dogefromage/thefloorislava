"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const port = process.env.PORT || 6969;
app.get('/', (req, res, next) => {
    res.send("hello");
});
app.listen(port, () => console.log('server running on port ' + port));
