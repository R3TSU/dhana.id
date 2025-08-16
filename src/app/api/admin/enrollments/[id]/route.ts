import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  updateEnrollmentDateByAdmin,
  deleteEnrollmentByAdmin,
} from "@/actions/admin/enrollment.actions";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const idNum = Number((await params).id);
  if (!idNum || Number.isNaN(idNum)) {
    return NextResponse.json(
      { success: false, error: "Invalid id" },
      { status: 400 },
    );
  }
  const result = await deleteEnrollmentByAdmin(idNum);
  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const idNum = Number((await params).id);
  if (!idNum || Number.isNaN(idNum)) {
    return NextResponse.json(
      { success: false, error: "Invalid id" },
      { status: 400 },
    );
  }
  const body = await req.json().catch(() => ({}));
  const dateStr = body?.enrollmentDate as string | undefined;
  if (!dateStr) {
    return NextResponse.json(
      { success: false, error: "Missing enrollmentDate" },
      { status: 400 },
    );
  }
  const newDate = new Date(dateStr);
  if (Number.isNaN(newDate.getTime())) {
    return NextResponse.json(
      { success: false, error: "Invalid date" },
      { status: 400 },
    );
  }

  const result = await updateEnrollmentDateByAdmin(idNum, newDate);
  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}
