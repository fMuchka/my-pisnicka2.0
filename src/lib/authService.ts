import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export async function loginWithEmailPassword(email: string, password: string) {
  try {
    // Use email as name@mars.local for Firebase email/password auth
    await signInWithEmailAndPassword(auth, email, password);

    return true;
  } catch (_err: unknown) {
    alert('Login failed. Please check your credentials.');

    return false;
  }
}
