'use client';
import * as React from 'react';
import AuthCard from '@/components/auth-card';
import ColorModeSelect from '../../theme/color-mode-select';
import SignInContainer from "../../components/styled-stack"
import ForgotPassword from '../../components/forgot-password';
import strings from "../../locales/en.json";

export default function Login() {
  const emailRef = React.useRef<HTMLInputElement>(null);
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const passwordRef = React.useRef<HTMLInputElement>(null);
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
        cardTitle={strings.auth.login}
        handleSubmit={handleSubmit}
        emailPrompt={strings.auth.emailPrompt}
        emailRef={emailRef}
        emailError={emailError}
        emailErrorMessage={emailErrorMessage}
        passwordPrompt={strings.auth.passwordPrompt}
        passwordRef={passwordRef}
        passwordError={passwordError}
        passwordErrorMessage={passwordErrorMessage}
        rememberMe={strings.auth.rememberMe}
        validateInputs={validateInputs}
        submitButtonCaption={strings.auth.login}
        handleClickOpen={handleClickOpen}
        forgotPassword={strings.auth.forgotPassword}
        signInWithGoogle={strings.auth.signInWithGoogle}
        signInWithFacebook={strings.auth.signInWithFacebook}
        noAccount={strings.auth.noAccount}
        register={strings.auth.signup}   
      />
    </SignInContainer>
  );
}