'use client';
import * as React from 'react';
import AuthCard from '@/components/auth-card';
import ColorModeSelect from '../../theme/color-mode-select';
import SignInContainer from "../../components/styled-stack"
import ForgotPassword from '../../components/forgot-password';
import strings from "../../locales/en.json";
import { apiRequest, getErrorMessage } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const message = await getErrorMessage(response);
      setSubmitErrorMessage(message);
      return;
    }

    setSubmitErrorMessage('');
    const jsonResponse = await response.json();
    localStorage.setItem('jwt_token', jsonResponse.token);
    document.cookie = `auth_token=${jsonResponse.token}; path=/; max-age=86400; SameSite=Lax`;
    router.push('/classes');
  };

  const validateInputs = () => {
    const email = emailRef.current;
    const password = passwordRef.current;

    let isValid = true;

    if (!email?.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage(strings.auth.validation.emailInvalid);
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password?.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage(strings.auth.validation.passwordMinLength);
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <SignInContainer direction="column" sx={{ justifyContent: 'space-between' }} data-testid="sign-in-container">
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <ForgotPassword open={open} handleClose={handleClose} />
      <AuthCard
        handleSubmit={handleSubmit}
        emailRef={emailRef}
        emailError={emailError}
        emailErrorMessage={emailErrorMessage}
        passwordRef={passwordRef}
        passwordError={passwordError}
        passwordErrorMessage={passwordErrorMessage}
        validateInputs={validateInputs}
        handleClickOpen={handleClickOpen}
        fromSignup={false}
        submitErrorMessage={submitErrorMessage}
      />
    </SignInContainer>
  );
}
