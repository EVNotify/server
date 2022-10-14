import { SetMetadata } from '@nestjs/common';

export const LOG_ROLE_NAME = 'log';

export const OwnsLog = () => SetMetadata('role', LOG_ROLE_NAME);
