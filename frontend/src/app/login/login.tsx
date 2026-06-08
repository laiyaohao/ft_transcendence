'use client';
import * as React from 'react';
import AuthCard from '@/components/auth-card';
import ColorModeSelect from '../../theme/color-mode-select';
import SignInContainer from "../../components/styled-stack"
import strings from "../../locales/en.json";

export default function Login() {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (emailError || passwordError) {
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
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage(strings.auth.validation.emailInvalid);
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
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
      <AuthCard
        cardTitle={strings.auth.login}
        handleSubmit={handleSubmit}
        emailPrompt={strings.auth.emailPrompt}
        emailError={emailError}
        emailErrorMessage={emailErrorMessage}
        passwordPrompt={strings.auth.passwordPrompt}
        passwordError={passwordError}
        passwordErrorMessage={passwordErrorMessage}
        rememberMe={strings.auth.rememberMe}
        open={open}
        handleClose={handleClose}
        validateInputs={validateInputs}
        submitButtonCaption={strings.auth.login}
        handleClickOpen={handleClickOpen}
        forgotPassword={strings.auth.forgotPassword}
        signInWithGoogle={strings.auth.signInWithGoogle}
        signInWithFacebook={strings.auth.signInWithFacebook}
        noAccount={strings.auth.noAccount}
        register={strings.auth.register}        
      />
    </SignInContainer>
  );
}