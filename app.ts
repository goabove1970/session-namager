require('module-alias/register');
var express = require('express');
import * as path from 'path';
var cors = require('cors');
var createError = require('http-errors');

import * as sessionRouter from '@root/src/routes/sessions';
import logger from '@src/logger';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(error, req, res, next) {
  if (error) {
    logger.error(`Error: ${error.message || error}`);
  }
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};
  res.status(error.status || 500);
  res.render('error');
});
