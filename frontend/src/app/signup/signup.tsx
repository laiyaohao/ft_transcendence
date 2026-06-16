'use client';
import * as React from 'react';
import Stack from '@mui/material/Stack';
import AuthCard from '@/components/auth-card';
import ColorModeSelect from '../../theme/color-mode-select';
import SignInContainer from "../../components/styled-stack"
import strings from "../../locales/en.json";
import Content from '@/components/content';

export default function Signup() {
  const nameRef = React.useRef<HTMLInputElement>(null);
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (nameError || emailError || passwordError ) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    console.log({
      email: data.get('email'),
      password: data.get('password'),
    });
  };

  const validateInputs = () => {
    const name = nameRef.current;
    const email = emailRef.current;
    const password = passwordRef.current;

    let isValid = true;

    if (!name?.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage(strings.auth.validation.nameInvalid);
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

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
            cardTitle={strings.auth.signup}
            handleSubmit={handleSubmit}
            namePrompt={strings.auth.namePrompt}
            nameRef={nameRef}
            nameError={nameError}
            nameErrorMessage={nameErrorMessage}
            emailPrompt={strings.auth.emailPrompt}
            emailRef={emailRef}
            emailError={emailError}
            emailErrorMessage={emailErrorMessage}
            passwordPrompt={strings.auth.passwordPrompt}
            passwordRef={passwordRef}
            passwordError={passwordError}
            passwordErrorMessage={passwordErrorMessage}
            validateInputs={validateInputs}
            submitButtonCaption={strings.auth.signup}
            signInWithGoogle={strings.auth.continueWithGoogle}
            signInWithFacebook={strings.auth.continueWithFacebook}
            haveAccount={strings.auth.haveAccount}
            login={strings.auth.login}
            />
        </Stack>
      </Stack>
    </SignInContainer>
  );
}