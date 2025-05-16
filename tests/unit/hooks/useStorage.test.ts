import { renderHook, act } from "@testing-library/react";
import { useStorage } from "../useStorage";
import * as storage from "firebase/storage";

const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

describe("useStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should upload a file", async () => {
    (storage.uploadBytes as jest.Mock).mockResolvedValue({ ref: {} });
    (storage.getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/test.jpg",
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.upload("test/path", mockFile);
      expect(response.success).toBe(true);
      expect(response.url).toBe("https://example.com/test.jpg");
      expect(result.current.progress).toBe(100);
    });
  });

  it("should get a file URL", async () => {
    (storage.getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/test.jpg",
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.getURL("test/path");
      expect(response.success).toBe(true);
      expect(response.url).toBe("https://example.com/test.jpg");
    });
  });

  it("should delete a file", async () => {
    (storage.deleteObject as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.remove("test/path");
      expect(response.success).toBe(true);
    });
  });

  it("should list files", async () => {
    (storage.listAll as jest.Mock).mockResolvedValue({
      items: [{ name: "test.jpg", fullPath: "test/path/test.jpg" }],
    });
    (storage.getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/test.jpg",
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.list("test/path");
      expect(response.success).toBe(true);
      expect(response.files).toHaveLength(1);
      expect(response.files[0].url).toBe("https://example.com/test.jpg");
    });
  });

  it("should upload a profile image", async () => {
    (storage.uploadBytes as jest.Mock).mockResolvedValue({ ref: {} });
    (storage.getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/profile.jpg",
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.uploadProfile("user123", mockFile);
      expect(response.success).toBe(true);
      expect(response.url).toBe("https://example.com/profile.jpg");
      expect(result.current.progress).toBe(100);
    });
  });

  it("should upload a game recording", async () => {
    (storage.uploadBytes as jest.Mock).mockResolvedValue({ ref: {} });
    (storage.getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/game.mp4",
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.uploadGame("game123", mockFile);
      expect(response.success).toBe(true);
      expect(response.url).toBe("https://example.com/game.mp4");
      expect(result.current.progress).toBe(100);
    });
  });

  it("should upload a venue image", async () => {
    (storage.uploadBytes as jest.Mock).mockResolvedValue({ ref: {} });
    (storage.getDownloadURL as jest.Mock).mockResolvedValue(
      "https://example.com/venue.jpg",
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.uploadVenue("venue123", mockFile);
      expect(response.success).toBe(true);
      expect(response.url).toBe("https://example.com/venue.jpg");
      expect(result.current.progress).toBe(100);
    });
  });

  it("should handle errors", async () => {
    const error = new Error("Storage error");
    (storage.uploadBytes as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      const response = await result.current.upload("test/path", mockFile);
      expect(response.success).toBe(false);
      expect(response.error).toBe(error.message);
      expect(result.current.progress).toBe(0);
    });
  });
});
