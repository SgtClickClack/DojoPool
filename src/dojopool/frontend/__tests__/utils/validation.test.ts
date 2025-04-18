import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "../../utils/validation";

describe("Validation Utils", () => {
  describe("validateEmail", () => {
    it("should return true for valid email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("user+tag@domain.com")).toBe(true);
    });

    it("should return false for invalid email addresses", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should return true for valid passwords", () => {
      expect(validatePassword("Password123!")).toBe(true);
      expect(validatePassword("Complex@Pass1")).toBe(true);
    });

    it("should return false for invalid passwords", () => {
      expect(validatePassword("")).toBe(false);
      expect(validatePassword("short")).toBe(false);
      expect(validatePassword("nodigits")).toBe(false);
      expect(validatePassword("NO_LOWERCASE_123")).toBe(false);
      expect(validatePassword("no_uppercase_123")).toBe(false);
    });
  });

  describe("validateUsername", () => {
    it("should return true for valid usernames", () => {
      expect(validateUsername("john_doe")).toBe(true);
      expect(validateUsername("user123")).toBe(true);
      expect(validateUsername("valid-name")).toBe(true);
    });

    it("should return false for invalid usernames", () => {
      expect(validateUsername("")).toBe(false);
      expect(validateUsername("sh")).toBe(false);
      expect(validateUsername("invalid@username")).toBe(false);
      expect(validateUsername("too_long_username_that_exceeds_limit")).toBe(
        false,
      );
    });
  });
});
