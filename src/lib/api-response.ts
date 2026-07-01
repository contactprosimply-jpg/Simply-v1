import { NextResponse } from "next/server";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, code: string, status: number) {
  return NextResponse.json({ error: message, code }, { status });
}
