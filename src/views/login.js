import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase.js';
import { el, clear } from '../lib/dom.js';

const MESSAGES = {
  'auth/invalid-email': 'That doesn’t look like a valid email address.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'No connection. Check your signal and try again.'
};

export function renderLogin(root) {
  clear(root);

  const error = el('div', { class: 'banner error', style: 'display:none' });
  const email = el('input', { type: 'email', autocomplete: 'username', required: 'required', placeholder: 'you@example.com' });
  const password = el('input', { type: 'password', autocomplete: 'current-password', required: 'required', placeholder: '••••••••' });
  const submit = el('button', { class: 'primary', type: 'submit', style: 'width:100%', text: 'Sign in' });

  function fail(err) {
    error.textContent = MESSAGES[err?.code] || 'Could not sign in. Please try again.';
    error.style.display = '';
  }

  const form = el('form', {
    onsubmit: async (event) => {
      event.preventDefault();
      error.style.display = 'none';
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      try {
        await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
        // The auth-state listener in main.js takes it from here.
      } catch (err) {
        fail(err);
        submit.disabled = false;
        submit.textContent = 'Sign in';
      }
    }
  }, [
    el('div', { class: 'field' }, [el('label', { text: 'Email' }), email]),
    el('div', { class: 'field' }, [el('label', { text: 'Password' }), password]),
    submit
  ]);

  const reset = el('button', {
    class: 'link',
    type: 'button',
    text: 'Forgot password?',
    onclick: async () => {
      const address = email.value.trim();
      if (!address) {
        fail({ code: 'auth/invalid-email' });
        return;
      }
      try {
        await sendPasswordResetEmail(auth, address);
        error.className = 'banner info';
        error.textContent = 'Reset link sent to ' + address + '.';
        error.style.display = '';
      } catch (err) {
        error.className = 'banner error';
        fail(err);
      }
    }
  });

  root.append(
    el('div', { class: 'login-wrap' }, [
      el('div', { class: 'card login' }, [
        el('h1', { text: 'Portugal 2026' }),
        el('p', { class: 'sub', text: 'Jacob & Christina. Sign in to see the trip.' }),
        error,
        form,
        el('div', { class: 'center', style: 'margin-top:16px' }, [reset])
      ])
    ])
  );
}
