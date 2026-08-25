'use client';
import * as React from 'react';
import Stack from '@mui/material/Stack';
import AuthCard from '@/components/auth-card';
import ColorModeSelect from '../../theme/color-mode-select';
import SignInContainer from "../../components/styled-stack"
import strings from "../../locales/en.json";
import Content from '@/components/content';
import { apiRequest, getErrorMessage } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { getRoleHome, saveAuthSession, type AuthResponsePayload } from '@/lib/auth';

export default function Signup() {
  const router = useRouter();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [submitErrorMessage, setSubmitErrorMessage] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');
    const fullName = data.get('fullName');
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role: 'STUDENT' }),
    });

    if (!response.ok) {
      const message = await getErrorMessage(response);
      setSubmitErrorMessage(message);
      return;
    }

    setSubmitErrorMessage('');
    try {
      const jsonResponse = await response.json() as AuthResponsePayload;
      const session = saveAuthSession(jsonResponse);
      router.replace(getRoleHome(session.role));
    } catch {
      setSubmitErrorMessage('Unable to establish a secure session. Please try again.');
    }
  };

  const validateInputs = () => {
    const name = nameRef.current;
    const email = emailRef.current;
    const password = passwordRef.current;

    let isValid = true;

    if (!name?.value || name.value.length < 2 || name.value.length > 100) {
      setNameError(true);
      setNameErrorMessage(strings.auth.validation.nameInvalid);
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!email?.value || email.value.length > 254 || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage(strings.auth.validation.emailInvalid);
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (
      !password?.value
      || password.value.length < 12
      || password.value.length > 128
      || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password.value)
    ) {
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
      <Stack
        direction={{ xs: 'column-reverse', md: 'row' }}
        sx={{
          justifyContent: 'center',
          gap: { xs: 6, sm: 12 },
          p: 2,
          mx: 'auto',
        }}
        data-testid="outer-stack"
      >
        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          sx={{
            justifyContent: 'center',
            gap: { xs: 6, sm: 12 },
            p: { xs: 2, sm: 4 },
            m: 'auto',
          }}
        >
          <Content />
          <AuthCard
            handleSubmit={handleSubmit}
            nameRef={nameRef}
            nameError={nameError}
            nameErrorMessage={nameErrorMessage}
            emailRef={emailRef}
            emailError={emailError}
            emailErrorMessage={emailErrorMessage}
            passwordRef={passwordRef}
            passwordError={passwordError}
            passwordErrorMessage={passwordErrorMessage}
            validateInputs={validateInputs}
            fromSignup={true}
            submitErrorMessage={submitErrorMessage}
            />
        </Stack>
      </Stack>
    </SignInContainer>
  );
}
