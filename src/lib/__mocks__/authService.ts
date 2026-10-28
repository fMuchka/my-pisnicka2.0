import { fn } from 'storybook/test';
import type * as authService from '../authService';

// Storybook replacement for authService (registered via sb.mock in .storybook/preview.tsx),
// so stories never reach Firebase. Stories override the behaviour with mocked(...).
export const loginWithEmailPassword = fn<typeof authService.loginWithEmailPassword>();
export const signOut = fn<typeof authService.signOut>();
export const updateCurrentUserPassword = fn<typeof authService.updateCurrentUserPassword>();
