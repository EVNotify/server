import { SetMetadata } from '@nestjs/common';

export const FIELD_TYPE_SETTINGS = 'settings';

export const SettingsField = () =>
  SetMetadata('fieldType', FIELD_TYPE_SETTINGS);
