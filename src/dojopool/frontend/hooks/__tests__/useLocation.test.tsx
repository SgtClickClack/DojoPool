import { renderHook, act } from '@testing-library/react';
import { useLocation } from '../useLocation';

// Mock the geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
};

global.navigator.geolocation = mockGeolocation;

describe('useLocation hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null location and no error', () => {
    const { result } = renderHook(() => useLocation());

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should update location when geolocation succeeds', () => {
    const mockPosition = {
      coords: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
    };

    mockGeolocation.watchPosition.mockImplementation((success) => {
      success(mockPosition);
      return 1;
    });

    const { result } = renderHook(() => useLocation());

    expect(result.current.location).toEqual({
      latitude: 51.5074,
      longitude: -0.1278,
    });
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle geolocation errors', () => {
    const mockError = new GeolocationPositionError();
    const onError = jest.fn();

    mockGeolocation.watchPosition.mockImplementation((success, error) => {
      error(mockError);
      return 1;
    });

    const { result } = renderHook(() => useLocation({ onError }));

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe(mockError);
    expect(result.current.isLoading).toBe(false);
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('should cleanup watch on unmount', () => {
    const watchId = 123;
    mockGeolocation.watchPosition.mockReturnValue(watchId);

    const { unmount } = renderHook(() => useLocation());

    unmount();

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });

  it('should handle missing geolocation API', () => {
    // Temporarily remove geolocation API
    const originalGeolocation = global.navigator.geolocation;
    delete global.navigator.geolocation;

    const onError = jest.fn();
    const { result } = renderHook(() => useLocation({ onError }));

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBeInstanceOf(GeolocationPositionError);
    expect(onError).toHaveBeenCalled();

    // Restore geolocation API
    global.navigator.geolocation = originalGeolocation;
  });
});
