import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { emptyDrugLabel, validateDispensing } from "../../src/lib/dispensing-validation";

function form(changes: Record<string, string | undefined> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...emptyDrugLabel, "drug-name": " ยาทดสอบ ", strength: "ยาเม็ด", quantity: "2", unit: "เม็ด", directions: "ข้อความทดสอบ", dispenser: "เจ้าหน้าที่ทดสอบ", hn: "CN-000001", "dispensing-key": randomUUID(), ...changes })) if (value !== undefined) form.set(key, value);
  return form;
}

test("accepts staff-entered drug label fields and trims values", () => {
  assert.equal(validateDispensing(form()).data?.["drug-name"], "ยาทดสอบ");
  assert.ok(validateDispensing(form({ quantity: "0.5" })).data);
});

test("rejects missing required fields, invalid patient and key", () => {
  for (const changes of [{ "drug-name": "" }, { directions: "" }, { unit: "" }, { dispenser: "" }, { hn: "" }, { hn: undefined }, { "dispensing-key": "forged" }]) assert.ok(validateDispensing(form(changes)).error);
});

test("rejects invalid quantities, dates, overlong label text, and files", () => {
  for (const changes of [{ quantity: "0" }, { quantity: "-1" }, { quantity: "1.001" }, { quantity: "1000000" }, { expiry: "2026-02-30" }, { directions: "x".repeat(1001) }]) assert.ok(validateDispensing(form(changes)).error);
  const data = form();
  data.set("drug-name", new Blob(["invalid"]));
  assert.ok(validateDispensing(data).error);
});

test("accepts dropdown values and rejects arbitrary form and unit values", () => {
  assert.ok(validateDispensing(form({ strength: "ยาแคปซูล", unit: "แคปซูล" })).data);
  assert.ok(validateDispensing(form({ strength: "ยาต้ม", unit: "ถุง" })).data);
  for (const changes of [{ strength: "" }, { strength: "invalid" }, { unit: "invalid" }]) assert.ok(validateDispensing(form(changes)).error);
});
