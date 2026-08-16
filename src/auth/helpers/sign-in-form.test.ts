import { describe, expect, it } from "@jest/globals";
import {
	countSignInFieldErrors,
	firstSignInFieldError,
	validateSignInForm,
} from "./sign-in-form";

const validInput = {
	serverUrl: "https://cms.example.com",
	collection: "users",
	email: "you@example.com",
	password: "secret",
};

describe("validateSignInForm()", () => {
	it("normalizes and returns the values when every field passes", () => {
		const { errors, values } = validateSignInForm({
			serverUrl: "  https://cms.example.com/  ",
			collection: " users ",
			email: " you@example.com ",
			password: "secret",
		});

		expect(errors).toEqual({});
		expect(values).toEqual({
			serverUrl: "https://cms.example.com",
			collectionSlug: "users",
			email: "you@example.com",
			password: "secret",
		});
	});

	it("keeps a password's surrounding whitespace", () => {
		const { values } = validateSignInForm({ ...validInput, password: " sec " });

		expect(values?.password).toBe(" sec ");
	});

	it("names a blank server URL rather than calling it malformed", () => {
		const { errors, values } = validateSignInForm({
			...validInput,
			serverUrl: "   ",
		});

		expect(errors.serverUrl).toBe("Enter your server URL.");
		expect(values).toBeNull();
	});

	it("reports a non-empty but malformed server URL as invalid", () => {
		const { errors, values } = validateSignInForm({
			...validInput,
			serverUrl: "not-a-url",
		});

		expect(errors.serverUrl).toBe(
			"Enter a valid server URL, e.g. https://cms.example.com.",
		);
		expect(values).toBeNull();
	});

	it("reports a blank collection slug", () => {
		const { errors, values } = validateSignInForm({
			...validInput,
			collection: "  ",
		});

		expect(errors.collection).toBe("Enter the auth collection slug.");
		expect(values).toBeNull();
	});

	it("reports a blank email", () => {
		const { errors, values } = validateSignInForm({
			...validInput,
			email: " ",
		});

		expect(errors.email).toBe("Enter your email address.");
		expect(values).toBeNull();
	});

	it("reports a blank password", () => {
		const { errors, values } = validateSignInForm({
			...validInput,
			password: "",
		});

		expect(errors.password).toBe("Enter your password.");
		expect(values).toBeNull();
	});

	it("reports every offending field from one call rather than only the first", () => {
		const { errors } = validateSignInForm({
			serverUrl: "",
			collection: "",
			email: "",
			password: "",
		});

		expect(errors).toEqual({
			serverUrl: "Enter your server URL.",
			collection: "Enter the auth collection slug.",
			email: "Enter your email address.",
			password: "Enter your password.",
		});
	});
});

describe("firstSignInFieldError()", () => {
	it("returns the offending field nearest the top of the form", () => {
		const { errors } = validateSignInForm({
			...validInput,
			collection: "",
			password: "",
		});

		expect(firstSignInFieldError(errors)).toBe("collection");
	});

	it("follows the form's order rather than the order messages were written", () => {
		expect(
			firstSignInFieldError({
				password: "Enter your password.",
				email: "Enter your email address.",
			}),
		).toBe("email");
	});

	it("returns null when nothing is wrong", () => {
		const { errors } = validateSignInForm(validInput);

		expect(firstSignInFieldError(errors)).toBeNull();
	});
});

describe("countSignInFieldErrors()", () => {
	it("counts the offending fields", () => {
		const { errors } = validateSignInForm({
			...validInput,
			email: "",
			password: "",
		});

		expect(countSignInFieldErrors(errors)).toBe(2);
	});

	it("counts a clean form as zero", () => {
		expect(countSignInFieldErrors({})).toBe(0);
	});
});
