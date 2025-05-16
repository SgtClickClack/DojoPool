import { renderHook, act } from "@testing-library/react";
import { useFirestore } from "../useFirestore";
import * as firestore from "firebase/firestore";

const mockData = {
  id: "123",
  name: "Test Document",
};

describe("useFirestore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a document", async () => {
    (firestore.addDoc as jest.Mock).mockResolvedValue({ id: "123" });
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.create("collection", mockData);
      expect(response.success).toBe(true);
      expect(response.id).toBe("123");
    });
  });

  it("should get a document", async () => {
    (firestore.getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockData,
      id: "123",
    });
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.get("collection", "123");
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ ...mockData, id: "123" });
    });
  });

  it("should update a document", async () => {
    (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.update("collection", "123", {
        name: "Updated",
      });
      expect(response.success).toBe(true);
    });
  });

  it("should delete a document", async () => {
    (firestore.deleteDoc as jest.Mock).mockResolvedValue(undefined);
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.remove("collection", "123");
      expect(response.success).toBe(true);
    });
  });

  it("should query documents", async () => {
    (firestore.getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => mockData,
          id: "123",
        },
      ],
    });
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.query("collection");
      expect(response.success).toBe(true);
      expect(response.data).toEqual([{ ...mockData, id: "123" }]);
    });
  });

  it("should get active games", async () => {
    (firestore.getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({ ...mockData, status: "active" }),
          id: "123",
        },
      ],
    });
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.getActive();
      expect(response.success).toBe(true);
      expect(response.data[0].status).toBe("active");
    });
  });

  it("should get venues by location", async () => {
    (firestore.getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({ ...mockData, location: "Test Location" }),
          id: "123",
        },
      ],
    });
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.getVenues("Test Location");
      expect(response.success).toBe(true);
      expect(response.data[0].location).toBe("Test Location");
    });
  });

  it("should get upcoming tournaments", async () => {
    (firestore.getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          data: () => ({ ...mockData, status: "upcoming" }),
          id: "123",
        },
      ],
    });
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.getUpcoming();
      expect(response.success).toBe(true);
      expect(response.data[0].status).toBe("upcoming");
    });
  });

  it("should handle errors", async () => {
    const error = new Error("Firestore error");
    (firestore.addDoc as jest.Mock).mockRejectedValue(error);
    const { result } = renderHook(() => useFirestore());

    await act(async () => {
      const response = await result.current.create("collection", mockData);
      expect(response.success).toBe(false);
      expect(response.error).toBe(error.message);
    });
  });
});
