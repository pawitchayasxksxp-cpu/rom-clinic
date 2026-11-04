import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { calendarMonth, isCalendarDate, validateBooking } from "../../src/lib/calendar";

function form(changes: Record<string, string | undefined> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ hn: "ROM-00000001", date: "2099-03-01", time: "09:30", department: "GN", note: "", "booking-key": randomUUID(), ...changes })) if (value !== undefined) form.set(key, value);
  return form;
}

test("calendar validates real dates and leap years", () => {
  assert.ok(isCalendarDate("2028-02-29"));
  for (const value of ["2027-02-29", "2028-02-30", "2026-13-01", "2026-1-01", "2569-11-01"]) assert.equal(isCalendarDate(value), false);
});

test("month grid has complete weeks and handles year and leap boundaries", () => {
  const month = calendarMonth("2028-02-29");
  assert.equal(month.days.length, 42);
  assert.equal(new Date(`${month.days[0]}T00:00:00Z`).getUTCDay(), 0);
  assert.ok(month.days.includes("2028-02-29"));
  assert.equal(month.end, "2028-03-01");
  assert.equal(calendarMonth("2027-01-01").previous, "2026-12-01");
  assert.equal(calendarMonth("2027-12-31").next, "2028-01-01");
});

test("booking validation accepts valid future Thai-time appointments", () => {
  assert.ok(validateBooking(form()).data);
});

test("booking validation rejects invalid date, time, department, key, and payload", () => {
  for (const changes of [{ hn: "" }, { date: "2026-02-30" }, { date: "2000-01-01" }, { time: "24:00" }, { department: "XX" }, { "booking-key": "forged" }, { note: "x".repeat(1001) }, { hn: undefined }]) assert.ok(validateBooking(form(changes)).error);
});

test("new bookings accept the clinic's current service departments", () => {
  for (const department of ["GN", "MS", "SP", "TM"]) assert.ok(validateBooking(form({ department })).data);
});
