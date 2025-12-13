import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  aud?: string;
  exp?: number;
}

export const GetCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
