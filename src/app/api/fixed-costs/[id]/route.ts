import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const fixedCost = await prisma.fixedCost.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.amount && { amount: parseFloat(body.amount) }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
        ...(body.recurrence && { recurrence: body.recurrence }),
        ...(body.renewalDate !== undefined && { renewalDate: body.renewalDate }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.active !== undefined && { active: body.active }),
      },
      include: { category: true },
    });

    return NextResponse.json(fixedCost);
  } catch (error) {
    console.error("Error updating fixed cost:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.fixedCost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fixed cost:", error);
    return NextResponse.json({ error: "Erro ao deletar" }, { status: 500 });
  }
}
