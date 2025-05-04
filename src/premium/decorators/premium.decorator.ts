import { SetMetadata } from '@nestjs/common';

export const PREMIUM_ROLE_NAME = 'premium';

export const Premium = () => SetMetadata('role', PREMIUM_ROLE_NAME);
