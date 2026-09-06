import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import CustomerEditForm from "./customer-edit-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarClientePage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select(`
      id,
      name,
      phone,
      email,
      notes
    `)
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  return (
    <CustomerEditForm
      customer={{
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
      }}
    />
  );
}
