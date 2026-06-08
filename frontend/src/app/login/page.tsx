import SignIn from './login';
import StyledBox from '@/components/styled-box';

export default function Login() {
  return (
    <StyledBox data-testid="login-page">
      <SignIn />
    </StyledBox>
  );
}