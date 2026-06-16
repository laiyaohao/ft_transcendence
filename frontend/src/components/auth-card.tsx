'use client';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import StyledCard from "./styled-card";
import { GoogleIcon, FacebookIcon } from '../utils/icons';

interface AuthCardInt {
  cardTitle: string;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  namePrompt?: string;
  nameRef?: React.RefObject<HTMLInputElement | null>;
  nameError?: boolean | undefined;
  nameErrorMessage?: string;
  emailPrompt: string;
  emailRef: React.RefObject<HTMLInputElement | null>;
  emailError: boolean | undefined;
  emailErrorMessage: string;
  passwordPrompt: string;
  passwordRef: React.RefObject<HTMLInputElement | null>;
  passwordError: boolean | undefined;
  passwordErrorMessage: string;
  rememberMe?: string;
  validateInputs: () => boolean;
  submitButtonCaption: string;
  handleClickOpen?: () => void;
  forgotPassword?: string;
  signInWithGoogle: string;
  signInWithFacebook: string;
  noAccount?: string;
  register?: string;
  haveAccount?: string;
  login?: string;
}

const AuthCard = ({ 
  cardTitle,
  handleSubmit,
  namePrompt,
  nameRef,
  nameError,
  nameErrorMessage,
  emailPrompt,
  emailRef,
  emailError,
  emailErrorMessage,
  passwordPrompt,
  passwordRef,
  passwordError,
  passwordErrorMessage,
  rememberMe,
  validateInputs,
  submitButtonCaption,
  handleClickOpen,
  forgotPassword,
  signInWithGoogle,
  signInWithFacebook,
  noAccount,
  register,
  haveAccount,
  login,
} : AuthCardInt) => {
  return (
    <StyledCard variant="outlined" data-testid="auth-card">
      <Typography
        component="h1"
        variant="h4"
        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
      >
        {cardTitle}
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          gap: 2,
        }}
      >
        {namePrompt && <FormControl>
          <FormLabel htmlFor="name">{namePrompt}</FormLabel>
          <TextField
            inputRef={nameRef}
            error={nameError}
            helperText={nameErrorMessage}
            id="name"
            type="name"
            name="name"
            placeholder="John Doe"
            autoComplete="name"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={nameError ? 'error' : 'primary'}
          />
        </FormControl>}
        <FormControl>
          <FormLabel htmlFor="email">{emailPrompt}</FormLabel>
          <TextField
            inputRef={emailRef}
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={emailError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">{passwordPrompt}</FormLabel>
          <TextField
            inputRef={passwordRef}
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={passwordError ? 'error' : 'primary'}
          />
        </FormControl>
        {rememberMe && <FormControlLabel
          control={<Checkbox value="remember" color="primary" />}
          label={rememberMe}
        />}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          onClick={validateInputs}
        >
          {submitButtonCaption}
        </Button>
        {forgotPassword && handleClickOpen && <Link
          component="button"
          type="button"
          onClick={handleClickOpen}
          variant="body2"
          sx={{ alignSelf: 'center' }}
        >
          {forgotPassword}
        </Link>}
      </Box>
      <Divider>or</Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Google')}
          startIcon={<GoogleIcon />}
        >
          {signInWithGoogle}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign in with Facebook')}
          startIcon={<FacebookIcon />}
        >
          {signInWithFacebook}
        </Button>
        {(register && noAccount) && <Typography sx={{ textAlign: 'center' }}>
          {noAccount}
          <Link
            href="/signup"
            variant="body2"
            sx={{ alignSelf: 'center' }}
          >
            {register}
          </Link>
        </Typography>}
        {(haveAccount && login) && <Typography sx={{ textAlign: 'center' }}>
          {haveAccount}
          <Link
            href="/login"
            variant="body2"
            sx={{ alignSelf: 'center' }}
          >
            {login}
          </Link>
        </Typography>}
      </Box>
    </StyledCard>
  )
}

export default AuthCard;