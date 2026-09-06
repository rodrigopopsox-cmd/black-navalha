"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type DeleteBlockButtonProps = {
  blockedTimeId: string;
};

export default function DeleteBlockButton({
  blockedTimeId,
}: DeleteBlockButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Deseja realmente excluir este bloqueio?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("blocked_times")
      .delete()
      .eq("id", blockedTimeId);

    if (deleteError) {
      setError(`Não foi possível excluir o bloqueio: ${deleteError.message}`);
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Excluir bloqueio"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "8px 10px",
          border: "1px solid #512323",
          borderRadius: "6px",
          background: "#1a0e0e",
          color: "#e57373",
          cursor: isDeleting ? "not-allowed" : "pointer",
          opacity: isDeleting ? 0.6 : 1,
        }}
      >
        <Trash2 size={15} />
        {isDeleting ? "EXCLUINDO..." : "EXCLUIR"}
      </button>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: "8px",
            color: "#e57373",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}