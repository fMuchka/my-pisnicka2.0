import { useState, type SubmitEvent } from 'react';
import Button from '../_core/button/Button';
import Input from '../_core/input/Input';
import { loginWithEmailPassword } from '../../lib/authService';
import styles from './EmailPasswordLogin.module.css';
import type { LoginValidation } from './types';
import { validatePassword, validateUser } from './validation';

interface EmailPasswordLoginProps {
  onLogin?: () => void;
}

export function EmailPasswordLogin({ onLogin }: Readonly<EmailPasswordLoginProps>) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationChecks, setValidationChecks] = useState<LoginValidation>({
    credentials: false,
    user: false,
    password: false,
  });

  const userError = validationChecks.credentials ? 'Špatné údaje' : 'Nesprávný formát';
  const passwordError = validationChecks.credentials ? 'Špatné údaje' : 'Heslo je prázdné';

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const checks: LoginValidation = {
      credentials: false,
      user: !validateUser(user),
      password: !validatePassword(password),
    };
    setValidationChecks(checks);

    if (checks.user || checks.password) {
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmailPassword(user.trim(), password);
      onLogin?.();
    } catch (err) {
      setValidationChecks({ ...checks, credentials: true });
      console.error('Exception while login:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={styles.loginForm}
      onSubmit={handleSubmit}
    >
      <Input
        value={user}
        onValueChange={setUser}
        label="Uživatel"
        placeholder="Tom Bombadil"
        autoComplete="username"
        invalid={validationChecks.user || validationChecks.credentials}
        errorText={userError}
        disabled={isSubmitting}
      />

      <Input
        value={password}
        onValueChange={setPassword}
        label="Heslo"
        type="password"
        placeholder="•••••"
        autoComplete="current-password"
        invalid={validationChecks.password || validationChecks.credentials}
        errorText={passwordError}
        disabled={isSubmitting}
      />

      <Button
        label="Přihlásit se"
        type="submit"
        disabled={isSubmitting}
      />
    </form>
  );
}
