import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { HttpHeader } from '../constants/http-headers';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

export function requestContext(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming = req.header(HttpHeader.RequestId);
  const requestId =
    incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader(HttpHeader.RequestId, requestId);
  res.setHeader(HttpHeader.ServerTimestamp, Date.now().toString());
  next();
}
