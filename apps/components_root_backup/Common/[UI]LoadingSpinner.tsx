import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
`;

const pulse = keyframes`
    0% {
        box-shadow: 0 0 5px #00ff9d,
                   0 0 10px #00ff9d,
                   0 0 15px #00ff9d;
    }
    50% {
        box-shadow: 0 0 10px #00ff9d,
                   0 0 20px #00ff9d,
                   0 0 30px #00ff9d;
    }
    100% {
        box-shadow: 0 0 5px #00ff9d,
                   0 0 10px #00ff9d,
                   0 0 15px #00ff9d;
    }
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
`;

const SpinnerRing = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid transparent;
  border-top: 3px solid #00ff9d;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const SpinnerText = styled.div`
  position: absolute;
  color: #00ff9d;
  font-size: 14px;
  font-weight: 500;
  margin-top: 80px;
  text-shadow: 0 0 10px #00ff9d;
`;

interface LoadingSpinnerProps {
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
}) => {
  return (
    <SpinnerContainer>
      <SpinnerRing />
      <SpinnerText>{text}</SpinnerText>
    </SpinnerContainer>
  );
};
