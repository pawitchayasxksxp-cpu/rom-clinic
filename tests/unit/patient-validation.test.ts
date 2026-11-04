import assert from "node:assert/strict";
import test from "node:test";
import { validatePatient } from "../../src/lib/patient-validation";

function form(changes: Record<string, string | undefined> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ "patient-type": "ผู้ป่วยใหม่", "first-name": " ทดสอบ ", "last-name": "ระบบ", "birth-date": "2000-02-29", phone: "0812345678", department: "GN", priority: "normal", ...changes })) { if (value !== undefined) data.set(key, value); }
  return data;
}

test("accepts valid patient fields, trims names, and drops unrecognized input", () => {
  const result = validatePatient(form({ role: "admin", hn: "CN-999999" }));
  assert.equal(result.data?.["first-name"], "ทดสอบ");
  assert.equal(result.data?.role, undefined);
  assert.equal(result.data?.hn, undefined);
});

test("rejects missing identity fields and invalid service selections", () => {
  for (const changes of [{ "first-name": " " }, { department: "XX" }, { priority: "unknown" }, { "patient-type": "unknown" }]) assert.ok(validatePatient(form(changes)).error);
});

test("rejects impossible, future, and Buddhist-calendar birth dates", () => {
  for (const birth of ["2025-02-29", "2000-02-30", "2999-01-01", "2543-01-01", "invalid"]) assert.ok(validatePatient(form({ "birth-date": birth })).error);
});

test("rejects malformed contact data, overlong fields, and uploaded files", () => {
  for (const changes of [{ phone: "abc" }, { email: "wrong" }, { "registered-postal-code": "abcde" }, { symptoms: "x".repeat(2001) }]) assert.ok(validatePatient(form(changes)).error);
  const uploaded = form();
  uploaded.set("first-name", new Blob(["name"]));
  assert.ok(validatePatient(uploaded).error);
});

test("validates optional blood pressure pairs and integer pulse values", () => {
  assert.ok(validatePatient(form({ "bp-systolic": "120", "bp-diastolic": "80", pulse: "72" })).data);
  assert.ok(validatePatient(form({ pulse: "72" })).data);
  for (const changes of [{ "bp-systolic": "120" }, { "bp-diastolic": "80" }, { pulse: "0" }, { pulse: "-1" }, { pulse: "72.5" }, { pulse: "1000" }, { pulse: "abc" }, { "bp-systolic": "120.5", "bp-diastolic": "80" }]) assert.ok(validatePatient(form(changes)).error);
});

test("validates patient service category with Walk-in as default", () => {
  assert.equal(validatePatient(form()).data?.["service-type"], "walk-in");
  assert.equal(validatePatient(form({ "service-type": "course" })).data?.["service-type"], "course");
  assert.ok(validatePatient(form({ "service-type": "other" })).error);
});

test("accepts current clinic service departments", () => {
  for (const department of ["GN", "MS", "SP", "TM"]) assert.ok(validatePatient(form({ department })).data);
  for (const department of ["DT", "ER", "PD"]) assert.ok(validatePatient(form({ department })).error);
});

test("editing preserves an existing legacy department without allowing other legacy choices", () => {
  assert.ok(validatePatient(form({ department: "DT" }), { legacyDepartment: "DT" }).data);
  assert.ok(validatePatient(form({ department: "ER" }), { legacyDepartment: "DT" }).error);
  assert.ok(validatePatient(form({ department: "TM" }), { legacyDepartment: "DT" }).data);
});
