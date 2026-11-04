import assert from "node:assert/strict";
import test from "node:test";
import { validatePatient } from "../../src/lib/patient-validation";

function form(changes: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ "patient-type": "ผู้ป่วยใหม่", "first-name": " ทดสอบ ", "last-name": "ระบบ", "birth-date": "2000-02-29", phone: "0812345678", department: "GN", priority: "normal", ...changes })) { if (value !== undefined) data.set(key, value); }
  return data;
}

test("accepts valid patient fields, trims names, and drops unrecognized input", () => {
  const result = validatePatient(form({ role: "admin" }));
  assert.equal(result.data?.["first-name"], "ทดสอบ");
  assert.equal(result.data?.role, undefined);
});

test("rejects missing identity fields and invalid service selections", () => {
  for (const changes of [{ "first-name": " " }, { department: "XX" }, { priority: "unknown" }, { "patient-type": "unknown" }, { "patient-type": "ผู้ป่วยเดิม" }]) assert.ok(validatePatient(form(changes)).error);
});

test("rejects impossible, future, and Buddhist-calendar birth dates", () => {
  for (const birth of ["2025-02-29", "2000-02-30", "2999-01-01", "2543-01-01", "invalid"]) assert.ok(validatePatient(form({ "birth-date": birth })).error);
});

test("rejects malformed contact data, overlong fields, and uploaded files", () => {
  for (const changes of [{ phone: "abc" }, { email: "wrong" }, { "registered-postal-code": "abcde" }, { symptoms: "x".repeat(2001) }, { hn: "<bad>" }]) assert.ok(validatePatient(form(changes)).error);
  const uploaded = form();
  uploaded.set("first-name", new Blob(["name"]));
  assert.ok(validatePatient(uploaded).error);
});
