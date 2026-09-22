import { describe, expect, it } from 'vitest';
import { validateRegistration } from '../utils/authValidation';
import { maskEmail } from '../pages/VerifyEmail';

const messages = {
  required: 'required', invalidEmail: 'invalid email',
  passwordMinLength: 'weak', passwordsNotMatch: 'mismatch',
};

describe('authentication validation', () => {
  it('rejects incomplete registration without calling Firebase', () => {
    expect(validateRegistration({
      name: ' ', email: 'wrong', password: 'short', confirmPassword: 'different', agreed: false,
    }, messages)).toEqual({
      name: 'required', email: 'invalid email', password: 'weak',
      confirmPassword: 'mismatch', agreed: 'required',
    });
  });

  it('accepts a complete registration and masks verification email safely', () => {
    expect(validateRegistration({
      name: 'مستخدم', email: 'user@example.com', password: 'strong-pass',
      confirmPassword: 'strong-pass', agreed: true,
    }, messages)).toEqual({});
    expect(maskEmail('customer@example.com')).toBe('cu******@example.com');
  });
});
