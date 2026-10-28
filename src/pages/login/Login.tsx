import { useNavigate } from 'react-router';
import Routes from '../../router/Routes';
import Button from '../../components/_core/button/Button';
import { EmailPasswordLogin } from '../../components/email-password-login';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();

  const onLogin = () => navigate(Routes.Home);
  const goToJoin = () => navigate(Routes.Join);

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img
          src="/mypisnicka-icon.svg"
          alt=""
        />
        <span className={styles.wordmark}>
          My<span className={styles.wordmarkAccent}>Písnička</span>
        </span>
      </div>

      <EmailPasswordLogin onLogin={onLogin} />

      <div className={styles.divider}>
        <span className={styles.dividerText}>nebo</span>
      </div>

      <Button
        label="Připojit se bez účtu"
        colorVariation="secondary"
        onClick={goToJoin}
      />
    </div>
  );
}
