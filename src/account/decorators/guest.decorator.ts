import { SetMetadata } from '@nestjs/common';

export const GUEST_ROLE_NAME = 'guest';

export const Guest = () => SetMetadata('role', GUEST_ROLE_NAME);
