import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import { SocialSignIn } from "../SocialSignIn";
import { useAuth } from "@/hooks/useAuth";

// Mock useAuth hook
jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

describe("SocialSignIn", () => {
  const mockSignInFunctions = {
    signInWithGooglePopup: jest.fn(),
    signInWithFacebookPopup: jest.fn(),
    signInWithTwitterPopup: jest.fn(),
    signInWithGithubPopup: jest.fn(),
    signInWithApplePopup: jest.fn(),
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue(mockSignInFunctions);
  });

  const renderComponent = () => {
    return render(
      <ChakraProvider>
        <SocialSignIn />
      </ChakraProvider>,
    );
  };

  it("renders all social sign-in buttons", () => {
    renderComponent();

    expect(screen.getByLabelText(/sign in with google/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign in with facebook/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign in with twitter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign in with github/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign in with apple/i)).toBeInTheDocument();
  });

  it("handles successful Google sign-in", async () => {
    mockSignInFunctions.signInWithGooglePopup.mockResolvedValueOnce({
      success: true,
    });

    renderComponent();

    const googleButton = screen.getByLabelText(/sign in with google/i);
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInFunctions.signInWithGooglePopup).toHaveBeenCalled();
    });
  });

  it("handles failed sign-in with retries", async () => {
    mockSignInFunctions.signInWithGooglePopup
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"));

    renderComponent();

    const googleButton = screen.getByLabelText(/sign in with google/i);
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText(/retrying google sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/1\/3/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/2\/3/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/3\/3/)).toBeInTheDocument();
    });
  });

  it("calls onSuccess callback after successful sign-in", async () => {
    const onSuccess = jest.fn();
    mockSignInFunctions.signInWithGooglePopup.mockResolvedValueOnce({
      success: true,
    });

    render(
      <ChakraProvider>
        <SocialSignIn onSuccess={onSuccess} />
      </ChakraProvider>,
    );

    const googleButton = screen.getByLabelText(/sign in with google/i);
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("calls onError callback after max retries", async () => {
    const onError = jest.fn();
    mockSignInFunctions.signInWithGooglePopup
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"))
      .mockRejectedValueOnce(new Error("Failed"));

    render(
      <ChakraProvider>
        <SocialSignIn onError={onError} />
      </ChakraProvider>,
    );

    const googleButton = screen.getByLabelText(/sign in with google/i);
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("prevents multiple simultaneous sign-in attempts", async () => {
    mockSignInFunctions.signInWithGooglePopup.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderComponent();

    const googleButton = screen.getByLabelText(/sign in with google/i);
    fireEvent.click(googleButton);
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignInFunctions.signInWithGooglePopup).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
